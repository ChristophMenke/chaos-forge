"use client";

import { MarkdownRenderer as ReactMarkdown } from "@/components/markdown-renderer";
import remarkBreaks from "remark-breaks";
import { cn } from "@/lib/utils";
import { convertImperialText } from "@/lib/utils/units";
import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { SvenBotAvatar } from "@/components/svenbot/svenbot-avatar";
import type { ChatStatus } from "@/lib/rulebook-chat/chat-history";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  /** Defaults to "done". */
  status?: ChatStatus;
  errorMessage?: string;
}

export function ChatMessage({ role, content, status = "done", errorMessage }: ChatMessageProps) {
  const t = useTranslations("rulebook");
  const isUser = role === "user";
  const isStreaming = status === "streaming";

  // Apply metric conversion to assistant messages
  const displayContent = isUser ? content : convertImperialText(content);

  return (
    <div
      className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}
      data-testid={`chat-message-${role}`}
    >
      {!isUser && <SvenBotAvatar size="sm" className="self-start" />}
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-3",
          isUser
            ? "bg-primary/20 border border-primary/30 text-foreground"
            : "glass border border-border/50 text-foreground"
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
        ) : (
          (displayContent || status === "error") && (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                {status === "error"
                  ? // Prefix rendered now, so it follows the current language.
                    [displayContent, `**${t("error")}:** ${errorMessage ?? ""}`]
                      .filter(Boolean)
                      .join("\n\n")
                  : displayContent}
              </ReactMarkdown>
            </div>
          )
        )}
        {status === "interrupted" && (
          <p
            className={cn(
              "flex items-center gap-1.5 text-xs text-amber-400",
              displayContent && "mt-2"
            )}
          >
            <TriangleAlert className="h-3.5 w-3.5" />
            {t("interrupted")}
          </p>
        )}
        {isStreaming && <span className="mt-1 inline-block h-4 w-1 animate-pulse bg-primary/60" />}
      </div>
    </div>
  );
}
