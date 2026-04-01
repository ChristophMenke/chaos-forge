import type { ClassId, MagicSchool, PriestSphere } from "./types";
import { CLASSES } from "./classes";
import { getOppositionSchools, getSpecialist, hasSphereAccess } from "./magic";
import { getIntelligenceModifiers, getWisdomModifiers } from "./abilities";

// PHB Table 21: Wizard Spell Progression
// Index = spell level - 1, value = number of slots
const WIZARD_SLOTS: number[][] = [
  // L1:  1st
  [1, 0, 0, 0, 0, 0, 0, 0, 0],
  // L2
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  // L3
  [2, 1, 0, 0, 0, 0, 0, 0, 0],
  // L4
  [3, 2, 0, 0, 0, 0, 0, 0, 0],
  // L5
  [4, 2, 1, 0, 0, 0, 0, 0, 0],
  // L6
  [4, 2, 2, 0, 0, 0, 0, 0, 0],
  // L7
  [4, 3, 2, 1, 0, 0, 0, 0, 0],
  // L8
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  // L9
  [4, 3, 3, 2, 1, 0, 0, 0, 0],
  // L10
  [4, 4, 3, 2, 2, 0, 0, 0, 0],
  // L11
  [4, 4, 4, 3, 3, 0, 0, 0, 0],
  // L12
  [4, 4, 4, 4, 4, 1, 0, 0, 0],
  // L13
  [5, 5, 5, 4, 4, 2, 0, 0, 0],
  // L14
  [5, 5, 5, 4, 4, 2, 1, 0, 0],
  // L15
  [5, 5, 5, 5, 5, 2, 1, 0, 0],
  // L16
  [5, 5, 5, 5, 5, 3, 2, 1, 0],
  // L17
  [5, 5, 5, 5, 5, 3, 3, 2, 0],
  // L18
  [5, 5, 5, 5, 5, 3, 3, 2, 1],
  // L19
  [5, 5, 5, 5, 5, 3, 3, 3, 1],
  // L20
  [5, 5, 5, 5, 5, 4, 3, 3, 2],
];

// PHB Table 24: Priest Spell Progression (7 levels)
const PRIEST_SLOTS: number[][] = [
  // L1
  [1, 0, 0, 0, 0, 0, 0],
  // L2
  [2, 0, 0, 0, 0, 0, 0],
  // L3
  [2, 1, 0, 0, 0, 0, 0],
  // L4
  [3, 2, 0, 0, 0, 0, 0],
  // L5
  [3, 3, 1, 0, 0, 0, 0],
  // L6
  [3, 3, 2, 0, 0, 0, 0],
  // L7
  [3, 3, 2, 1, 0, 0, 0],
  // L8
  [3, 3, 3, 2, 0, 0, 0],
  // L9
  [4, 4, 3, 2, 1, 0, 0],
  // L10
  [4, 4, 3, 3, 2, 0, 0],
  // L11
  [5, 4, 4, 3, 2, 1, 0],
  // L12
  [6, 5, 5, 3, 2, 2, 0],
  // L13
  [6, 6, 6, 4, 2, 2, 0],
  // L14
  [6, 6, 6, 5, 3, 2, 1],
  // L15
  [7, 7, 7, 5, 4, 2, 1],
  // L16
  [7, 7, 7, 6, 5, 3, 1],
  // L17
  [8, 8, 8, 6, 5, 3, 1],
  // L18
  [8, 8, 8, 7, 6, 4, 2],
  // L19
  [9, 9, 8, 7, 6, 4, 2],
  // L20
  [9, 9, 9, 8, 7, 5, 2],
];

// PHB Table 32: Bard Spell Progression (6 spell levels max, starts at level 2)
const BARD_SLOTS: number[][] = [
  // L1: no spells
  [0, 0, 0, 0, 0, 0],
  // L2
  [1, 0, 0, 0, 0, 0],
  // L3
  [2, 0, 0, 0, 0, 0],
  // L4
  [2, 1, 0, 0, 0, 0],
  // L5
  [3, 1, 0, 0, 0, 0],
  // L6
  [3, 2, 0, 0, 0, 0],
  // L7
  [3, 2, 1, 0, 0, 0],
  // L8
  [3, 3, 1, 0, 0, 0],
  // L9
  [3, 3, 2, 0, 0, 0],
  // L10
  [3, 3, 2, 1, 0, 0],
  // L11
  [3, 3, 3, 1, 0, 0],
  // L12
  [3, 3, 3, 2, 0, 0],
  // L13
  [3, 3, 3, 2, 1, 0],
  // L14
  [3, 3, 3, 3, 1, 0],
  // L15
  [3, 3, 3, 3, 2, 0],
  // L16
  [3, 3, 3, 3, 2, 1],
  // L17
  [4, 3, 3, 3, 3, 1],
  // L18
  [4, 4, 3, 3, 3, 2],
  // L19
  [4, 4, 4, 4, 3, 2],
  // L20
  [4, 4, 4, 4, 4, 3],
];

