"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { MarkdownRenderer as ReactMarkdown } from "@/components/markdown-renderer";
import { localized } from "@/lib/utils/localize";
import {
  spellName as getSpellName,
  spellRange,
  spellArea,
  spellDescription,
} from "@/lib/utils/spell-display";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getBardSpellSlots,
  getWizardSpellSlots,
  getPriestSpellSlots,
  getPriestBonusSlots,
  getPriestSpellPoints,
  getPriestBonusSpellPoints,
  getPriestSpellCost,
  getWizardSpellPoints,
  getWizardBonusSpellPoints,
  getWizardSpellCost,
  getSpecialistBonusSlots,
} from "@/lib/rules/spellslots";
import { getClassGroup } from "@/lib/rules/classes";
import type { ClassGroup, ClassId } from "@/lib/rules/types";
import { isPriestCaster } from "@/lib/rules/magic";
import type { CharacterRow, CharacterSpellWithDetails, SpellRow } from "@/lib/supabase/types";
import { getKit, getKitSpellFailure } from "@/lib/rules/kits";

interface PlaySpellbookPanelProps {
  spells: CharacterSpellWithDetails[];
  character: CharacterRow;
  classGroups: ClassGroup[];
  classEntries: { classId: string; level: number }[];
  wisScore: number;
  readOnly: boolean;
  onCast: (spellId: string, pointsCost: number) => void;
  onRest: () => void;
  epicSpellFailure?: number;
  epicWildMagic?: number;
  characterKit?: string | null;
  hasArmor?: boolean;
  priestAvailableSpells?: SpellRow[];
}

