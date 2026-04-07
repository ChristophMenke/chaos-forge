/**
 * Role inference for combat entities.
 */

import type { ClassGroup } from "@/lib/rules/types";
import type { CombatRole, Zone, SimSpell } from "./types";

/**
 * Infer combat role from class groups, AC, and available spells.
 * Used for player characters.
 */
export function inferCharacterRole(
  classGroups: ClassGroup[],
  ac: number,
  knownSpells: SimSpell[]
): CombatRole {
  const hasHeal = knownSpells.some((s) => s.category === "heal");

  if (classGroups.includes("wizard")) return "artillery";
  if (classGroups.includes("priest")) return hasHeal ? "support" : "striker";
  if (classGroups.includes("warrior")) return ac <= 3 ? "tank" : "striker";
  if (classGroups.includes("rogue")) return "striker";

  return "striker";
}

/**
 * Infer combat role for a monster.
 */
export function inferMonsterRole(
  ac: number,
  hitDiceValue: number,
  hasRangedAttack: boolean,
  typicalSpells: string[]
): CombatRole {
  if (typicalSpells.length > 0) {
    const healSpells = ["cure light wounds", "cure serious wounds", "cure critical wounds", "heal"];
    if (typicalSpells.some((s) => healSpells.includes(s.toLowerCase()))) return "support";
    return "artillery";
  }
  if (hasRangedAttack) return "artillery";
  if (ac <= 2 && hitDiceValue >= 6) return "tank";
  return "striker";
}

/**
 * Determine zone from role.
 */
export function zoneFromRole(role: CombatRole): Zone {
  return role === "artillery" || role === "support" ? "ranged" : "melee";
}
