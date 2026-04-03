import type { ClassId } from "./types";
import { CLASSES } from "./classes";
import { getThac0, getSavingThrows, getAttacksPerRound } from "./combat";
import { getWizardSpellSlots, getPriestSpellSlots, getBardSpellSlots } from "./spellslots";
import { getWeaponProficiencySlots, getNonweaponProficiencySlots } from "./proficiencies";

// PHB XP tables by class
// Index 0 = XP needed to reach level 2, index 1 = level 3, etc.
const XP_TABLES: Record<string, number[]> = {
  fighter: [
    2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 750000, 1000000, 1250000,
    1500000, 1750000, 2000000, 2250000, 2500000, 2750000, 3000000,
  ],
  ranger: [
    2250, 4500, 9000, 18000, 36000, 75000, 150000, 300000, 600000, 900000, 1200000, 1500000,
    1800000, 2100000, 2400000, 2700000, 3000000, 3300000, 3600000,
  ],
  paladin: [
    2250, 4500, 9000, 18000, 36000, 75000, 150000, 300000, 600000, 900000, 1200000, 1500000,
    1800000, 2100000, 2400000, 2700000, 3000000, 3300000, 3600000,
  ],
  mage: [
    2500, 5000, 10000, 20000, 40000, 60000, 90000, 135000, 250000, 375000, 750000, 1125000, 1500000,
    1875000, 2250000, 2625000, 3000000, 3375000, 3750000,
  ],
  cleric: [
    1500, 3000, 6000, 13000, 27500, 55000, 110000, 225000, 450000, 675000, 900000, 1125000, 1350000,
    1575000, 1800000, 2025000, 2250000, 2475000, 2700000,
  ],
  druid: [
    2000, 4000, 7500, 12500, 20000, 35000, 60000, 90000, 125000, 200000, 300000, 750000, 1500000,
    3000000, 3500000, 4000000, 4500000, 5000000, 5500000,
  ],
  thief: [
    1250, 2500, 5000, 10000, 20000, 40000, 70000, 110000, 160000, 220000, 440000, 660000, 880000,
    1100000, 1320000, 1540000, 1760000, 1980000, 2200000,
  ],
  bard: [
    1250, 2500, 5000, 10000, 20000, 40000, 70000, 110000, 160000, 220000, 440000, 660000, 880000,
    1100000, 1320000, 1540000, 1760000, 1980000, 2200000,
  ],
};

// Specialist wizards use the same table as mage
function getXpTable(classId: ClassId): number[] {
  const cls = CLASSES[classId];
  if (!cls) return XP_TABLES.fighter;

  // All wizard specialists use the mage table
  if (cls.group === "wizard") return XP_TABLES.mage;

  // PO:S&M priest subclasses use the cleric XP table
  if (classId === "crusader" || classId === "monk" || classId === "shaman") return XP_TABLES.cleric;

  return XP_TABLES[classId] ?? XP_TABLES.fighter;
}

/** Returns XP needed to reach the next level, or null if at max level */
export function getXpForNextLevel(classId: ClassId, currentLevel: number): number | null {
  const table = getXpTable(classId);
  const index = currentLevel - 1; // level 1 → index 0 (XP for level 2)
  if (index >= table.length) return null;
  return table[index];
}

export interface LevelUpPreview {
  classId: ClassId;
  currentLevel: number;
  newLevel: number;
  currentXp: number;
  newXp: number;
  levelsGained: number;
}

/**
 * Preview what happens when XP is added to a character class.
 * Calculates the new level based on XP thresholds.
 */
export function previewXpGain(
  classId: ClassId,
  currentLevel: number,
  currentXp: number,
  xpToAdd: number
): LevelUpPreview {
  const newXp = currentXp + xpToAdd;
  let level = currentLevel;

  // Keep leveling up as long as we meet the next threshold
  let nextLevelXp = getXpForNextLevel(classId, level);
  while (nextLevelXp !== null && newXp >= nextLevelXp) {
    level++;
    nextLevelXp = getXpForNextLevel(classId, level);
  }

  return {
    classId,
    currentLevel,
    newLevel: level,
    currentXp,
    newXp,
    levelsGained: level - currentLevel,
  };
}

