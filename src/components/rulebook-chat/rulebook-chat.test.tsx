import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => (key === "botName" ? "SvenBot" : key),
}));

const { RulebookChat } = await import("./rulebook-chat");
const { CHAT_STORAGE_PREFIX, __resetChatStoreForTests } =
  await import("@/lib/rulebook-chat/chat-store");

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  __resetChatStoreForTests();
  localStorage.clear();
});

const Chat = () => <RulebookChat scope="player" userId="u1" />;

function storeChat(messages: object[], extra: object = {}) {
  localStorage.setItem(
    `${CHAT_STORAGE_PREFIX}:player:u1`,
    JSON.stringify({
      version: 1,
      messages,
      selectedBooks: [],
      truncated: false,
      summary: "",
      summarizedUpTo: null,
      ...extra,
    })
  );
}

/** fetch answering with a stream the test controls. */
function streamingFetch() {
  const encoder = new TextEncoder();
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({ start: (c) => void (controller = c) });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(body, { status: 200 }))
  );
  return {
    push: (text: string) => controller.enqueue(encoder.encode(text)),
    close: () => controller.close(),
  };
}

describe("RulebookChat", () => {
  it("introduces SvenBot with his face in the header", () => {
    render(<Chat />);

    const heading = screen.getByRole("heading", { level: 1, name: "SvenBot" });
    const header = heading.closest("[data-testid='rulebook-chat-header']") as HTMLElement;
    expect(header).not.toBeNull();
    expect(within(header).getByText("title")).toBeInTheDocument();
    expect(within(header).getByTestId("svenbot-avatar")).toBeInTheDocument();
  });

  it("greets with a large portrait in the empty chat", () => {
    render(<Chat />);

    const welcome = screen.getByTestId("chat-welcome");
    expect(within(welcome).getByText("welcome")).toBeInTheDocument();
    expect(within(welcome).getByTestId("svenbot-avatar")).toHaveClass("h-20", "w-20");
  });

  it("shows SvenBot rubbing his hands while the answer is loading", async () => {
    // A request that never settles keeps the chat in its loading state.
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    );
    render(<Chat />);

    fireEvent.click(screen.getAllByTestId("example-question")[0]);

    const loading = await screen.findByTestId("chat-loading");
    expect(within(loading).getByText("thinking")).toBeInTheDocument();
    expect(within(loading).getByTestId("svenbot-avatar")).toBeInTheDocument();
  });

  it("shows the stored conversation when opened again", async () => {
    storeChat([
      { id: "1", role: "user", content: "Was ist ETW0?", status: "done" },
      { id: "2", role: "assistant", content: "ETW0 16", status: "done" },
    ]);
    render(<Chat />);

    expect(screen.getByText("Was ist ETW0?")).toBeInTheDocument();
    expect(await screen.findByText("ETW0 16")).toBeInTheDocument();
    expect(screen.queryByTestId("chat-welcome")).not.toBeInTheDocument();
  });

  it("finishes an answer while the chat is closed and shows it on return", async () => {
    const stream = streamingFetch();
    const { unmount } = render(<Chat />);
    fireEvent.click(screen.getAllByTestId("example-question")[0]);
    await screen.findByTestId("chat-loading");

    unmount(); // player switches page
    stream.push("Die ganze Antwort");
    stream.close();
    await new Promise((resolve) => setTimeout(resolve, 0));

    render(<Chat />);
    expect(await screen.findByText("Die ganze Antwort")).toBeInTheDocument();
  });

  it("keeps the player and GM chats apart", () => {
    storeChat([{ id: "1", role: "user", content: "Spielerfrage", status: "done" }]);
    render(<RulebookChat scope="gm" userId="u1" />);

    expect(screen.queryByText("Spielerfrage")).not.toBeInTheDocument();
    expect(screen.getByTestId("chat-welcome")).toBeInTheDocument();
  });

  it("notes that older messages were removed", () => {
    storeChat([{ id: "1", role: "user", content: "q", status: "done" }], { truncated: true });
    render(<Chat />);

    expect(screen.getByText("truncated")).toBeInTheDocument();
  });

  it("blocks the example questions while an answer is running", async () => {
    streamingFetch();
    storeChat([]);
    render(<Chat />);
    fireEvent.click(screen.getAllByTestId("example-question")[0]);
    await screen.findByTestId("chat-loading");

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("example-question")).not.toBeInTheDocument();
  });

  it("offers 'new chat' only when there is a conversation", () => {
    render(<Chat />);
    expect(screen.queryByRole("button", { name: "newChat" })).not.toBeInTheDocument();

    cleanup();
    __resetChatStoreForTests(); // reload
    storeChat([{ id: "1", role: "user", content: "q", status: "done" }]);
    render(<Chat />);
    expect(screen.getByRole("button", { name: "newChat" })).toBeInTheDocument();
  });

  it("keeps the conversation when the question is cancelled", async () => {
    storeChat([{ id: "1", role: "user", content: "Bleib da", status: "done" }]);
    render(<Chat />);

    fireEvent.click(screen.getByRole("button", { name: "newChat" }));
    expect(await screen.findByText("newChatConfirmText")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("confirm-cancel"));

    expect(screen.getByText("Bleib da")).toBeInTheDocument();
  });

  it("starts over after confirming", async () => {
    storeChat([{ id: "1", role: "user", content: "Weg damit", status: "done" }]);
    render(<Chat />);

    fireEvent.click(screen.getByRole("button", { name: "newChat" }));
    const confirm = await screen.findByTestId("confirm-delete");
    expect(confirm).toHaveTextContent("newChat");
    fireEvent.click(confirm);

    expect(screen.queryByText("Weg damit")).not.toBeInTheDocument();
    expect(screen.getByTestId("chat-welcome")).toBeInTheDocument();
  });
});
