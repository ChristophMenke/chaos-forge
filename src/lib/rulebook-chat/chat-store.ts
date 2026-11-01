/**
 * SvenBot chats live here, outside React: a page or GM tab that unmounts does
 * not stop a running answer, and the chat survives reloads via localStorage.
 * One chat per area and player (`player:<userId>`, `gm:<userId>`); views read
 * it through useRulebookChat (useSyncExternalStore).
 */

import {
  apiHistory,
  appendMessage,
  applySummary,
  pendingForSummary,
  emptyChat,
  parseChat,
  restoreChat,
  type ChatMessage,
  type StoredChat,
} from "./chat-history";

export type ChatScope = "player" | "gm";

/** The part of fetch the store uses (always called with a URL string). */
export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface ChatSnapshot {
  chat: StoredChat;
  /** An answer is being fetched in this tab (never stored). */
  isLoading: boolean;
}

export const CHAT_STORAGE_PREFIX = "chaos-forge-svenbot-chat";
const SAVE_INTERVAL_MS = 1000;

/** Returned for unknown keys and on the server — must stay the same object. */
export const EMPTY_SNAPSHOT: ChatSnapshot = Object.freeze({
  chat: emptyChat(),
  isLoading: false,
});

const snapshots = new Map<string, ChatSnapshot>();
const listeners = new Map<string, Set<() => void>>();
const controllers = new Map<string, AbortController>();
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
const lastSaved = new Map<string, number>();
/** Chats with a summary request in flight (one at a time per chat). */
const summarizing = new Set<string>();
/** Bumped per chat on "new chat"; late summaries of the old chat are dropped. */
const epochs = new Map<string, number>();
/** Bumped by the test reset; requests from an older generation write nothing. */
let generation = 0;
let idCounter = 0;
let storageListening = false;

export function chatKey(scope: ChatScope, userId: string): string {
  return `${scope}:${userId}`;
}

const storageKey = (key: string) => `${CHAT_STORAGE_PREFIX}:${key}`;

function nextId(): string {
  // Not crypto.randomUUID: it is missing on plain-HTTP origins (testing over the LAN).
  return `${Date.now().toString(36)}-${(idCounter++).toString(36)}`;
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(storageKey(key));
  } catch {
    return null;
  }
}

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function setSnapshot(key: string, snapshot: ChatSnapshot) {
  snapshots.set(key, snapshot);
  notify(key);
}

/** Current chat; loads it from localStorage on first access (idempotent, no writes). */
export function getChat(key: string): ChatSnapshot {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  let snapshot = snapshots.get(key);
  if (!snapshot) {
    snapshot = { chat: restoreChat(readStorage(key)), isLoading: false };
    snapshots.set(key, snapshot);
  }
  return snapshot;
}

function isQuotaError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "QuotaExceededError";
}

/** Writes the chat; when storage is full, keeps dropping the oldest half. */
function save(key: string) {
  const timer = saveTimers.get(key);
  if (timer !== undefined) clearTimeout(timer);
  saveTimers.delete(key);
  lastSaved.set(key, Date.now());

  let chat = getChat(key).chat;
  for (;;) {
    try {
      window.localStorage.setItem(storageKey(key), JSON.stringify(chat));
      return;
    } catch (error) {
      if (!isQuotaError(error) || chat.messages.length === 0) return; // blocked: page-only chat
      chat = {
        ...chat,
        messages: chat.messages.slice(Math.ceil(chat.messages.length / 2)),
        truncated: true,
      };
    }
  }
}

function saveThrottled(key: string) {
  const elapsed = Date.now() - (lastSaved.get(key) ?? 0);
  if (elapsed >= SAVE_INTERVAL_MS) return save(key);
  if (!saveTimers.has(key)) {
    saveTimers.set(
      key,
      setTimeout(() => save(key), SAVE_INTERVAL_MS - elapsed)
    );
  }
}

function update(
  key: string,
  change: (chat: StoredChat) => StoredChat,
  options: { isLoading?: boolean; persist: "now" | "throttled" }
) {
  const current = getChat(key);
  setSnapshot(key, {
    chat: change(current.chat),
    isLoading: options.isLoading ?? current.isLoading,
  });
  if (options.persist === "now") save(key);
  else saveThrottled(key);
}

function updateMessage(chat: StoredChat, id: string, patch: Partial<ChatMessage>): StoredChat {
  return {
    ...chat,
    messages: chat.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  };
}

function onStorage(event: StorageEvent) {
  if (!event.key?.startsWith(`${CHAT_STORAGE_PREFIX}:`)) return;
  const key = event.key.slice(CHAT_STORAGE_PREFIX.length + 1);
  // Only chats open in this tab, and never while this tab is streaming into it.
  if (!snapshots.has(key) || controllers.has(key)) return;
  // parseChat, not restoreChat: the other tab may still be streaming.
  setSnapshot(key, { chat: parseChat(event.newValue), isLoading: false });
}

