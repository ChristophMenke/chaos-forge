"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const t = useTranslations("rulebook");
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-3 border-t border-border/50"
      data-testid="chat-input-form"
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={t("placeholder")}
        aria-label={t("placeholder")}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
        data-testid="chat-input"
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !input.trim()}
        data-testid="chat-send-button"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">{t("send")}</span>
      </Button>
    </form>
  );
}
