"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { ChronicleQuoteRow, QuoteReactionRow } from "@/lib/supabase/types";

const EMOJI_OPTIONS = ["👍", "😂", "💀", "🔥", "⭐", "❤️", "🐉", "⚔️"];

interface QuoteSectionProps {
  quotes: ChronicleQuoteRow[];
  reactions: QuoteReactionRow[];
  currentUserId: string;
}

export function QuoteSection({
  quotes: initialQuotes,
  reactions: initialReactions,
  currentUserId,
}: QuoteSectionProps) {
  const t = useTranslations("chronicle");
  const tcom = useTranslations("common");
  const [quotes, setQuotes] = useState(initialQuotes);
  const [reactions, setReactions] = useState(initialReactions);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [attributedTo, setAttributedTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    const supabase = createClient();

    if (editingId) {
      const { error } = await supabase
        .from("chronicle_quotes")
        .update({ content: content.trim(), attributed_to: attributedTo.trim() })
        .eq("id", editingId);
      if (!error) {
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === editingId
              ? { ...q, content: content.trim(), attributed_to: attributedTo.trim() }
              : q
          )
        );
      }
    } else {
      const { data, error } = await supabase
        .from("chronicle_quotes")
        .insert({
          content: content.trim(),
          attributed_to: attributedTo.trim(),
          created_by: currentUserId,
        })
        .select()
        .single<ChronicleQuoteRow>();
      if (!error && data) {
        setQuotes((prev) => [data, ...prev]);
      }
    }

    resetForm();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("chronicle_quotes").delete().eq("id", id);
    if (!error) {
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      setReactions((prev) => prev.filter((r) => r.quote_id !== id));
    }
  }

  async function toggleReaction(quoteId: string, emoji: string) {
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

  function startEdit(quote: ChronicleQuoteRow) {
    setEditingId(quote.id);
    setContent(quote.content);
    setAttributedTo(quote.attributed_to);
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setContent("");
    setAttributedTo("");
    setShowForm(false);
  }

  function getReactionCounts(quoteId: string): { emoji: string; count: number; hasOwn: boolean }[] {
    const quoteReactions = reactions.filter((r) => r.quote_id === quoteId);
    const grouped = new Map<string, { count: number; hasOwn: boolean }>();
    for (const r of quoteReactions) {
      const current = grouped.get(r.emoji) ?? { count: 0, hasOwn: false };
      current.count++;
      if (r.user_id === currentUserId) current.hasOwn = true;
      grouped.set(r.emoji, current);
    }
    return Array.from(grouped.entries()).map(([emoji, data]) => ({
      emoji,
      ...data,
    }));
  }

  return (
    <div data-testid="quote-section">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-xl text-primary">{t("quotes")}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          data-testid="quote-add-button"
        >
          {showForm ? tcom("cancel") : t("addQuote")}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div
          className="mb-4 rounded-lg border border-border bg-card/50 p-4"
          data-testid="quote-form"
        >
          <div className="flex flex-col gap-3">
            <textarea
              placeholder={t("quoteContent")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[60px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm italic"
              data-testid="quote-content-input"
              autoFocus
            />
            <Input
              placeholder={t("quoteAttributedTo")}
              value={attributedTo}
              onChange={(e) => setAttributedTo(e.target.value)}
              data-testid="quote-attributed-input"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>
                {tcom("cancel")}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !content.trim()}
                data-testid="quote-save-button"
              >
                {saving && <Spinner className="mr-2" />}
                {editingId ? tcom("save") : tcom("add")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quotes List */}
      {quotes.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground" data-testid="quote-empty">
          {t("noQuotes")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {quotes.map((quote) => {
            const reactionCounts = getReactionCounts(quote.id);
            const isOwner = quote.created_by === currentUserId;

            return (
              <div
                key={quote.id}
                className="rounded-lg border border-border bg-card/30 p-4"
                data-testid={`quote-card-${quote.id}`}
              >
                <blockquote className="border-l-2 border-primary/40 pl-3 italic text-foreground">
                  &ldquo;{quote.content}&rdquo;
                </blockquote>
                {quote.attributed_to && (
                  <p className="mt-1 text-right text-sm text-muted-foreground">
                    — {quote.attributed_to}
                  </p>
                )}

                {/* Reactions */}
                <div className="mt-3 flex flex-wrap items-center gap-1">
                  {reactionCounts.map(({ emoji, count, hasOwn }) => (
                    <button
                      key={emoji}
                      onClick={() => toggleReaction(quote.id, emoji)}
                      className={`rounded-full border px-2 py-0.5 text-sm transition-colors ${
                        hasOwn ? "border-primary/50 bg-primary/10" : "border-border hover:bg-muted"
                      }`}
                      data-testid={`quote-reaction-${quote.id}-${emoji}`}
                    >
                      {emoji} {count}
                    </button>
                  ))}
                  {/* Add reaction picker */}
                  <div className="relative">
                    <button
                      className="rounded-full border border-dashed border-border px-2 py-0.5 text-sm text-muted-foreground hover:bg-muted"
                      onClick={() => setPickerOpenId(pickerOpenId === quote.id ? null : quote.id)}
                      data-testid={`quote-add-reaction-${quote.id}`}
                    >
                      +
                    </button>
                    {pickerOpenId === quote.id && (
                      <div className="absolute bottom-full left-0 z-10 mb-1 flex rounded-lg border border-border bg-card p-2 shadow-lg">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              toggleReaction(quote.id, emoji);
                              setPickerOpenId(null);
                            }}
                            className="rounded p-1 text-lg hover:bg-muted"
                            data-testid={`quote-emoji-pick-${quote.id}-${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Owner actions */}
                {isOwner && (
                  <div className="mt-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(quote)}
                      data-testid={`quote-edit-${quote.id}`}
                    >
                      {tcom("edit")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(quote.id)}
                      data-testid={`quote-delete-${quote.id}`}
                    >
                      {tcom("delete")}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
