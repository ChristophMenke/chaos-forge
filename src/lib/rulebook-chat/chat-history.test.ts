// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  API_HISTORY_LENGTH,
  MAX_STORED_MESSAGES,
  apiHistory,
  appendMessage,
  applySummary,
  emptyChat,
  pendingForSummary,
  SUMMARY_BATCH,
  parseChat,
  restoreChat,
  type ChatMessage,
  type StoredChat,
} from "./chat-history";

let n = 0;
function msg(role: ChatMessage["role"], content: string, status: ChatMessage["status"] = "done") {
  return { id: `m${n++}`, role, content, status } satisfies ChatMessage;
}
const pair = (q: string, a: string, status: ChatMessage["status"] = "done") => [
  msg("user", q),
  msg("assistant", a, status),
];
const chatOf = (messages: ChatMessage[]): StoredChat => ({ ...emptyChat(), messages });

describe("appendMessage", () => {
  it("appends a message", () => {
    const chat = appendMessage(emptyChat(), msg("user", "Hallo"));
    expect(chat.messages.map((m) => m.content)).toEqual(["Hallo"]);
    expect(chat.truncated).toBe(false);
  });

  it("keeps only the newest 200 messages and remembers that it cut", () => {
    let chat = emptyChat();
    for (let i = 0; i <= MAX_STORED_MESSAGES; i++) chat = appendMessage(chat, msg("user", `q${i}`));

    expect(chat.messages).toHaveLength(MAX_STORED_MESSAGES);
    expect(chat.messages[0].content).toBe("q1");
    expect(chat.truncated).toBe(true);
  });
});

describe("apiHistory", () => {
  it("sends the last 10 complete exchanges as alternating user/assistant turns", () => {
    const messages = Array.from({ length: 12 }, (_, i) => pair(`q${i}`, `a${i}`)).flat();

    const history = apiHistory(messages);

    expect(API_HISTORY_LENGTH).toBe(20);
    expect(history).toHaveLength(20);
    expect(history[0]).toEqual({ role: "user", content: "q2" });
    expect(history.at(-1)).toEqual({ role: "assistant", content: "a11" });
    history.forEach((m, i) => expect(m.role).toBe(i % 2 === 0 ? "user" : "assistant"));
  });

  it("drops a question together with its failed, interrupted or still running answer", () => {
    const history = apiHistory([
      ...pair("ok1", "a1"),
      ...pair("broken", "", "error"),
      ...pair("cut", "Stufe 5 und", "interrupted"),
      ...pair("ok2", "a2"),
      msg("user", "running"),
      msg("assistant", "…", "streaming"),
    ]);

    expect(history.map((m) => m.content)).toEqual(["ok1", "a1", "ok2", "a2"]);
  });

  it("drops a dangling question without answer", () => {
    expect(apiHistory([...pair("q", "a"), msg("user", "no answer yet")])).toEqual([
      { role: "user", content: "q" },
      { role: "assistant", content: "a" },
    ]);
  });

  it("drops exchanges the server would silently reject (over 10,000 characters)", () => {
    const history = apiHistory([...pair("long", "x".repeat(10001)), ...pair("q", "a")]);
    expect(history.map((m) => m.content)).toEqual(["q", "a"]);
  });

  it("is used by the server as its history limit too", () => {
    const route = readFileSync(
      path.resolve(__dirname, "../../app/api/rulebook-chat/route.ts"),
      "utf8"
    );
    expect(route).toContain("API_HISTORY_LENGTH");
    expect(route).not.toMatch(/\.slice\(-8\)/);
  });
});

describe("parseChat / restoreChat", () => {
  const stored = {
    ...chatOf([...pair("q", "a"), msg("user", "q2"), msg("assistant", "Te", "streaming")]),
    selectedBooks: ["phb"],
  };

  it("reads a stored chat unchanged", () => {
    expect(parseChat(JSON.stringify(stored))).toEqual(stored);
  });

  it("marks an answer that was still streaming as interrupted when restoring", () => {
    const restored = restoreChat(JSON.stringify(stored));
    expect(restored.messages.at(-1)?.status).toBe("interrupted");
    expect(restored.selectedBooks).toEqual(["phb"]);
  });

  it.each([
    ["no value", null],
    ["broken JSON", "{nope"],
    ["wrong version", JSON.stringify({ ...stored, version: 99 })],
    ["missing messages", JSON.stringify({ version: 1 })],
    ["invalid message", JSON.stringify({ ...stored, messages: [{ role: "x" }] })],
  ])("falls back to an empty chat for %s", (_label, raw) => {
    expect(restoreChat(raw)).toEqual(emptyChat());
  });
});

describe("pendingForSummary / applySummary", () => {
  const exchanges = (count: number) =>
    Array.from({ length: count }, (_, i) => pair(`q${i}`, `a${i}`)).flat();

  it("waits until at least 8 complete messages have left the 20-message window", () => {
    expect(SUMMARY_BATCH).toBe(8);
    expect(pendingForSummary(chatOf(exchanges(13)))).toEqual([]); // 3 exchanges outside
    const pending = pendingForSummary(chatOf(exchanges(14))); // 4 exchanges outside
    expect(pending.map((m) => m.content)).toEqual(["q0", "a0", "q1", "a1", "q2", "a2", "q3", "a3"]);
  });

  it("skips what is already summarized", () => {
    const messages = exchanges(18); // 8 exchanges outside the window
    const chat = applySummary(chatOf(messages), "Bisher: ETW0", messages[7].id); // up to a3

    expect(chat.summary).toBe("Bisher: ETW0");
    expect(pendingForSummary(chat).map((m) => m.content)).toEqual([
      "q4",
      "a4",
      "q5",
      "a5",
      "q6",
      "a6",
      "q7",
      "a7",
    ]);
  });

  it("treats a summarized message that was trimmed away as fully covered", () => {
    const chat = { ...chatOf(exchanges(14)), summarizedUpTo: "gone", summary: "alt" };
    expect(pendingForSummary(chat)).toHaveLength(8);
  });

  it("leaves out failed exchanges", () => {
    const messages = [...pair("x", "", "error"), ...exchanges(14)];
    expect(pendingForSummary(chatOf(messages)).map((m) => m.content)[0]).toBe("q0");
  });

  it("reads summary fields, defaulting for older stored chats", () => {
    const raw = { version: 1, messages: [], selectedBooks: [], truncated: false };
    expect(parseChat(JSON.stringify(raw))).toMatchObject({ summary: "", summarizedUpTo: null });
  });
});
