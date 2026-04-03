export type EncumbranceLevel = "unencumbered" | "light" | "moderate" | "heavy" | "severe";

import type { ClassGroup } from "./types";

export interface ACCalculationInput {
  /** Equipped armor's AC value (null = no armor, base 10) */
  equippedArmorAC?: number | null;
  /** Whether a shield is equipped */
  shieldEquipped?: boolean;
  /** DEX (or Balance sub-stat) defensive adjustment */
  dexDefenseAdj: number;
  /** Additive magic item AC modifier (house rule: Bracers +4 → -4) */
  magicACModifier?: number;
  /** Class groups for unarmored defense bonus check */
  classGroups?: ClassGroup[];
  /** Current encumbrance level */
  encumbrance?: EncumbranceLevel;
  /** If true, encumbrance is ignored for unarmored bonus (per-character setting) */
  ignoreEncumbrance?: boolean;
  /** If true, equipped "armor" is magical protection (Bracers, Ring) — still counts as unarmored for PO bonus */
  isMagicalProtection?: boolean;
  /** Epic AC bonus (positive value = AC improvement, e.g. 2 from Totem Tattoo) */
  epicAcBonus?: number;
  /** Single-Weapon Style AC bonus (1 or 2, from fighting style slots) */
  singleWeaponStyleBonus?: number;
}

/**
 * Calculate AC in AD&D 2e.
 *
 * - Armor REPLACES base AC 10 (not subtractive). Shield gives -1. DEX adjustment applied.
 * - Player's Option: Unarmored warriors/rogues get -2 AC when unencumbered.
 * - House Rule: Magic items (Bracers, Cloak, Ring of Protection) stack additively.
 */
export function calculateAC(input: ACCalculationInput): number {
  const {
    equippedArmorAC = null,
    shieldEquipped = false,
    dexDefenseAdj,
    magicACModifier = 0,
    classGroups = [],
    encumbrance = "unencumbered",
    ignoreEncumbrance = false,
    isMagicalProtection = false,
    epicAcBonus = 0,
    singleWeaponStyleBonus = 0,
  } = input;

  // Magical protection (Bracers +4, Ring +1) is a BONUS subtracted from base 10,
  // not an absolute AC replacement. Also still counts as "unarmored" for PO bonus.
  const isUnarmored = equippedArmorAC == null || isMagicalProtection;
  const baseAC = isMagicalProtection ? 10 - (equippedArmorAC ?? 0) : (equippedArmorAC ?? 10);
  const shieldBonus = shieldEquipped ? -1 : 0;

  // Player's Option: Skills & Powers — unarmored warrior/rogue bonus (-2)
  let unarmoredBonus = 0;
  if (isUnarmored) {
    const hasWarriorOrRogue = classGroups.some((g) => g === "warrior" || g === "rogue");
    const isEffectivelyUnencumbered = ignoreEncumbrance || encumbrance === "unencumbered";
    if (hasWarriorOrRogue && isEffectivelyUnencumbered) {
      unarmoredBonus = -2;
    }
  }

  // Single-Weapon Style bonus only applies when fighting without a shield
  const effectiveSWSBonus = shieldEquipped ? 0 : singleWeaponStyleBonus;

  return (
    baseAC +
    shieldBonus +
    dexDefenseAdj +
    magicACModifier +
    unarmoredBonus -
    epicAcBonus -
    effectiveSWSBonus
  );
}

/**
 * Detect whether an armor item is a shield (bilingual check).
 * Used to separate armor from shield in AC calculations.
 */
export function isShieldItem(name: string): boolean {
  const lower = name.toLowerCase();
  return lower === "schild" || lower === "shield" || lower.includes("shield");
}

/**
 * Calculate encumbrance level based on carried weight vs STR weight allowance.
 * PHB Table 47 thresholds (simplified).
 */
export function calculateEncumbrance(
  totalWeight: number,
  strWeightAllow: number
): EncumbranceLevel {
  if (strWeightAllow <= 0) return "severe";
  const ratio = totalWeight / strWeightAllow;

  if (ratio <= 0.33) return "unencumbered";
  if (ratio <= 0.5) return "light";
  if (ratio <= 0.66) return "moderate";
  if (ratio <= 1.0) return "heavy";
  return "severe";
}

/**
 * Calculate movement rate based on armor and encumbrance.
 */
export function getMovementRate(baseMovement: number, encumbrance: EncumbranceLevel): number {
  switch (encumbrance) {
    case "unencumbered":
      return baseMovement;
    case "light":
      return Math.floor(baseMovement * 0.75);
    case "moderate":
      return Math.floor(baseMovement * 0.5);
    case "heavy":
      return Math.floor(baseMovement * 0.33);
    case "severe":
      return 1;
  }
}