// ── Next Level Changes ──────────────────────────────────────

export interface NextLevelChange {
  type: "thac0" | "saves" | "spellSlots" | "attacks" | "weaponProf" | "nwpProf";
  before: string;
  after: string;
}

/**
 * Calculate what changes when a character levels up from `currentLevel` to `currentLevel + 1`.
 * Used for next-level preview in the XP dialog.
 */
export function getNextLevelChanges(classId: ClassId, currentLevel: number): NextLevelChange[] {
  const cls = CLASSES[classId];
  if (!cls) return [];
  const group = cls.group;
  const nextLevel = currentLevel + 1;
  const changes: NextLevelChange[] = [];

  // THAC0
  const oldThac0 = getThac0(group, currentLevel);
  const newThac0 = getThac0(group, nextLevel);
  if (oldThac0 !== newThac0) {
    changes.push({ type: "thac0", before: String(oldThac0), after: String(newThac0) });
  }

  // Saving Throws
  const oldSaves = getSavingThrows(group, currentLevel);
  const newSaves = getSavingThrows(group, nextLevel);
  if (JSON.stringify(oldSaves) !== JSON.stringify(newSaves)) {
    changes.push({ type: "saves", before: "", after: "" });
  }

  // Spell Slots
  if (classId === "bard") {
    const oldSlots = getBardSpellSlots(currentLevel);
    const newSlots = getBardSpellSlots(nextLevel);
    if (JSON.stringify(oldSlots) !== JSON.stringify(newSlots)) {
      const fmt = (s: number[]) => s.filter((v) => v > 0).join("/") || "—";
      changes.push({ type: "spellSlots", before: fmt(oldSlots), after: fmt(newSlots) });
    }
  } else if (group === "wizard") {
    const oldSlots = getWizardSpellSlots(currentLevel);
    const newSlots = getWizardSpellSlots(nextLevel);
    if (JSON.stringify(oldSlots) !== JSON.stringify(newSlots)) {
      const fmt = (s: number[]) => s.filter((v) => v > 0).join("/") || "—";
      changes.push({ type: "spellSlots", before: fmt(oldSlots), after: fmt(newSlots) });
    }
  } else if (group === "priest") {
    const oldSlots = getPriestSpellSlots(currentLevel);
    const newSlots = getPriestSpellSlots(nextLevel);
    if (JSON.stringify(oldSlots) !== JSON.stringify(newSlots)) {
      const fmt = (s: number[]) => s.filter((v) => v > 0).join("/") || "—";
      changes.push({ type: "spellSlots", before: fmt(oldSlots), after: fmt(newSlots) });
    }
  }

  // Attacks per round (warriors)
  if (group === "warrior") {
    const oldAtk = getAttacksPerRound(group, currentLevel, false);
    const newAtk = getAttacksPerRound(group, nextLevel, false);
    if (oldAtk !== newAtk) {
      changes.push({ type: "attacks", before: oldAtk, after: newAtk });
    }
  }

  // Weapon proficiency slots
  const oldWp = getWeaponProficiencySlots(group, currentLevel);
  const newWp = getWeaponProficiencySlots(group, nextLevel);
  if (oldWp !== newWp) {
    changes.push({ type: "weaponProf", before: String(oldWp), after: String(newWp) });
  }

  // NWP slots
  const oldNwp = getNonweaponProficiencySlots(group, currentLevel);
  const newNwp = getNonweaponProficiencySlots(group, nextLevel);
  if (oldNwp !== newNwp) {
    changes.push({ type: "nwpProf", before: String(oldNwp), after: String(newNwp) });
  }

  return changes;
}

/** Returns the XP threshold for a given level (0 for level 1) */
export function getXpThreshold(classId: ClassId, level: number): number {
  if (level <= 1) return 0;
  const table = getXpTable(classId);
  const index = level - 2; // level 2 → index 0
  if (index >= table.length) return table[table.length - 1];
  return table[index];
}
