import { describe, it, expect } from "vitest";
import { runSimulation } from "./simulator";
import { resolveEntityTurn } from "./resolver";
import { createSeededRng } from "./dice";
import type { CombatEntity, SimulationState } from "./types";

function makeThief(overrides: Partial<CombatEntity> = {}): CombatEntity {
  return {
    id: "thief1",
    name: "Thief",
    side: "party",
    source: "character",
    ac: 4,
    thac0: 17,
    hpMax: 28,
    hpCurrent: 28,
    attacksPerRound: 1,
    damageDice: [{ count: 1, sides: 6, bonus: 2 }],
    saves: { paralyzation: 12, rod: 12, petrification: 11, breath: 15, spell: 13 },
    magicResistance: 0,
    weaponSpeed: 4,
    zone: "melee",
    role: "striker",
    spellSlots: null,
    knownSpells: [],
    activeEffects: [],
    isAlive: true,
    attackDebt: 0,
    backstabMultiplier: 3, // Level 5-8 thief
    hideInShadows: 50,
    moveSilently: 55,
    isHidden: true,
    ...overrides,
  };
}

function makeTarget(overrides: Partial<CombatEntity> = {}): CombatEntity {
  return {
    id: "target1",
    name: "Target",
    side: "opposition",
    source: "monster",
    ac: 5,
    thac0: 17,
    hpMax: 40,
    hpCurrent: 40,
    attacksPerRound: 1,
    damageDice: [{ count: 1, sides: 8, bonus: 2 }],
    saves: { paralyzation: 13, rod: 14, petrification: 13, breath: 16, spell: 15 },
    magicResistance: 0,
    weaponSpeed: 5,
    zone: "melee",
    role: "striker",
    spellSlots: null,
    knownSpells: [],
    activeEffects: [],
    isAlive: true,
    attackDebt: 0,
    ...overrides,
  };
}

function makeState(entities: CombatEntity[], round = 1): SimulationState {
  return { round, entities, log: [], outcome: "ongoing", maxRounds: 30 };
}

describe("Backstab mechanics", () => {
  it("hidden thief performs backstab with multiplied damage", () => {
    const thief = makeThief();
    const target = makeTarget();
    const state = makeState([thief, target]);
    const rng = createSeededRng(42);

    const actions = resolveEntityTurn(thief, state, rng);

    const backstab = actions.find((a) => a.detail.includes("Backstab"));
    expect(backstab).toBeDefined();
    expect(backstab!.detail).toContain("x3");
    expect(backstab!.damage).toBeGreaterThan(0);
    expect(backstab!.hit).toBe(true);
  });

  it("backstab breaks stealth", () => {
    const thief = makeThief();
    const target = makeTarget();
    const state = makeState([thief, target]);
    const rng = createSeededRng(42);

    resolveEntityTurn(thief, state, rng);

    expect(thief.isHidden).toBe(false);
  });

  it("invisible thief can backstab", () => {
    const thief = makeThief({
      isHidden: false,
      activeEffects: [{ name: "Invisibility", roundsRemaining: -1, effect: { invisible: true } }],
    });
    const target = makeTarget();
    const state = makeState([thief, target]);
    const rng = createSeededRng(42);

    const actions = resolveEntityTurn(thief, state, rng);

    const backstab = actions.find((a) => a.detail.includes("Backstab"));
    expect(backstab).toBeDefined();
    // Invisibility should be removed
    expect(thief.activeEffects.some((e) => e.effect.invisible)).toBe(false);
  });

  it("non-hidden thief does normal attack", () => {
    const thief = makeThief({ isHidden: false });
    const target = makeTarget();
    const state = makeState([thief, target]);
    const rng = createSeededRng(42);

    const actions = resolveEntityTurn(thief, state, rng);

    const backstab = actions.find((a) => a.detail.includes("Backstab"));
    expect(backstab).toBeUndefined();
  });

  it("thief without backstab multiplier does not backstab", () => {
    const thief = makeThief({ backstabMultiplier: null, isHidden: true });
    const target = makeTarget();
    const state = makeState([thief, target]);
    const rng = createSeededRng(42);

    const actions = resolveEntityTurn(thief, state, rng);

    const backstab = actions.find((a) => a.detail.includes("Backstab"));
    expect(backstab).toBeUndefined();
  });

  it("backstab targets highest-threat enemy (caster > striker)", () => {
    const thief = makeThief();
    const caster = makeTarget({
      id: "caster1",
      name: "Enemy Mage",
      role: "artillery",
      knownSpells: [
        {
          name: "Fireball",
          level: 3,
          type: "wizard",
          castingTime: 3,
          savingThrow: "spell",
          category: "aoe_damage",
          targetMode: "zone_aoe",
          estimatedDamage: { count: 6, sides: 6, bonus: 0 },
          duration: 0,
          counters: [],
          conditions: [],
        },
      ],
    });
    const striker = makeTarget({ id: "striker1", name: "Orc" });
    const state = makeState([thief, caster, striker]);
    const rng = createSeededRng(42);

    const actions = resolveEntityTurn(thief, state, rng);

    const backstab = actions.find((a) => a.detail.includes("Backstab"));
    expect(backstab).toBeDefined();
    expect(backstab!.targetName).toBe("Enemy Mage");
  });
});

describe("Re-hide mechanic", () => {
  it("thief attempts re-hide in round 2+", () => {
    const rng = createSeededRng(1); // Seed that gives d100 <= 50
    const thief = makeThief({ isHidden: false });
    const target = makeTarget();
    const state = makeState([thief, target], 2);

    // Run multiple seeds to find one where re-hide succeeds
    let foundHide = false;
    for (let seed = 0; seed < 100; seed++) {
      const testRng = createSeededRng(seed);
      const testThief = { ...makeThief({ isHidden: false }), activeEffects: [] };
      const testTarget = makeTarget();
      const testState = makeState([testThief, testTarget], 2);
      const actions = resolveEntityTurn(testThief, testState, testRng);
      if (actions.some((a) => a.detail.includes("Hide in Shadows"))) {
        expect(testThief.isHidden).toBe(true);
        foundHide = true;
        break;
      }
    }
    expect(foundHide).toBe(true);
  });
});

describe("Thief in full simulation", () => {
  it("thief with backstab performs better than fighter equivalent", () => {
    const thief = makeThief({ id: "thief1" });
    const fighter: CombatEntity = {
      ...makeThief({ id: "fighter1" }),
      name: "Fighter",
      backstabMultiplier: null,
      hideInShadows: null,
      moveSilently: null,
      isHidden: false,
    };

    const target1 = makeTarget({ id: "t1" });
    const target2 = makeTarget({ id: "t2" });

    const thiefResult = runSimulation([thief], [target1], { iterations: 20, seed: 42 });
    const fighterResult = runSimulation([fighter], [target2], { iterations: 20, seed: 42 });

    // Thief with backstab should deal more damage on average (backstab round 1)
    expect(thiefResult.avgPartyDPR).toBeGreaterThanOrEqual(fighterResult.avgPartyDPR);
  });
});
