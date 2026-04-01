import type { ClassId, ClassGroup, SavingThrows, RaceId, DualclassInfo } from "./types";
import { CLASSES } from "./classes";
import { RACES } from "./races";
import { getThac0, getSavingThrows } from "./combat";

/** A single class entry for a multiclass character */
export interface ClassEntry {
  classId: ClassId;
  level: number;
}

// ─── THAC0 ───────────────────────────────────────────────────────────────────
// Multiclass: Use the best (lowest) THAC0 from all active classes

export function getMulticlassThac0(classes: ClassEntry[]): number {
  if (classes.length === 0) return 20;
  return Math.min(
    ...classes.map((c) => {
      const cls = CLASSES[c.classId];
      if (!cls) return 20;
      return getThac0(cls.group, c.level, c.classId);
    })
  );
}

// ─── SAVING THROWS ───────────────────────────────────────────────────────────
// Multiclass: Use the best (lowest) value in each category

export function getMulticlassSaves(classes: ClassEntry[]): SavingThrows {
  if (classes.length === 0) {
    return { paralyzation: 20, rod: 20, petrification: 20, breath: 20, spell: 20 };
  }

  // Saves use class group (no warrior override) — Crusader saves as priest per PO:S&M
  const allSaves = classes.map((c) => {
    const cls = CLASSES[c.classId];
    if (!cls) return getSavingThrows("warrior", 1);
    return getSavingThrows(cls.group, c.level);
  });

  return {
    paralyzation: Math.min(...allSaves.map((s) => s.paralyzation)),
    rod: Math.min(...allSaves.map((s) => s.rod)),
    petrification: Math.min(...allSaves.map((s) => s.petrification)),
    breath: Math.min(...allSaves.map((s) => s.breath)),
    spell: Math.min(...allSaves.map((s) => s.spell)),
  };
}

// ─── HP DIVISOR ──────────────────────────────────────────────────────────────
// Multiclass: HP divided by number of classes

export function getMulticlassHpDivisor(classCount: number): number {
  return Math.max(1, classCount);
}

// ─── RULE COMPLIANCE ─────────────────────────────────────────────────────────
// Only for warnings — NEVER used to block selections

export function isRuleCompliantMulticlass(raceId: RaceId, classIds: ClassId[]): boolean {
  if (classIds.length <= 1) return true;

  const race = RACES[raceId];
  if (!race) return false;

  // Check if this exact combination exists in the race's multiclass options
  const sorted = [...classIds].sort();
  return race.multiclassOptions.some((option) => {
    const optionSorted = [...option].sort();
    return (
      optionSorted.length === sorted.length && optionSorted.every((cls, i) => cls === sorted[i])
    );
  });
}

// ─── EXCEPTIONAL STRENGTH ────────────────────────────────────────────────────
// At least one warrior class → eligible for exceptional strength

export function multiclassHasExceptionalStr(classIds: ClassId[]): boolean {
  return classIds.some((id) => CLASSES[id].exceptionalStrength);
}

// ─── CLASS GROUPS ────────────────────────────────────────────────────────────
// Get unique class groups for the multiclass combination

export function getMulticlassGroups(classIds: ClassId[]): ClassGroup[] {
  const groups = new Set(classIds.map((id) => CLASSES[id]?.group).filter(Boolean) as ClassGroup[]);
  return [...groups];
}

// ─── MULTICLASS ARMOR WARNINGS ──────────────────────────────────────────────
// PHB: Multiclass wizards cannot cast spells in armor (except elves in elven chain)
// PHB: Multiclass thieves lose most thief abilities in non-thief armor

export interface MulticlassArmorWarning {
  type: "wizard" | "thief";
}

/**
 * Check if a multiclass character has armor restrictions that should be warned about.
 * Returns warnings for wizard (no spellcasting in armor) and thief (limited skills in heavy armor).
 * Only relevant when character is multiclassed AND wears armor.
 */
