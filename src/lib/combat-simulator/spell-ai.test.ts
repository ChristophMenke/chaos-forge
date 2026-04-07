import { describe, it, expect } from "vitest";
import { decideSpellAction } from "./spell-ai";
import { createSeededRng } from "./dice";
import { COMBAT_SPELLS } from "./spell-catalog";
import type { CombatEntity, SimulationState } from "./types";

function makeEntity(overrides: Partial<CombatEntity>): CombatEntity {
  return {
    id: "e1",
    name: "Test",
    side: "party",
    source: "character",
    ac: 5,
    thac0: 15,
    hpMax: 30,
    hpCurrent: 30,
    attacksPerRound: 1,
    damageDice: [{ count: 1, sides: 8, bonus: 0 }],
    saves: { paralyzation: 10, rod: 10, petrification: 10, breath: 10, spell: 10 },
    magicResistance: 0,
    weaponSpeed: 5,
    zone: "ranged",
    role: "artillery",
    spellSlots: [3, 2, 1],
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

const rng = createSeededRng(42);

describe("decideSpellAction", () => {
  it("returns null when no spell slots", () => {
    const caster = makeEntity({ spellSlots: null });
    const enemy = makeEntity({ id: "e2", side: "opposition" });
    const result = decideSpellAction(caster, makeState([caster, enemy]), rng);
    expect(result).toBeNull();
  });

  it("returns null when all slots expended", () => {
    const caster = makeEntity({
      spellSlots: [0, 0, 0],
      knownSpells: [COMBAT_SPELLS.fireball],
    });
    const enemy = makeEntity({ id: "e2", side: "opposition" });
    const result = decideSpellAction(caster, makeState([caster, enemy]), rng);
    expect(result).toBeNull();
  });

  it("counters invisible enemy with Detect Invisibility", () => {
    const caster = makeEntity({
      knownSpells: [COMBAT_SPELLS.detect_invisibility, COMBAT_SPELLS.fireball],
      spellSlots: [3, 2, 1],
    });
    const enemy = makeEntity({
      id: "e2",
      side: "opposition",
      activeEffects: [{ name: "Invisibility", roundsRemaining: 3, effect: { invisible: true } }],
    });
    const result = decideSpellAction(caster, makeState([caster, enemy]), rng);
    expect(result).not.toBeNull();
    expect(result!.spell.name).toBe("Detect Invisibility");
  });

  it("support heals ally below 30% HP", () => {
    const healer = makeEntity({
      role: "support",
      knownSpells: [COMBAT_SPELLS.cure_light_wounds, COMBAT_SPELLS.cure_serious_wounds],
      spellSlots: [3, 2, 2],
    });
    const wounded = makeEntity({ id: "e2", hpCurrent: 5, hpMax: 30, side: "party" });
    const enemy = makeEntity({ id: "e3", side: "opposition" });
    const result = decideSpellAction(healer, makeState([healer, wounded, enemy]), rng);
    expect(result).not.toBeNull();
    expect(result!.spell.category).toBe("heal");
    // Should pick highest level heal
    expect(result!.spell.name).toBe("Cure Serious Wounds");
  });

  it("does NOT heal when allies are healthy", () => {
    const healer = makeEntity({
      role: "support",
      knownSpells: [COMBAT_SPELLS.cure_light_wounds, COMBAT_SPELLS.hold_person],
      spellSlots: [3, 2],
    });
    const healthy = makeEntity({ id: "e2", hpCurrent: 28, hpMax: 30, side: "party" });
    const enemy = makeEntity({ id: "e3", side: "opposition", role: "striker", zone: "melee" });
    const result = decideSpellAction(healer, makeState([healer, healthy, enemy]), rng);
    // Should CC instead of heal
    expect(result).not.toBeNull();
    expect(result!.spell.category).toBe("cc");
  });

  it("uses AoE when density >= 30% and 2+ targets in zone", () => {
    const mage = makeEntity({
      knownSpells: [COMBAT_SPELLS.fireball],
      spellSlots: [3, 2, 1],
    });
    const enemies = Array.from({ length: 4 }, (_, i) =>
      makeEntity({ id: `e${i + 2}`, side: "opposition", zone: "melee" })
    );
    const result = decideSpellAction(mage, makeState([mage, ...enemies]), rng);
    expect(result).not.toBeNull();
    expect(result!.spell.name).toBe("Fireball");
    expect(result!.targets.length).toBe(4);
  });

  it("does NOT use AoE on single isolated enemy", () => {
    const mage = makeEntity({
      knownSpells: [COMBAT_SPELLS.fireball, COMBAT_SPELLS.magic_missile],
      spellSlots: [3, 2, 1],
    });
    const enemy = makeEntity({ id: "e2", side: "opposition", zone: "melee" });
    const result = decideSpellAction(mage, makeState([mage, enemy]), rng);
    // Should fall through to single damage
    expect(result).not.toBeNull();
    expect(result!.spell.name).toBe("Magic Missile");
  });

  it("CCs highest-threat striker", () => {
    const mage = makeEntity({
      knownSpells: [COMBAT_SPELLS.hold_person_wiz],
      spellSlots: [3, 2, 1],
    });
    const tank = makeEntity({ id: "e2", side: "opposition", role: "tank" });
    const striker = makeEntity({ id: "e3", side: "opposition", role: "striker" });
    const result = decideSpellAction(mage, makeState([mage, tank, striker]), rng);
    expect(result).not.toBeNull();
    expect(result!.targets[0].id).toBe("e3"); // Striker has priority
  });
});
