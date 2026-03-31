// ─── TURN UNDEAD (PHB Table 61) ──────────────────────────────────────────────
// Clerics can turn or destroy undead; evil clerics can command them.
// Paladins turn as priests two levels lower.

export type UndeadType =
  | "skeleton"
  | "zombie"
  | "ghoul"
  | "shadow"
  | "wight"
  | "ghast"
  | "wraith"
  | "mummy"
  | "spectre"
  | "vampire"
  | "ghost"
  | "lich"
  | "special";

/** Result from looking up the turn table. number = d20 target, "T" = auto-turn, "D" = auto-destroy, "D*" = destroy + 2d4 extra, null = cannot turn */
export type TurnTableResult = number | "T" | "D" | "D*" | null;

// PHB Table 61: TURNING UNDEAD
// Columns: Cleric levels 1, 2, 3, 4, 5, 6, 7, 8, 9, 10-11, 12-13, 14+
// Each row = one undead type, values across 12 level brackets
const TURN_TABLE: Record<UndeadType, TurnTableResult[]> = {
  //                    L1    L2    L3    L4    L5    L6    L7    L8    L9   L10-11 L12-13  L14+
  skeleton: [10, 7, 4, "T", "T", "D", "D", "D*", "D*", "D*", "D*", "D*"],
  zombie: [13, 10, 7, 4, "T", "T", "D", "D", "D*", "D*", "D*", "D*"],
  ghoul: [16, 13, 10, 7, 4, "T", "T", "D", "D", "D*", "D*", "D*"],
  shadow: [19, 16, 13, 10, 7, 4, "T", "T", "D", "D", "D*", "D*"],
  wight: [20, 19, 16, 13, 10, 7, 4, "T", "T", "D", "D", "D*"],
  ghast: [null, 20, 19, 16, 13, 10, 7, 4, "T", "T", "D", "D"],
  wraith: [null, null, 20, 19, 16, 13, 10, 7, 4, "T", "T", "D"],
  mummy: [null, null, null, 20, 19, 16, 13, 10, 7, 4, "T", "T"],
  spectre: [null, null, null, null, 20, 19, 16, 13, 10, 7, 4, "T"],
  vampire: [null, null, null, null, null, 20, 19, 16, 13, 10, 7, 4],
  ghost: [null, null, null, null, null, null, 20, 19, 16, 13, 10, 7],
  lich: [null, null, null, null, null, null, null, 20, 19, 16, 13, 10],
  special: [null, null, null, null, null, null, null, null, 20, 19, 16, 13],
};

/** All undead types in order of ascending HD */
export const UNDEAD_TYPES: UndeadType[] = [
  "skeleton",
  "zombie",
  "ghoul",
  "shadow",
  "wight",
  "ghast",
  "wraith",
  "mummy",
  "spectre",
  "vampire",
  "ghost",
  "lich",
  "special",
];

/** German labels for undead types */
export const UNDEAD_LABELS: Record<UndeadType, { name: string; name_en: string; hd: string }> = {
  skeleton: { name: "Skelett", name_en: "Skeleton", hd: "1" },
  zombie: { name: "Zombie", name_en: "Zombie", hd: "2" },
  ghoul: { name: "Ghul", name_en: "Ghoul", hd: "2" },
  shadow: { name: "Schatten", name_en: "Shadow", hd: "3-4" },
  wight: { name: "Wight", name_en: "Wight", hd: "5" },
  ghast: { name: "Ghast", name_en: "Ghast", hd: "4" },
  wraith: { name: "Todesalb", name_en: "Wraith", hd: "6" },
  mummy: { name: "Mumie", name_en: "Mummy", hd: "7" },
  spectre: { name: "Gespenst", name_en: "Spectre", hd: "8" },
  vampire: { name: "Vampir", name_en: "Vampire", hd: "9" },
  ghost: { name: "Geist", name_en: "Ghost", hd: "10" },
  lich: { name: "Lich", name_en: "Lich", hd: "11+" },
  special: { name: "Spezial", name_en: "Special", hd: "—" },
};

/** Convert cleric level to table column index (0-11) */
function levelToColumnIndex(level: number): number {
  if (level <= 0) return -1; // can't turn
  if (level <= 9) return level - 1; // L1=0, L2=1, ... L9=8
  if (level <= 11) return 9; // L10-11
  if (level <= 13) return 10; // L12-13
  return 11; // L14+
}

/**
 * Look up the turn result for a given undead type and cleric level.
 * Returns the d20 target number, "T" (auto-turn), "D"/"D*" (auto-destroy), or null (cannot turn).
 */
export function getTurnTarget(undeadType: UndeadType, clericLevel: number): TurnTableResult {
  const col = levelToColumnIndex(clericLevel);
  if (col < 0) return null;
  const row = TURN_TABLE[undeadType];
  if (!row) return null;
  return row[Math.min(col, row.length - 1)];
}

export interface TurnAttemptResult {
  success: boolean;
  result: "turned" | "destroyed" | "commanded" | "failed";
  affectedHD: number; // 2d6 for normal, up to 12 for command
  targetNeeded: TurnTableResult;
  extraAffected: number; // 2d4 extra for D* results
}

/**
 * Resolve a turn/command undead attempt.
 * @param clericLevel - effective cleric level (paladin: actual level - 2)
 * @param undeadType - type of undead being turned
 * @param d20Roll - the d20 roll (ignored for T/D results)
 * @param affectedHDRoll - 2d6 roll for number of HD affected
 * @param isEvil - true for evil clerics (command instead of turn)
 * @param extraRoll - 2d4 roll for D* extra affected (optional)
 */
export function resolveTurnAttempt(
  clericLevel: number,
  undeadType: UndeadType,
  d20Roll: number,
  affectedHDRoll: number,
  isEvil: boolean,
  extraRoll: number = 0
): TurnAttemptResult {
  const target = getTurnTarget(undeadType, clericLevel);

  if (target === null) {
    return {
      success: false,
      result: "failed",
      affectedHD: 0,
      targetNeeded: null,
      extraAffected: 0,
    };
  }

  let success = false;
  let isDestroy = false;
  let extra = 0;

  if (target === "D*") {
    success = true;
    isDestroy = true;
    extra = extraRoll;
  } else if (target === "D") {
    success = true;
    isDestroy = true;
  } else if (target === "T") {
    success = true;
  } else {
    // number — need d20 >= target
    success = d20Roll >= target;
  }

  if (!success) {
    return {
      success: false,
      result: "failed",
      affectedHD: 0,
      targetNeeded: target,
      extraAffected: 0,
    };
  }

  if (isEvil) {
    // Evil clerics command instead of turn/destroy
    // "T" → obey, "D"/"D*" → completely subservient
    return {
      success: true,
      result: "commanded",
      affectedHD: Math.min(affectedHDRoll, 12), // max 12 for command
      targetNeeded: target,
      extraAffected: extra,
    };
  }

  return {
    success: true,
    result: isDestroy ? "destroyed" : "turned",
    affectedHD: affectedHDRoll,
    targetNeeded: target,
    extraAffected: extra,
  };
}

/**
 * PHB: Paladins turn undead as priests two levels lower.
 * Returns 0 if paladin level is too low to turn.
 */
export function getPaladinTurnLevel(paladinLevel: number): number {
  return Math.max(0, paladinLevel - 2);
}