export function getMulticlassArmorWarnings(
  classIds: ClassId[],
  wearsArmor: boolean,
  armorAC: number | null,
  isMagicalProtection?: boolean
): MulticlassArmorWarning[] {
  // Magical protection (e.g. Bracers of Defense) does not restrict spellcasting or thief skills
  if (classIds.length <= 1 || !wearsArmor || isMagicalProtection) return [];

  const warnings: MulticlassArmorWarning[] = [];
  const groups = new Set(classIds.map((id) => CLASSES[id].group));

  // Wizard in armor: cannot cast spells (PHB p.44)
  if (groups.has("wizard")) {
    warnings.push({ type: "wizard" });
  }

  // Thief/Bard in armor heavier than studded leather: loses most thief abilities (PHB p.44)
  // Thieves can wear leather (AC 8), studded leather (AC 7), padded (AC 8). AC < 7 = too heavy.
  if (groups.has("rogue") && armorAC !== null && armorAC < 7) {
    warnings.push({ type: "thief" });
  }

  return warnings;
}

// ─── DUAL-CLASS ──────────────────────────────────────────────────────────────
// PHB Ch3: A character abandons one class and begins advancing in another.
// The old class abilities are dormant until the new class level exceeds the old.

export interface DualclassRequirementResult {
  allowed: boolean;
  failures: string[];
}

/**
 * Check if a character meets dual-class requirements.
 * PHB: 17+ in ALL prime requisites of the OLD class, 15+ in ALL prime requisites of the NEW class.
 */
export function meetsDualclassRequirements(
  originalClassId: ClassId,
  newClassId: ClassId,
  abilities: Partial<Record<string, number>>
): DualclassRequirementResult {
  const failures: string[] = [];
  const origClass = CLASSES[originalClassId];
  const newClass = CLASSES[newClassId];

  if (!origClass || !newClass) return { allowed: false, failures: ["Ungültige Klasse."] };
  if (originalClassId === newClassId)
    return { allowed: false, failures: ["Kann nicht in die gleiche Klasse wechseln."] };

  // 17+ in all prime requisites of the OLD class
  for (const req of origClass.primeRequisites) {
    const score = abilities[req] ?? 0;
    if (score < 17) {
      failures.push(`${req.toUpperCase()} ${score} < 17 (alte Klasse ${origClass.name})`);
    }
  }

  // 15+ in all prime requisites of the NEW class
  for (const req of newClass.primeRequisites) {
    const score = abilities[req] ?? 0;
    if (score < 15) {
      failures.push(`${req.toUpperCase()} ${score} < 15 (neue Klasse ${newClass.name})`);
    }
  }

  return { allowed: failures.length === 0, failures };
}

/**
 * Check if the original class abilities are still dormant.
 * PHB: Dormant until new class level EXCEEDS old class level.
 */
export function isDualclassDormant(dualclass: DualclassInfo, newClassLevel: number): boolean {
  return newClassLevel <= dualclass.switchLevel;
}

/**
 * Get the best THAC0 for a dual-class character.
 * If dormant: only new class THAC0. If active: best of both.
 */
export function getDualclassThac0(dualclass: DualclassInfo, newClassLevel: number): number {
  const newCls = CLASSES[dualclass.newClass];
  const newThac0 = newCls ? getThac0(newCls.group, newClassLevel, dualclass.newClass) : 20;

  if (isDualclassDormant(dualclass, newClassLevel)) return newThac0;

  const origCls = CLASSES[dualclass.originalClass];
  const origThac0 = origCls
    ? getThac0(origCls.group, dualclass.switchLevel, dualclass.originalClass)
    : 20;

  return Math.min(newThac0, origThac0);
}

/**
 * Get the best saving throws for a dual-class character.
 * If dormant: only new class saves. If active: best of both.
 */
export function getDualclassSaves(dualclass: DualclassInfo, newClassLevel: number): SavingThrows {
  const newCls = CLASSES[dualclass.newClass];
  const newSaves = newCls
    ? getSavingThrows(newCls.group, newClassLevel)
    : getSavingThrows("warrior", 1);

  if (isDualclassDormant(dualclass, newClassLevel)) return newSaves;

  const origCls = CLASSES[dualclass.originalClass];
  const origSaves = origCls
    ? getSavingThrows(origCls.group, dualclass.switchLevel)
    : getSavingThrows("warrior", 1);

  return {
    paralyzation: Math.min(newSaves.paralyzation, origSaves.paralyzation),
    rod: Math.min(newSaves.rod, origSaves.rod),
    petrification: Math.min(newSaves.petrification, origSaves.petrification),
    breath: Math.min(newSaves.breath, origSaves.breath),
    spell: Math.min(newSaves.spell, origSaves.spell),
  };
}