export function getBardSpellSlots(level: number): number[] {
  const idx = Math.min(level, BARD_SLOTS.length) - 1;
  return [...BARD_SLOTS[Math.max(0, idx)]];
}

export function getWizardSpellSlots(level: number): number[] {
  const idx = Math.min(level, WIZARD_SLOTS.length) - 1;
  return [...WIZARD_SLOTS[Math.max(0, idx)]];
}

/**
 * PHB: Specialist wizards gain +1 spell slot per spell level where they have
 * at least 1 base slot. The bonus slot must be used for a spell from the
 * specialist's school.
 */
export function getSpecialistBonusSlots(classId: ClassId, level: number): number[] {
  const specialist = getSpecialist(classId);
  if (!specialist) return new Array(9).fill(0);
  const baseSlots = getWizardSpellSlots(level);
  return baseSlots.map((slots) => (slots > 0 ? 1 : 0));
}

export function getPriestSpellSlots(level: number): number[] {
  const idx = Math.min(level, PRIEST_SLOTS.length) - 1;
  return [...PRIEST_SLOTS[Math.max(0, idx)]];
}

/**
 * Bonus priest spell slots from WIS.
 * Uses the bonusSpells array from getWisdomModifiers().
 */
export function getPriestBonusSlots(wisScore: number): number[] {
  const { bonusSpells } = getWisdomModifiers(wisScore);
  const result = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < bonusSpells.length && i < 7; i++) {
    result[i] = bonusSpells[i];
  }
  return result;
}

export interface SpellLearnResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if a character can learn a specific spell.
 */
// ─── PRIEST SPELL POINTS (Player's Option: Spells & Magic) ───────────────────
// Spell Points replace fixed slots — priests get a pool of points they can
// spend flexibly on any spell they know. Spell cost = spell level squared.

// Table 26: Priest Spell Point Progression
const PRIEST_SPELL_POINTS: number[] = [
  // L1-L20
  10, 15, 20, 28, 36, 45, 55, 65, 78, 92, 107, 123, 140, 158, 177, 197, 218, 240, 263, 287,
];

// Table 28: Spell Point Cost by Priest Spell Level
// Cost = level of the spell (1=1, 2=2, 3=4, 4=6, 5=8, 6=10, 7=12)
const PRIEST_SPELL_POINT_COST: number[] = [
  1,
  2,
  4,
  6,
  8,
  10,
  12, // spell levels 1-7
];

// Table 27: Bonus Spell Points from WIS
// WIS 13=+1, 14=+2, 15=+4, 16=+8, 17=+12, 18=+16
const PRIEST_BONUS_SPELL_POINTS: Record<number, number> = {
  13: 1,
  14: 2,
  15: 4,
  16: 8,
  17: 12,
  18: 16,
};

export function getPriestSpellPoints(level: number): number {
  const idx = Math.min(level, PRIEST_SPELL_POINTS.length) - 1;
  return PRIEST_SPELL_POINTS[Math.max(0, idx)];
}

export function getPriestBonusSpellPoints(wisScore: number): number {
  let bonus = 0;
  for (const [wis, points] of Object.entries(PRIEST_BONUS_SPELL_POINTS)) {
    if (wisScore >= parseInt(wis)) bonus = points;
  }
  return bonus;
}

export function getPriestSpellCost(spellLevel: number): number {
  if (spellLevel < 1 || spellLevel > 7) return 0;
  return PRIEST_SPELL_POINT_COST[spellLevel - 1];
}

