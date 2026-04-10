import type { ClassGroup, ClassId } from "./types";

/**
 * Weapon proficiency slots by class group and level.
 * PHB Table 34.
 */
export function getWeaponProficiencySlots(classGroup: ClassGroup, level: number): number {
  switch (classGroup) {
    case "warrior":
      return 4 + Math.floor((level - 1) / 3);
    case "priest":
      return 2 + Math.floor((level - 1) / 4);
    case "rogue":
      return 2 + Math.floor((level - 1) / 4);
    case "wizard":
      return 1 + Math.floor((level - 1) / 6);
  }
}

/**
 * Non-weapon proficiency slots by class group and level.
 * PHB Table 34. Base slots + additional every 3 levels.
 */
export function getNonweaponProficiencySlots(
  classGroup: ClassGroup,
  level: number,
  _intScore?: number
): number {
  const base = classGroup === "priest" || classGroup === "wizard" ? 4 : 3;
  return base + Math.floor((level - 1) / 3);
}

/**
 * Attack penalty when using a weapon the character is not proficient with.
 * PHB Table 34.
 */
export function getNonproficiencyPenalty(classGroup: ClassGroup): number {
  switch (classGroup) {
    case "warrior":
      return -2;
    case "priest":
      return -3;
    case "rogue":
      return -3;
    case "wizard":
      return -5;
  }
}

/**
 * Whether a class can specialize in weapons.
 * House rule: all classes can specialize (via Skills & Powers Character Points).
 */
export function canSpecialize(_classId: ClassId): boolean {
  return true;
}

/**
 * Standard PHB specialization is only for Fighters.
 * Returns true if specialization is non-standard (for warning display).
 */
export function isNonStandardSpecialization(classId: ClassId): boolean {
  return classId !== "fighter";
}

// ─── WEAPON SPEED FACTORS (PHB Chapter 9) ───────────────────────────────────

const WEAPON_SPEED_FACTORS: Record<string, number> = {
  battle_axe: 7,
  hand_axe: 4,
  club: 4,
  dagger: 2,
  dart: 2,
  flail: 7,
  halberd: 9,
  hammer: 4,
  war_hammer: 4,
  javelin: 4,
  lance: 8,
  mace: 7,
  morning_star: 7,
  pike: 13,
  scimitar: 5,
  spear: 6,
  staff: 4,
  quarterstaff: 4,
  long_sword: 5,
  short_sword: 3,
  bastard_sword: 6,
  "two-handed_sword": 10,
  trident: 7,
  whip: 8,
  composite_long_bow: 7,
  composite_short_bow: 6,
  long_bow: 8,
  short_bow: 7,
  light_crossbow: 7,
  heavy_crossbow: 10,
  sling: 6,
};

export function getWeaponSpeedFactor(weaponId: string): number | null {
  return WEAPON_SPEED_FACTORS[weaponId] ?? null;
}
