/**
 * Monster stat block parsing helpers for the Combat Simulator.
 * Pure functions — no DB access.
 */

export interface ParsedHitDice {
  dice: number;
  sides: number;
  bonus: number;
}

export interface DamageDie {
  count: number;
  sides: number;
  bonus: number;
}

/**
 * Parse a Monstrous Manual hit dice expression.
 * Examples: "4", "4+1", "3-1", "1/2", "12+3"
 */
export function parseHitDice(hd: string): ParsedHitDice {
  const trimmed = hd.trim();

  // Fractional HD: "1/2" means 1d4 HP or fixed 2 HP
  if (/^\d+\/\d+$/.test(trimmed)) {
    const [num, den] = trimmed.split("/").map(Number);
    return { dice: 0, sides: 0, bonus: Math.ceil((num / den) * 4) };
  }

  // HD with bonus/penalty: "4+1", "3-1"
  const match = trimmed.match(/^(\d+)\s*([+-])\s*(\d+)$/);
  if (match) {
    const dice = parseInt(match[1], 10);
    const sign = match[2] === "+" ? 1 : -1;
    const bonus = sign * parseInt(match[3], 10);
    return { dice, sides: 8, bonus };
  }

  // Simple HD: "4", "1", "12"
  const simple = parseInt(trimmed, 10);
  if (!isNaN(simple)) {
    return { dice: simple, sides: 8, bonus: 0 };
  }

  // Fallback
  return { dice: 1, sides: 8, bonus: 0 };
}

/**
 * Roll HP for a monster given parsed hit dice.
 * @param rng Optional random function (0-1 exclusive). Defaults to Math.random.
 */
export function rollMonsterHp(parsed: ParsedHitDice, rng: () => number = Math.random): number {
  if (parsed.dice === 0) {
    return Math.max(1, parsed.bonus);
  }

  let total = parsed.bonus;
  for (let i = 0; i < parsed.dice; i++) {
    total += Math.floor(rng() * parsed.sides) + 1;
  }
  return Math.max(1, total);
}

/**
 * Parse a Monstrous Manual damage string.
 * Examples: "1d8", "1d8+2", "1d4/1d4/2d6", "1d6-1", "1"
 */
export function parseDamageString(damage: string): DamageDie[] {
  return damage.split("/").map((part) => parseSingleDamage(part.trim()));
}

function parseSingleDamage(dmg: string): DamageDie {
  // Dice notation: "2d6+3", "1d8", "1d6-1"
  const diceMatch = dmg.match(/^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?$/);
  if (diceMatch) {
    const count = parseInt(diceMatch[1], 10);
    const sides = parseInt(diceMatch[2], 10);
    const sign = diceMatch[3] === "-" ? -1 : 1;
    const bonus = diceMatch[4] ? sign * parseInt(diceMatch[4], 10) : 0;
    return { count, sides, bonus };
  }

  // Flat damage: "1", "5"
  const flat = parseInt(dmg, 10);
  if (!isNaN(flat)) {
    return { count: 0, sides: 0, bonus: flat };
  }

  return { count: 1, sides: 4, bonus: 0 };
}

/**
 * Parse attacks per round string to a number.
 * Examples: "1" → 1, "3/2" → 1.5, "5/2" → 2.5
 */
export function parseAttacksPerRound(apr: string): number {
  const trimmed = apr.trim();

  if (trimmed.includes("/")) {
    const [num, den] = trimmed.split("/").map(Number);
    if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
  }

  const parsed = parseInt(trimmed, 10);
  return isNaN(parsed) ? 1 : parsed;
}
