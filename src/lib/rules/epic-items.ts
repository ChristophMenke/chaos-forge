import type { EpicItemRow, DamageLevelEffect } from "@/lib/supabase/types";

// ── Stat Override Types ──────────────────────────────────────

export interface EpicStatOverrides {
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
}

export interface EpicEffects {
  statOverrides: EpicStatOverrides;
  miscEffects: string[];
  /** Thief skill penalty percentage (e.g., 10 = -10%) */
  thiefPenalty: number;
  /** Whether thief skills are completely disabled */
  thiefDisabled: boolean;
  /** Spell failure percentage (e.g., 10 = 10% failure chance) */
  spellFailure: number;
  /** Wild magic percentage (e.g., 50 = 50% wild magic chance) */
  wildMagic: number;
}

// ── Core Functions ───────────────────────────────────────────

/**
 * Get the current damage level effect for an epic item.
 * Returns undefined if the item has no damage level system.
 */
export function getCurrentDamageLevelEffect(item: EpicItemRow): DamageLevelEffect | undefined {
  if (item.max_damage_level === 0) return undefined;
  return item.damage_levels[String(item.damage_level)];
}

/**
 * Compute the combined effects of all equipped epic items.
 */
export function getEpicEffects(items: EpicItemRow[]): EpicEffects {
  const result: EpicEffects = {
    statOverrides: {},
    miscEffects: [],
    thiefPenalty: 0,
    thiefDisabled: false,
    spellFailure: 0,
    wildMagic: 0,
  };

  for (const item of items) {
    if (!item.equipped) continue;

    // Items with damage levels
    const dlEffect = getCurrentDamageLevelEffect(item);
    if (dlEffect) {
      // Apply stat overrides (last one wins if multiple items override same stat)
      if (dlEffect.stat_overrides) {
        Object.assign(result.statOverrides, dlEffect.stat_overrides);
      }

      // Parse misc effects
      for (const effect of dlEffect.effects ?? []) {
        result.miscEffects.push(effect);
        if (effect === "thief_disabled") result.thiefDisabled = true;
        if (effect === "thief_penalty_10") result.thiefPenalty += 10;
        if (effect === "spell_failure_10") result.spellFailure = Math.max(result.spellFailure, 10);
        if (effect === "wild_magic_50") result.wildMagic = Math.max(result.wildMagic, 50);
      }
    }
  }

  return result;
}

/**
 * Scale sub-stats proportionally when a main stat is overridden.
 * Formula: effective_sub = round(override * (base_sub / base_main))
 * Clamped to [1, override].
 */
export function scaleSubStat(
  baseStat: number,
  baseSub: number | null | undefined,
  overrideStat: number
): number | null {
  if (baseSub == null) return null;
  if (baseStat === 0) return overrideStat;
  const scaled = Math.round(overrideStat * (baseSub / baseStat));
  return Math.max(1, Math.min(overrideStat, scaled));
}

/**
 * Apply thief skill penalty to a skill value.
 * If disabled, returns 0. Otherwise subtracts the penalty percentage.
 */
export function applyThiefPenalty(baseValue: number, effects: EpicEffects): number {
  if (effects.thiefDisabled) return 0;
  if (effects.thiefPenalty === 0) return baseValue;
  return Math.max(0, baseValue - effects.thiefPenalty);
}
