import type { ClassGroup } from "./types";

export interface FightingStyleBenefit {
  slots: number;
  description: string;
  description_en: string;
}

export interface FightingStyleDefinition {
  id: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  maxSlots: number;
  benefits: FightingStyleBenefit[];
  availableFor: ClassGroup[];
  canSpecialize: ClassGroup[];
}

export const FIGHTING_STYLES: Record<string, FightingStyleDefinition> = {
  single_weapon: {
    id: "single_weapon",
    name: "Einhandkampf",
    name_en: "Single-Weapon Style",
    description:
      "Kampf mit einer Einhandwaffe ohne Schild oder Zweitwaffe. Spezialisierung gewährt AC-Bonus.",
    description_en:
      "Fighting with a one-handed weapon and nothing in the off-hand. Specialization grants AC bonus.",
    maxSlots: 2,
    benefits: [
      {
        slots: 1,
        description: "+1 RK-Bonus mit Einhandwaffe (kein Schild)",
        description_en: "+1 AC bonus with one-handed weapon (no shield)",
      },
      {
        slots: 2,
        description: "+2 RK-Bonus mit Einhandwaffe (Maximum)",
        description_en: "+2 AC bonus with one-handed weapon (maximum)",
      },
    ],
    availableFor: ["warrior", "priest", "rogue", "wizard"],
    canSpecialize: ["warrior", "priest", "rogue"],
  },
  two_hander: {
    id: "two_hander",
    name: "Zweihandkampf",
    name_en: "Two-Hander Style",
    description: "Kampf mit einer Zweihandwaffe oder einer Einhandwaffe beidhändig geführt.",
    description_en: "Fighting with a two-handed weapon or a one-handed weapon used two-handed.",
    maxSlots: 1,
    benefits: [
      {
        slots: 1,
        description: "Speed Factor -3, +1 Schaden bei einhändigen Waffen zweihändig geführt",
        description_en: "Speed Factor -3, +1 damage with one-handed weapons used two-handed",
      },
    ],
    availableFor: ["warrior", "priest", "rogue", "wizard"],
    canSpecialize: ["warrior", "priest", "rogue"],
  },
  weapon_and_shield: {
    id: "weapon_and_shield",
    name: "Waffe & Schild",
    name_en: "Weapon and Shield Style",
    description:
      "Kampf mit Einhandwaffe und Schild. Spezialisierung ermöglicht einen Extra-Angriff mit dem Schild.",
    description_en:
      "Fighting with a one-handed weapon and shield. Specialization allows an extra attack with the shield.",
    maxSlots: 2,
    benefits: [
      {
        slots: 1,
        description: "Extra-Angriff pro Runde (nur Schildstoß/Parade)",
        description_en: "Extra attack per round (Shield-Punch/Parry only)",
      },
      {
        slots: 2,
        description: "Reduzierte Abzüge: 0 Waffe / -2 Schild",
        description_en: "Reduced penalties: 0 weapon / -2 shield",
      },
    ],
    availableFor: ["warrior", "priest"],
    canSpecialize: ["warrior", "priest"],
  },
  two_weapon: {
    id: "two_weapon",
    name: "Beidhändiger Kampf",
    name_en: "Two-Weapon Style",
    description:
      "Kampf mit einer Waffe in jeder Hand. Spezialisierung reduziert Angriffsabzüge und erlaubt gleich lange Waffen.",
    description_en:
      "Fighting with a weapon in each hand. Specialization reduces attack penalties and allows equal-length weapons.",
    maxSlots: 1,
    benefits: [
      {
        slots: 1,
        description: "Angriffsabzüge 0/-2 statt -2/-4, gleich lange Waffen erlaubt",
        description_en: "Attack penalties 0/-2 instead of -2/-4, equal-length weapons allowed",
      },
    ],
    availableFor: ["warrior", "rogue"],
    canSpecialize: ["warrior", "rogue"],
  },
};

/**
 * Get all fighting style definitions.
 */
export function getAllFightingStyles(): FightingStyleDefinition[] {
  return Object.values(FIGHTING_STYLES);
}

/**
 * Get fighting styles available for a class group (known from creation).
 */
export function getAvailableFightingStyles(classGroup: ClassGroup): FightingStyleDefinition[] {
  return Object.values(FIGHTING_STYLES).filter((s) => s.availableFor.includes(classGroup));
}

/**
 * Get fighting styles a class group can specialize in.
 */
export function getSpecializableFightingStyles(classGroup: ClassGroup): FightingStyleDefinition[] {
  return Object.values(FIGHTING_STYLES).filter((s) => s.canSpecialize.includes(classGroup));
}

/**
 * Check if a class group can learn another fighting style specialization.
 * Warriors can learn multiple, others max 1.
 */
export function canLearnMoreFightingStyles(
  classGroup: ClassGroup,
  currentStyleCount: number
): boolean {
  if (classGroup === "wizard") return false;
  if (classGroup === "warrior") return true;
  return currentStyleCount < 1;
}

/**
 * Get a fighting style by ID.
 */
export function getFightingStyle(id: string): FightingStyleDefinition | null {
  return FIGHTING_STYLES[id] ?? null;
}

/**
 * Get the AC bonus from Single-Weapon Style specialization.
 * 1 slot = +1 AC, 2 slots = +2 AC (maximum).
 * Returns 0 if the character has no Single-Weapon Style.
 */
export function getSingleWeaponStyleBonus(
  fightingStyles: { style_id: string; slots_invested: number }[]
): number {
  const sws = fightingStyles.find((fs) => fs.style_id === "single_weapon");
  if (!sws) return 0;
  return Math.min(sws.slots_invested, 2);
}
