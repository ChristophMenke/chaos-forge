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
import { getStrengthModifiers, getDexterityModifiers, getConstitutionModifiers } from "./abilities";
import { scaleSubStat, applyThiefPenalty } from "./epic-items";
import { hasThiefSkills, getBackstabMultiplier } from "./thief";
import { getSingleWeaponStyleBonus } from "./fighting-styles";
import { getClassGroup } from "./classes";
import { getConBonusCap } from "./hitpoints";

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

export interface CharacterCombatData {
  thac0: number;
  ac: number;
  saves: SavingThrows;
  /** floor((INT + WIS) / 2) + epicPerceptionBonus — House Rule */
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

  // Effective stats
  const effectiveStr = eo.str ?? character.str;
  const effectiveDex = eo.dex ?? character.dex;
  const effectiveInt = eo.int ?? character.int;
  const effectiveWis = eo.wis ?? character.wis;

  // Modifiers (only STR and DEX needed for AC calc)
  const strMods = getStrengthModifiers(
    effectiveStr,
    character.str_exceptional ?? undefined,
    eo.str != null
      ? (scaleSubStat(character.str, character.str_muscle, effectiveStr) ?? undefined)
      : (character.str_muscle ?? undefined),
    eo.str != null
      ? (scaleSubStat(character.str, character.str_stamina, effectiveStr) ?? undefined)
      : (character.str_stamina ?? undefined)
  );
  const dexMods = getDexterityModifiers(
    effectiveDex,
    eo.dex != null
      ? (scaleSubStat(character.dex, character.dex_aim, effectiveDex) ?? undefined)
      : (character.dex_aim ?? undefined),
    eo.dex != null
      ? (scaleSubStat(character.dex, character.dex_balance, effectiveDex) ?? undefined)
      : (character.dex_balance ?? undefined)
  );

  // CON adjustment for HP (same logic as play-mode.tsx)
  const effectiveCon = eo.con ?? character.con;
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

  // AC
  const ac = calculateAC({
    equippedArmorAC: equippedArmor?.armor?.ac ?? null,
    shieldEquipped: equippedShield,
    dexDefenseAdj: dexMods.defensiveAdj,
    classGroups,
    encumbrance: encumbranceLevel,
    ignoreEncumbrance: character.ignore_encumbrance,
    isMagicalProtection,
    epicAcBonus: epicEffects.acBonus,
    singleWeaponStyleBonus,
    shieldProficiencyBonus,
  });

  // Perception (House Rule)
  const perception = Math.floor((effectiveInt + effectiveWis) / 2) + epicEffects.perceptionBonus;

  // Thief skills
  let thiefSkills: ThiefSkillValues | null = null;
  if (hasThiefSkills(classIds) && !epicEffects.thiefDisabled) {
    thiefSkills = {
      openLocks: applyThiefPenalty(character.thief_pick_locks, epicEffects),
      findTraps: applyThiefPenalty(character.thief_find_traps, epicEffects),
      moveSilently: applyThiefPenalty(character.thief_move_silently, epicEffects),
      hideInShadows: applyThiefPenalty(character.thief_hide_shadows, epicEffects),
      detectNoise: applyThiefPenalty(character.thief_detect_noise, epicEffects),
      climbWalls: applyThiefPenalty(character.thief_climb_walls, epicEffects),
      readLanguages: applyThiefPenalty(character.thief_read_languages, epicEffects),
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

  return {
    thac0,
    ac,
    saves,
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
  };
}
