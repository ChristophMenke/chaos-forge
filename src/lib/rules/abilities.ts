import type {
  StrengthModifiers,
  DexterityModifiers,
  ConstitutionModifiers,
  IntelligenceModifiers,
  WisdomModifiers,
  CharismaModifiers,
} from "./types";

// ─── STRENGTH ──────────────────────────────────────────────────────────────────
// PHB Table 1: Strength
// Index 0 = STR 3, Index 15 = STR 18

const STR_TABLE: StrengthModifiers[] = [
  // STR 3
  { hitAdj: -3, dmgAdj: -1, weightAllow: 5, maxPress: 10, openDoors: 2, bendBars: 0 },
  // STR 4
  { hitAdj: -2, dmgAdj: -1, weightAllow: 10, maxPress: 25, openDoors: 3, bendBars: 0 },
  // STR 5
  { hitAdj: -2, dmgAdj: -1, weightAllow: 10, maxPress: 25, openDoors: 3, bendBars: 0 },
  // STR 6
  { hitAdj: -1, dmgAdj: 0, weightAllow: 20, maxPress: 55, openDoors: 4, bendBars: 0 },
  // STR 7
  { hitAdj: -1, dmgAdj: 0, weightAllow: 20, maxPress: 55, openDoors: 4, bendBars: 0 },
  // STR 8
  { hitAdj: 0, dmgAdj: 0, weightAllow: 35, maxPress: 90, openDoors: 5, bendBars: 1 },
  // STR 9
  { hitAdj: 0, dmgAdj: 0, weightAllow: 35, maxPress: 90, openDoors: 5, bendBars: 1 },
  // STR 10
  { hitAdj: 0, dmgAdj: 0, weightAllow: 40, maxPress: 115, openDoors: 6, bendBars: 2 },
  // STR 11
  { hitAdj: 0, dmgAdj: 0, weightAllow: 40, maxPress: 115, openDoors: 6, bendBars: 2 },
  // STR 12
  { hitAdj: 0, dmgAdj: 0, weightAllow: 45, maxPress: 140, openDoors: 7, bendBars: 4 },
  // STR 13
  { hitAdj: 0, dmgAdj: 0, weightAllow: 45, maxPress: 140, openDoors: 7, bendBars: 4 },
  // STR 14
  { hitAdj: 0, dmgAdj: 0, weightAllow: 55, maxPress: 170, openDoors: 8, bendBars: 7 },
  // STR 15
  { hitAdj: 0, dmgAdj: 0, weightAllow: 55, maxPress: 170, openDoors: 8, bendBars: 7 },
  // STR 16
  { hitAdj: 0, dmgAdj: 1, weightAllow: 70, maxPress: 195, openDoors: 9, bendBars: 10 },
  // STR 17
  { hitAdj: 1, dmgAdj: 1, weightAllow: 85, maxPress: 220, openDoors: 10, bendBars: 13 },
  // STR 18
  { hitAdj: 1, dmgAdj: 2, weightAllow: 110, maxPress: 255, openDoors: 11, bendBars: 16 },
  // STR 19 (for sub-stats / magical enhancement)
  { hitAdj: 3, dmgAdj: 7, weightAllow: 485, maxPress: 640, openDoors: 16, bendBars: 50 },
  // STR 20
  { hitAdj: 3, dmgAdj: 8, weightAllow: 535, maxPress: 700, openDoors: 17, bendBars: 60 },
  // STR 21
  { hitAdj: 4, dmgAdj: 9, weightAllow: 635, maxPress: 810, openDoors: 17, bendBars: 70 },
  // STR 22
  { hitAdj: 4, dmgAdj: 10, weightAllow: 785, maxPress: 970, openDoors: 18, bendBars: 80 },
  // STR 23
  { hitAdj: 5, dmgAdj: 11, weightAllow: 935, maxPress: 1130, openDoors: 18, bendBars: 90 },
  // STR 24
  { hitAdj: 6, dmgAdj: 12, weightAllow: 1235, maxPress: 1440, openDoors: 19, bendBars: 95 },
  // STR 25
  { hitAdj: 7, dmgAdj: 14, weightAllow: 1535, maxPress: 1750, openDoors: 19, bendBars: 99 },
];

