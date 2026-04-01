/** Core AD&D 2nd Edition type definitions */

export interface AbilityScores {
  str: number; // 3-18
  strExceptional?: number; // 1-100, only for warrior classes with STR 18
  dex: number; // 3-18
  con: number; // 3-18
  int: number; // 3-18
  wis: number; // 3-18
  cha: number; // 3-18
}

export type AbilityName = "str" | "dex" | "con" | "int" | "wis" | "cha";

/** STR modifiers */
export interface StrengthModifiers {
  hitAdj: number;
  dmgAdj: number;
  weightAllow: number; // in lbs
  maxPress: number; // in lbs
  openDoors: number; // on d20
  bendBars: number; // percentage
}

/** DEX modifiers */
export interface DexterityModifiers {
  reactionAdj: number;
  missileAdj: number;
  defensiveAdj: number;
  pickPockets: number; // % adjustment to thief skill
  openLocks: number;
  findTraps: number;
  moveSilently: number;
  hideInShadows: number;
  climbWalls: number;
}

/** CON modifiers */
export interface ConstitutionModifiers {
  hpAdj: number;
  systemShock: number; // percentage
  resurrectionSurvival: number; // percentage
  poisonSave: number;
  regeneration: number | null;
}

/** INT modifiers */
export interface IntelligenceModifiers {
  numberOfLanguages: number;
  spellLevel: number | null; // max spell level for mages, null if non-caster
  chanceToLearn: number; // percentage
  maxSpellsPerLevel: number | string; // number or "All"
  spellImmunity: number | null; // immune to illusions of this level and below
  bonusProficiencies: number; // additional NWP slots
}

/** WIS modifiers */
export interface WisdomModifiers {
  magicalDefenseAdj: number;
  bonusSpells: number[]; // bonus spell slots by spell level [1st, 2nd, ...]
  spellFailure: number; // percentage
  spellImmunity: string | null; // immune to specific spells at WIS 19+
}

/** CHA modifiers */
export interface CharismaModifiers {
  maxHenchmen: number;
  loyaltyBase: number;
  reactionAdj: number;
}

/** Class groups for THAC0 / saving throw progression */
export type ClassGroup = "warrior" | "priest" | "rogue" | "wizard";

/** Saving throw categories */
export interface SavingThrows {
  paralyzation: number; // Paralyzation, Poison, Death Magic
  rod: number; // Rod, Staff, Wand
  petrification: number; // Petrification, Polymorph
  breath: number; // Breath Weapon
  spell: number; // Spell
}

/** Race identifiers */
export type RaceId =
  | "human"
  | "elf"
  | "half_elf"
  | "dwarf"
  | "gnome"
  | "halfling"
  | "half_orc"
  | "kobold"
  | "tiefling";

/** Class identifiers */
export type ClassId =
  | "fighter"
  | "ranger"
  | "paladin"
  | "mage"
  | "abjurer"
  | "conjurer"
  | "diviner"
  | "enchanter"
  | "illusionist"
  | "invoker"
  | "necromancer"
  | "transmuter"
  | "cleric"
  | "crusader"
  | "druid"
  | "thief"
  | "bard";

/** Magic school identifiers */
export type MagicSchool =
  | "abjuration"
  | "alteration"
  | "conjuration"
  | "divination"
  | "enchantment"
  | "illusion"
  | "invocation"
  | "necromancy";

/** Priest sphere identifiers — PHB 16 + Complete Priest's Handbook + Tome of Magic */
export type PriestSphere =
  | "all"
  | "animal"
  | "astral"
  | "charm"
  | "combat"
  | "creation"
  | "divination"
  | "elemental"
  | "elemental air"
  | "elemental earth"
  | "elemental fire"
  | "elemental water"
  | "elemental magma"
  | "guardian"
  | "healing"
  | "necromantic"
  | "plant"
  | "protection"
  | "summoning"
  | "sun"
  | "weather"
  // Extended spheres (Complete Priest's Handbook, Tome of Magic, Player's Option)
  | "chaos"
  | "cosmos"
  | "law"
  | "learning"
  | "numbers"
  | "thought"
  | "time"
  | "travelers"
  | "war"
  | "wards"
  | "special";

/** Sphere access levels */
export type SphereAccess = "major" | "minor";

/** Combat ability rating for priesthoods */
export type CombatRating = "good" | "medium" | "poor";

/** Granted Power definition for Priests of Specific Mythoi */
export interface GrantedPower {
  id: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  level: number; // ab welcher Stufe verfügbar (1 = sofort)
  mechanical?: {
    type:
      | "turn_undead"
      | "command_undead"
      | "saving_throw_bonus"
      | "immunity"
      | "laying_on_hands"
      | "berserker_rage"
      | "soothing_word"
      | "charm"
      | "inspire_fear"
      | "detect"
      | "other";
    savingThrowBonus?: Partial<SavingThrows>;
    usesPerDay?: number;
  };
}

/** Ability description for class/race abilities */
export interface ClassAbility {
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  usesPerDay?: number;
}

/** Multiclass / Dualclass support */
export type MulticlassCombination = ClassId[];

export interface DualclassInfo {
  originalClass: ClassId;
  newClass: ClassId;
  switchLevel: number;
}
