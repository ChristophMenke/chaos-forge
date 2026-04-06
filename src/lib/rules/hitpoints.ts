import type { ClassGroup } from "./types";

/**
 * Calculate HP at level 1: hit die maximum + CON modifier (minimum 1)
 */
export function calculateHitPointsLevel1(
  classGroup: ClassGroup,
  hitDieMax: number,
  conHpAdj: number
): number {
  const cappedAdj = Math.min(conHpAdj, getConBonusCap(classGroup));
  return Math.max(1, hitDieMax + cappedAdj);
}

/**
 * CON HP bonus cap by class group.
 * Warriors can benefit from the full +3/+4 at CON 17/18.
 * All others are capped at +2.
 */
export function getConBonusCap(classGroup: ClassGroup): number {
  return classGroup === "warrior" ? 4 : 2;
}

export type HpStatus = "alive" | "unconscious" | "dead";

/**
 * Death threshold: character dies when HP reaches -maxHP.
 */
export function getDeathThreshold(maxHp: number): number {
  return -maxHp;
}

/**
 * Determine character status based on current and max HP.
 * - alive: HP > 0
 * - unconscious: HP <= 0 but above death threshold
 * - dead: HP <= -maxHP
 */
export function getHpStatus(currentHp: number, maxHp: number): HpStatus {
  if (currentHp > 0) return "alive";
  if (currentHp <= getDeathThreshold(maxHp)) return "dead";
  return "unconscious";
}
