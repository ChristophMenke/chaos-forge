import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CHAT_STORAGE_PREFIX,
  __resetChatStoreForTests,
  chatKey,
  clearSvenBotChats,
  getChat,
  resetChat,
  sendMessage,
  setSelectedBooks,
  subscribeChat,
} from "./chat-store";
import { emptyChat, type StoredChat } from "./chat-history";

const KEY = chatKey("player", "u1");
const STORAGE_KEY = `${CHAT_STORAGE_PREFIX}:player:u1`;

/** A streaming Response the test feeds chunk by chunk. */
function controllableStream() {
  const encoder = new TextEncoder();
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
    cancel() {
      cancelled = true;
    },
  });
  return {
    response: new Response(body, { status: 200 }),
    push: (text: string) => controller.enqueue(encoder.encode(text)),
    close: () => controller.close(),
    fail: () => controller.error(new TypeError("network error")),
    wasCancelled: () => cancelled,
  };
}

const flush = () => vi.advanceTimersByTimeAsync(0);
const stored = (key = STORAGE_KEY): StoredChat | null => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
};

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  __resetChatStoreForTests();
});

afterEach(() => {
  __resetChatStoreForTests();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("chat store", () => {
  it("streams an answer into the chat and saves it when done", async () => {
    const stream = controllableStream();
    const fetchImpl = vi.fn(async () => stream.response);
    const listener = vi.fn();
    subscribeChat(KEY, listener);
    const before = getChat(KEY);

    void sendMessage(KEY, "Was ist ETW0?", { fetchImpl });
    await flush();

    const sending = getChat(KEY);
    expect(sending).not.toBe(before);
    expect(sending.isLoading).toBe(true);
    expect(sending.chat.messages.map((m) => [m.role, m.content, m.status])).toEqual([
      ["user", "Was ist ETW0?", "done"],
      ["assistant", "", "streaming"],
    ]);

    stream.push("ETW0 ");
    await flush();
    expect(getChat(KEY).chat.messages[1].content).toBe("ETW0 ");

    stream.push("16");
    stream.close();
    await flush();

    const done = getChat(KEY);
    expect(done.isLoading).toBe(false);
    expect(done.chat.messages[1]).toMatchObject({ content: "ETW0 16", status: "done" });
    expect(stored()?.messages[1]).toMatchObject({ content: "ETW0 16", status: "done" });
    expect(listener).toHaveBeenCalled();
  });

  it("keeps streaming after every view has unsubscribed (page left)", async () => {
    const stream = controllableStream();
    const unsubscribe = subscribeChat(KEY, () => {});
    void sendMessage(KEY, "Frage", { fetchImpl: async () => stream.response });
    await flush();

    unsubscribe();
    stream.push("Antwort");
    stream.close();
    await flush();

    expect(getChat(KEY).chat.messages[1]).toMatchObject({ content: "Antwort", status: "done" });
    expect(stored()?.messages[1].status).toBe("done");
  });

  it("saves at most once per second while streaming", async () => {
    const stream = controllableStream();
    void sendMessage(KEY, "Frage", { fetchImpl: async () => stream.response });
    await flush();
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    for (let i = 0; i < 10; i++) {
      stream.push("x");
      await flush();
    }
    expect(setItem.mock.calls.length).toBeLessThanOrEqual(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(stored()?.messages[1].content).toBe("xxxxxxxxxx");
  });

  it("restores the chat after a reload and marks a cut-off answer as interrupted", async () => {
    const stream = controllableStream();
    void sendMessage(KEY, "Frage", { fetchImpl: async () => stream.response });
    await flush();
    stream.push("Halbe Antw");
    await vi.advanceTimersByTimeAsync(1000);

    __resetChatStoreForTests(); // "reload": module state gone, localStorage stays

    expect(getChat(KEY).chat.messages[1]).toMatchObject({
      content: "Halbe Antw",
      status: "interrupted",
    });
  });

  it("sends the complete exchanges as history and the book filter", async () => {
    const first = controllableStream();
    const fetchImpl = vi.fn(async () => first.response);
    setSelectedBooks(KEY, ["phb"]);
    void sendMessage(KEY, "Q1", { fetchImpl });
    await flush();
    first.push("A1");
    first.close();
    await flush();

    const second = controllableStream();
    fetchImpl.mockImplementation(async () => second.response);
    void sendMessage(KEY, "Q2", { fetchImpl });
    await flush();

    const body = JSON.parse(
      (fetchImpl.mock.calls[1] as unknown as [string, RequestInit])[1].body as string
    );
    expect(body).toMatchObject({
      message: "Q2",
      history: [
        { role: "user", content: "Q1" },
        { role: "assistant", content: "A1" },
      ],
      bookFilter: ["phb"],
    });
  });

  it("omits the book filter when all books are selected", async () => {
    const fetchImpl = vi.fn(async () => controllableStream().response);
    void sendMessage(KEY, "Q", { fetchImpl });
    await flush();

    const body = JSON.parse(
      (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string
    );
    expect(body.bookFilter).toBeUndefined();
  });

  it("records an API error on the answer", async () => {
    const fetchImpl = async () =>
      new Response(JSON.stringify({ error: "Zu viele Anfragen." }), { status: 429 });

    await sendMessage(KEY, "Q", { fetchImpl });

    expect(getChat(KEY).chat.messages[1]).toMatchObject({
      status: "error",
      errorMessage: "Zu viele Anfragen.",
      content: "",
    });
    expect(getChat(KEY).isLoading).toBe(false);
  });

  it("keeps the part that arrived when the stream breaks", async () => {
    const stream = controllableStream();
    void sendMessage(KEY, "Q", { fetchImpl: async () => stream.response });
    await flush();
    stream.push("Teil");
    await flush();
    stream.fail();
    await flush();

    expect(getChat(KEY).chat.messages[1]).toMatchObject({
      content: "Teil",
      status: "error",
      errorMessage: "network error",
    });
  });

  it("ignores a second question while an answer is still running", async () => {
    const fetchImpl = vi.fn(async () => controllableStream().response);
    void sendMessage(KEY, "Q1", { fetchImpl });
    await flush();
    void sendMessage(KEY, "Q2", { fetchImpl });
    await flush();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(getChat(KEY).chat.messages).toHaveLength(2);
  });

  it("keeps chats of different areas and players apart", async () => {
    const stream = controllableStream();
    void sendMessage(KEY, "nur Spieler", { fetchImpl: async () => stream.response });
    await flush();

    expect(getChat(chatKey("gm", "u1")).chat.messages).toEqual([]);
    expect(getChat(chatKey("player", "u2")).chat.messages).toEqual([]);
  });

  it("shrinks the stored chat when storage is full, and keeps working if it never fits", async () => {
    const stream = controllableStream();
    void sendMessage(KEY, "Frage", { fetchImpl: async () => stream.response });
    await flush();
    stream.push("Antwort");
    stream.close();
    await flush();

    const original = Storage.prototype.setItem;
    const writes: string[] = [];
    let failures = 1;
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key: string,
      value: string
    ) {
      if (failures-- > 0) throw new DOMException("full", "QuotaExceededError");
      writes.push(value);
      return original.call(this, key, value);
    });

    setSelectedBooks(KEY, ["phb"]);

    expect(writes).toHaveLength(1);
    const saved = JSON.parse(writes[0]) as StoredChat;
    expect(saved.messages.length).toBeLessThan(2);
    expect(saved.truncated).toBe(true);
    expect(getChat(KEY).chat.messages).toHaveLength(2); // the open chat is untouched

    setItem.mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(() => setSelectedBooks(KEY, [])).not.toThrow();
    expect(getChat(KEY).chat.selectedBooks).toEqual([]);
  });

  it("follows changes from another tab, without calling its running answer interrupted", () => {
    getChat(KEY); // loaded here
    const other: StoredChat = {
      ...emptyChat(),
      messages: [
        { id: "a", role: "user", content: "aus Tab B", status: "done" },
        { id: "b", role: "assistant", content: "läuft", status: "streaming" },
      ],
    };

    window.dispatchEvent(
      new StorageEvent("storage", { key: STORAGE_KEY, newValue: JSON.stringify(other) })
    );
    expect(getChat(KEY).chat.messages[1].status).toBe("streaming");
    expect(getChat(KEY).isLoading).toBe(false);

    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: null }));
    expect(getChat(KEY).chat.messages).toEqual([]);
  });

  it("does not let another tab overwrite a chat that is streaming here", async () => {
    const stream = controllableStream();
    void sendMessage(KEY, "hier", { fetchImpl: async () => stream.response });
    await flush();

    window.dispatchEvent(
      new StorageEvent("storage", { key: STORAGE_KEY, newValue: JSON.stringify(emptyChat()) })
    );

    expect(getChat(KEY).chat.messages[0].content).toBe("hier");
  });

  it("clears a player's chats on account deletion", () => {
    setSelectedBooks(chatKey("player", "u1"), ["phb"]);
    setSelectedBooks(chatKey("gm", "u1"), ["phb"]);
    setSelectedBooks(chatKey("player", "u2"), ["phb"]);

    clearSvenBotChats("u1");

    expect(localStorage.getItem(`${CHAT_STORAGE_PREFIX}:player:u1`)).toBeNull();
    expect(localStorage.getItem(`${CHAT_STORAGE_PREFIX}:gm:u1`)).toBeNull();
    expect(localStorage.getItem(`${CHAT_STORAGE_PREFIX}:player:u2`)).not.toBeNull();
  });

  it("does not let a request from before a reset write into the new state", async () => {
    const stream = controllableStream();
    void sendMessage(KEY, "alt", { fetchImpl: async () => stream.response });
    await flush();

    __resetChatStoreForTests();
    localStorage.clear();
    stream.push("späte Antwort");
    await flush();

    expect(getChat(KEY).chat.messages).toEqual([]);
    expect(stream.wasCancelled()).toBe(true);
  });
});

