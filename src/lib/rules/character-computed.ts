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
} from "@/lib/supabase/types";
import type { ClassGroup, ClassId, SavingThrows } from "./types";
import {
  getMulticlassThac0,
  getMulticlassSaves,
  getMulticlassGroups,
  getMulticlassHpDivisor,
} from "./multiclass";
import { calculateAC, calculateEncumbrance, getShieldProficiencyBonus } from "./equipment";
import { getEpicEffects } from "./epic-items";
import type { EpicEffects } from "./epic-items";
import { getMagicItemEffects } from "./magic-items";
import { getStrengthModifiers, getDexterityModifiers, getConstitutionModifiers } from "./abilities";
import { scaleSubStat, applyThiefPenalty } from "./epic-items";
import { hasThiefSkills, getBackstabMultiplier } from "./thief";
import { getSingleWeaponStyleBonus } from "./fighting-styles";
import { getClassGroup } from "./classes";
import { getConBonusCap } from "./hitpoints";
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
  thac0: number;
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
  fightingStyles: CharacterFightingStyleRow[] = []
): CharacterCombatData {
  const activeClasses = classes.filter((cc) => cc.is_active);
  const classIds = activeClasses.map((cc) => cc.class_id as ClassId);
  const classGroups = getMulticlassGroups(classIds);
  const primaryClassGroup = classGroups[0] ?? "warrior";

  // Dual-class effective entries
  const classEntries = activeClasses.map((cc) => ({
    classId: cc.class_id as ClassId,
    level: cc.level,
  }));
  const dualOrig = classes.find((cc) => cc.switch_level != null);
  let effectiveClassEntries = classEntries;
  if (dualOrig) {
    const dualNew = activeClasses.find((cc) => cc.class_id !== dualOrig.class_id);
    if (dualNew) {
      const dormant = dualNew.level <= dualOrig.switch_level!;
      if (dormant) {
        effectiveClassEntries = [{ classId: dualNew.class_id as ClassId, level: dualNew.level }];
      } else {
        effectiveClassEntries = [
          { classId: dualOrig.class_id as ClassId, level: dualOrig.switch_level! },
          { classId: dualNew.class_id as ClassId, level: dualNew.level },
        ];
      }
    }
  }

  const thac0 = getMulticlassThac0(effectiveClassEntries);
  const saves = getMulticlassSaves(effectiveClassEntries);
  const maxLevel = Math.max(...activeClasses.map((cc) => cc.level), 1);

  // Epic effects
  const epicEffects = getEpicEffects(epicItems, character.level);
  const eo = epicEffects.statOverrides;
  const fo = epicEffects.forceStatOverrides;

  // Magic item effects (additive bonuses + stat overrides)
  const magicEffects = getMagicItemEffects(equipment);
  const mb = magicEffects.statBonuses;
  const mo = magicEffects.statOverrides;

  // Effective stats: forceStatOverride wins absolutely (replaces base regardless
  // of direction); otherwise max(base, epicOverride, magicOverride) + magic
  // additive bonuses (capped at 25). Force-overrides model items like the
  // Kondensator where the biological stat replaces the stored buffed value.
  const MAX_STAT = 25;
  const resolve = (base: number, force?: number, epic?: number, magic?: number): number =>
    force ?? Math.max(base, epic ?? 0, magic ?? 0);
  const effectiveStr = Math.min(
    resolve(character.str, fo.str, eo.str, mo.str) + (mb.str ?? 0),
    MAX_STAT
  );
  const effectiveDex = Math.min(
    resolve(character.dex, fo.dex, eo.dex, mo.dex) + (mb.dex ?? 0),
    MAX_STAT
  );
  const effectiveInt = Math.min(
    resolve(character.int, fo.int, eo.int, mo.int) + (mb.int ?? 0),
    MAX_STAT
  );
  const effectiveWis = Math.min(
    resolve(character.wis, fo.wis, eo.wis, mo.wis) + (mb.wis ?? 0),
    MAX_STAT
  );

  // Is STR overridden by any item?
  const strOverridden = fo.str != null || eo.str != null || mo.str != null;
  // For exceptional STR: use magic override if magic item provides the winning STR override
  const strExceptional =
    mo.str != null && mo.str >= (eo.str ?? 0) && magicEffects.strExceptionalOverride != null
      ? magicEffects.strExceptionalOverride
      : (character.str_exceptional ?? undefined);

  // Modifiers (only STR and DEX needed for AC calc)
  const strMods = getStrengthModifiers(
    effectiveStr,
    strExceptional,
    strOverridden
      ? (scaleSubStat(character.str, character.str_muscle, effectiveStr) ?? undefined)
      : (character.str_muscle ?? undefined),
    strOverridden
      ? (scaleSubStat(character.str, character.str_stamina, effectiveStr) ?? undefined)
      : (character.str_stamina ?? undefined)
  );
  const dexOverridden = fo.dex != null || eo.dex != null || mo.dex != null;
  const dexMods = getDexterityModifiers(
    effectiveDex,
    dexOverridden
      ? (scaleSubStat(character.dex, character.dex_aim, effectiveDex) ?? undefined)
      : (character.dex_aim ?? undefined),
    dexOverridden
      ? (scaleSubStat(character.dex, character.dex_balance, effectiveDex) ?? undefined)
      : (character.dex_balance ?? undefined)
  );

  // CON adjustment for HP (same logic as play-mode.tsx)
  const effectiveCon = Math.min(
    resolve(character.con, fo.con, eo.con, mo.con) + (mb.con ?? 0),
    MAX_STAT
  );
  const conMods = getConstitutionModifiers(effectiveCon);
  const baseConMods = getConstitutionModifiers(character.con);

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
  const hpCurrent = Math.max(0, Math.min(character.hp_current + Math.min(0, hpDelta), hpMax));

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
  });

  // Perception (House Rule) — base only, epic/magic bonuses are situational (e.g. sight-based)
  const perception = Math.floor((effectiveInt + effectiveWis) / 2);

  // Saving throw bonuses from magic items (lower is better → subtract)
  const msb = magicEffects.saveBonuses;
  const adjustedSaves: SavingThrows = {
    paralyzation: saves.paralyzation - (msb.paralyzation ?? 0),
    rod: saves.rod - (msb.rod ?? 0),
    petrification: saves.petrification - (msb.petrification ?? 0),
    breath: saves.breath - (msb.breath ?? 0),
    spell: saves.spell - (msb.spell ?? 0),
  };

  // Thief skills (epic penalties + magic bonuses)
  const mtb = magicEffects.thiefSkillBonuses;
  let thiefSkills: ThiefSkillValues | null = null;
  if (hasThiefSkills(classIds) && !epicEffects.thiefDisabled) {
    thiefSkills = {
      openLocks: applyThiefPenalty(character.thief_pick_locks, epicEffects) + (mtb.openLocks ?? 0),
      findTraps: applyThiefPenalty(character.thief_find_traps, epicEffects) + (mtb.findTraps ?? 0),
      moveSilently:
        applyThiefPenalty(character.thief_move_silently, epicEffects) + (mtb.moveSilently ?? 0),
      hideInShadows:
        applyThiefPenalty(character.thief_hide_shadows, epicEffects) + (mtb.hideInShadows ?? 0),
      detectNoise:
        applyThiefPenalty(character.thief_detect_noise, epicEffects) + (mtb.detectNoise ?? 0),
      climbWalls:
        applyThiefPenalty(character.thief_climb_walls, epicEffects) + (mtb.climbWalls ?? 0),
      readLanguages:
        applyThiefPenalty(character.thief_read_languages, epicEffects) + (mtb.readLanguages ?? 0),
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
  const overclockActive = epicItems.some((item) => {
    if (!item.equipped) return false;
    const se = item.simple_effects as Record<string, unknown> | null;
    return se?.overclock_active === true;
  });
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
      adjustedThac0: adjusted.melee,
      damageDice: weapon.damage_sm,
      damageBonus: strMods.dmgAdj + specDmgBonus + equippedWeapon.damage_bonus,
      attacksPerRound: apr,
      speed: weapon.speed,
    };
  }

  return {
    thac0,
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
