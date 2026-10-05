/**
 * Shared utility to compute derived combat data from a character's raw DB data.
 * Used by both the Play Mode (client) and GM Dashboard (server).
 */

import type {
  CharacterRow,
  CharacterClassRow,
  CharacterEquipmentWithDetails,
  CharacterWeaponProficiencyRow,
  CharacterFightingStyleRow,
  EpicItemRow,
  MagicSpellAbility,
  CharacterEffectRow,
} from "@/lib/supabase/types";
import type { ClassGroup, ClassId, SavingThrows } from "./types";
import {
  getMulticlassThac0,
  getMulticlassSaves,
  getMulticlassGroups,
  getMulticlassHpDivisor,
  getEffectiveClassEntries,
} from "./multiclass";
import { calculateAC, calculateEncumbrance, getShieldProficiencyBonus } from "./equipment";
import { getEpicEffects } from "./epic-items";
import type { EpicEffects } from "./epic-items";
import { getMagicItemEffects } from "./magic-items";
import { getConstitutionModifiers } from "./abilities";
import { applyThiefPenalty } from "./epic-items";
import { resolveEffectiveStats } from "./effective-stats";
import { aggregateEffects, scaleAttacksPerRound, type EffectSummary } from "./temporary-effects";
import { hasThiefSkills, getBackstabMultiplier } from "./thief";
import { getSingleWeaponStyleBonus } from "./fighting-styles";
import { getClassGroup } from "./classes";
import { getConBonusCap, clampHpCurrentToMax } from "./hitpoints";
import { getAdjustedWeaponThac0, getAttacksPerRound } from "./combat";
import { getNonproficiencyPenalty } from "./proficiencies";
import { findWeaponProf } from "@/lib/utils/proficiency-match";

export interface ThiefSkillValues {
  /** thief_pick_locks — "Open Locks" in AD&D 2e */
  openLocks: number;
  findTraps: number;
  moveSilently: number;
  hideInShadows: number;
  detectNoise: number;
  climbWalls: number;
  readLanguages: number;
}

export interface PrimaryWeaponData {
  /** Adjusted THAC0 for this weapon (incl. STR, proficiency, magic bonuses) */
  adjustedThac0: number;
  /** Base damage dice string, e.g. "1d8" */
  damageDice: string;
  /** Total damage bonus (STR + specialization + magic weapon bonus) */
  damageBonus: number;
  /** Attacks per round string, e.g. "2" or "3/2" */
  attacksPerRound: string;
  /** Weapon speed factor */
  speed: number;
}

export interface CharacterCombatData {
  /** Class THAC0 (best of active classes), without temporary effects */
  thac0: number;
  /** THAC0 including attack modifiers from temporary effects */
  thac0Effective: number;
  /** Aggregated temporary effects (see temporary-effects.ts) */
  effectSummary: EffectSummary;
  /** Temporary hit points left on active effects */
  tempHp: number;
  ac: number;
  saves: SavingThrows;
  /** floor((INT + WIS) / 2) + epicPerceptionBonus + magicPerceptionBonus — House Rule */
  perception: number;
  classGroups: ClassGroup[];
  primaryClassGroup: ClassGroup;
  maxLevel: number;
  hpCurrent: number;
  hpMax: number;
  backstabMultiplier: number | null;
  thiefSkills: ThiefSkillValues | null;
  poisonSavePenalty: number;
  epicEffects: EpicEffects;
  /** Magic resistance percentage from magic items (max, not cumulative) */
  magicResistance: number;
  /** Spell failure percentage from magic items (combined with epic) */
  magicSpellFailure: number;
  /** Resistances/immunities from magic items */
  magicResistances: string[];
  /** Passive abilities from magic items */
  magicPassiveAbilities: string[];
  /** Spell-like abilities from magic items */
  magicSpellAbilities: MagicSpellAbility[];
  /** Primary equipped weapon data for combat simulation */
  primaryWeapon: PrimaryWeaponData | null;
}

/**
 * Compute all derived combat data from raw character + related rows.
 * Pure function — no DB access, no React hooks.
 */
