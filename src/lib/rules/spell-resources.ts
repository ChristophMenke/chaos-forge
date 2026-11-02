/**
 * Spell slots or spell points a character has, and how many are used —
 * shared by the play-mode spellbook panel and SvenBot's character context.
 */

import { getClassGroup } from "./classes";
import { getMulticlassGroups } from "./multiclass";
import {
  getBardSpellSlots,
  getPriestBonusSlots,
  getPriestSpellPoints,
  getPriestBonusSpellPoints,
  getPriestSpellSlots,
  getSpecialistBonusSlots,
  getWizardBonusSpellPoints,
  getWizardSpellPoints,
  getWizardSpellSlots,
} from "./spellslots";
import type { ClassGroup, ClassId } from "./types";

export interface SpellResourceInput {
  character: {
    int: number;
    spell_system: string | null;
    spell_points_used: number | null;
    spell_slots_adj: Record<string, number> | null;
  };
  /** Active classes only. */
  classEntries: { classId: string; level: number }[];
  /** Effective WIS (items and effects included) — drives the priest bonus. */
  effectiveWis: number;
  epicBonusSpellPoints?: number;
  /** The character's spells; only prepared ones count as expended. */
  spells: { prepared: boolean; expended: boolean; spell: { level: number } }[];
}

export interface SpellResources {
  casterClass: { classId: string; level: number };
  classGroups: ClassGroup[];
  isWizard: boolean;
  isPriest: boolean;
  isBard: boolean;
  mode: "slots" | "points" | "none";
  maxSpellLevel: number;
  /** Slots per spell level (index 0 = level 1); empty in points mode. */
  totalSlots: number[];
  /** Expended prepared spells per spell level. */
  expendedByLevel: Record<number, number>;
  totalPoints: number;
  pointsRemaining: number;
}

export function computeSpellResources({
  character,
  classEntries,
  effectiveWis,
  epicBonusSpellPoints = 0,
  spells,
}: SpellResourceInput): SpellResources {
  const classGroups = getMulticlassGroups(classEntries.map((ce) => ce.classId as ClassId));
  const isBard = classEntries.some((ce) => ce.classId === "bard");
  const isWizard = classGroups.includes("wizard") || isBard;
  const isPriest = classGroups.includes("priest");

  const casterClass = classEntries.find((ce) => {
    if (ce.classId === "bard") return true;
    const group = getClassGroup(ce.classId as ClassId);
    return group === "wizard" || group === "priest";
  }) ??
    classEntries[0] ?? { classId: "fighter", level: 1 };
  const casterLevel = casterClass.level;

  const isPointsMode = character.spell_system === "points";
  const maxSpellLevel = isBard ? 6 : isWizard ? 9 : 7;

  let totalPoints = 0;
  if (isPointsMode) {
    if (isWizard) {
      totalPoints =
        getWizardSpellPoints(casterLevel) +
        getWizardBonusSpellPoints(character.int) +
        epicBonusSpellPoints;
    } else if (isPriest) {
      totalPoints =
        getPriestSpellPoints(casterLevel) +
        getPriestBonusSpellPoints(effectiveWis) +
        epicBonusSpellPoints;
    }
  }

  let totalSlots: number[] = [];
  if (!isPointsMode) {
    const base = isBard
      ? getBardSpellSlots(casterLevel)
      : isWizard
        ? getWizardSpellSlots(casterLevel)
        : isPriest
          ? getPriestSpellSlots(casterLevel)
          : [];
    const priestBonus = isPriest ? getPriestBonusSlots(effectiveWis) : [];
    const specialistBonus = isWizard
      ? getSpecialistBonusSlots(casterClass.classId as ClassId, casterLevel)
      : [];
    const adj = character.spell_slots_adj ?? {};
    totalSlots = base.map(
      (slots, i) =>
        slots + (priestBonus[i] ?? 0) + (specialistBonus[i] ?? 0) + (adj[String(i + 1)] ?? 0)
    );
  }

  const expendedByLevel: Record<number, number> = {};
  for (const s of spells) {
    if (s.prepared && s.expended) {
      expendedByLevel[s.spell.level] = (expendedByLevel[s.spell.level] ?? 0) + 1;
    }
  }

  const hasMagic = isWizard || isPriest;
  return {
    casterClass,
    classGroups,
    isWizard,
    isPriest,
    isBard,
    mode: !hasMagic ? "none" : isPointsMode ? "points" : "slots",
    maxSpellLevel,
    totalSlots,
    expendedByLevel,
    totalPoints,
    pointsRemaining: totalPoints - (character.spell_points_used ?? 0),
  };
}
