"use client";

import { useState, memo } from "react";
import { MarkdownRenderer as ReactMarkdown } from "@/components/markdown-renderer";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getBookAbbreviation } from "@/lib/utils/source-books";
import { spellName, spellRange, spellArea, spellDescription } from "@/lib/utils/spell-display";
import type { CharacterSpellWithDetails, SpellRow } from "@/lib/supabase/types";

interface SpellCardProps {
  charSpell: CharacterSpellWithDetails;
  readOnly: boolean;
  loading: boolean;
  canPrepare: boolean;
  onTogglePrepared: (spellId: string, currentlyPrepared: boolean) => void;
  onRemove: (spellId: string) => void;
}

export const SpellCard = memo(function SpellCard({
  charSpell,
  readOnly,
  loading,
  canPrepare,
  onTogglePrepared,
  onRemove,
}: SpellCardProps) {
  const t = useTranslations("spellbook");
  const tSpells = useTranslations("spells");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);

  const spell = charSpell.spell;

  const getSpellName = (s: SpellRow) => spellName(s, locale);
  const getSpellDesc = (s: SpellRow) => spellDescription(s, locale);

  return (
    <div
      className={`rounded-lg border transition-colors ${
        charSpell.prepared ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
      data-testid={`spellbook-card-${spell.id}`}
    >
      {/* Collapsed row */}
      <div
        className="flex min-h-[44px] cursor-pointer items-center gap-2 px-3 py-2"
        onClick={() => setExpanded(!expanded)}
        data-testid={`spellbook-toggle-${spell.id}`}
      >
        {charSpell.prepared && (
          <span className="text-primary" aria-hidden="true">
            &#9733;
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{getSpellName(spell)}</span>
        <Badge variant="outline" className="shrink-0 text-xs">
          L{spell.level}
        </Badge>
        <Badge variant="outline" className="hidden shrink-0 text-xs capitalize sm:inline-flex">
          {spell.school ?? spell.sphere}
        </Badge>
        {spell.source_book && (
          <span className="hidden shrink-0 rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground sm:inline">
            {getBookAbbreviation(spell.source_book)}
          </span>
        )}
        {spell.components.length > 0 && (
          <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
            {spell.components.join(", ")}
          </span>
        )}
        {spell.casting_time && /^[\d]|^Special/i.test(spell.casting_time) && (
          <span
            className="hidden shrink-0 items-center gap-0.5 text-xs text-muted-foreground lg:inline-flex"
            title={`${tSpells("castingTime")}: ${spell.casting_time}`}
            aria-label={`${tSpells("castingTime")}: ${spell.casting_time}`}
          >
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14A6 6 0 1 1 8 2a6 6 0 0 1 0 12zm1-6.59V4a1 1 0 0 0-2 0v4a1 1 0 0 0 .29.71l2 2a1 1 0 0 0 1.42-1.42L9 7.41z" />
            </svg>
            {spell.casting_time}
          </span>
        )}
        <svg
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          className="border-t border-border px-3 pb-3 pt-2"
          data-testid={`spellbook-details-${spell.id}`}
        >
          {/* Meta info */}
          <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="capitalize sm:hidden">
              {tSpells("school")}: {spell.school ?? spell.sphere}
            </span>
            <span>
              {tSpells("range")}: {spellRange(spell)}
            </span>
            <span>
              {tSpells("duration")}: {spell.duration}
            </span>
            <span>
              {tSpells("areaOfEffect")}: {spellArea(spell)}
            </span>
            {spell.casting_time && (
              <span>
                {tSpells("castingTime")}: {spell.casting_time}
              </span>
            )}
            {spell.saving_throw && spell.saving_throw !== "None" && (
              <span>
                {tSpells("savingThrow")}: {spell.saving_throw}
              </span>
            )}
            {spell.components.length > 0 && (
              <span>
                {tSpells("components")}: {spell.components.join(", ")}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{getSpellDesc(spell)}</ReactMarkdown>
          </div>

          {/* Action buttons */}
          {!readOnly && (
            <div className="mt-3 flex gap-2">
              <Button
                variant={charSpell.prepared ? "default" : "outline"}
                size="sm"
                className="min-h-[44px] flex-1 sm:flex-none"
                disabled={loading || (!charSpell.prepared && !canPrepare)}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePrepared(spell.id, charSpell.prepared);
                }}
                data-testid={`spellbook-prepare-${spell.id}`}
              >
                {charSpell.prepared ? t("unprepare") : t("prepare")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] text-destructive hover:text-destructive"
                disabled={loading}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(spell.id);
                }}
                data-testid={`spellbook-remove-${spell.id}`}
              >
                {t("remove")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
