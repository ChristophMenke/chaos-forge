"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { BookFilter, ALL_SLUGS } from "./book-filter";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function RulebookChat() {
  const t = useTranslations("rulebook");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Abort in-flight request on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  function handleToggleBook(slug: string) {
    setSelectedBooks((prev) => {
      // If currently "all" (empty array), switch to all-except-this
      if (prev.length === 0) {
        return ALL_SLUGS.filter((s) => s !== slug);
      }
      if (prev.includes(slug)) {
        const next = prev.filter((s) => s !== slug);
        return next.length === 0 ? [] : next; // If none left, go back to "all"
      }
      const next = [...prev, slug];
      return next.length === ALL_SLUGS.length ? [] : next; // If all selected, use empty = "all"
    });
  }

  function handleSelectAll() {
    setSelectedBooks([]);
  }

  const handleSend = useCallback(
    async (message: string) => {
      const userMessage: Message = { role: "user", content: message };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingContent("");

      // Abort previous request if still running
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Build history (last 4 exchanges = 8 messages)
        const history = messages.slice(-8).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch("/api/rulebook-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            message,
            history,
            bookFilter: selectedBooks.length > 0 ? selectedBooks : undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        // Read streaming response
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setStreamingContent(fullContent);
        }

        // Add complete assistant message
        setMessages((prev) => [...prev, { role: "assistant", content: fullContent }]);
        setStreamingContent("");
      } catch (err) {
        // Ignore abort errors (component unmounted or new request)
        if (err instanceof DOMException && err.name === "AbortError") return;
        const errorMessage = err instanceof Error ? err.message : t("error");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `**${t("error")}:** ${errorMessage}` },
        ]);
        setStreamingContent("");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, selectedBooks, t]
  );

  const isEmpty = messages.length === 0 && !streamingContent;

  return (
    <div
      className="flex flex-col p-3 sm:p-6 h-[calc(100dvh-101px-4rem)] sm:h-[calc(100dvh-201px)]"
      data-testid="rulebook-chat"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="font-cinzel text-xl font-bold text-foreground">{t("title")}</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowFilter((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          data-testid="toggle-book-filter"
        >
          {t("filterBooks")}
        </button>
      </div>

      {/* Chat area */}
      <GlassCard hover={false} className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        {/* Book filter (collapsible) */}
        {showFilter && (
          <BookFilter
            selectedBooks={selectedBooks}
            onToggle={handleToggleBook}
            onSelectAll={handleSelectAll}
          />
        )}

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          data-testid="chat-messages"
        >
          {isEmpty && <WelcomeScreen t={t} onExampleClick={handleSend} />}

          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}

          {streamingContent && (
            <ChatMessage role="assistant" content={streamingContent} isStreaming />
          )}

          {isLoading && !streamingContent && (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              data-testid="chat-loading"
            >
              <Sparkles className="h-4 w-4 animate-pulse text-primary" />
              <span>{t("thinking")}</span>
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </GlassCard>
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
  const examples = [t("example1"), t("example2"), t("example3")];

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center text-center px-4"
      data-testid="chat-welcome"
    >
      <BookOpen className="h-12 w-12 text-primary/40 mb-4" />
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