// ─── WIZARD SPELL POINTS (Player's Option: Spells & Magic) ──────────────────
// Table 17: Wizard Spell Point Progression
const WIZARD_SPELL_POINTS: {
  points: number;
  specialistBonus: number;
  maxSpellLevel: number;
  maxMemorized: number;
}[] = [
  // L1-L20
  { points: 15, specialistBonus: 10, maxSpellLevel: 1, maxMemorized: 4 }, // L1
  { points: 22, specialistBonus: 14, maxSpellLevel: 1, maxMemorized: 4 }, // L2
  { points: 30, specialistBonus: 18, maxSpellLevel: 2, maxMemorized: 4 }, // L3
  { points: 40, specialistBonus: 24, maxSpellLevel: 2, maxMemorized: 4 }, // L4
  { points: 52, specialistBonus: 30, maxSpellLevel: 3, maxMemorized: 5 }, // L5
  { points: 65, specialistBonus: 38, maxSpellLevel: 3, maxMemorized: 5 }, // L6
  { points: 80, specialistBonus: 46, maxSpellLevel: 4, maxMemorized: 5 }, // L7
  { points: 96, specialistBonus: 56, maxSpellLevel: 4, maxMemorized: 5 }, // L8
  { points: 114, specialistBonus: 66, maxSpellLevel: 5, maxMemorized: 5 }, // L9
  { points: 133, specialistBonus: 78, maxSpellLevel: 5, maxMemorized: 5 }, // L10
  { points: 155, specialistBonus: 90, maxSpellLevel: 6, maxMemorized: 5 }, // L11
  { points: 178, specialistBonus: 104, maxSpellLevel: 6, maxMemorized: 5 }, // L12
  { points: 203, specialistBonus: 118, maxSpellLevel: 7, maxMemorized: 6 }, // L13
  { points: 229, specialistBonus: 134, maxSpellLevel: 7, maxMemorized: 6 }, // L14
  { points: 257, specialistBonus: 150, maxSpellLevel: 8, maxMemorized: 6 }, // L15
  { points: 287, specialistBonus: 168, maxSpellLevel: 8, maxMemorized: 6 }, // L16
  { points: 318, specialistBonus: 186, maxSpellLevel: 9, maxMemorized: 6 }, // L17
  { points: 351, specialistBonus: 206, maxSpellLevel: 9, maxMemorized: 6 }, // L18
  { points: 386, specialistBonus: 226, maxSpellLevel: 9, maxMemorized: 6 }, // L19
  { points: 422, specialistBonus: 248, maxSpellLevel: 9, maxMemorized: 6 }, // L20
];

// Table 18: Spell Cost by Level (Wizard)
const WIZARD_SPELL_POINT_COST: { fixed: number; free: number }[] = [
  { fixed: 3, free: 5 }, // Level 1
  { fixed: 6, free: 10 }, // Level 2
  { fixed: 10, free: 16 }, // Level 3
  { fixed: 15, free: 24 }, // Level 4
  { fixed: 21, free: 33 }, // Level 5
  { fixed: 28, free: 44 }, // Level 6
  { fixed: 36, free: 56 }, // Level 7
  { fixed: 45, free: 70 }, // Level 8
  { fixed: 55, free: 86 }, // Level 9
];

// Table 19: Bonus Spell Points for Intelligence
const WIZARD_BONUS_SPELL_POINTS: Record<number, number> = {
  14: 1,
  15: 3,
  16: 5,
  17: 8,
  18: 11,
  19: 15,
  20: 20,
  21: 25,
  22: 31,
  23: 38,
  24: 46,
  25: 55,
};

export function getWizardSpellPoints(level: number): number {
  const idx = Math.min(level, WIZARD_SPELL_POINTS.length) - 1;
  return WIZARD_SPELL_POINTS[Math.max(0, idx)].points;
}

export function getWizardSpecialistBonusPoints(level: number): number {
  const idx = Math.min(level, WIZARD_SPELL_POINTS.length) - 1;
  return WIZARD_SPELL_POINTS[Math.max(0, idx)].specialistBonus;
}

export function getWizardBonusSpellPoints(intScore: number): number {
  let bonus = 0;
  for (const [score, points] of Object.entries(WIZARD_BONUS_SPELL_POINTS)) {
    if (intScore >= parseInt(score)) bonus = points;
  }
  return bonus;
}

export function getWizardSpellCost(spellLevel: number, isFree: boolean = false): number {
  if (spellLevel < 1 || spellLevel > 9) return 0;
  const costs = WIZARD_SPELL_POINT_COST[spellLevel - 1];
  return isFree ? costs.free : costs.fixed;
}

