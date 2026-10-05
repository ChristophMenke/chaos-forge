/**
 * Single source of truth for a character's effective ability scores and their
 * modifiers — shared by play mode, the character sheet, the checks panel and
 * the GM dashboard (computeCharacterCombatData).
 *
 * Order:
 *  1. Items: force override wins; otherwise max(base, epic override, magic
 *     override) + magic bonuses, capped at 25. An active overclock replaces
 *     Constitution.
 *  2. Temporary effects: set-to → factors → deltas (applyEffectsToAbility).
 *  3. Sub-stats are scaled whenever the score differs from the base, so the
 *     modifiers follow the change (sub-stats otherwise replace the score row).
 *  4. Modifier tables are read at toModifierScore() (3–25); the shown value
 *     may be lower.
 */
import type { CharacterRow } from "@/lib/supabase/types";
import {
  getCharismaModifiers,
  getConstitutionModifiers,
  getDexterityModifiers,
  getIntelligenceModifiers,
  getStrengthModifiers,
  getWisdomModifiers,
  toModifierScore,
} from "./abilities";
import { scaleSubStat, type EpicEffects } from "./epic-items";
import type { AggregatedMagicEffects } from "./magic-items";
import {
  ABILITY_KEYS,
  applyEffectsToAbility,
  emptyEffectSummary,
  type AbilityKey,
  type EffectSummary,
} from "./temporary-effects";

const MAX_STAT = 25;

export interface StatSources {
  epicEffects: EpicEffects;
  magicEffects: AggregatedMagicEffects;
  /** Overclock (Kondensator) active and available → Constitution is replaced. */
  overclockActive?: boolean;
}

export interface EffectiveStats {
  /** Shown scores (0–25) after items and temporary effects. */
  values: Record<AbilityKey, number>;
  /** Score differs from the stored base value. */
  modified: Record<AbilityKey, boolean>;
  mods: {
    str: ReturnType<typeof getStrengthModifiers>;
    dex: ReturnType<typeof getDexterityModifiers>;
    con: ReturnType<typeof getConstitutionModifiers>;
    int: ReturnType<typeof getIntelligenceModifiers>;
    wis: ReturnType<typeof getWisdomModifiers>;
    cha: ReturnType<typeof getCharismaModifiers>;
  };
}

type SubStatPair = [keyof CharacterRow, keyof CharacterRow];

const SUB_STATS: Record<AbilityKey, SubStatPair> = {
  str: ["str_muscle", "str_stamina"],
  dex: ["dex_aim", "dex_balance"],
  con: ["con_health", "con_fitness"],
  int: ["int_knowledge", "int_reason"],
  wis: ["wis_intuition", "wis_willpower"],
  cha: ["cha_leadership", "cha_appearance"],
};

function itemValue(character: CharacterRow, key: AbilityKey, sources: StatSources): number {
  const { epicEffects, magicEffects } = sources;
  if (key === "con" && sources.overclockActive && epicEffects.overclockAbility) {
    return epicEffects.overclockAbility.conOverride;
  }
  const force = epicEffects.forceStatOverrides[key];
  const resolved =
    force ??
    Math.max(
      character[key],
      epicEffects.statOverrides[key] ?? 0,
      magicEffects.statOverrides[key] ?? 0
    );
  return Math.min(resolved + (magicEffects.statBonuses[key] ?? 0), MAX_STAT);
}

export function resolveEffectiveStats(
  character: CharacterRow,
  sources: StatSources,
  effects: EffectSummary = emptyEffectSummary()
): EffectiveStats {
  const values = {} as Record<AbilityKey, number>;
  const modified = {} as Record<AbilityKey, boolean>;
  const subs = {} as Record<AbilityKey, [number | undefined, number | undefined]>;

  for (const key of ABILITY_KEYS) {
    const value = applyEffectsToAbility(itemValue(character, key, sources), effects.abilities[key]);
    values[key] = value;
    modified[key] = value !== character[key];

    const tableScore = toModifierScore(value);
    subs[key] = SUB_STATS[key].map((column) => {
      const raw = character[column] as number | null;
      if (raw == null) return undefined;
      if (!modified[key]) return raw;
      const scaled = scaleSubStat(character[key], raw, tableScore);
      return scaled == null ? undefined : toModifierScore(scaled);
    }) as [number | undefined, number | undefined];
  }

  // Exceptional strength only matters at 18: a magic item granting it wins
  // (e.g. gauntlets 18/00), otherwise the character's own percentile.
  const { magicEffects, epicEffects } = sources;
  const magicStrWins =
    magicEffects.statOverrides.str != null &&
    magicEffects.statOverrides.str >= (epicEffects.statOverrides.str ?? 0) &&
    magicEffects.strExceptionalOverride != null;
  const strExceptional = magicStrWins
    ? magicEffects.strExceptionalOverride!
    : (character.str_exceptional ?? undefined);
  const strException = values.str === 18 ? strExceptional : undefined;

  return {
    values,
    modified,
    mods: {
      str: getStrengthModifiers(toModifierScore(values.str), strException, ...subs.str),
      dex: getDexterityModifiers(toModifierScore(values.dex), ...subs.dex),
      con: getConstitutionModifiers(toModifierScore(values.con), ...subs.con),
      int: getIntelligenceModifiers(toModifierScore(values.int), ...subs.int),
      wis: getWisdomModifiers(toModifierScore(values.wis), ...subs.wis),
      cha: getCharismaModifiers(toModifierScore(values.cha), ...subs.cha),
    },
  };
}