// PHB Table 1 continued: Exceptional Strength (18/01 - 18/00)
// Ranges: 01-50, 51-75, 76-90, 91-99, 00(=100)
const EXCEPTIONAL_STR_TABLE: { max: number; mods: StrengthModifiers }[] = [
  {
    max: 50,
    mods: { hitAdj: 1, dmgAdj: 3, weightAllow: 135, maxPress: 280, openDoors: 12, bendBars: 20 },
  },
  {
    max: 75,
    mods: { hitAdj: 2, dmgAdj: 3, weightAllow: 160, maxPress: 305, openDoors: 13, bendBars: 25 },
  },
  {
    max: 90,
    mods: { hitAdj: 2, dmgAdj: 4, weightAllow: 185, maxPress: 330, openDoors: 14, bendBars: 30 },
  },
  {
    max: 99,
    mods: { hitAdj: 2, dmgAdj: 5, weightAllow: 235, maxPress: 380, openDoors: 15, bendBars: 35 },
  },
  {
    max: 100,
    mods: { hitAdj: 3, dmgAdj: 6, weightAllow: 335, maxPress: 480, openDoors: 16, bendBars: 40 },
  },
];

/** Look up base STR modifiers from the table (no sub-stat overrides). */
function lookupStrength(str: number, exceptional?: number): StrengthModifiers {
  if (str === 18 && exceptional !== undefined && exceptional >= 1) {
    const entry = EXCEPTIONAL_STR_TABLE.find((e) => exceptional <= e.max);
    if (entry) return { ...entry.mods };
  }
  return { ...STR_TABLE[str - 3] };
}

/**
 * Get Strength modifiers, optionally overriding with Player's Option sub-stats.
 * - `muscle`: overrides hitAdj, dmgAdj, openDoors, bendBars, maxPress
 * - `stamina`: overrides weightAllow
 */
export function getStrengthModifiers(
  str: number,
  exceptional?: number,
  muscle?: number | null,
  stamina?: number | null
): StrengthModifiers {
  const base = lookupStrength(str, exceptional);

  if (muscle != null && muscle !== str) {
    const muscleRow = lookupStrength(muscle);
    base.hitAdj = muscleRow.hitAdj;
    base.dmgAdj = muscleRow.dmgAdj;
    base.openDoors = muscleRow.openDoors;
    base.bendBars = muscleRow.bendBars;
    base.maxPress = muscleRow.maxPress;
  }

  if (stamina != null && stamina !== str) {
    const staminaRow = lookupStrength(stamina);
    base.weightAllow = staminaRow.weightAllow;
  }

  return base;
}

// ─── DEXTERITY ─────────────────────────────────────────────────────────────────
// PHB Table 2: Dexterity

