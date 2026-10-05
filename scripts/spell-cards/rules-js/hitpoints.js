"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateHitPointsLevel1 = calculateHitPointsLevel1;
exports.computeEffectiveMaxHp = computeEffectiveMaxHp;
exports.getConBonusCap = getConBonusCap;
exports.clampHpCurrentToMax = clampHpCurrentToMax;
exports.getDeathThreshold = getDeathThreshold;
exports.getHpStatus = getHpStatus;
/**
 * Calculate HP at level 1: hit die maximum + CON modifier (minimum 1)
 */
function calculateHitPointsLevel1(classGroup, hitDieMax, conHpAdj) {
    const cappedAdj = Math.min(conHpAdj, getConBonusCap(classGroup));
    return Math.max(1, hitDieMax + cappedAdj);
}
/**
 * Apply the class-group CON-bonus cap to an ability modifier.
 * Warrior cap +4, others +2. Penalties (negative values) are not capped.
 */
function capConHpAdjForClass(conHpAdj, classGroup) {
    if (conHpAdj < 0)
        return conHpAdj;
    return Math.min(conHpAdj, getConBonusCap(classGroup));
}
/**
 * Compute the effective max HP when the character's effective CON differs
 * from the CON used when HP was originally rolled/stored. Delta approach:
 *
 *   effective_max_hp = stored_max_hp + (effCap − storedCap) × level
 *
 * Clamped to a minimum of 1. Penalties are applied per level. This is used
 * for epic items that replace CON (e.g. Sprocket's Kondensator): on unequip
 * the effective CON drops → effective max HP drops → current HP is clamped
 * by the caller to avoid "undead" states.
 */
function computeEffectiveMaxHp(storedMaxHp, storedConHpAdj, effectiveConHpAdj, characterLevel, classGroup) {
    const storedCapped = capConHpAdjForClass(storedConHpAdj, classGroup);
    const effCapped = capConHpAdjForClass(effectiveConHpAdj, classGroup);
    const delta = (effCapped - storedCapped) * Math.max(1, characterLevel);
    return Math.max(1, storedMaxHp + delta);
}
/**
 * CON HP bonus cap by class group.
 * Warriors can benefit from the full +3/+4 at CON 17/18.
 * All others are capped at +2.
 */
function getConBonusCap(classGroup) {
    return classGroup === "warrior" ? 4 : 2;
}
/**
 * Clamp current HP to the new effective max after a max HP change (e.g. CON-Override).
 *
 * Rules applied in order:
 *  1. If storedCurrent > effectiveMax → lower current to effectiveMax.
 *  2. If storedCurrent < −effectiveMax (below death threshold) → raise to −effectiveMax.
 *  3. Otherwise return storedCurrent unchanged (unconscious state is preserved as-is).
 *
 * Intentionally one-directional on the upper bound: current is never raised toward
 * effectiveMax (no free healing when max increases). The only upward correction is
 * the death-threshold floor (#2), which prevents a logically impossible "more-dead-
 * than-the-new-max-allows" state.
 */
function clampHpCurrentToMax(storedCurrent, effectiveMax) {
    const floor = getDeathThreshold(effectiveMax);
    return Math.max(floor, Math.min(storedCurrent, effectiveMax));
}
/**
 * Death threshold: character dies when HP reaches -maxHP.
 */
function getDeathThreshold(maxHp) {
    return -maxHp;
}
/**
 * Determine character status based on current and max HP.
 * - alive: HP > 0
 * - unconscious: HP <= 0 but above death threshold
 * - dead: HP <= -maxHP
 */
function getHpStatus(currentHp, maxHp) {
    if (currentHp > 0)
        return "alive";
    if (currentHp <= getDeathThreshold(maxHp))
        return "dead";
    return "unconscious";
}
