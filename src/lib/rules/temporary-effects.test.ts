import { describe, it, expect } from "vitest";
import type { CharacterEffectRow, EffectModifier } from "@/lib/supabase/types";
import {
  aggregateEffects,
  applyEffectsToAbility,
  consumeTempHp,
  getStackingWarnings,
  getThresholdWarnings,
  scaleAttacksPerRound,
  validateModifier,
} from "./temporary-effects";

let counter = 0;
function effect(
  name: string,
  modifiers: EffectModifier[],
  extra: Partial<CharacterEffectRow> = {}
): CharacterEffectRow {
  counter++;
  return {
    id: `e${counter}`,
    character_id: "c1",
    name,
    notes: "",
    duration_text: "",
    preset_key: null,
    modifiers,
    flags: [],
    temp_hp_remaining: 0,
    created_by: null,
    created_at: `2026-10-05T10:00:${String(counter).padStart(2, "0")}Z`,
    ended_at: null,
    ...extra,
  };
}

describe("validateModifier", () => {
  it("accepts the operations each target allows", () => {
    expect(validateModifier({ target: "str", op: "set", value: 5 })).toBe(true);
    expect(validateModifier({ target: "str", op: "factor", value: 0.5 })).toBe(true);
    expect(validateModifier({ target: "ac", op: "set", value: 6 })).toBe(true);
    expect(validateModifier({ target: "movement", op: "factor", value: 0.5 })).toBe(true);
    expect(validateModifier({ target: "savesAll", op: "delta", value: -2 })).toBe(true);
  });

  it("rejects operations that make no sense for a target", () => {
    expect(validateModifier({ target: "attack", op: "factor", value: 2 })).toBe(false);
    expect(validateModifier({ target: "savesAll", op: "set", value: 10 })).toBe(false);
    expect(validateModifier({ target: "movement", op: "set", value: 6 })).toBe(false);
    expect(validateModifier({ target: "movement", op: "factor", value: 0.7 })).toBe(false);
    expect(validateModifier({ target: "str", op: "delta", value: Number.NaN })).toBe(false);
  });
});

describe("applyEffectsToAbility", () => {
  // Order: set → factor → delta, then clamped to 0–25.
  it("halves first and subtracts afterwards", () => {
    const summary = aggregateEffects([
      effect("Seuche", [{ target: "str", op: "delta", value: -2 }]),
      effect("Schwächendes Gift", [{ target: "allAbilities", op: "factor", value: 0.5 }]),
    ]);
    expect(applyEffectsToAbility(16, summary.abilities.str)).toBe(6);
  });

  it("lets the most recent set-to effect win", () => {
    const summary = aggregateEffects([
      effect("Schwächestrahl", [{ target: "str", op: "set", value: 5 }]),
      effect("Rage", [{ target: "str", op: "set", value: 18 }]),
    ]);
    expect(applyEffectsToAbility(12, summary.abilities.str)).toBe(18);
  });

  it("clamps to 0–25", () => {
    const low = aggregateEffects([effect("Drain", [{ target: "con", op: "delta", value: -20 }])]);
    const high = aggregateEffects([effect("Boost", [{ target: "con", op: "delta", value: 20 }])]);
    expect(applyEffectsToAbility(10, low.abilities.con)).toBe(0);
    expect(applyEffectsToAbility(10, high.abilities.con)).toBe(25);
  });

  it("applies allAbilities to every ability", () => {
    const summary = aggregateEffects([
      effect("Fluch", [{ target: "allAbilities", op: "delta", value: -1 }]),
    ]);
    for (const key of ["str", "dex", "con", "int", "wis", "cha"] as const) {
      expect(applyEffectsToAbility(10, summary.abilities[key])).toBe(9);
    }
  });

  it("leaves an ability without effects unchanged", () => {
    expect(applyEffectsToAbility(13, aggregateEffects([]).abilities.wis)).toBe(13);
  });
});

