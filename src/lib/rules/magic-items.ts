/**
 * Magic Item effect aggregation for regular (non-epic) magical items.
 *
 * Magic items are stored in character_equipment with weapon_id=null and armor_id=null.
 * Their effects are in the magic_effects JSONB column.
 *
 * Key difference from epic items:
 * - Magic items use ADDITIVE bonuses (STR +2)
 * - Epic items use OVERRIDES (STR becomes 19)
 */

import type {
  CharacterEquipmentWithDetails,
  MagicEffects,
  MagicSpellAbility,
  MagicStatOverrides,
} from "@/lib/supabase/types";
import type { SavingThrows } from "./types";

export interface ThiefSkillBonuses {
  hideInShadows?: number;
  moveSilently?: number;
  pickPockets?: number;
  openLocks?: number;
  findTraps?: number;
  climbWalls?: number;
  detectNoise?: number;
  readLanguages?: number;
}

export interface AggregatedMagicEffects {
  /** Additive stat bonuses (e.g. STR +2, DEX +1) */
  statBonuses: Partial<Record<"str" | "dex" | "con" | "int" | "wis" | "cha", number>>;
  /** Summed AC bonus (negative = better, AD&D descending) */
  acBonus: number;
  /** Summed attack bonus */
  attackBonus: number;
  /** Summed damage bonus */
  damageBonus: number;
  /** Save bonuses mapped to AD&D save categories */
  saveBonuses: Partial<SavingThrows>;
  /** Thief skill bonuses (summed) */
  thiefSkillBonuses: ThiefSkillBonuses;
  /** Summed perception bonus */
  perceptionBonus: number;
  /** Summed movement bonus (in feet) */
  movementBonus: number;
  /** Max magic resistance percentage */
  magicResistance: number;
  /** Max spell failure percentage */
  spellFailure: number;
  /** All spell-like abilities from magic items */
  spellAbilities: MagicSpellAbility[];
  /** Deduplicated resistances/immunities */
  resistances: string[];
  /** Deduplicated passive abilities */
  passiveAbilities: string[];
  /** Stat overrides from magic items (max wins when multiple items override same stat) */
  statOverrides: Partial<Record<"str" | "dex" | "con" | "int" | "wis" | "cha", number>>;
  /** Exceptional strength override (e.g. 100 = 18/00 from Gauntlets of Ogre Power) */
  strExceptionalOverride: number | null;
}

/** Check if an equipment entry is a magic item (no weapon/armor reference) */
export function isMagicItem(eq: CharacterEquipmentWithDetails): boolean {
  return eq.weapon_id == null && eq.armor_id == null && eq.custom_label != null;
}

/** Check if a charged item is depleted (max_charges=0 is treated as no-charge item) */
export function isDepleted(effects: MagicEffects): boolean {
  return (
    effects.max_charges != null && effects.max_charges > 0 && (effects.current_charges ?? 0) <= 0
  );
}

/**
 * Aggregate effects from all equipped magic items.
 * Only considers items that are equipped, are magic items (no weapon/armor ref),
 * and have remaining charges (if applicable).
 */
