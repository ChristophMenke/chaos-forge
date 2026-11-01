"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  EMPTY_SNAPSHOT,
  chatKey,
  getChat,
  resetChat,
  sendMessage,
  setSelectedBooks,
  subscribeChat,
  type ChatScope,
} from "@/lib/rulebook-chat/chat-store";

/** The stored SvenBot chat of this area and player, plus its actions. */
export function useRulebookChat(scope: ChatScope, userId: string) {
  const key = chatKey(scope, userId);
  const subscribe = useCallback((listener: () => void) => subscribeChat(key, listener), [key]);
  const getSnapshot = useCallback(() => getChat(key), [key]);
  const { chat, isLoading } = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_SNAPSHOT);

  const send = useCallback((text: string) => void sendMessage(key, text), [key]);
  const setBooks = useCallback((books: string[]) => setSelectedBooks(key, books), [key]);
  const reset = useCallback(() => resetChat(key), [key]);

  return { chat, isLoading, send, setBooks, reset };
}