export function PlaySpellbookPanel({
  spells,
  character,
  classGroups,
  classEntries,
  wisScore,
  readOnly,
  onCast,
  onRest,
  epicSpellFailure = 0,
  epicWildMagic = 0,
  characterKit,
  hasArmor = false,
  priestAvailableSpells = [],
}: PlaySpellbookPanelProps) {
  const t = useTranslations("playMode");
  const te = useTranslations("epic");
  const tSpells = useTranslations("spells");
  const locale = useLocale();
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);
  const [showRestConfirm, setShowRestConfirm] = useState(false);
  const [priestSearch, setPriestSearch] = useState("");
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1]));
  const [showAllPerLevel, setShowAllPerLevel] = useState<Set<number>>(new Set());

  const isBard = classEntries.some((ce) => ce.classId === "bard");
  const isWizard = classGroups.includes("wizard") || isBard;
  const isPriest = classGroups.includes("priest");
  const usesSphereSpells = isPriest && priestAvailableSpells.length > 0;
  const casterClass = useMemo(() => {
    for (const ce of classEntries) {
      if (ce.classId === "bard") return ce;
      const group = getClassGroup(ce.classId as ClassId);
      if (group === "wizard" || group === "priest") return ce;
    }
    return classEntries[0] ?? { classId: "fighter", level: 1 };
  }, [classEntries]);
  const casterLevel = casterClass.level;

  const isPointsMode = character.spell_system === "points";

  // Prepared spells only
  const preparedSpells = useMemo(() => spells.filter((s) => s.prepared), [spells]);

  // Group by level
  const spellsByLevel = useMemo(() => {
    const groups: Record<number, CharacterSpellWithDetails[]> = {};
    for (const s of preparedSpells) {
      const lvl = s.spell.level;
      if (!groups[lvl]) groups[lvl] = [];
      groups[lvl].push(s);
    }
    return groups;
  }, [preparedSpells]);

  const maxSpellLevel = isBard ? 6 : isWizard ? 9 : 7;

  // Resource tracking
  const totalPoints = useMemo(() => {
    if (!isPointsMode) return 0;
    if (isWizard) {
      return getWizardSpellPoints(casterLevel) + getWizardBonusSpellPoints(character.int);
    }
    if (isPriest) {
      return getPriestSpellPoints(casterLevel) + getPriestBonusSpellPoints(wisScore);
    }
    return 0;
  }, [isPointsMode, isWizard, isPriest, casterLevel, character.int, wisScore]);

  const pointsRemaining = totalPoints - character.spell_points_used;

  // Slot tracking
  const baseSlots = useMemo(() => {
    if (isPointsMode) return [];
    if (isBard) return getBardSpellSlots(casterLevel);
    if (isWizard) return getWizardSpellSlots(casterLevel);
    if (isPriest) return getPriestSpellSlots(casterLevel);
    return [];
  }, [isPointsMode, isBard, isWizard, isPriest, casterLevel]);

  const bonusSlots = useMemo(() => {
    if (isPointsMode || !isPriest) return new Array(maxSpellLevel).fill(0);
    return getPriestBonusSlots(wisScore);
  }, [isPointsMode, isPriest, wisScore, maxSpellLevel]);

  const specialistBonus = useMemo(() => {
    if (isPointsMode || !isWizard) return new Array(maxSpellLevel).fill(0);
    return getSpecialistBonusSlots(casterClass.classId as ClassId, casterLevel);
  }, [isPointsMode, isWizard, casterClass.classId, casterLevel, maxSpellLevel]);

  const slotsAdj = character.spell_slots_adj ?? {};

  const totalSlots = useMemo(
    () =>
      baseSlots.map(
        (base, i) =>
          base + (bonusSlots[i] ?? 0) + (specialistBonus[i] ?? 0) + (slotsAdj[String(i + 1)] ?? 0)
      ),
    [baseSlots, bonusSlots, specialistBonus, slotsAdj]
  );

  const expendedByLevel = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const s of preparedSpells) {
      if (s.expended) {
        const lvl = s.spell.level;
        counts[lvl] = (counts[lvl] ?? 0) + 1;
      }
    }
    return counts;
  }, [preparedSpells]);

  // Priest sphere spells grouped by level (for play mode)
  const priestSpellsByLevel = useMemo(() => {
    if (!usesSphereSpells) return {};
    const filtered = priestSearch.trim()
      ? priestAvailableSpells.filter((s) => {
          const q = priestSearch.toLowerCase();
          return (
            s.name.toLowerCase().includes(q) || (s.name_en && s.name_en.toLowerCase().includes(q))
          );
        })
      : priestAvailableSpells;
    const groups: Record<number, SpellRow[]> = {};
    for (const s of filtered) {
      if (!groups[s.level]) groups[s.level] = [];
      groups[s.level].push(s);
    }
    return groups;
  }, [usesSphereSpells, priestAvailableSpells, priestSearch]);

  // Priest slot-mode: track cast count per level (local state, reset on rest)
  const [priestCastByLevel, setPriestCastByLevel] = useState<Record<number, number>>({});

  function canCastPriestSpell(spellLevel: number): boolean {
    if (readOnly) return false;
    if (isPointsMode) {
      return pointsRemaining >= getPriestSpellCost(spellLevel);
    }
    // Slot mode: check if slots remain for this level
    const available = totalSlots[spellLevel - 1] ?? 0;
    const used = priestCastByLevel[spellLevel] ?? 0;
    return used < available;
  }

  function handleCastPriestSpell(spell: SpellRow) {
    if (isPointsMode) {
      onCast(spell.id, getPriestSpellCost(spell.level));
    } else {
      // Slot mode: increment local counter
      setPriestCastByLevel((prev) => ({
        ...prev,
        [spell.level]: (prev[spell.level] ?? 0) + 1,
      }));
    }
  }

  function getSpellCost(spellLevel: number): number {
    if (isWizard) return getWizardSpellCost(spellLevel);
    if (isPriest) return getPriestSpellCost(spellLevel);
    return spellLevel;
  }

  function canCast(spell: CharacterSpellWithDetails): boolean {
    if (readOnly) return false;
    if (isPointsMode) {
      return pointsRemaining >= getSpellCost(spell.spell.level);
    }
    return !spell.expended;
  }

  function handleCast(spell: CharacterSpellWithDetails) {
    const cost = getSpellCost(spell.spell.level);
    onCast(spell.spell_id, cost);
  }

  function handleRest() {
    setShowRestConfirm(false);
    setPriestCastByLevel({});
    onRest();
  }

  const spellName = (s: SpellRow) => getSpellName(s, locale);
  const spellDesc = (s: SpellRow) => spellDescription(s, locale);

  return (
    <GlassCard hover={false} data-testid="play-spellbook-panel">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("spellbook")}
        </h3>
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowRestConfirm(true)}
            data-testid="play-rest-btn"
          >
            {t("rest")}
          </Button>
        )}
      </div>

      {/* Epic Spell Failure Warnings */}
      {epicWildMagic > 0 && (
        <div
          className="mb-3 rounded-lg border border-purple-500/50 bg-purple-500/10 p-2 text-xs text-purple-400"
          data-testid="play-wild-magic-warning"
        >
          {te("wildMagic", { percent: epicWildMagic })}
        </div>
      )}
      {epicSpellFailure > 0 && (
        <div
          className="mb-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-2 text-xs text-amber-400"
          data-testid="play-spell-failure-warning"
        >
          {te("spellFailure", { percent: epicSpellFailure })}
        </div>
      )}
      {(() => {
        const kitSpellFail = getKitSpellFailure(characterKit ?? null, hasArmor);
        if (kitSpellFail <= 0) return null;
        const kitDef = getKit(characterKit ?? null);
        const kitName = kitDef ? localized(kitDef.name, kitDef.name_en, locale) : "";
        return (
          <div
            className="mb-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-2 text-xs text-yellow-400"
            data-testid="play-kit-spell-failure-warning"
          >
            {t("kitSpellFailure", { percent: kitSpellFail, kitName })}
          </div>
        );
      })()}

      {/* Rest confirmation */}
      {showRestConfirm && (
        <div
          className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-2"
          data-testid="play-rest-confirm"
        >
          <p className="mb-2 text-sm">{t("restConfirmMessage")}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7"
              onClick={handleRest}
              data-testid="play-rest-confirm-btn"
            >
              {t("rest")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => setShowRestConfirm(false)}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}

      {/* Resource display */}
      {isPointsMode ? (
        <div className="mb-3 flex items-center gap-3" data-testid="play-spell-points">
          <div className="rounded-lg border border-primary bg-primary/5 px-3 py-1.5 text-center">
            <div className="text-[10px] text-muted-foreground">{t("spellPointsRemaining")}</div>
            <div
              className={`font-heading text-xl font-bold ${pointsRemaining < totalPoints * 0.25 ? "text-destructive" : "text-primary"}`}
            >
              {pointsRemaining}
            </div>
            <div className="text-[10px] text-muted-foreground">/ {totalPoints}</div>
          </div>
        </div>
      ) : (
        <div className="mb-3 flex flex-wrap gap-1.5" data-testid="play-spell-slots">
          {Array.from({ length: maxSpellLevel }, (_, i) => i + 1).map((lvl) => {
            const available = totalSlots[lvl - 1] ?? 0;
            const expended = usesSphereSpells
              ? (priestCastByLevel[lvl] ?? 0)
              : (expendedByLevel[lvl] ?? 0);
            if (available === 0) return null;
            return (
              <div
                key={lvl}
                className="rounded-md border border-border px-2 py-1 text-center"
                data-testid={`play-slot-level-${lvl}`}
              >
                <div className="text-[10px] text-muted-foreground">L{lvl}</div>
                <div className="font-mono text-sm">
                  <span className={expended >= available ? "text-destructive" : "text-primary"}>
                    {expended}
                  </span>
                  <span className="text-muted-foreground">/{available}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Priest: search field */}
      {usesSphereSpells && (
        <div className="mb-3">
          <input
            type="text"
            placeholder={tSpells("searchAvailableSpells")}
            value={priestSearch}
            onChange={(e) => setPriestSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-background/50 px-2 py-1.5 text-sm placeholder:text-muted-foreground"
            data-testid="play-priest-spell-search"
          />
        </div>
      )}

      {/* Priest spell list (from spheres) — collapsible per level, paginated */}
      {usesSphereSpells ? (
        <div className="space-y-2">
          {Object.keys(priestSpellsByLevel)
            .map(Number)
            .sort((a, b) => a - b)
            .map((level) => {
              const spells = priestSpellsByLevel[level];
              const isLevelOpen = expandedLevels.has(level);
              const INITIAL_COUNT = 10;
              const showAll = showAllPerLevel.has(level);
              const visibleSpells = showAll ? spells : spells.slice(0, INITIAL_COUNT);
              const hasMore = spells.length > INITIAL_COUNT && !showAll;

              return (
                <div key={level} className="rounded-lg border border-border">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left"
                    onClick={() =>
                      setExpandedLevels((prev) => {
                        const next = new Set(prev);
                        if (next.has(level)) next.delete(level);
                        else next.add(level);
                        return next;
                      })
                    }
                    aria-expanded={isLevelOpen}
                    data-testid={`play-priest-level-${level}`}
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      Level {level}
                      {isPointsMode && (
                        <span className="ml-1 text-[10px]">
                          ({t("spellPointsCost")}: {getPriestSpellCost(level)})
                        </span>
                      )}
                      <span className="ml-1 text-[10px]">({spells.length})</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{isLevelOpen ? "▾" : "▸"}</span>
                  </button>
                  {isLevelOpen && (
                    <div className="space-y-1 px-2 pb-2">
                      {visibleSpells.map((spell) => {
                        const isExpanded = expandedSpell === spell.id;
                        const canCastThis = canCastPriestSpell(spell.level);
                        return (
                          <div
                            key={spell.id}
                            className="rounded-lg border border-border bg-card/50 transition-colors"
                            data-testid={`play-spell-${spell.id}`}
                          >
                            <div
                              className="flex min-h-[40px] cursor-pointer items-center gap-2 px-2 py-1.5"
                              role="button"
                              tabIndex={0}
                              onClick={() => setExpandedSpell(isExpanded ? null : spell.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setExpandedSpell(isExpanded ? null : spell.id);
                                }
                              }}
                            >
                              <span className="min-w-0 flex-1 truncate text-sm">
                                {spellName(spell)}
                              </span>
                              {spell.sphere && (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 text-[9px] capitalize"
                                  data-testid={`play-spell-sphere-${spell.id}`}
                                >
                                  {spell.sphere}
                                </Badge>
                              )}
                              {!readOnly && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-6 shrink-0 px-2 text-[10px]"
                                  disabled={!canCastThis}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCastPriestSpell(spell);
                                  }}
                                  data-testid={`play-cast-${spell.id}`}
                                >
                                  {t("castSpell")}
                                </Button>
                              )}
                            </div>
                            {isExpanded && (
                              <div className="border-t border-border px-2 pb-2 pt-1.5">
                                <div className="mb-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                  <span>
                                    {tSpells("range")}: {spellRange(spell)}
                                  </span>
                                  <span>
                                    {tSpells("duration")}: {spell.duration}
                                  </span>
                                  <span>
                                    {tSpells("areaOfEffect")}: {spellArea(spell)}
                                  </span>
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
                                <div className="prose prose-sm max-w-none text-xs dark:prose-invert">
                                  <ReactMarkdown>{spellDesc(spell)}</ReactMarkdown>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {hasMore && (
                        <button
                          type="button"
                          className="w-full rounded-md border border-dashed border-border py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary"
                          onClick={() => setShowAllPerLevel((prev) => new Set([...prev, level]))}
                          data-testid={`play-priest-show-all-${level}`}
                        >
                          {spells.length - INITIAL_COUNT} {tSpells("moreSpells")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      ) : preparedSpells.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noSpells")}</p>
      ) : (
        <div className="space-y-1">
          {Object.keys(spellsByLevel)
            .map(Number)
            .sort((a, b) => a - b)
            .map((level) => (
              <div key={level}>
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  Level {level}
                  {isPointsMode && (
                    <span className="ml-1 text-[10px]">
                      ({t("spellPointsCost")}: {getSpellCost(level)})
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {spellsByLevel[level].map((charSpell) => {
                    const spell = charSpell.spell;
                    const isExpanded = expandedSpell === spell.id;
                    const isExpended = !isPointsMode && charSpell.expended;

                    return (
                      <div
                        key={`${charSpell.spell_id}-${charSpell.character_id}`}
                        className={`rounded-lg border transition-colors ${
                          isExpended
                            ? "border-border/50 bg-muted/30 opacity-60"
                            : "border-border bg-card/50"
                        }`}
                        data-testid={`play-spell-${spell.id}`}
                      >
                        <div
                          className="flex min-h-[40px] cursor-pointer items-center gap-2 px-2 py-1.5"
                          role="button"
                          tabIndex={0}
                          onClick={() => setExpandedSpell(isExpanded ? null : spell.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setExpandedSpell(isExpanded ? null : spell.id);
                            }
                          }}
                        >
                          <span
                            className={`min-w-0 flex-1 truncate text-sm ${isExpended ? "line-through" : ""}`}
                          >
                            {spellName(spell)}
                          </span>
                          {isPriest && spell.sphere && (
                            <Badge
                              variant="outline"
                              className="shrink-0 text-[9px] capitalize"
                              data-testid={`play-spell-sphere-${spell.id}`}
                            >
                              {spell.sphere}
                            </Badge>
                          )}
                          {spell.casting_time && (
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {spell.casting_time}
                            </Badge>
                          )}
                          {!readOnly && (
                            <Button
                              size="sm"
                              variant={isExpended ? "ghost" : "default"}
                              className="h-6 shrink-0 px-2 text-[10px]"
                              disabled={!canCast(charSpell)}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCast(charSpell);
                              }}
                              data-testid={`play-cast-${spell.id}`}
                            >
                              {isExpended ? t("spellExpended") : t("castSpell")}
                            </Button>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="border-t border-border px-2 pb-2 pt-1.5">
                            <div className="mb-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                              <span>
                                {tSpells("range")}: {spellRange(spell)}
                              </span>
                              <span>
                                {tSpells("duration")}: {spell.duration}
                              </span>
                              <span>
                                {tSpells("areaOfEffect")}: {spellArea(spell)}
                              </span>
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
                            <div className="prose prose-sm max-w-none text-xs dark:prose-invert">
                              <ReactMarkdown>{spellDesc(spell)}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </GlassCard>
  );
}
