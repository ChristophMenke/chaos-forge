/**
 * SvenBot's chat as stored in the browser, and the pure rules around it:
 * trimming, what goes to the API as context, and reading it back.
 */

export type ChatStatus = "done" | "streaming" | "interrupted" | "error";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: ChatStatus;
  /** Server/network error text for status "error" (the UI adds the localized "Error:"). */
  errorMessage?: string;
}

export interface StoredChat {
  version: 1;
  messages: ChatMessage[];
  /** Book filter; empty = all books. */
  selectedBooks: string[];
  /** Older messages were dropped to stay within MAX_STORED_MESSAGES. */
  truncated: boolean;
  /** Running summary of messages that left the API window (Phase 3). */
  summary: string;
  /** Id of the last message folded into `summary`. */
  summarizedUpTo: string | null;
}

/** Messages kept per chat in localStorage. */
export const MAX_STORED_MESSAGES = 200;
/** Messages sent verbatim as context: the last 10 complete exchanges. */
export const API_HISTORY_LENGTH = 20;
/** The API silently drops longer history entries (route.ts). */
export const MAX_HISTORY_CONTENT_LENGTH = 10000;

export function emptyChat(): StoredChat {
  return {
    version: 1,
    messages: [],
    selectedBooks: [],
    truncated: false,
    summary: "",
    summarizedUpTo: null,
  };
}

export function appendMessage(chat: StoredChat, message: ChatMessage): StoredChat {
  const messages = [...chat.messages, message];
  const overflow = messages.length - MAX_STORED_MESSAGES;
  return overflow > 0
    ? { ...chat, messages: messages.slice(overflow), truncated: true }
    : { ...chat, messages };
}

export interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Complete exchanges only (question + finished answer), oldest first. Gemini
 * expects alternating user/model turns, so a question whose answer failed or
 * was cut off is dropped together with it.
 */
export function completeExchanges(messages: ChatMessage[]): [ChatMessage, ChatMessage][] {
  const exchanges: [ChatMessage, ChatMessage][] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const [question, answer] = [messages[i], messages[i + 1]];
    if (question.role !== "user" || answer.role !== "assistant") continue;
    i++;
    if (answer.status !== "done") continue;
    if (
      question.content.length > MAX_HISTORY_CONTENT_LENGTH ||
      answer.content.length > MAX_HISTORY_CONTENT_LENGTH
    ) {
      continue;
    }
    exchanges.push([question, answer]);
  }
  return exchanges;
}

/** The verbatim context for the next question: the last 10 complete exchanges. */
export function apiHistory(messages: ChatMessage[]): ApiMessage[] {
  return completeExchanges(messages)
    .slice(-API_HISTORY_LENGTH / 2)
    .flat()
    .map(({ role, content }) => ({ role, content }));
}

/** Summarize older messages in batches, not after every answer. */
export const SUMMARY_BATCH = 8;

/**
 * Complete messages that left the verbatim API window and are not yet part of
 * the running summary — returned once there are at least SUMMARY_BATCH.
 */
export function pendingForSummary(chat: StoredChat): ChatMessage[] {
  const exchanges = completeExchanges(chat.messages);
  const outside = exchanges.slice(0, Math.max(0, exchanges.length - API_HISTORY_LENGTH / 2));
  // A summarized message that got trimmed away was older than everything left.
  const coveredUpTo = chat.summarizedUpTo
    ? chat.messages.findIndex((m) => m.id === chat.summarizedUpTo)
    : -1;
  const pending = outside
    .filter(([, answer]) => chat.messages.indexOf(answer) > coveredUpTo)
    .flat();
  return pending.length >= SUMMARY_BATCH ? pending : [];
}

export function applySummary(chat: StoredChat, summary: string, upToId: string): StoredChat {
  return { ...chat, summary, summarizedUpTo: upToId };
}

const STATUSES: ChatStatus[] = ["done", "streaming", "interrupted", "error"];

function isMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.id === "string" &&
    (m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string" &&
    STATUSES.includes(m.status as ChatStatus) &&
    (m.errorMessage === undefined || typeof m.errorMessage === "string")
  );
}

/** Reads a stored chat as-is (another tab may still be streaming into it). */
export function parseChat(raw: string | null): StoredChat {
  if (!raw) return emptyChat();
  try {
    const data = JSON.parse(raw) as Partial<StoredChat>;
    if (data.version !== 1 || !Array.isArray(data.messages) || !data.messages.every(isMessage)) {
      return emptyChat();
    }
    return {
      version: 1,
      messages: data.messages,
      selectedBooks: Array.isArray(data.selectedBooks)
        ? data.selectedBooks.filter((b): b is string => typeof b === "string")
        : [],
      truncated: data.truncated === true,
      summary: typeof data.summary === "string" ? data.summary : "",
      summarizedUpTo: typeof data.summarizedUpTo === "string" ? data.summarizedUpTo : null,
    };
  } catch {
    return emptyChat();
  }
}

/**
 * Reads the chat when the page loads. Nothing streams yet in this tab, so an
 * answer stored mid-stream was cut off (tab closed) and is marked interrupted.
 */
export function restoreChat(raw: string | null): StoredChat {
  const chat = parseChat(raw);
  if (!chat.messages.some((m) => m.status === "streaming")) return chat;
  return {
    ...chat,
    messages: chat.messages.map((m) =>
      m.status === "streaming" ? { ...m, status: "interrupted" } : m
    ),
  };
}
