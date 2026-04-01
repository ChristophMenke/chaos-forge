"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  getBardSpellSlots,
  getWizardSpellSlots,
  getPriestSpellSlots,
  getPriestBonusSlots,
  getPriestSpellPoints,
  getPriestBonusSpellPoints,
  getPriestSpellCost,
} from "@/lib/rules/spellslots";
import type { CharacterSpellWithDetails } from "@/lib/supabase/types";

interface ResourceTrackerProps {
  isWizard: boolean;
  isPriest: boolean;
  isBard?: boolean;
  level: number;
  wisScore: number;
  spells: CharacterSpellWithDetails[];
  maxSpellLevel: number;
}

export function ResourceTracker({
  isWizard,
  isPriest,
  isBard,
  level,
  wisScore,
  spells,
  maxSpellLevel,
}: ResourceTrackerProps) {
  const t = useTranslations("spellbook");

  const baseSlots = useMemo(() => {
    if (isBard) return getBardSpellSlots(level);
    if (isWizard) return getWizardSpellSlots(level);
    if (isPriest) return getPriestSpellSlots(level);
    return [];
  }, [isBard, isWizard, isPriest, level]);

  const bonusSlots = useMemo(() => {
    if (isPriest) return getPriestBonusSlots(wisScore);
    return new Array(maxSpellLevel).fill(0);
  }, [isPriest, wisScore, maxSpellLevel]);

  const totalSlots = useMemo(
    () => baseSlots.map((base, i) => base + (bonusSlots[i] ?? 0)),
    [baseSlots, bonusSlots]
  );

  const preparedCountByLevel = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let l = 1; l <= maxSpellLevel; l++) {
      counts[l] = spells.filter((s) => s.prepared && s.spell.level === l).length;
    }
    return counts;
  }, [spells, maxSpellLevel]);

  if (isPriest) {
    const totalPoints = getPriestSpellPoints(level) + getPriestBonusSpellPoints(wisScore);
    const basePoints = getPriestSpellPoints(level);
    const bonusPoints = getPriestBonusSpellPoints(wisScore);

    return (
      <div data-testid="spellbook-resources">
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {/* Total spell points */}
          <div className="shrink-0 rounded-lg border border-primary bg-primary/5 px-4 py-2 text-center">
            <div className="text-xs text-muted-foreground">{t("spellPoints")}</div>
            <div className="font-heading text-2xl text-primary" data-testid="spell-points-total">
              {totalPoints}
            </div>
            <div className="text-xs text-muted-foreground">
              {basePoints} + {bonusPoints} WIS
            </div>
          </div>

          {/* Cost table */}
          <div className="flex shrink-0 gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((sl) => (
              <div
                key={sl}
                className="rounded-md border border-border px-2 py-1.5 text-center"
                data-testid={`spell-cost-level-${sl}`}
              >
                <div className="text-xs text-muted-foreground">L{sl}</div>
                <div className="font-mono text-sm font-medium">{getPriestSpellCost(sl)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Wizard: horizontal slot boxes
  return (
    <div data-testid="spellbook-resources">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: maxSpellLevel }, (_, i) => i + 1).map((spellLevel) => {
          const available = totalSlots[spellLevel - 1] ?? 0;
          const prepared = preparedCountByLevel[spellLevel] ?? 0;
          if (available === 0) return null;
          return (
            <div
              key={spellLevel}
              className="shrink-0 rounded-lg border border-border px-3 py-2 text-center"
              data-testid={`spell-slot-level-${spellLevel}`}
            >
              <div className="text-xs text-muted-foreground">L{spellLevel}</div>
              <div className="font-mono text-lg">
                <span
                  className={prepared >= available ? "text-destructive" : "text-primary"}
                  data-testid={`spell-slot-prepared-${spellLevel}`}
                >
                  {prepared}
                </span>
                <span className="text-muted-foreground">/</span>
                <span data-testid={`spell-slot-available-${spellLevel}`}>{available}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