const DEX_TABLE: DexterityModifiers[] = [
  // DEX 3
  {
    reactionAdj: -3,
    missileAdj: -3,
    defensiveAdj: 4,
    pickPockets: -15,
    openLocks: -10,
    findTraps: -10,
    moveSilently: -20,
    hideInShadows: -10,
    climbWalls: -15,
  },
  // DEX 4
  {
    reactionAdj: -2,
    missileAdj: -2,
    defensiveAdj: 3,
    pickPockets: -10,
    openLocks: -5,
    findTraps: -10,
    moveSilently: -15,
    hideInShadows: -5,
    climbWalls: -12,
  },
  // DEX 5
  {
    reactionAdj: -1,
    missileAdj: -1,
    defensiveAdj: 2,
    pickPockets: -5,
    openLocks: 0,
    findTraps: -5,
    moveSilently: -10,
    hideInShadows: 0,
    climbWalls: -10,
  },
  // DEX 6
  {
    reactionAdj: 0,
    missileAdj: 0,
    defensiveAdj: 1,
    pickPockets: 0,
    openLocks: 0,
    findTraps: 0,
    moveSilently: -5,
    hideInShadows: 0,
    climbWalls: -8,
  },
  // DEX 7
  {
    reactionAdj: 0,
    missileAdj: 0,
    defensiveAdj: 0,
    pickPockets: 0,
    openLocks: 0,
    findTraps: 0,
    moveSilently: 0,
    hideInShadows: 0,
    climbWalls: -5,
  },
  // DEX 8
  {
    reactionAdj: 0,
    missileAdj: 0,
    defensiveAdj: 0,
    pickPockets: 0,
    openLocks: 0,
    findTraps: 0,
    moveSilently: 0,
    hideInShadows: 0,
    climbWalls: -2,
  },
  // DEX 9
  {
    reactionAdj: 0,
    missileAdj: 0,
    defensiveAdj: 0,
    pickPockets: 0,
    openLocks: 0,
    findTraps: 0,
    moveSilently: 0,
    hideInShadows: 0,
    climbWalls: 0,
  },
  // DEX 10
  {
    reactionAdj: 0,
    missileAdj: 0,
    defensiveAdj: 0,
    pickPockets: 0,
    openLocks: 0,
    findTraps: 0,
    moveSilently: 0,
    hideInShadows: 0,
    climbWalls: 0,
  },
  // DEX 11
  {
    reactionAdj: 0,
    missileAdj: 0,
    defensiveAdj: 0,
    pickPockets: 0,
    openLocks: 0,
    findTraps: 0,
    moveSilently: 0,
    hideInShadows: 0,
    climbWalls: 0,
  },
  // DEX 12
  {
    reactionAdj: 0,
    missileAdj: 0,
    defensiveAdj: 0,
    pickPockets: 0,
    openLocks: 0,
    findTraps: 0,
    moveSilently: 0,
    hideInShadows: 0,
    climbWalls: 0,
  },
  // DEX 13
  {
    reactionAdj: 0,
    missileAdj: 0,
    defensiveAdj: 0,
    pickPockets: 0,
    openLocks: 0,
    findTraps: 0,
    moveSilently: 0,
    hideInShadows: 0,
    climbWalls: 0,
  },
  // DEX 14
  {
    reactionAdj: 0,
    missileAdj: 0,
    defensiveAdj: 0,
    pickPockets: 0,
    openLocks: 0,
    findTraps: 0,
    moveSilently: 0,
    hideInShadows: 0,
    climbWalls: 0,
  },
  // DEX 15
  {
    reactionAdj: 0,
    missileAdj: 0,
    defensiveAdj: -1,
    pickPockets: 0,
    openLocks: 0,
    findTraps: 0,
    moveSilently: 0,
    hideInShadows: 0,
    climbWalls: 0,
  },
  // DEX 16
  {
    reactionAdj: 1,
    missileAdj: 1,
    defensiveAdj: -2,
    pickPockets: 0,
    openLocks: 5,
    findTraps: 0,
    moveSilently: 0,
    hideInShadows: 0,
    climbWalls: 0,
  },
  // DEX 17
  {
    reactionAdj: 2,
    missileAdj: 2,
    defensiveAdj: -3,
    pickPockets: 5,
    openLocks: 10,
    findTraps: 0,
    moveSilently: 5,
    hideInShadows: 5,
    climbWalls: 0,
  },
  // DEX 18
  {
    reactionAdj: 2,
    missileAdj: 2,
    defensiveAdj: -4,
    pickPockets: 10,
    openLocks: 15,
    findTraps: 5,
    moveSilently: 10,
    hideInShadows: 10,
    climbWalls: 0,
  },
  // DEX 19
  {
    reactionAdj: 3,
    missileAdj: 3,
    defensiveAdj: -4,
    pickPockets: 15,
    openLocks: 20,
    findTraps: 10,
    moveSilently: 15,
    hideInShadows: 15,
    climbWalls: 0,
  },
  // DEX 20
  {
    reactionAdj: 3,
    missileAdj: 3,
    defensiveAdj: -4,
    pickPockets: 20,
    openLocks: 25,
    findTraps: 15,
    moveSilently: 18,
    hideInShadows: 18,
    climbWalls: 0,
  },
  // DEX 21
  {
    reactionAdj: 4,
    missileAdj: 4,
    defensiveAdj: -5,
    pickPockets: 25,
    openLocks: 30,
    findTraps: 20,
    moveSilently: 20,
    hideInShadows: 20,
    climbWalls: 0,
  },
  // DEX 22
  {
    reactionAdj: 4,
    missileAdj: 4,
    defensiveAdj: -5,
    pickPockets: 30,
    openLocks: 35,
    findTraps: 25,
    moveSilently: 23,
    hideInShadows: 23,
    climbWalls: 0,
  },
  // DEX 23
  {
    reactionAdj: 4,
    missileAdj: 4,
    defensiveAdj: -5,
    pickPockets: 35,
    openLocks: 40,
    findTraps: 30,
    moveSilently: 25,
    hideInShadows: 25,
    climbWalls: 0,
  },
  // DEX 24
  {
    reactionAdj: 5,
    missileAdj: 5,
    defensiveAdj: -6,
    pickPockets: 40,
    openLocks: 45,
    findTraps: 35,
    moveSilently: 30,
    hideInShadows: 30,
    climbWalls: 5,
  },
  // DEX 25
  {
    reactionAdj: 5,
    missileAdj: 5,
    defensiveAdj: -6,
    pickPockets: 45,
    openLocks: 50,
    findTraps: 40,
    moveSilently: 35,
    hideInShadows: 35,
    climbWalls: 10,
  },
];

/**
 * Get Dexterity modifiers, optionally overriding with Player's Option sub-stats.
 * - `aim`: overrides missileAdj
 * - `balance`: overrides defensiveAdj, reactionAdj
 */
