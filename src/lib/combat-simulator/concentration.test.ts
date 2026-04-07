import { describe, it, expect } from "vitest";
import { resolveEntityTurn, tickEffects } from "./resolver";
import { createSeededRng } from "./dice";
import { COMBAT_SPELLS } from "./spell-catalog";
import type { CombatEntity, SimulationState } from "./types";

function makeCaster(overrides: Partial<CombatEntity> = {}): CombatEntity {
  return {
    id: "caster1",
    name: "Mage",
    side: "party",
    source: "character",
    ac: 8,
    thac0: 19,
    hpMax: 20,
    hpCurrent: 20,
    attacksPerRound: 1,
    damageDice: [{ count: 1, sides: 4, bonus: 0 }],
    saves: { paralyzation: 14, rod: 11, petrification: 13, breath: 15, spell: 12 },
    magicResistance: 0,
    weaponSpeed: 5,
    zone: "ranged",
    role: "artillery",
    spellSlots: [4, 3, 2],
    knownSpells: [COMBAT_SPELLS.detect_invisibility, COMBAT_SPELLS.fireball],
    activeEffects: [],
    isAlive: true,
    attackDebt: 0,
    concentratingOn: null,
    spellFailure: 0,
    casterLevel: 7,
    ...overrides,
  };
}

function makeTarget(overrides: Partial<CombatEntity> = {}): CombatEntity {
  return {
    id: "target1",
    name: "Enemy",
    side: "opposition",
    source: "monster",
    ac: 5,
    thac0: 17,
    hpMax: 30,
    hpCurrent: 30,
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

describe("Spell Failure", () => {
  it("high spell failure causes spells to fizzle", () => {
    const caster = makeCaster({
      spellFailure: 100, // 100% failure
      knownSpells: [COMBAT_SPELLS.fireball],
    });
    const target = makeTarget();
    const state = makeState([caster, target]);

    // With 100% failure, spell should always fail
    // But spell AI might not even try due to >50% check
    // Actually with spellFailure > 50, the AI returns null → physical attack
    const rng = createSeededRng(42);
    const actions = resolveEntityTurn(caster, state, rng);

    // Should not cast any spell (AI avoids when failure > 50%)
    const spellAction = actions.find((a) => a.type === "spell");
    expect(spellAction).toBeUndefined();
  });

  it("moderate spell failure sometimes fizzles", () => {
    // 40% failure - AI still tries (< 50 threshold)
    let fizzleCount = 0;
    let castCount = 0;

    for (let seed = 0; seed < 100; seed++) {
      const testCaster = makeCaster({
        spellFailure: 40,
        knownSpells: [COMBAT_SPELLS.magic_missile],
        spellSlots: [4, 3, 2],
      });
      const target = makeTarget({ id: `t${seed}` });
      const state = makeState([testCaster, target]);
      const rng = createSeededRng(seed);
      const actions = resolveEntityTurn(testCaster, state, rng);

      const spell = actions.find((a) => a.type === "spell");
      if (spell?.detail.includes("spell failure")) fizzleCount++;
      if (spell) castCount++;
    }

    // Should have some fizzles and some successes with 40% failure
    expect(fizzleCount).toBeGreaterThan(0);
    expect(castCount - fizzleCount).toBeGreaterThan(0);
  });
});

describe("Concentration tracking", () => {
  it("tickEffects clears concentratingOn when effect expires", () => {
    const caster = makeCaster({
      concentratingOn: "Detect Invisibility",
      activeEffects: [
        {
          name: "Detect Invisibility",
          roundsRemaining: 1,
          casterId: "caster1",
          effect: {},
        },
      ],
    });

    tickEffects(caster);

    // Effect expired → concentration cleared
    expect(caster.concentratingOn).toBeNull();
  });

  it("concentration spell keeps concentratingOn while active", () => {
    const caster = makeCaster({
      concentratingOn: "Detect Invisibility",
      activeEffects: [
        {
          name: "Detect Invisibility",
          roundsRemaining: 3,
          casterId: "caster1",
          effect: {},
        },
      ],
    });

    tickEffects(caster);

    // Effect still active → concentration persists
    expect(caster.concentratingOn).toBe("Detect Invisibility");
    expect(caster.activeEffects.length).toBe(1);
  });
});

describe("Silenced entities", () => {
  it("silenced entity cannot cast spells", () => {
    const caster = makeCaster({
      knownSpells: [COMBAT_SPELLS.fireball],
      activeEffects: [{ name: "Silence 15'", roundsRemaining: 3, effect: { silenced: true } }],
    });
    const target = makeTarget();
    const state = makeState([caster, target]);
    const rng = createSeededRng(42);

    const actions = resolveEntityTurn(caster, state, rng);

    const spell = actions.find((a) => a.type === "spell");
    expect(spell).toBeUndefined();
    // Should fall through to physical attack
    const attack = actions.find((a) => a.type === "attack");
    expect(attack).toBeDefined();
  });
});

describe("Damage type immunity", () => {
  it("fire-immune monster takes no damage from Fireball", () => {
    const caster = makeCaster({
      knownSpells: [COMBAT_SPELLS.fireball],
    });
    const fireImmune = makeTarget({
      specialDefenses: [{ type: "immunity", element: "fire" }],
    });
    const state = makeState([caster, fireImmune]);

    // Find a seed where the mage casts fireball
    for (let seed = 0; seed < 50; seed++) {
      const rng = createSeededRng(seed);
      const testCaster = { ...caster, spellSlots: [4, 3, 2], activeEffects: [] };
      const testTarget = { ...fireImmune, activeEffects: [] };
      const testState = makeState([testCaster, testTarget]);
      const actions = resolveEntityTurn(testCaster, testState, rng);

      const fireball = actions.find((a) => a.type === "spell" && a.detail.includes("Fireball"));
      if (fireball) {
        expect(fireball.detail).toContain("immune");
        expect(fireball.damage).toBeUndefined();
        break;
      }
    }
  });
});
