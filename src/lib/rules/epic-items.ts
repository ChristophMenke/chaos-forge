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

export interface ShapeshiftForm {
  key: string;
  name: string;
  name_en: string;
  baseAC: number;
  attacks: string;
  attacks_en: string;
  movement: number;
  usesPerDay: number; // -1 = unlimited
  requiresCheck: string;
  requiresCheck_en: string;
  hugRule?: string;
  hugRule_en?: string;
}

export interface SpecialAttack {
  key: string;
  name: string;
  name_en: string;
  usesPerDay: number;
  effect: string;
  effect_en: string;
}

export interface OverclockAbility {
  name: string;
  name_en: string;
  durationHours: number;
  requiresCheck: string;
  requiresCheck_en: string;
  conOverride: number;
  poisonSavePenalty: number;
  healsPerHour: number;
  description: string;
  description_en: string;
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
  /** Perception bonus from equipped items (e.g., +2 from goggles) */
  perceptionBonus: number;
  /** AC bonus (negative = better AC in AD&D descending system) */
  acBonus: number;
  /** Temporary STR override value (e.g., 20 from Totem Tattoo) */
  temporaryStrOverride: number | null;
  /** Available shapeshift forms */
  shapeshiftForms: ShapeshiftForm[];
  /** Available special attacks */
  specialAttacks: SpecialAttack[];
  /** Passive abilities (e.g., "speak_with_animals") */
  passiveAbilities: string[];
  /** Overclock ability (e.g., Kondensator boost) */
  overclockAbility: OverclockAbility | null;
}

// ── Core Functions ───────────────────────────────────────────

/**
 * Get the auto-unlocked damage level for an item based on character level.
 * Items with `level_thresholds` in simple_effects use auto-unlock.
 */
export function getAutoUnlockedLevel(item: EpicItemRow, characterLevel: number): number {
  const se = item.simple_effects as Record<string, unknown> | null;
  const thresholds = se?.level_thresholds as number[] | undefined;
  if (!thresholds || !Array.isArray(thresholds)) return item.damage_level;
  let unlocked = 0;
  for (const t of thresholds) {
    if (characterLevel >= t) unlocked++;
  }
  return Math.min(unlocked, item.max_damage_level);
}

/**
 * Get the current damage level effect for an epic item.
 * Uses auto-unlock if characterLevel is provided and item has level_thresholds.
 */
export function getCurrentDamageLevelEffect(
  item: EpicItemRow,
  characterLevel?: number
): DamageLevelEffect | undefined {
  if (item.max_damage_level === 0) return undefined;
  const level =
    characterLevel != null ? getAutoUnlockedLevel(item, characterLevel) : item.damage_level;
  return item.damage_levels[String(level)];
}

/**
 * For items with level_thresholds, get ALL unlocked effects (cumulative).
 * Returns effects from level 0 up to the current unlocked level.
 */
function getCumulativeEffects(
  item: EpicItemRow,
  characterLevel: number
): { effects: string[]; statOverrides: EpicStatOverrides } {
  const se = item.simple_effects as Record<string, unknown> | null;
  const thresholds = se?.level_thresholds as number[] | undefined;
  if (!thresholds) {
    const dl = getCurrentDamageLevelEffect(item, characterLevel);
    return {
      effects: dl?.effects ?? [],
      statOverrides: (dl?.stat_overrides as EpicStatOverrides) ?? {},
    };
  }

  const allEffects: string[] = [];
  const allOverrides: EpicStatOverrides = {};
  const unlockedLevel = getAutoUnlockedLevel(item, characterLevel);

  for (let i = 0; i <= unlockedLevel; i++) {
    const dl = item.damage_levels[String(i)];
    if (!dl) continue;
    for (const e of dl.effects ?? []) {
      if (!allEffects.includes(e)) allEffects.push(e);
    }
    if (dl.stat_overrides) {
      Object.assign(allOverrides, dl.stat_overrides);
    }
  }
  return { effects: allEffects, statOverrides: allOverrides };
}

/**
 * Compute the combined effects of all equipped epic items.
 * @param characterLevel - If provided, enables auto-unlock and cumulative effects.
 */