export function getDexterityModifiers(
  dex: number,
  aim?: number | null,
  balance?: number | null
): DexterityModifiers {
  const base = { ...DEX_TABLE[dex - 3] };

  if (aim != null && aim !== dex) {
    const aimRow = DEX_TABLE[aim - 3];
    base.missileAdj = aimRow.missileAdj;
  }

  if (balance != null && balance !== dex) {
    const balanceRow = DEX_TABLE[balance - 3];
    base.defensiveAdj = balanceRow.defensiveAdj;
    base.reactionAdj = balanceRow.reactionAdj;
  }

  return base;
}

// ─── CONSTITUTION ──────────────────────────────────────────────────────────────
// PHB Table 3: Constitution

const CON_TABLE: ConstitutionModifiers[] = [
  // CON 3
  { hpAdj: -2, systemShock: 35, resurrectionSurvival: 40, poisonSave: 0, regeneration: null },
  // CON 4
  { hpAdj: -1, systemShock: 40, resurrectionSurvival: 45, poisonSave: 0, regeneration: null },
  // CON 5
  { hpAdj: -1, systemShock: 45, resurrectionSurvival: 50, poisonSave: 0, regeneration: null },
  // CON 6
  { hpAdj: -1, systemShock: 50, resurrectionSurvival: 55, poisonSave: 0, regeneration: null },
  // CON 7
  { hpAdj: 0, systemShock: 55, resurrectionSurvival: 60, poisonSave: 0, regeneration: null },
  // CON 8
  { hpAdj: 0, systemShock: 60, resurrectionSurvival: 65, poisonSave: 0, regeneration: null },
  // CON 9
  { hpAdj: 0, systemShock: 65, resurrectionSurvival: 70, poisonSave: 0, regeneration: null },
  // CON 10
  { hpAdj: 0, systemShock: 70, resurrectionSurvival: 75, poisonSave: 0, regeneration: null },
  // CON 11
  { hpAdj: 0, systemShock: 75, resurrectionSurvival: 80, poisonSave: 0, regeneration: null },
  // CON 12
  { hpAdj: 0, systemShock: 80, resurrectionSurvival: 85, poisonSave: 0, regeneration: null },
  // CON 13
  { hpAdj: 0, systemShock: 85, resurrectionSurvival: 90, poisonSave: 0, regeneration: null },
  // CON 14
  { hpAdj: 0, systemShock: 88, resurrectionSurvival: 92, poisonSave: 0, regeneration: null },
  // CON 15
  { hpAdj: 1, systemShock: 90, resurrectionSurvival: 94, poisonSave: 0, regeneration: null },
  // CON 16
  { hpAdj: 2, systemShock: 95, resurrectionSurvival: 96, poisonSave: 0, regeneration: null },
  // CON 17
  { hpAdj: 3, systemShock: 97, resurrectionSurvival: 98, poisonSave: 0, regeneration: null },
  // CON 18
  { hpAdj: 4, systemShock: 99, resurrectionSurvival: 100, poisonSave: 0, regeneration: null },
  // CON 19
  { hpAdj: 5, systemShock: 99, resurrectionSurvival: 100, poisonSave: 1, regeneration: null },
  // CON 20
  { hpAdj: 5, systemShock: 99, resurrectionSurvival: 100, poisonSave: 1, regeneration: null },
  // CON 21
  { hpAdj: 6, systemShock: 99, resurrectionSurvival: 100, poisonSave: 2, regeneration: null },
  // CON 22
  { hpAdj: 6, systemShock: 99, resurrectionSurvival: 100, poisonSave: 2, regeneration: null },
  // CON 23
  { hpAdj: 6, systemShock: 99, resurrectionSurvival: 100, poisonSave: 3, regeneration: null },
  // CON 24
  { hpAdj: 7, systemShock: 99, resurrectionSurvival: 100, poisonSave: 3, regeneration: null },
  // CON 25
  { hpAdj: 7, systemShock: 99, resurrectionSurvival: 100, poisonSave: 4, regeneration: null },
];

/**
 * Get Constitution modifiers, optionally overriding with Player's Option sub-stats.
 * - `health`: overrides systemShock, poisonSave
 * - `fitness`: overrides hpAdj, resurrectionSurvival
 */