describe("resetChat (Neuer Chat)", () => {
  it("cancels a running answer, empties the chat and keeps the book filter", async () => {
    const stream = controllableStream();
    setSelectedBooks(KEY, ["phb"]);
    void sendMessage(KEY, "alt", { fetchImpl: async () => stream.response });
    await flush();
    stream.push("Teil");
    await flush();

    resetChat(KEY);
    stream.push(" und mehr");
    await vi.advanceTimersByTimeAsync(2000);

    const { chat, isLoading } = getChat(KEY);
    expect(chat.messages).toEqual([]);
    expect(chat.truncated).toBe(false);
    expect(chat.summary).toBe("");
    expect(chat.selectedBooks).toEqual(["phb"]);
    expect(isLoading).toBe(false);
    expect(stored()?.messages).toEqual([]);
    expect(stream.wasCancelled()).toBe(true);
  });

  it("lets a new question start right after the reset without the old answer showing up", async () => {
    const old = controllableStream();
    void sendMessage(KEY, "alt", { fetchImpl: async () => old.response });
    await flush();

    resetChat(KEY);
    const fresh = controllableStream();
    void sendMessage(KEY, "neu", { fetchImpl: async () => fresh.response });
    await flush();
    old.push("alte Antwort");
    old.close();
    fresh.push("neue Antwort");
    fresh.close();
    await flush();

    expect(getChat(KEY).chat.messages.map((m) => m.content)).toEqual(["neu", "neue Antwort"]);
    expect(getChat(KEY).isLoading).toBe(false);
  });
});

