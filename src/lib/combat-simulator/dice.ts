/**
 * Seeded PRNG (Mulberry32) for deterministic combat simulation.
 */

export interface SeededRng {
  /** Raw float [0, 1) */
  random(): number;
  /** Roll 1dN */
  d4(): number;
  d6(): number;
  d8(): number;
  d10(): number;
  d12(): number;
  d20(): number;
  d100(): number;
  /** Roll XdY+Z */
  roll(count: number, sides: number, bonus?: number): number;
}

export function createSeededRng(seed: number): SeededRng {
  let state = seed | 0;

  function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function rollDie(sides: number): number {
    return Math.floor(next() * sides) + 1;
  }

  return {
    random: next,
    d4: () => rollDie(4),
    d6: () => rollDie(6),
    d8: () => rollDie(8),
    d10: () => rollDie(10),
    d12: () => rollDie(12),
    d20: () => rollDie(20),
    d100: () => rollDie(100),
    roll(count: number, sides: number, bonus = 0): number {
      let total = bonus;
      for (let i = 0; i < count; i++) {
        total += rollDie(sides);
      }
      return total;
    },
  };
}
