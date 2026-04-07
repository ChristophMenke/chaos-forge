import { describe, it, expect } from "vitest";
import { runSimulation } from "./simulator";
import type { CombatEntity } from "./types";

function makeFighter(overrides: Partial<CombatEntity> = {}): CombatEntity {
  return {
    id: "f1",
    name: "Fighter",
    side: "party",
    source: "character",
    ac: 2,
    thac0: 14,
    hpMax: 45,
    hpCurrent: 45,
    attacksPerRound: 1.5,
    damageDice: [{ count: 1, sides: 8, bonus: 3 }],
    saves: { paralyzation: 11, rod: 13, petrification: 12, breath: 13, spell: 14 },
    magicResistance: 0,
    weaponSpeed: 5,
    zone: "melee",
    role: "tank",
    spellSlots: null,
    knownSpells: [],
    activeEffects: [],
    isAlive: true,
    attackDebt: 0,
    ...overrides,
  };
}

function makeKobold(id: string): CombatEntity {
  return {
    id,
    name: `Kobold ${id}`,
    side: "opposition",
    source: "monster",
    ac: 7,
    thac0: 20,
    hpMax: 2,
    hpCurrent: 2,
    attacksPerRound: 1,
    damageDice: [{ count: 1, sides: 4, bonus: 0 }],
    saves: { paralyzation: 16, rod: 18, petrification: 17, breath: 20, spell: 19 },
    magicResistance: 0,
    weaponSpeed: 4,
    zone: "melee",
    role: "striker",
    spellSlots: null,
    knownSpells: [],
    activeEffects: [],
    isAlive: true,
    attackDebt: 0,
  };
}

function makeOgre(id: string): CombatEntity {
  return {
    id,
    name: `Ogre ${id}`,
    side: "opposition",
    source: "monster",
    ac: 5,
    thac0: 17,
    hpMax: 30,
    hpCurrent: 30,
    attacksPerRound: 1,
    damageDice: [{ count: 1, sides: 10, bonus: 6 }],
    saves: { paralyzation: 13, rod: 14, petrification: 13, breath: 16, spell: 15 },
    magicResistance: 0,
    weaponSpeed: 7,
    zone: "melee",
    role: "striker",
    spellSlots: null,
    knownSpells: [],
    activeEffects: [],
    isAlive: true,
    attackDebt: 0,
  };
}

describe("runSimulation", () => {
  it("produces consistent result structure", () => {
    const party = [makeFighter()];
    const opposition = [makeKobold("k1")];
    const result = runSimulation(party, opposition, { iterations: 5, seed: 42 });

    expect(result.iterations).toBe(5);
    expect(result.partyWins + result.oppositionWins).toBe(5);
    expect(result.pWin).toBeGreaterThanOrEqual(0);
    expect(result.pWin).toBeLessThanOrEqual(1);
    expect(result.avgRounds).toBeGreaterThan(0);
    expect(result.representativeLog.length).toBeGreaterThan(0);
    expect(result.difficulty).toBeDefined();
  });

  it("deterministic seed produces identical results", () => {
    const party = [makeFighter()];
    const opposition = [makeKobold("k1"), makeKobold("k2")];
    const r1 = runSimulation(party, opposition, { iterations: 10, seed: 123 });
    const r2 = runSimulation(party, opposition, { iterations: 10, seed: 123 });

    expect(r1.partyWins).toBe(r2.partyWins);
    expect(r1.avgRounds).toBe(r2.avgRounds);
    expect(r1.pWin).toBe(r2.pWin);
  });

  it("4 fighters vs 1 kobold = near 100% win rate", () => {
    const party = [
      makeFighter({ id: "f1" }),
      makeFighter({ id: "f2", name: "Fighter 2" }),
      makeFighter({ id: "f3", name: "Fighter 3" }),
      makeFighter({ id: "f4", name: "Fighter 4" }),
    ];
    const opposition = [makeKobold("k1")];
    const result = runSimulation(party, opposition, { iterations: 20, seed: 42 });

    expect(result.pWin).toBeGreaterThanOrEqual(0.9);
    expect(result.difficulty).toBe("trivial");
  });

  it("handles balanced encounter with non-zero outcomes for both sides", () => {
    const party = [makeFighter({ id: "f1" })];
    const opposition = [makeOgre("o1"), makeOgre("o2")];
    const result = runSimulation(party, opposition, { iterations: 20, seed: 99 });

    // Fighter vs 2 ogres should be tough
    expect(result.pWin).toBeLessThan(0.8);
  });

  it("does not exceed maxRounds", () => {
    const party = [makeFighter()];
    const opposition = [makeKobold("k1")];
    const result = runSimulation(party, opposition, {
      iterations: 5,
      maxRounds: 3,
      seed: 42,
    });

    for (const log of result.representativeLog) {
      expect(log.round).toBeLessThanOrEqual(3);
    }
  });

  it("combat log contains action entries", () => {
    const party = [makeFighter()];
    const opposition = [makeKobold("k1")];
    const result = runSimulation(party, opposition, { iterations: 1, seed: 42 });

    const allActions = result.representativeLog.flatMap((r) => r.actions);
    expect(allActions.length).toBeGreaterThan(0);
    expect(allActions[0].actorName).toBeDefined();
    expect(allActions[0].type).toBeDefined();
  });

  it("calculates DPR values", () => {
    const party = [makeFighter()];
    const opposition = [makeOgre("o1")];
    const result = runSimulation(party, opposition, { iterations: 10, seed: 42 });

    expect(result.avgPartyDPR).toBeGreaterThan(0);
    expect(result.avgOppositionDPR).toBeGreaterThanOrEqual(0);
  });
});
