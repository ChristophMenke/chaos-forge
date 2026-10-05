"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAC = calculateAC;
exports.isShieldItem = isShieldItem;
exports.getShieldType = getShieldType;
exports.getShieldProficiencyBonus = getShieldProficiencyBonus;
exports.calculateEncumbrance = calculateEncumbrance;
exports.getMovementRate = getMovementRate;
exports.getEncumbranceLabel = getEncumbranceLabel;
exports.getStartingGold = getStartingGold;
exports.purseTotalInCP = purseTotalInCP;
exports.calculatePayment = calculatePayment;
/**
 * Calculate AC in AD&D 2e.
 *
 * - Armor REPLACES base AC 10 (not subtractive). Shield gives -1. DEX adjustment applied.
 * - Player's Option: Unarmored warriors/rogues get -2 AC when unencumbered.
 * - House Rule: Magic items (Bracers, Cloak, Ring of Protection) stack additively.
 */
function calculateAC(input) {
    const { equippedArmorAC = null, shieldEquipped = false, dexDefenseAdj, magicACModifier = 0, classGroups = [], encumbrance = "unencumbered", ignoreEncumbrance = false, isMagicalProtection = false, epicAcBonus = 0, singleWeaponStyleBonus = 0, shieldProficiencyBonus = 0, } = input;
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
    // Shield proficiency bonus only applies when a shield is equipped
    const effectiveShieldProfBonus = shieldEquipped ? shieldProficiencyBonus : 0;
    return (baseAC +
        shieldBonus +
        dexDefenseAdj +
        magicACModifier +
        unarmoredBonus -
        epicAcBonus -
        effectiveSWSBonus -
        effectiveShieldProfBonus);
}
/**
 * Detect whether an armor item is a shield (bilingual check).
 * Used to separate armor from shield in AC calculations.
 */
function isShieldItem(name) {
    const lower = name.toLowerCase();
    return lower === "buckler" || lower.includes("shield") || lower.includes("schild");
}
const SHIELD_TYPE_BONUS = {
    buckler: 1,
    small: 2,
    medium: 3,
    large: 3,
};
/**
 * Derive the shield type from a shield name (supports DE, EN, and import formats).
 * Returns null if the name is not recognized as a shield.
 */
function getShieldType(name) {
    const lower = name.toLowerCase();
    if (lower === "buckler")
        return "buckler";
    if (lower.includes("medium") || lower.includes("mittler"))
        return "medium";
    if (lower.includes("large") || lower.includes("groß") || lower.includes("body"))
        return "large";
    if (lower.includes("small") || lower.includes("klein"))
        return "small";
    // Generic "Schild" / "Shield" without qualifier → small shield
    if (lower === "schild" || lower === "shield")
        return "small";
    return null;
}
/**
 * Get Shield Proficiency AC bonus for an equipped shield.
 * Uses DB shield_type when available, falls back to name-based type detection.
 * Returns 0 if not proficient or no shield equipped.
 */
function getShieldProficiencyBonus(shieldType, shieldName, weaponProficiencies) {
    const equippedType = shieldType ?? (shieldName ? getShieldType(shieldName) : null);
    if (!equippedType)
        return 0;
    const isProficient = weaponProficiencies.some((wp) => {
        const profType = getShieldType(wp.weapon_name);
        return profType === equippedType;
    });
    if (!isProficient)
        return 0;
    return SHIELD_TYPE_BONUS[equippedType];
}
/**
 * Calculate encumbrance level based on carried weight vs STR weight allowance.
 * PHB Table 47 thresholds (simplified).
 */
function calculateEncumbrance(totalWeight, strWeightAllow) {
    if (strWeightAllow <= 0)
        return "severe";
    const ratio = totalWeight / strWeightAllow;
    if (ratio <= 0.33)
        return "unencumbered";
    if (ratio <= 0.5)
        return "light";
    if (ratio <= 0.66)
        return "moderate";
    if (ratio <= 1.0)
        return "heavy";
    return "severe";
}
/**
 * Calculate movement rate based on armor and encumbrance.
 */
function getMovementRate(baseMovement, encumbrance) {
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
const ENCUMBRANCE_LABELS = {
    unencumbered: "Unbelastet",
    light: "Leicht belastet",
    moderate: "Mäßig belastet",
    heavy: "Schwer belastet",
    severe: "Überbelastet",
};
function getEncumbranceLabel(level) {
    return ENCUMBRANCE_LABELS[level];
}
const classes_1 = require("./classes");
const STARTING_GOLD = {
    warrior: { diceCount: 5, diceSides: 4, bonus: 0, multiplier: 10 },
    wizard: { diceCount: 1, diceSides: 4, bonus: 1, multiplier: 10 },
    priest: { diceCount: 3, diceSides: 6, bonus: 0, multiplier: 10 },
    rogue: { diceCount: 2, diceSides: 6, bonus: 0, multiplier: 10 },
};
function getStartingGold(classId) {
    const group = (0, classes_1.getClassGroup)(classId);
    return STARTING_GOLD[group];
}
const COIN_VALUES_IN_CP = { pp: 500, gp: 100, ep: 50, sp: 10, cp: 1 };
/**
 * Convert a coin purse to its total value in copper pieces.
 */
function purseTotalInCP(purse) {
    return (purse.pp * COIN_VALUES_IN_CP.pp +
        purse.gp * COIN_VALUES_IN_CP.gp +
        purse.ep * COIN_VALUES_IN_CP.ep +
        purse.sp * COIN_VALUES_IN_CP.sp +
        purse.cp * COIN_VALUES_IN_CP.cp);
}
/**
 * Calculate payment: deduct costInCP from the purse, spending largest coins first.
 * Returns remaining coins and whether the payment succeeded.
 */
function calculatePayment(purse, costInCP) {
    const totalAvailable = purseTotalInCP(purse);
    if (costInCP <= 0) {
        return { success: true, remaining: { ...purse }, shortfall: 0 };
    }
    if (totalAvailable < costInCP) {
        return { success: false, remaining: { ...purse }, shortfall: costInCP - totalAvailable };
    }
    let remaining = costInCP;
    const result = { ...purse };
    // Deduct from largest denomination first
    for (const coin of ["pp", "gp", "ep", "sp", "cp"]) {
        if (remaining <= 0)
            break;
        const coinValue = COIN_VALUES_IN_CP[coin];
        const coinsNeeded = Math.min(result[coin], Math.floor(remaining / coinValue));
        result[coin] -= coinsNeeded;
        remaining -= coinsNeeded * coinValue;
    }
    // If there's remaining cost (fractional coin), break a larger coin
    if (remaining > 0) {
        for (const coin of ["cp", "sp", "ep", "gp", "pp"]) {
            if (result[coin] > 0 && COIN_VALUES_IN_CP[coin] >= remaining) {
                result[coin] -= 1;
                let change = COIN_VALUES_IN_CP[coin] - remaining;
                remaining = 0;
                // Distribute change to smaller denominations
                for (const changeCoin of ["gp", "ep", "sp", "cp"]) {
                    if (COIN_VALUES_IN_CP[changeCoin] >= COIN_VALUES_IN_CP[coin])
                        continue;
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