export function getConstitutionModifiers(
  con: number,
  health?: number | null,
  fitness?: number | null
): ConstitutionModifiers {
  const base = { ...CON_TABLE[con - 3] };

  if (health != null && health !== con) {
    const healthRow = CON_TABLE[health - 3];
    base.systemShock = healthRow.systemShock;
    base.poisonSave = healthRow.poisonSave;
  }

  if (fitness != null && fitness !== con) {
    const fitnessRow = CON_TABLE[fitness - 3];
    base.hpAdj = fitnessRow.hpAdj;
    base.resurrectionSurvival = fitnessRow.resurrectionSurvival;
  }

  return base;
}

// ─── INTELLIGENCE ──────────────────────────────────────────────────────────────
// PHB Table 4: Intelligence

const INT_TABLE: IntelligenceModifiers[] = [
  // INT 3
  {
    numberOfLanguages: 1,
    spellLevel: null,
    chanceToLearn: 0,
    maxSpellsPerLevel: 0,
    spellImmunity: null,
    bonusProficiencies: 0,
  },
  // INT 4
  {
    numberOfLanguages: 1,
    spellLevel: null,
    chanceToLearn: 0,
    maxSpellsPerLevel: 0,
    spellImmunity: null,
    bonusProficiencies: 0,
  },
  // INT 5
  {
    numberOfLanguages: 1,
    spellLevel: null,
    chanceToLearn: 0,
    maxSpellsPerLevel: 0,
    spellImmunity: null,
    bonusProficiencies: 0,
  },
  // INT 6
  {
    numberOfLanguages: 1,
    spellLevel: null,
    chanceToLearn: 0,
    maxSpellsPerLevel: 0,
    spellImmunity: null,
    bonusProficiencies: 0,
  },
  // INT 7
  {
    numberOfLanguages: 1,
    spellLevel: null,
    chanceToLearn: 0,
    maxSpellsPerLevel: 0,
    spellImmunity: null,
    bonusProficiencies: 0,
  },
  // INT 8
  {
    numberOfLanguages: 1,
    spellLevel: null,
    chanceToLearn: 0,
    maxSpellsPerLevel: 0,
    spellImmunity: null,
    bonusProficiencies: 0,
  },
  // INT 9
  {
    numberOfLanguages: 2,
    spellLevel: 4,
    chanceToLearn: 35,
    maxSpellsPerLevel: 6,
    spellImmunity: null,
    bonusProficiencies: 0,
  },
  // INT 10
  {
    numberOfLanguages: 2,
    spellLevel: 5,
    chanceToLearn: 40,
    maxSpellsPerLevel: 7,
    spellImmunity: null,
    bonusProficiencies: 0,
  },
  // INT 11
  {
    numberOfLanguages: 2,
    spellLevel: 5,
    chanceToLearn: 45,
    maxSpellsPerLevel: 7,
    spellImmunity: null,
    bonusProficiencies: 0,
  },
  // INT 12
  {
    numberOfLanguages: 3,
    spellLevel: 6,
    chanceToLearn: 50,
    maxSpellsPerLevel: 7,
    spellImmunity: null,
    bonusProficiencies: 0,
  },
  // INT 13
  {
    numberOfLanguages: 3,
    spellLevel: 6,
    chanceToLearn: 55,
    maxSpellsPerLevel: 9,
    spellImmunity: null,
    bonusProficiencies: 0,
  },
  // INT 14
  {
    numberOfLanguages: 4,
    spellLevel: 7,
    chanceToLearn: 60,
    maxSpellsPerLevel: 9,
    spellImmunity: null,
    bonusProficiencies: 0,
  },
  // INT 15
  {
    numberOfLanguages: 4,
    spellLevel: 7,
    chanceToLearn: 65,
    maxSpellsPerLevel: 11,
    spellImmunity: null,
    bonusProficiencies: 0,
  },
  // INT 16
  {
    numberOfLanguages: 5,
    spellLevel: 8,
    chanceToLearn: 70,
    maxSpellsPerLevel: 11,
    spellImmunity: null,
    bonusProficiencies: 0,
  },
  // INT 17
  {
    numberOfLanguages: 6,
    spellLevel: 8,
    chanceToLearn: 75,
    maxSpellsPerLevel: 14,
    spellImmunity: null,
    bonusProficiencies: 0,
  },
  // INT 18
  {
    numberOfLanguages: 7,
    spellLevel: 9,
    chanceToLearn: 85,
    maxSpellsPerLevel: 18,
    spellImmunity: null,
    bonusProficiencies: 0,
  },
  // INT 19
  {
    numberOfLanguages: 8,
    spellLevel: 9,
    chanceToLearn: 95,
    maxSpellsPerLevel: "All",
    spellImmunity: 1,
    bonusProficiencies: 1,
  },
  // INT 20
  {
    numberOfLanguages: 9,
    spellLevel: 9,
    chanceToLearn: 96,
    maxSpellsPerLevel: "All",
    spellImmunity: 2,
    bonusProficiencies: 1,
  },
  // INT 21
  {
    numberOfLanguages: 10,
    spellLevel: 9,
    chanceToLearn: 97,
    maxSpellsPerLevel: "All",
    spellImmunity: 3,
    bonusProficiencies: 2,
  },
  // INT 22
  {
    numberOfLanguages: 11,
    spellLevel: 9,
    chanceToLearn: 98,
    maxSpellsPerLevel: "All",
    spellImmunity: 4,
    bonusProficiencies: 2,
  },
  // INT 23
  {
    numberOfLanguages: 12,
    spellLevel: 9,
    chanceToLearn: 99,
    maxSpellsPerLevel: "All",
    spellImmunity: 5,
    bonusProficiencies: 3,
  },
  // INT 24
  {
    numberOfLanguages: 15,
    spellLevel: 9,
    chanceToLearn: 100,
    maxSpellsPerLevel: "All",
    spellImmunity: 6,
    bonusProficiencies: 3,
  },
  // INT 25
  {
    numberOfLanguages: 20,
    spellLevel: 9,
    chanceToLearn: 100,
    maxSpellsPerLevel: "All",
    spellImmunity: 7,
    bonusProficiencies: 4,
  },
];