export function getWizardMaxMemorized(level: number): number {
  const idx = Math.min(level, WIZARD_SPELL_POINTS.length) - 1;
  return WIZARD_SPELL_POINTS[Math.max(0, idx)].maxMemorized;
}

export function canLearnSpell(
  classId: ClassId,
  spellSchool: MagicSchool | undefined,
  spellSphere: PriestSphere | undefined,
  spellLevel: number,
  intScore: number,
  priesthoodId?: string | null
): SpellLearnResult {
  const cls = CLASSES[classId];
  if (!cls) return { allowed: false, reason: "Ungültige Klasse." };

  // Non-casters can't learn spells
  if (cls.group !== "wizard" && cls.group !== "priest" && classId !== "bard") {
    return { allowed: false, reason: "Diese Klasse kann keine Zauber wirken." };
  }

  // Wizard spell checks
  if (cls.group === "wizard" && spellSchool) {
    // Check opposition schools for specialists
    const opposition = getOppositionSchools(classId);
    if (opposition.includes(spellSchool)) {
      return { allowed: false, reason: `Verbotene Schule für diese Spezialisierung.` };
    }

    // Check INT spell level limit
    const intMods = getIntelligenceModifiers(intScore);
    if (intMods.spellLevel !== null && spellLevel > intMods.spellLevel) {
      return {
        allowed: false,
        reason: `INT ${intScore} erlaubt maximal Zauberstufe ${intMods.spellLevel}.`,
      };
    }
  }

  // Priest spell checks (priesthood-aware)
  if (cls.group === "priest" && spellSphere) {
    if (!hasSphereAccess(classId, spellSphere, "minor", priesthoodId)) {
      return { allowed: false, reason: `Kein Zugang zur Sphäre "${spellSphere}".` };
    }

    // Minor sphere access: max level 3
    if (!hasSphereAccess(classId, spellSphere, "major", priesthoodId) && spellLevel > 3) {
      return {
        allowed: false,
        reason: `Nebensphäre "${spellSphere}": maximal Zauberstufe 3.`,
      };
    }
  }

  return { allowed: true };
}

// ─── RANGER SPELL SLOTS (PHB Ch3: Ranger) ───────────────────────────────────

// Rangers gain druid spells at level 8 and wizard spells at level 9
const RANGER_DRUID_SLOTS: Record<number, number[]> = {
  8: [1, 0, 0],
  9: [1, 0, 0],
  10: [2, 0, 0],
  11: [2, 0, 0],
  12: [2, 1, 0],
  13: [2, 1, 0],
  14: [2, 2, 0],
  15: [2, 2, 1],
  16: [3, 2, 1],
  17: [3, 2, 2],
  18: [3, 3, 2],
  19: [3, 3, 3],
  20: [3, 3, 3],
};

const RANGER_WIZARD_SLOTS: Record<number, number[]> = {
  9: [1, 0],
  10: [1, 0],
  11: [1, 0],
  12: [1, 0],
  13: [1, 1],
  14: [1, 1],
  15: [2, 1],
  16: [2, 1],
  17: [2, 2],
  18: [2, 2],
  19: [3, 2],
  20: [3, 2],
};

export function getRangerSpellSlots(level: number): {
  druid: number[];
  wizard: number[];
} {
  const druid = RANGER_DRUID_SLOTS[Math.min(level, 20)] ?? [0, 0, 0];
  const wizard = RANGER_WIZARD_SLOTS[Math.min(level, 20)] ?? [0, 0];
  return { druid, wizard };
}

// ─── PALADIN SPELL SLOTS (PHB Ch3: Paladin) ─────────────────────────────────

// Paladins gain priest spells at level 9
const PALADIN_PRIEST_SLOTS: Record<number, number[]> = {
  9: [1, 0, 0, 0],
  10: [2, 0, 0, 0],
  11: [2, 1, 0, 0],
  12: [2, 2, 0, 0],
  13: [2, 2, 1, 0],
  14: [3, 2, 1, 0],
  15: [3, 2, 1, 1],
  16: [3, 3, 2, 1],
  17: [3, 3, 3, 1],
  18: [3, 3, 3, 2],
  19: [3, 3, 3, 2],
  20: [3, 3, 3, 3],
};

export function getPaladinSpellSlots(level: number): number[] {
  return PALADIN_PRIEST_SLOTS[Math.min(level, 20)] ?? [0, 0, 0, 0];
}