describe("aggregateEffects", () => {
  it("adds save bonuses for all saves and for one category", () => {
    const summary = aggregateEffects([
      effect("Gebet", [{ target: "savesAll", op: "delta", value: 1 }]),
      effect("Pit-Fiend-Aura", [{ target: "saveRod", op: "delta", value: -3 }]),
    ]);
    expect(summary.saves).toEqual({
      paralyzation: 1,
      rod: -2,
      petrification: 1,
      breath: 1,
      spell: 1,
    });
  });

  it("keeps conditional changes out of the numbers and lists them as notes", () => {
    const summary = aggregateEffects([
      effect("Schutz vor Bösem", [
        { target: "savesAll", op: "delta", value: 2, condition: "Böse" },
      ]),
    ]);
    expect(summary.saves.spell).toBe(0);
    expect(summary.conditionalNotes).toEqual([
      { target: "savesAll", value: 2, condition: "Böse", effectName: "Schutz vor Bösem" },
    ]);
  });

  it("sums attack, damage and AC bonuses and remembers their sources", () => {
    const summary = aggregateEffects([
      effect("Segen", [{ target: "attack", op: "delta", value: 1 }]),
      effect("Bein verletzt", [{ target: "attack", op: "delta", value: -2 }]),
      effect("Verlangsamen", [{ target: "ac", op: "delta", value: -4 }]),
      effect("Gesang", [{ target: "damage", op: "delta", value: 1 }]),
    ]);
    expect(summary.attack).toBe(-1);
    expect(summary.damage).toBe(1);
    expect(summary.acBonus).toBe(-4);
    expect(summary.sources.attack).toEqual([
      { effectName: "Segen", op: "delta", value: 1 },
      { effectName: "Bein verletzt", op: "delta", value: -2 },
    ]);
  });

  it("multiplies movement and attack factors", () => {
    const summary = aggregateEffects([
      effect("Bein verletzt", [{ target: "movement", op: "factor", value: 0.5 }]),
      effect("Verlangsamen", [
        { target: "movement", op: "factor", value: 0.5 },
        { target: "attacksPerRound", op: "factor", value: 0.5 },
      ]),
    ]);
    expect(summary.movementFactor).toBe(0.25);
    expect(summary.attacksFactor).toBe(0.5);
  });

  it("takes an AC set-to value from the most recent effect", () => {
    const summary = aggregateEffects([
      effect("Rüstung", [{ target: "ac", op: "set", value: 6 }]),
      effect("Rindenhaut", [{ target: "ac", op: "set", value: 5 }]),
    ]);
    expect(summary.acSet).toBe(5);
  });

  it("collects flags, temporary hit points and the remaining targets", () => {
    const summary = aggregateEffects([
      effect("Stinkwolke", [], { flags: ["nauseated", "noAttacks"] }),
      effect("Hilfe", [{ target: "tempHp", op: "delta", value: 6 }], { temp_hp_remaining: 4 }),
      effect("Taubheit", [{ target: "spellFailure", op: "delta", value: 20 }], {
        flags: ["deafened"],
      }),
      effect("Klagelied", [{ target: "thiefSkills", op: "delta", value: -25 }]),
      effect("Hitze", [
        { target: "abilityChecks", op: "delta", value: -2 },
        { target: "perception", op: "delta", value: -1 },
      ]),
    ]);
    expect(summary.noAttacks).toBe(true);
    expect(summary.flags).toEqual(expect.arrayContaining(["nauseated", "noAttacks", "deafened"]));
    expect(summary.tempHp).toBe(4);
    expect(summary.spellFailure).toBe(20);
    expect(summary.thiefSkills).toBe(-25);
    expect(summary.abilityChecks).toBe(-2);
    expect(summary.perception).toBe(-1);
  });

  it("derives the special combat flags from the effect flags", () => {
    const summary = aggregateEffects([
      effect("Netz", [], { flags: ["noDexAc"] }),
      effect("Arm gebrochen", [], { flags: ["noShield", "cannotCast"] }),
    ]);
    expect(summary.noDexAc).toBe(true);
    expect(summary.noShield).toBe(true);
    expect(summary.cannotCast).toBe(true);
    expect(summary.noAttacks).toBe(false);
  });

  it("ignores ended effects and invalid modifiers", () => {
    const summary = aggregateEffects([
      effect("Alt", [{ target: "attack", op: "delta", value: 3 }], {
        ended_at: "2026-10-05T11:00:00Z",
      }),
      effect("Kaputt", [{ target: "attack", op: "factor", value: 2 }]),
    ]);
    expect(summary.attack).toBe(0);
  });
});

describe("consumeTempHp", () => {
  const aid = (id: string, remaining: number, created_at: string) =>
    effect("Hilfe", [{ target: "tempHp", op: "delta", value: remaining }], {
      id,
      temp_hp_remaining: remaining,
      created_at,
    });

  it("absorbs damage with temporary hit points first", () => {
    expect(consumeTempHp([aid("a", 6, "2026-10-05T10:00:00Z")], 10)).toEqual({
      updates: [{ id: "a", temp_hp_remaining: 0 }],
      remainingDamage: 4,
    });
  });

  it("uses the oldest effect first", () => {
    const result = consumeTempHp(
      [aid("new", 5, "2026-10-05T12:00:00Z"), aid("old", 3, "2026-10-05T10:00:00Z")],
      4
    );
    expect(result).toEqual({
      updates: [
        { id: "old", temp_hp_remaining: 0 },
        { id: "new", temp_hp_remaining: 4 },
      ],
      remainingDamage: 0,
    });
  });

  it("passes the full damage on without a buffer", () => {
    expect(consumeTempHp([], 7)).toEqual({ updates: [], remainingDamage: 7 });
  });
});

describe("warnings", () => {
  it("warns at the rule thresholds", () => {
    expect(getThresholdWarnings({ str: 0, dex: 10, con: 2, int: 10, wis: 10, cha: 2 })).toEqual([
      { ability: "str", value: 0, level: "deadly" },
      { ability: "con", value: 2, level: "unconscious" },
      { ability: "cha", value: 2, level: "incapacitated" },
    ]);
    expect(getThresholdWarnings({ str: 3, dex: 3, con: 3, int: 3, wis: 3, cha: 3 })).toEqual([]);
  });

  it("warns when the same preset is active twice", () => {
    const bless = { preset_key: "bless" };
    expect(
      getStackingWarnings([
        effect("Segen", [], bless),
        effect("Segen", [], bless),
        effect("Gebet", [], { preset_key: "prayer" }),
      ])
    ).toEqual(["bless"]);
  });
});

describe("scaleAttacksPerRound", () => {
  const summary = (factor: number, noAttacks = false) => ({
    ...aggregateEffects([]),
    attacksFactor: factor,
    noAttacks,
  });

  it("keeps the rate without effects", () => {
    expect(scaleAttacksPerRound("3/2", summary(1))).toBe("3/2");
  });

  it("doubles and halves rates and keeps them as fractions", () => {
    expect(scaleAttacksPerRound("1", summary(2))).toBe("2");
    expect(scaleAttacksPerRound("3/2", summary(2))).toBe("3");
    expect(scaleAttacksPerRound("1", summary(0.5))).toBe("1/2");
    expect(scaleAttacksPerRound("3/2", summary(0.5))).toBe("3/4");
    expect(scaleAttacksPerRound("2", summary(0.25))).toBe("1/2");
  });

  it("reports no attacks", () => {
    expect(scaleAttacksPerRound("2", summary(1, true))).toBe("0");
    expect(scaleAttacksPerRound("2", summary(0))).toBe("0");
  });
});