/**
 * Get Intelligence modifiers, optionally overriding with Player's Option sub-stats.
 * - `knowledge`: overrides numberOfLanguages
 * - `reason`: overrides spellLevel, chanceToLearn, maxSpellsPerLevel
 */
export function getIntelligenceModifiers(
  int: number,
  knowledge?: number | null,
  reason?: number | null
): IntelligenceModifiers {
  const base = { ...INT_TABLE[int - 3] };

  if (knowledge != null && knowledge !== int) {
    const knowledgeRow = INT_TABLE[knowledge - 3];
    base.numberOfLanguages = knowledgeRow.numberOfLanguages;
  }

  if (reason != null && reason !== int) {
    const reasonRow = INT_TABLE[reason - 3];
    base.spellLevel = reasonRow.spellLevel;
    base.chanceToLearn = reasonRow.chanceToLearn;
    base.maxSpellsPerLevel = reasonRow.maxSpellsPerLevel;
  }

  return base;
}

// ─── WISDOM ────────────────────────────────────────────────────────────────────
// PHB Table 5: Wisdom

const WIS_TABLE: WisdomModifiers[] = [
  // WIS 3
  { magicalDefenseAdj: -3, bonusSpells: [], spellFailure: 30, spellImmunity: null },
  // WIS 4
  { magicalDefenseAdj: -2, bonusSpells: [], spellFailure: 25, spellImmunity: null },
  // WIS 5
  { magicalDefenseAdj: -1, bonusSpells: [], spellFailure: 20, spellImmunity: null },
  // WIS 6
  { magicalDefenseAdj: -1, bonusSpells: [], spellFailure: 15, spellImmunity: null },
  // WIS 7
  { magicalDefenseAdj: -1, bonusSpells: [], spellFailure: 15, spellImmunity: null },
  // WIS 8
  { magicalDefenseAdj: 0, bonusSpells: [], spellFailure: 10, spellImmunity: null },
  // WIS 9
  { magicalDefenseAdj: 0, bonusSpells: [], spellFailure: 5, spellImmunity: null },
  // WIS 10
  { magicalDefenseAdj: 0, bonusSpells: [], spellFailure: 0, spellImmunity: null },
  // WIS 11
  { magicalDefenseAdj: 0, bonusSpells: [], spellFailure: 0, spellImmunity: null },
  // WIS 12
  { magicalDefenseAdj: 0, bonusSpells: [], spellFailure: 0, spellImmunity: null },
  // WIS 13
  { magicalDefenseAdj: 0, bonusSpells: [1], spellFailure: 0, spellImmunity: null },
  // WIS 14
  { magicalDefenseAdj: 0, bonusSpells: [1], spellFailure: 0, spellImmunity: null },
  // WIS 15
  { magicalDefenseAdj: 1, bonusSpells: [2], spellFailure: 0, spellImmunity: null },
  // WIS 16
  { magicalDefenseAdj: 2, bonusSpells: [2, 2], spellFailure: 0, spellImmunity: null },
  // WIS 17
  { magicalDefenseAdj: 3, bonusSpells: [2, 2, 1], spellFailure: 0, spellImmunity: null },
  // WIS 18
  { magicalDefenseAdj: 4, bonusSpells: [2, 2, 1, 1], spellFailure: 0, spellImmunity: null },
  // WIS 19
  {
    magicalDefenseAdj: 4,
    bonusSpells: [3, 2, 1, 1],
    spellFailure: 0,
    spellImmunity: "Cause Fear, Charm Person, Command, Friends, Hypnotism",
  },
  // WIS 20
  {
    magicalDefenseAdj: 4,
    bonusSpells: [3, 2, 2, 1],
    spellFailure: 0,
    spellImmunity:
      "Cause Fear, Charm Person, Command, Friends, Hypnotism, Forget, Hold Person, Ray of Enfeeblement, Scare",
  },
  // WIS 21
  {
    magicalDefenseAdj: 4,
    bonusSpells: [3, 3, 2, 1, 1],
    spellFailure: 0,
    spellImmunity:
      "Cause Fear, Charm Person, Command, Friends, Hypnotism, Forget, Hold Person, Ray of Enfeeblement, Scare, Fear",
  },
  // WIS 22
  {
    magicalDefenseAdj: 4,
    bonusSpells: [3, 3, 2, 2, 1],
    spellFailure: 0,
    spellImmunity:
      "Cause Fear, Charm Person, Command, Friends, Hypnotism, Forget, Hold Person, Ray of Enfeeblement, Scare, Fear, Charm Monster, Confusion, Emotion, Fumble, Suggestion",
  },
  // WIS 23
  {
    magicalDefenseAdj: 4,
    bonusSpells: [3, 3, 2, 2, 2],
    spellFailure: 0,
    spellImmunity:
      "Cause Fear, Charm Person, Command, Friends, Hypnotism, Forget, Hold Person, Ray of Enfeeblement, Scare, Fear, Charm Monster, Confusion, Emotion, Fumble, Suggestion, Chaos, Feeblemind, Hold Monster, Magic Jar, Quest",
  },
  // WIS 24
  {
    magicalDefenseAdj: 4,
    bonusSpells: [3, 3, 2, 2, 2, 1],
    spellFailure: 0,
    spellImmunity:
      "Cause Fear, Charm Person, Command, Friends, Hypnotism, Forget, Hold Person, Ray of Enfeeblement, Scare, Fear, Charm Monster, Confusion, Emotion, Fumble, Suggestion, Chaos, Feeblemind, Hold Monster, Magic Jar, Quest, Geas, Mass Suggestion, Rod of Rulership",
  },
  // WIS 25
  {
    magicalDefenseAdj: 4,
    bonusSpells: [3, 3, 2, 2, 2, 1, 1],
    spellFailure: 0,
    spellImmunity:
      "Cause Fear, Charm Person, Command, Friends, Hypnotism, Forget, Hold Person, Ray of Enfeeblement, Scare, Fear, Charm Monster, Confusion, Emotion, Fumble, Suggestion, Chaos, Feeblemind, Hold Monster, Magic Jar, Quest, Geas, Mass Suggestion, Rod of Rulership, Antipathy/Sympathy, Death Spell, Mass Charm",
  },
];

