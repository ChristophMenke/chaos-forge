"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { BookFilter, ALL_SLUGS } from "./book-filter";
import { SvenBotAvatar } from "@/components/svenbot/svenbot-avatar";
import { useRulebookChat } from "./use-rulebook-chat";
import type { ChatScope } from "@/lib/rulebook-chat/chat-store";

interface RulebookChatProps {
  /** Player page and GM area keep separate conversations. */
  scope: ChatScope;
  userId: string;
}

/**
 * SvenBot. The conversation lives in the chat store (src/lib/rulebook-chat),
 * so it survives page and tab switches, reloads, and answers keep streaming
 * while this view is unmounted.
 */
export function RulebookChat({ scope, userId }: RulebookChatProps) {
  const t = useTranslations("rulebook");
  const { chat, isLoading, send, setBooks, reset } = useRulebookChat(scope, userId);
  const { messages, selectedBooks, truncated } = chat;
  const [showFilter, setShowFilter] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages and while streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleToggleBook(slug: string) {
    // Empty selection means "all books".
    if (selectedBooks.length === 0) return setBooks(ALL_SLUGS.filter((s) => s !== slug));
    if (selectedBooks.includes(slug)) return setBooks(selectedBooks.filter((s) => s !== slug));
    const next = [...selectedBooks, slug];
    setBooks(next.length === ALL_SLUGS.length ? [] : next);
  }

  function handleSend(message: string) {
    if (!isLoading) send(message);
  }

  const lastMessage = messages.at(-1);
  const waitingForFirstWords =
    isLoading && lastMessage?.status === "streaming" && lastMessage.content === "";
  const isEmpty = messages.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-6" data-testid="rulebook-chat">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between" data-testid="rulebook-chat-header">
        <div className="flex items-center gap-3">
          <SvenBotAvatar size="md" />
          <div className="leading-tight">
            <h1 className="font-cinzel text-xl font-bold text-foreground">{t("botName")}</h1>
            <p className="text-xs text-muted-foreground">{t("title")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isEmpty && (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-testid="new-chat"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("newChat")}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFilter((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-testid="toggle-book-filter"
          >
            {t("filterBooks")}
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="glass glow-neutral flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl">
        {/* Book filter (collapsible) */}
        {showFilter && (
          <BookFilter
            selectedBooks={selectedBooks}
            onToggle={handleToggleBook}
            onSelectAll={() => setBooks([])}
          />
        )}

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          data-testid="chat-messages"
        >
          {isEmpty && <WelcomeScreen t={t} onExampleClick={handleSend} />}

          {truncated && (
            <p className="text-center text-xs text-muted-foreground" data-testid="chat-truncated">
              {t("truncated")}
            </p>
          )}

          {messages.map((msg) =>
            // The empty streaming answer is shown as the loading line below.
            msg.status === "streaming" && msg.content === "" ? null : (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                status={msg.status}
                errorMessage={msg.errorMessage}
              />
            )
          )}

          {waitingForFirstWords && (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              data-testid="chat-loading"
            >
              <SvenBotAvatar size="sm" className="animate-pulse" />
              <span>{t("thinking")}</span>
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>

      <ConfirmDialog
        open={confirmReset}
        title={t("newChatConfirmTitle")}
        message={t("newChatConfirmText")}
        confirmLabel={t("newChat")}
        onConfirm={() => {
          reset();
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

function WelcomeScreen({
  t,
  onExampleClick,
}: {
  t: (key: string) => string;
  onExampleClick: (message: string) => void;
}) {
  const examples = [t("example1"), t("example2"), t("example3"), t("example4")];

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center text-center px-4"
      data-testid="chat-welcome"
    >
      <SvenBotAvatar size="lg" className="mb-4" />
      <p className="text-sm text-muted-foreground max-w-md mb-6">{t("welcome")}</p>
      <p className="text-xs text-muted-foreground mb-3">{t("exampleQuestions")}</p>
      <div className="flex flex-col gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onExampleClick(example)}
            className="rounded-lg border border-border/50 bg-background/30 px-4 py-2 text-sm text-foreground/80 hover:bg-primary/10 hover:border-primary/30 transition-colors text-left"
            data-testid="example-question"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