export function computeCharacterCombatData(
  character: CharacterRow,
  classes: CharacterClassRow[],
  equipment: CharacterEquipmentWithDetails[],
  epicItems: EpicItemRow[],
  weaponProficiencies: CharacterWeaponProficiencyRow[],
  fightingStyles: CharacterFightingStyleRow[] = [],
  effects: CharacterEffectRow[] = []
): CharacterCombatData {
  const effectSummary = aggregateEffects(effects);
  const activeClasses = classes.filter((cc) => cc.is_active);
  const classIds = activeClasses.map((cc) => cc.class_id as ClassId);
  const classGroups = getMulticlassGroups(classIds);
  const primaryClassGroup = classGroups[0] ?? "warrior";

  // Dual-class effective entries
  const effectiveClassEntries = getEffectiveClassEntries(classes);

  const thac0 = getMulticlassThac0(effectiveClassEntries);
  const saves = getMulticlassSaves(effectiveClassEntries);
  const maxLevel = Math.max(...activeClasses.map((cc) => cc.level), 1);

  // Epic effects
  const epicEffects = getEpicEffects(epicItems, character.level);

  // Magic item effects (additive bonuses + stat overrides)
  const magicEffects = getMagicItemEffects(equipment);

  // Overclock (Kondensator) replaces Constitution while active
  const overclockActive = epicItems.some((item) => {
    if (!item.equipped) return false;
    const se = item.simple_effects as Record<string, unknown> | null;
    return se?.overclock_active === true;
  });

  // Effective abilities + modifiers: items, overclock and temporary effects
  // through the shared resolver (same rules as play mode and the sheet).
  const stats = resolveEffectiveStats(
    character,
    {
      epicEffects,
      magicEffects,
      overclockActive: overclockActive && epicEffects.overclockAbility != null,
    },
    effectSummary
  );
  const effectiveInt = stats.values.int;
  const effectiveWis = stats.values.wis;
  const strMods = stats.mods.str;
  const dexMods = stats.mods.dex;
  const conMods = stats.mods.con;
  const baseConMods = getConstitutionModifiers(
    character.con,
    character.con_health,
    character.con_fitness
  );

  let hpDelta = 0;
  if (conMods.hpAdj !== baseConMods.hpAdj) {
    const divisor = getMulticlassHpDivisor(activeClasses.length);
    let totalDelta = 0;
    for (const cc of activeClasses) {
      const group = getClassGroup(cc.class_id as ClassId);
      const cap = getConBonusCap(group);
      const cappedNew = Math.min(conMods.hpAdj, cap);
      const cappedOld = Math.min(baseConMods.hpAdj, cap);
      totalDelta += (cappedNew - cappedOld) * cc.level;
    }
    hpDelta = Math.round(totalDelta / divisor);
  }
  const hpMax = Math.max(1, character.hp_max + hpDelta);
  const hpCurrent = clampHpCurrentToMax(character.hp_current, hpMax);

  // Equipment: armor + shield
  const equippedArmor = equipment.find((e) => e.equipped && e.armor && !e.armor.is_shield);
  const equippedShieldItem =
    equipment.find((e) => e.equipped && e.armor && e.armor.is_shield) ?? null;
  const equippedShield = equippedShieldItem !== null;
  const isMagicalProtection = equippedArmor?.armor?.is_magical_protection ?? false;

  // Weight + encumbrance
  const totalWeight = equipment.reduce((sum, e) => {
    const w = e.weapon?.weight ?? e.armor?.weight ?? 0;
    return sum + w * e.quantity;
  }, 0);
  const encumbranceLevel = calculateEncumbrance(totalWeight, strMods.weightAllow);

  // Fighting styles
  const singleWeaponStyleBonus = getSingleWeaponStyleBonus(fightingStyles);
  const shieldProficiencyBonus = getShieldProficiencyBonus(
    equippedShieldItem?.armor?.shield_type ?? null,
    equippedShieldItem?.armor?.name ?? null,
    weaponProficiencies
  );

  // AC (magic item AC bonus is negative = better in AD&D descending)
  const ac = calculateAC({
    equippedArmorAC: equippedArmor?.armor?.ac ?? null,
    shieldEquipped: equippedShield,
    dexDefenseAdj: dexMods.defensiveAdj,
    magicACModifier: magicEffects.acBonus,
    classGroups,
    encumbrance: encumbranceLevel,
    ignoreEncumbrance: character.ignore_encumbrance,
    isMagicalProtection,
    epicAcBonus: epicEffects.acBonus,
    singleWeaponStyleBonus,
    shieldProficiencyBonus,
    effectAcBonus: effectSummary.acBonus,
    effectAcSet: effectSummary.acSet,
    noDexBonus: effectSummary.noDexAc,
    noShield: effectSummary.noShield,
  });

  // Perception (House Rule) — epic/magic bonuses are situational (e.g. sight-based),
  // temporary effects (e.g. deafness) apply.
  const perception = Math.floor((effectiveInt + effectiveWis) / 2) + effectSummary.perception;

  // Saving throw bonuses from magic items (lower is better → subtract)
  const msb = magicEffects.saveBonuses;
  const esb = effectSummary.saves;
  const adjustedSaves: SavingThrows = {
    paralyzation: saves.paralyzation - (msb.paralyzation ?? 0) - esb.paralyzation,
    rod: saves.rod - (msb.rod ?? 0) - esb.rod,
    petrification: saves.petrification - (msb.petrification ?? 0) - esb.petrification,
    breath: saves.breath - (msb.breath ?? 0) - esb.breath,
    spell: saves.spell - (msb.spell ?? 0) - esb.spell,
  };

  // Thief skills (epic penalties + magic bonuses + epic bonuses)
  const mtb = magicEffects.thiefSkillBonuses;
  const etb = epicEffects.thiefBonuses;
  const fxThief = effectSummary.thiefSkills;
  let thiefSkills: ThiefSkillValues | null = null;
  if (hasThiefSkills(classIds) && !epicEffects.thiefDisabled) {
    thiefSkills = {
      openLocks:
        applyThiefPenalty(character.thief_pick_locks, epicEffects) +
        (mtb.openLocks ?? 0) +
        (etb.openLocks ?? 0) +
        fxThief,
      findTraps:
        applyThiefPenalty(character.thief_find_traps, epicEffects) +
        (mtb.findTraps ?? 0) +
        (etb.findTraps ?? 0) +
        fxThief,
      moveSilently:
        applyThiefPenalty(character.thief_move_silently, epicEffects) +
        (mtb.moveSilently ?? 0) +
        (etb.moveSilently ?? 0) +
        fxThief,
      hideInShadows:
        applyThiefPenalty(character.thief_hide_shadows, epicEffects) +
        (mtb.hideInShadows ?? 0) +
        (etb.hideInShadows ?? 0) +
        fxThief,
      detectNoise:
        applyThiefPenalty(character.thief_detect_noise, epicEffects) +
        (mtb.detectNoise ?? 0) +
        (etb.detectNoise ?? 0) +
        fxThief,
      climbWalls:
        applyThiefPenalty(character.thief_climb_walls, epicEffects) +
        (mtb.climbWalls ?? 0) +
        (etb.climbWalls ?? 0) +
        fxThief,
      readLanguages:
        applyThiefPenalty(character.thief_read_languages, epicEffects) +
        (mtb.readLanguages ?? 0) +
        (etb.readLanguages ?? 0) +
        fxThief,
    };
  }

  // Backstab
  let backstabMultiplier: number | null = null;
  if (hasThiefSkills(classIds)) {
    const thiefClass = activeClasses.find(
      (cc) => cc.class_id === "thief" || cc.class_id === "bard"
    );
    if (thiefClass) {
      backstabMultiplier = getBackstabMultiplier(thiefClass.level);
    }
  }

  // Poison save penalty (from overclock)
  const poisonSavePenalty =
    overclockActive && epicEffects.overclockAbility
      ? epicEffects.overclockAbility.poisonSavePenalty
      : 0;

  // Primary weapon data for combat simulation
  const equippedWeapon = equipment.find((e) => e.equipped && e.weapon);
  let primaryWeapon: PrimaryWeaponData | null = null;
  if (equippedWeapon?.weapon) {
    const weapon = equippedWeapon.weapon;
    const matchingProf = findWeaponProf(weaponProficiencies, weapon.name, weapon.name_en);
    const isProficient = !!matchingProf;
    const isSpecialized = matchingProf?.specialization ?? false;
    const specHitBonus = isSpecialized ? 1 : 0;
    const specDmgBonus = isSpecialized ? 2 : 0;
    const profPenalty = isProficient ? 0 : getNonproficiencyPenalty(primaryClassGroup);

    const adjusted = getAdjustedWeaponThac0(
      thac0,
      strMods.hitAdj + specHitBonus,
      dexMods.missileAdj + specHitBonus,
      weapon.weapon_type,
      profPenalty,
      equippedWeapon.hit_bonus
    );

    const warriorEntry = effectiveClassEntries.find(
      (ce) => getClassGroup(ce.classId) === "warrior"
    );
    let apr: string;
    if (warriorEntry) {
      apr = getAttacksPerRound("warrior", warriorEntry.level, isSpecialized);
    } else if (isSpecialized) {
      apr = "3/2";
    } else {
      apr = "1";
    }

    primaryWeapon = {
      adjustedThac0: adjusted.melee - effectSummary.attack,
      damageDice: weapon.damage_sm,
      damageBonus:
        strMods.dmgAdj + specDmgBonus + equippedWeapon.damage_bonus + effectSummary.damage,
      attacksPerRound: scaleAttacksPerRound(apr, effectSummary),
      speed: weapon.speed,
    };
  }

  return {
    thac0,
    thac0Effective: thac0 - effectSummary.attack,
    effectSummary,
    tempHp: effectSummary.tempHp,
    ac,
    saves: adjustedSaves,
    perception,
    classGroups,
    primaryClassGroup,
    maxLevel,
    hpCurrent,
    hpMax,
    backstabMultiplier,
    thiefSkills,
    poisonSavePenalty,
    epicEffects,
    magicResistance: magicEffects.magicResistance,
    magicSpellFailure: Math.max(magicEffects.spellFailure, epicEffects.spellFailure),
    magicResistances: magicEffects.resistances,
    magicPassiveAbilities: magicEffects.passiveAbilities,
    magicSpellAbilities: magicEffects.spellAbilities,
    primaryWeapon,
  };
}