/**
 * Get Wisdom modifiers, optionally overriding with Player's Option sub-stats.
 * - `intuition`: overrides magicalDefenseAdj
 * - `willpower`: overrides bonusSpells, spellFailure
 */
export function getWisdomModifiers(
  wis: number,
  intuition?: number | null,
  willpower?: number | null
): WisdomModifiers {
  const entry = WIS_TABLE[wis - 3];
  const base = { ...entry, bonusSpells: [...entry.bonusSpells] };

  if (intuition != null && intuition !== wis) {
    const intuitionRow = WIS_TABLE[intuition - 3];
    base.magicalDefenseAdj = intuitionRow.magicalDefenseAdj;
  }

  if (willpower != null && willpower !== wis) {
    const willpowerRow = WIS_TABLE[willpower - 3];
    base.bonusSpells = [...willpowerRow.bonusSpells];
    base.spellFailure = willpowerRow.spellFailure;
  }

  return base;
}

// ─── CHARISMA ──────────────────────────────────────────────────────────────────
// PHB Table 6: Charisma

const CHA_TABLE: CharismaModifiers[] = [
  // CHA 3
  { maxHenchmen: 1, loyaltyBase: -5, reactionAdj: -5 },
  // CHA 4
  { maxHenchmen: 1, loyaltyBase: -4, reactionAdj: -4 },
  // CHA 5
  { maxHenchmen: 2, loyaltyBase: -3, reactionAdj: -3 },
  // CHA 6
  { maxHenchmen: 2, loyaltyBase: -2, reactionAdj: -2 },
  // CHA 7
  { maxHenchmen: 3, loyaltyBase: -1, reactionAdj: -1 },
  // CHA 8
  { maxHenchmen: 3, loyaltyBase: 0, reactionAdj: 0 },
  // CHA 9
  { maxHenchmen: 4, loyaltyBase: 0, reactionAdj: 0 },
  // CHA 10
  { maxHenchmen: 4, loyaltyBase: 0, reactionAdj: 0 },
  // CHA 11
  { maxHenchmen: 4, loyaltyBase: 0, reactionAdj: 0 },
  // CHA 12
  { maxHenchmen: 5, loyaltyBase: 0, reactionAdj: 0 },
  // CHA 13
  { maxHenchmen: 5, loyaltyBase: 0, reactionAdj: 1 },
  // CHA 14
  { maxHenchmen: 6, loyaltyBase: 1, reactionAdj: 2 },
  // CHA 15
  { maxHenchmen: 7, loyaltyBase: 3, reactionAdj: 3 },
  // CHA 16
  { maxHenchmen: 8, loyaltyBase: 4, reactionAdj: 5 },
  // CHA 17
  { maxHenchmen: 10, loyaltyBase: 6, reactionAdj: 6 },
  // CHA 18
  { maxHenchmen: 15, loyaltyBase: 8, reactionAdj: 7 },
  // CHA 19
  { maxHenchmen: 20, loyaltyBase: 10, reactionAdj: 8 },
  // CHA 20
  { maxHenchmen: 25, loyaltyBase: 12, reactionAdj: 9 },
  // CHA 21
  { maxHenchmen: 30, loyaltyBase: 14, reactionAdj: 10 },
  // CHA 22
  { maxHenchmen: 35, loyaltyBase: 16, reactionAdj: 11 },
  // CHA 23
  { maxHenchmen: 40, loyaltyBase: 18, reactionAdj: 12 },
  // CHA 24
  { maxHenchmen: 45, loyaltyBase: 20, reactionAdj: 13 },
  // CHA 25
  { maxHenchmen: 50, loyaltyBase: 20, reactionAdj: 14 },
];