export function getMagicItemEffects(
  equipment: CharacterEquipmentWithDetails[]
): AggregatedMagicEffects {
  const result: AggregatedMagicEffects = {
    statBonuses: {},
    acBonus: 0,
    attackBonus: 0,
    damageBonus: 0,
    saveBonuses: {},
    thiefSkillBonuses: {},
    perceptionBonus: 0,
    movementBonus: 0,
    magicResistance: 0,
    spellFailure: 0,
    spellAbilities: [],
    resistances: [],
    passiveAbilities: [],
    statOverrides: {},
    strExceptionalOverride: null,
  };

  const resistanceSet = new Set<string>();
  const passiveSet = new Set<string>();

  for (const eq of equipment) {
    if (!eq.equipped || !isMagicItem(eq)) continue;

    const fx = eq.magic_effects;
    if (!fx || typeof fx !== "object") continue;
    if (isDepleted(fx)) continue;

    // Attribute bonuses (summed)
    for (const stat of ["str", "dex", "con", "int", "wis", "cha"] as const) {
      if (fx[stat] != null) {
        result.statBonuses[stat] = (result.statBonuses[stat] ?? 0) + fx[stat]!;
      }
    }

    // Stat overrides (max wins — AD&D: highest override takes precedence)
    if (fx.stat_overrides) {
      for (const stat of ["str", "dex", "con", "int", "wis", "cha"] as const) {
        const val = fx.stat_overrides[stat];
        if (val != null) {
          result.statOverrides[stat] = Math.max(result.statOverrides[stat] ?? 0, val);
        }
      }
      if (fx.stat_overrides.str_exceptional != null) {
        result.strExceptionalOverride = Math.max(
          result.strExceptionalOverride ?? 0,
          fx.stat_overrides.str_exceptional
        );
      }
    }

    // AC bonus (summed, negative = better)
    if (fx.ac_bonus != null) result.acBonus += fx.ac_bonus;

    // Attack/Damage bonus (summed)
    if (fx.attack_bonus != null) result.attackBonus += fx.attack_bonus;
    if (fx.damage_bonus != null) result.damageBonus += fx.damage_bonus;

    // Saving throws: save_all distributes to all 5 categories
    const saveAll = fx.save_all ?? 0;
    if (saveAll) {
      result.saveBonuses.paralyzation = (result.saveBonuses.paralyzation ?? 0) + saveAll;
      result.saveBonuses.rod = (result.saveBonuses.rod ?? 0) + saveAll;
      result.saveBonuses.petrification = (result.saveBonuses.petrification ?? 0) + saveAll;
      result.saveBonuses.breath = (result.saveBonuses.breath ?? 0) + saveAll;
      result.saveBonuses.spell = (result.saveBonuses.spell ?? 0) + saveAll;
    }
    // Specific saves map to AD&D categories
    if (fx.save_vs_poison != null) {
      result.saveBonuses.paralyzation = (result.saveBonuses.paralyzation ?? 0) + fx.save_vs_poison;
    }
    if (fx.save_vs_rod != null) {
      result.saveBonuses.rod = (result.saveBonuses.rod ?? 0) + fx.save_vs_rod;
    }
    if (fx.save_vs_petrification != null) {
      result.saveBonuses.petrification =
        (result.saveBonuses.petrification ?? 0) + fx.save_vs_petrification;
    }
    if (fx.save_vs_breath != null) {
      result.saveBonuses.breath = (result.saveBonuses.breath ?? 0) + fx.save_vs_breath;
    }
    if (fx.save_vs_spell != null) {
      result.saveBonuses.spell = (result.saveBonuses.spell ?? 0) + fx.save_vs_spell;
    }

    // Thief skill bonuses (summed)
    if (fx.hide_in_shadows != null) {
      result.thiefSkillBonuses.hideInShadows =
        (result.thiefSkillBonuses.hideInShadows ?? 0) + fx.hide_in_shadows;
    }
    if (fx.move_silently != null) {
      result.thiefSkillBonuses.moveSilently =
        (result.thiefSkillBonuses.moveSilently ?? 0) + fx.move_silently;
    }
    if (fx.pick_pockets != null) {
      result.thiefSkillBonuses.pickPockets =
        (result.thiefSkillBonuses.pickPockets ?? 0) + fx.pick_pockets;
    }
    if (fx.open_locks != null) {
      result.thiefSkillBonuses.openLocks =
        (result.thiefSkillBonuses.openLocks ?? 0) + fx.open_locks;
    }
    if (fx.find_traps != null) {
      result.thiefSkillBonuses.findTraps =
        (result.thiefSkillBonuses.findTraps ?? 0) + fx.find_traps;
    }
    if (fx.climb_walls != null) {
      result.thiefSkillBonuses.climbWalls =
        (result.thiefSkillBonuses.climbWalls ?? 0) + fx.climb_walls;
    }
    if (fx.detect_noise != null) {
      result.thiefSkillBonuses.detectNoise =
        (result.thiefSkillBonuses.detectNoise ?? 0) + fx.detect_noise;
    }
    if (fx.read_languages != null) {
      result.thiefSkillBonuses.readLanguages =
        (result.thiefSkillBonuses.readLanguages ?? 0) + fx.read_languages;
    }

    // Perception & Movement (summed)
    if (fx.perception_bonus != null) result.perceptionBonus += fx.perception_bonus;
    if (fx.movement_bonus != null) result.movementBonus += fx.movement_bonus;

    // Magic resistance (max, not cumulative per AD&D rules)
    if (fx.magic_resistance != null) {
      result.magicResistance = Math.max(result.magicResistance, fx.magic_resistance);
    }

    // Spell failure (max)
    if (fx.spell_failure != null) {
      result.spellFailure = Math.max(result.spellFailure, fx.spell_failure);
    }

    // Spell abilities (concat)
    if (fx.spell_abilities?.length) {
      result.spellAbilities.push(...fx.spell_abilities);
    }

    // Resistances (deduplicated)
    if (fx.resistances?.length) {
      for (const r of fx.resistances) {
        if (!resistanceSet.has(r)) {
          resistanceSet.add(r);
          result.resistances.push(r);
        }
      }
    }

    // Passive abilities (deduplicated)
    if (fx.passive_abilities?.length) {
      for (const p of fx.passive_abilities) {
        if (!passiveSet.has(p)) {
          passiveSet.add(p);
          result.passiveAbilities.push(p);
        }
      }
    }
  }

  return result;
}