export function subscribeChat(key: string, listener: () => void): () => void {
  if (!storageListening && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
    storageListening = true;
  }
  let set = listeners.get(key);
  if (!set) listeners.set(key, (set = new Set()));
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}

/**
 * Folds messages that left the verbatim window into the running summary, in
 * the background. Failures are ignored; the next answer retries.
 */
async function maybeSummarize(key: string, fetchImpl: FetchLike) {
  if (summarizing.has(key)) return;
  const chat = getChat(key).chat;
  const pending = pendingForSummary(chat);
  if (pending.length === 0) return;

  const myGeneration = generation;
  const myEpoch = epochs.get(key) ?? 0;
  summarizing.add(key);
  try {
    const response = await fetchImpl("/api/rulebook-chat/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        previousSummary: chat.summary,
        messages: pending.map(({ role, content }) => ({ role, content })),
      }),
    });
    if (!response.ok) return;
    const { summary } = (await response.json()) as { summary?: unknown };
    if (typeof summary !== "string" || !summary) return;
    if (generation !== myGeneration || (epochs.get(key) ?? 0) !== myEpoch) return;
    update(key, (current) => applySummary(current, summary, pending.at(-1)!.id), {
      persist: "now",
    });
  } catch {
    // Offline or server error — try again after the next answer.
  } finally {
    if (generation === myGeneration) summarizing.delete(key);
  }
}

interface SendOptions {
  fetchImpl?: FetchLike;
}

/** Asks SvenBot. Keeps running when every view has unmounted. */
export async function sendMessage(
  key: string,
  text: string,
  { fetchImpl = fetch }: SendOptions = {}
): Promise<void> {
  if (controllers.has(key)) return; // one answer at a time
  const before = getChat(key).chat;
  const controller = new AbortController();
  const myGeneration = generation;
  controllers.set(key, controller);
  const isCurrent = () =>
    generation === myGeneration &&
    controllers.get(key) === controller &&
    !controller.signal.aborted;

  const answerId = nextId();
  update(
    key,
    (chat) =>
      appendMessage(
        appendMessage(chat, { id: nextId(), role: "user", content: text, status: "done" }),
        { id: answerId, role: "assistant", content: "", status: "streaming" }
      ),
    { isLoading: true, persist: "now" }
  );

  let received = "";
  try {
    const response = await fetchImpl("/api/rulebook-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        message: text,
        history: apiHistory(before.messages),
        bookFilter: before.selectedBooks.length > 0 ? before.selectedBooks : undefined,
        summary: before.summary || undefined,
      }),
    });
    if (!isCurrent()) return;
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (!isCurrent()) {
        await reader.cancel().catch(() => {});
        return;
      }
      if (done) break;
      received += decoder.decode(value, { stream: true });
      update(key, (chat) => updateMessage(chat, answerId, { content: received }), {
        persist: "throttled",
      });
    }

    update(key, (chat) => updateMessage(chat, answerId, { content: received, status: "done" }), {
      isLoading: false,
      persist: "now",
    });
    void maybeSummarize(key, fetchImpl);
  } catch (error) {
    const aborted = (error as Error)?.name === "AbortError" || controller.signal.aborted;
    if (aborted || !isCurrent()) return;
    update(
      key,
      (chat) =>
        updateMessage(chat, answerId, {
          content: received,
          status: "error",
          errorMessage: error instanceof Error ? error.message : String(error),
        }),
      { isLoading: false, persist: "now" }
    );
  } finally {
    if (controllers.get(key) === controller) controllers.delete(key);
  }
}

/**
 * "New chat": cancels a running answer and empties the conversation (summary
 * included); the book filter stays.
 */
export function resetChat(key: string): void {
  epochs.set(key, (epochs.get(key) ?? 0) + 1);
  controllers.get(key)?.abort();
  controllers.delete(key);
  update(key, (chat) => ({ ...emptyChat(), selectedBooks: chat.selectedBooks }), {
    isLoading: false,
    persist: "now", // also drops a pending throttled save of the old chat
  });
}

export function setSelectedBooks(key: string, selectedBooks: string[]): void {
  update(key, (chat) => ({ ...chat, selectedBooks }), { persist: "now" });
}

/** Removes a player's stored chats (account deletion). */
export function clearSvenBotChats(userId: string): void {
  for (const scope of ["player", "gm"] as const) {
    const key = chatKey(scope, userId);
    epochs.set(key, (epochs.get(key) ?? 0) + 1);
    controllers.get(key)?.abort();
    controllers.delete(key);
    snapshots.delete(key);
    try {
      window.localStorage.removeItem(storageKey(key));
    } catch {
      // nothing stored
    }
  }
}

/** Test helper: forget all in-memory state, as after a page reload. */
export function __resetChatStoreForTests(): void {
  generation++;
  controllers.forEach((controller) => controller.abort());
  controllers.clear();
  saveTimers.forEach((timer) => clearTimeout(timer));
  saveTimers.clear();
  lastSaved.clear();
  snapshots.clear();
  listeners.clear();
  summarizing.clear();
  epochs.clear();
}
