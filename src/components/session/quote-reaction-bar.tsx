"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { QuoteReactionRow } from "@/lib/supabase/types";

const EMOJI_OPTIONS = ["👍", "😂", "💀", "🔥", "⭐", "❤️", "🐉", "⚔️"];

interface QuoteReactionBarProps {
  quoteId: string;
  currentUserId: string;
  initialReactions: QuoteReactionRow[];
}

export function QuoteReactionBar({
  quoteId,
  currentUserId,
  initialReactions,
}: QuoteReactionBarProps) {
  const [reactions, setReactions] = useState(initialReactions);
  const [showPicker, setShowPicker] = useState(false);

  async function toggleReaction(emoji: string) {
    const supabase = createClient();
    const existing = reactions.find(
      (r) => r.quote_id === quoteId && r.user_id === currentUserId && r.emoji === emoji
    );

    if (existing) {
      const { error } = await supabase
        .from("chronicle_quote_reactions")
        .delete()
        .eq("id", existing.id);
      if (!error) {
        setReactions((prev) => prev.filter((r) => r.id !== existing.id));
      }
    } else {
      const { data, error } = await supabase
        .from("chronicle_quote_reactions")
        .insert({ quote_id: quoteId, user_id: currentUserId, emoji })
        .select()
        .single<QuoteReactionRow>();
      if (!error && data) {
        setReactions((prev) => [...prev, data]);
      }
    }
  }

  // Group reactions by emoji with count
  const emojiCounts = new Map<string, { count: number; userReacted: boolean }>();
  for (const r of reactions) {
    const existing = emojiCounts.get(r.emoji) ?? { count: 0, userReacted: false };
    existing.count++;
    if (r.user_id === currentUserId) existing.userReacted = true;
    emojiCounts.set(r.emoji, existing);
  }

  return (
    <div className="flex flex-wrap items-center gap-1" data-testid="quote-reaction-bar">
      {[...emojiCounts.entries()].map(([emoji, { count, userReacted }]) => (
        <button
          key={emoji}
          onClick={() => toggleReaction(emoji)}
          className={`rounded-full px-1.5 py-0.5 text-xs transition-colors ${
            userReacted ? "bg-primary/10 ring-1 ring-primary/50" : "bg-muted hover:bg-muted/80"
          }`}
          data-testid={`quote-reaction-${emoji}`}
        >
          {emoji} {count}
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted/80"
          data-testid="quote-reaction-add"
        >
          +
        </button>
        {showPicker && (
          <div className="absolute bottom-full left-0 z-50 mb-1 flex gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-lg">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  toggleReaction(emoji);
                  setShowPicker(false);
                }}
                className="rounded px-1 py-0.5 text-sm hover:bg-muted"
                data-testid={`quote-emoji-option-${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