const ENCUMBRANCE_LABELS: Record<EncumbranceLevel, string> = {
  unencumbered: "Unbelastet",
  light: "Leicht belastet",
  moderate: "Mäßig belastet",
  heavy: "Schwer belastet",
  severe: "Überbelastet",
};

export function getEncumbranceLabel(level: EncumbranceLevel): string {
  return ENCUMBRANCE_LABELS[level];
}

// ─── STARTING GOLD (PHB Table 44) ───────────────────────────────────────────

import type { ClassId } from "./types";
import { getClassGroup } from "./classes";

export interface StartingGold {
  diceCount: number;
  diceSides: number;
  bonus: number;
  multiplier: number;
}

const STARTING_GOLD: Record<string, StartingGold> = {
  warrior: { diceCount: 5, diceSides: 4, bonus: 0, multiplier: 10 },
  wizard: { diceCount: 1, diceSides: 4, bonus: 1, multiplier: 10 },
  priest: { diceCount: 3, diceSides: 6, bonus: 0, multiplier: 10 },
  rogue: { diceCount: 2, diceSides: 6, bonus: 0, multiplier: 10 },
};

export function getStartingGold(classId: ClassId): StartingGold {
  const group = getClassGroup(classId);
  return STARTING_GOLD[group];
}

// ─── PAYMENT SYSTEM ────────────────────────────────────────────────────────
// AD&D 2e exchange rates: 1 PP = 5 GP, 1 GP = 2 EP = 10 SP = 100 CP

export interface CoinPurse {
  pp: number;
  gp: number;
  ep: number;
  sp: number;
  cp: number;
}

export interface PaymentResult {
  success: boolean;
  remaining: CoinPurse;
  shortfall: number; // in CP, 0 if success
}

const COIN_VALUES_IN_CP = { pp: 500, gp: 100, ep: 50, sp: 10, cp: 1 };

/**
 * Convert a coin purse to its total value in copper pieces.
 */
export function purseTotalInCP(purse: CoinPurse): number {
  return (
    purse.pp * COIN_VALUES_IN_CP.pp +
    purse.gp * COIN_VALUES_IN_CP.gp +
    purse.ep * COIN_VALUES_IN_CP.ep +
    purse.sp * COIN_VALUES_IN_CP.sp +
    purse.cp * COIN_VALUES_IN_CP.cp
  );
}

/**
 * Calculate payment: deduct costInCP from the purse, spending largest coins first.
 * Returns remaining coins and whether the payment succeeded.
 */
export function calculatePayment(purse: CoinPurse, costInCP: number): PaymentResult {
  const totalAvailable = purseTotalInCP(purse);
  if (costInCP <= 0) {
    return { success: true, remaining: { ...purse }, shortfall: 0 };
  }
  if (totalAvailable < costInCP) {
    return { success: false, remaining: { ...purse }, shortfall: costInCP - totalAvailable };
  }

  let remaining = costInCP;
  const result: CoinPurse = { ...purse };

  // Deduct from largest denomination first
  for (const coin of ["pp", "gp", "ep", "sp", "cp"] as const) {
    if (remaining <= 0) break;
    const coinValue = COIN_VALUES_IN_CP[coin];
    const coinsNeeded = Math.min(result[coin], Math.floor(remaining / coinValue));
    result[coin] -= coinsNeeded;
    remaining -= coinsNeeded * coinValue;
  }

  // If there's remaining cost (fractional coin), break a larger coin
  if (remaining > 0) {
    for (const coin of ["cp", "sp", "ep", "gp", "pp"] as const) {
      if (result[coin] > 0 && COIN_VALUES_IN_CP[coin] >= remaining) {
        result[coin] -= 1;
        let change = COIN_VALUES_IN_CP[coin] - remaining;
        remaining = 0;
        // Distribute change to smaller denominations
        for (const changeCoin of ["gp", "ep", "sp", "cp"] as const) {
          if (COIN_VALUES_IN_CP[changeCoin] >= COIN_VALUES_IN_CP[coin]) continue;
          const changeCoins = Math.floor(change / COIN_VALUES_IN_CP[changeCoin]);
          result[changeCoin] += changeCoins;
          change -= changeCoins * COIN_VALUES_IN_CP[changeCoin];
        }
        break;
      }
    }
  }

  return { success: true, remaining: result, shortfall: 0 };
}