export function getEpicEffects(items: EpicItemRow[], characterLevel?: number): EpicEffects {
  const result: EpicEffects = {
    statOverrides: {},
    miscEffects: [],
    thiefPenalty: 0,
    thiefDisabled: false,
    spellFailure: 0,
    wildMagic: 0,
    perceptionBonus: 0,
    acBonus: 0,
    temporaryStrOverride: null,
    shapeshiftForms: [],
    specialAttacks: [],
    passiveAbilities: [],
    overclockAbility: null,
  };

  let overclockCandidate: OverclockAbility | null = null;

  for (const item of items) {
    if (!item.equipped) continue;
    const se = item.simple_effects as Record<string, unknown> | null;

    // Items with damage levels (cumulative if level_thresholds present)
    if (item.max_damage_level > 0) {
      const { effects, statOverrides } =
        characterLevel != null
          ? getCumulativeEffects(item, characterLevel)
          : (() => {
              const dl = getCurrentDamageLevelEffect(item);
              return {
                effects: dl?.effects ?? [],
                statOverrides: (dl?.stat_overrides as EpicStatOverrides) ?? {},
              };
            })();

      Object.assign(result.statOverrides, statOverrides);

      for (const effect of effects) {
        result.miscEffects.push(effect);
        if (effect === "thief_disabled") result.thiefDisabled = true;
        if (effect === "thief_penalty_10") result.thiefPenalty += 10;
        if (effect === "spell_failure_10") result.spellFailure = Math.max(result.spellFailure, 10);
        if (effect === "wild_magic_50") result.wildMagic = Math.max(result.wildMagic, 50);
        // New effects
        if (effect.startsWith("ac_bonus_")) result.acBonus += parseInt(effect.split("_")[2]) || 0;
        if (effect.startsWith("perception_bonus_"))
          result.perceptionBonus += parseInt(effect.split("_")[2]) || 0;
        if (effect.startsWith("str_override_"))
          result.temporaryStrOverride = parseInt(effect.split("_")[2]) || null;
        if (effect === "speak_with_animals") result.passiveAbilities.push(effect);
      }

      // Parse shapeshift forms from simple_effects
      if (se?.shapeshift_forms && Array.isArray(se.shapeshift_forms)) {
        const unlockedLevel =
          characterLevel != null ? getAutoUnlockedLevel(item, characterLevel) : item.damage_level;
        for (const form of se.shapeshift_forms as (ShapeshiftForm & { unlock_level: number })[]) {
          if (form.unlock_level <= unlockedLevel) {
            result.shapeshiftForms.push(form);
          }
        }
      }

      // Parse special attacks from simple_effects
      if (se?.special_attacks && Array.isArray(se.special_attacks)) {
        const unlockedLevel =
          characterLevel != null ? getAutoUnlockedLevel(item, characterLevel) : item.damage_level;
        for (const atk of se.special_attacks as (SpecialAttack & { unlock_level: number })[]) {
          if (atk.unlock_level <= unlockedLevel) {
            result.specialAttacks.push(atk);
          }
        }
      }

      // Collect overclock candidate (resolved after loop to ensure device_offline is fully known)
      if (se?.overclock && typeof se.overclock === "object" && !overclockCandidate) {
        const oc = se.overclock as Record<string, unknown>;
        overclockCandidate = {
          name: (oc.name as string) ?? "",
          name_en: (oc.name_en as string) ?? "",
          durationHours: (oc.duration_hours as number) ?? 1,
          requiresCheck: (oc.requires_check as string) ?? "",
          requiresCheck_en: (oc.requires_check_en as string) ?? "",
          conOverride: (oc.con_override as number) ?? 20,
          poisonSavePenalty: (oc.poison_save_penalty as number) ?? 0,
          healsPerHour: (oc.heals_per_hour as number) ?? 0,
          description: (oc.description as string) ?? "",
          description_en: (oc.description_en as string) ?? "",
        };
      }
    }

    // Simple effects (items without damage levels)
    if (se && typeof se === "object") {
      const pb = se.perception_bonus;
      if (typeof pb === "number") result.perceptionBonus += pb;
    }
  }

  // Resolve overclock after loop — disabled when any item causes device_offline
  if (overclockCandidate && !result.miscEffects.includes("device_offline")) {
    result.overclockAbility = overclockCandidate;
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

// ── Fragility System ──────────────────────────────────────

export interface FragilityInfo {
  baseChance: number;
  reductionPerLevel: number;
  trigger: string;
  trigger_en: string;
}

/**
 * Calculate the current fragility chance for an epic item based on character level.
 * Formula: max(0, baseChance − reductionPerLevel × characterLevel)
 * @param baseChance - Starting fragility percentage (e.g. 50 = 50%)
 * @param reductionPerLevel - Percentage points reduced per character level
 * @param characterLevel - AD&D character level (1-based)
 * @returns Fragility percentage clamped to [0, baseChance]
 */
export function getFragilityChance(
  baseChance: number,
  reductionPerLevel: number,
  characterLevel: number
): number {
  return Math.max(0, baseChance - reductionPerLevel * characterLevel);
}

/**
 * Parse fragility info from an epic item's simple_effects.
 * Returns null if no fragility data exists.
 */
export function getFragilityInfo(
  simpleEffects: Record<string, unknown> | null
): FragilityInfo | null {
  if (!simpleEffects?.fragility) return null;
  const f = simpleEffects.fragility as Record<string, unknown>;
  return {
    baseChance: (f.base_chance as number) ?? 50,
    reductionPerLevel: (f.reduction_per_level as number) ?? 0,
    // DB uses "trigger_de" — differs from the usual name/name_en convention
    trigger: (f.trigger_de as string) ?? (f.trigger as string) ?? "Physischer Rettungswurf",
    trigger_en: (f.trigger_en as string) ?? "Physical saving throw",
  };
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