/**
 * Get Charisma modifiers, optionally overriding with Player's Option sub-stats.
 * - `leadership`: overrides maxHenchmen, loyaltyBase
 * - `appearance`: overrides reactionAdj
 */
export function getCharismaModifiers(
  cha: number,
  leadership?: number | null,
  appearance?: number | null
): CharismaModifiers {
  const base = { ...CHA_TABLE[cha - 3] };

  if (leadership != null && leadership !== cha) {
    const leadershipRow = CHA_TABLE[leadership - 3];
    base.maxHenchmen = leadershipRow.maxHenchmen;
    base.loyaltyBase = leadershipRow.loyaltyBase;
  }

  if (appearance != null && appearance !== cha) {
    const appearanceRow = CHA_TABLE[appearance - 3];
    base.reactionAdj = appearanceRow.reactionAdj;
  }

  return base;
}

// ─── ABILITY SCORE GENERATION METHODS ────────────────────────────────────────

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function roll3d6(): number {
  return rollDie(6) + rollDie(6) + rollDie(6);
}

function roll4d6DropLowest(): number {
  const dice = [rollDie(6), rollDie(6), rollDie(6), rollDie(6)];
  dice.sort((a, b) => a - b);
  return dice[1] + dice[2] + dice[3];
}

/** Method I: 3d6 in order for STR, DEX, CON, INT, WIS, CHA */
export function rollAbilityScoresMethodI(): number[] {
  return [roll3d6(), roll3d6(), roll3d6(), roll3d6(), roll3d6(), roll3d6()];
}

/** Method II: 3d6 twice per ability, keep the higher */
export function rollAbilityScoresMethodII(): number[] {
  return Array.from({ length: 6 }, () => Math.max(roll3d6(), roll3d6()));
}

/** Method III: 3d6 six times, player arranges freely */
export function rollAbilityScoresMethodIII(): number[] {
  return [roll3d6(), roll3d6(), roll3d6(), roll3d6(), roll3d6(), roll3d6()];
}

/** Method IV: 3d6 twelve times, pick best 6 (returned sorted descending) */
export function rollAbilityScoresMethodIV(): number[] {
  const rolls = Array.from({ length: 12 }, () => roll3d6());
  rolls.sort((a, b) => b - a);
  return rolls.slice(0, 6);
}

/** Method V: 4d6 drop lowest, six times, player arranges freely */
export function rollAbilityScoresMethodV(): number[] {
  return Array.from({ length: 6 }, () => roll4d6DropLowest());
}
