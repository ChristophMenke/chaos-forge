"use client";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { cn } from "@/lib/utils";
import { convertImperialText } from "@/lib/utils/units";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === "user";

  // Apply metric conversion to assistant messages
  const displayContent = isUser ? content : convertImperialText(content);

  return (
    <div
      className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}
      data-testid={`chat-message-${role}`}
    >
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
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkBreaks]}>{displayContent}</ReactMarkdown>
          </div>
        )}
        {isStreaming && <span className="mt-1 inline-block h-4 w-1 animate-pulse bg-primary/60" />}
      </div>
    </div>
  );
}