describe("running summary", () => {
  /** A chat with `count` complete exchanges stored before the page loads. */
  function storeExchanges(count: number, extra: Partial<StoredChat> = {}) {
    const messages = Array.from({ length: count }, (_, i) => [
      { id: `q${i}`, role: "user" as const, content: `Frage ${i}`, status: "done" as const },
      { id: `a${i}`, role: "assistant" as const, content: `Antwort ${i}`, status: "done" as const },
    ]).flat();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...emptyChat(), messages, ...extra }));
  }

  /** Answers chat requests with "ok" and summary requests via `summarize`. */
  function fakeApi(
    summarize: (body: {
      previousSummary: string;
      messages: unknown[];
    }) => Response | Promise<Response>
  ) {
    return vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/rulebook-chat/summary") return summarize(JSON.parse(init!.body as string));
      const stream = controllableStream();
      stream.push("ok");
      stream.close();
      return stream.response;
    });
  }

  it("summarizes once enough messages have left the window", async () => {
    storeExchanges(13); // + the new one = 14 → 4 exchanges outside the window
    const fetchImpl = fakeApi(() => Response.json({ summary: "Bisher: Fragen 0–3." }));

    await sendMessage(KEY, "Frage 13", { fetchImpl });
    await flush();

    const summaryCalls = fetchImpl.mock.calls.filter(
      ([url]) => url === "/api/rulebook-chat/summary"
    );
    expect(summaryCalls).toHaveLength(1);
    const body = JSON.parse((summaryCalls[0][1] as RequestInit).body as string);
    expect(body.previousSummary).toBe("");
    expect(body.messages).toHaveLength(8);
    expect(body.messages[0]).toEqual({ role: "user", content: "Frage 0" });

    expect(getChat(KEY).chat).toMatchObject({
      summary: "Bisher: Fragen 0–3.",
      summarizedUpTo: "a3",
    });
    expect(stored()?.summary).toBe("Bisher: Fragen 0–3.");
  });

  it("does not summarize while too little has left the window", async () => {
    storeExchanges(5);
    const fetchImpl = fakeApi(() => Response.json({ summary: "x" }));

    await sendMessage(KEY, "Frage", { fetchImpl });
    await flush();

    expect(fetchImpl.mock.calls.some(([url]) => url === "/api/rulebook-chat/summary")).toBe(false);
  });

  it("sends the summary with every question", async () => {
    storeExchanges(2, { summary: "Kämpfer Stufe 5, ETW0 16" });
    const fetchImpl = fakeApi(() => Response.json({ summary: "x" }));

    await sendMessage(KEY, "Und jetzt?", { fetchImpl });

    const chatCall = fetchImpl.mock.calls.find(([url]) => url === "/api/rulebook-chat")!;
    expect(JSON.parse((chatCall[1] as RequestInit).body as string).summary).toBe(
      "Kämpfer Stufe 5, ETW0 16"
    );
  });

  it("keeps the chat unchanged when summarizing fails", async () => {
    storeExchanges(13);
    const fetchImpl = fakeApi(() => new Response("{}", { status: 500 }));

    await sendMessage(KEY, "Frage 13", { fetchImpl });
    await flush();

    expect(getChat(KEY).chat.summary).toBe("");
    expect(getChat(KEY).chat.messages).toHaveLength(28);
  });

  it("drops a summary that arrives after 'new chat'", async () => {
    storeExchanges(13);
    let answer!: (response: Response) => void;
    const fetchImpl = fakeApi(() => new Promise<Response>((resolve) => (answer = resolve)));

    await sendMessage(KEY, "Frage 13", { fetchImpl });
    await flush();
    resetChat(KEY);
    answer(Response.json({ summary: "zu spät" }));
    await flush();

    expect(getChat(KEY).chat.summary).toBe("");
  });

  it("runs only one summary at a time", async () => {
    storeExchanges(13);
    let answer!: (response: Response) => void;
    const fetchImpl = fakeApi(() => new Promise<Response>((resolve) => (answer = resolve)));

    await sendMessage(KEY, "Frage 13", { fetchImpl });
    await flush();
    await sendMessage(KEY, "Frage 14", { fetchImpl });
    await flush();
    answer(Response.json({ summary: "s" }));
    await flush();

    expect(
      fetchImpl.mock.calls.filter(([url]) => url === "/api/rulebook-chat/summary")
    ).toHaveLength(1);
  });
});
