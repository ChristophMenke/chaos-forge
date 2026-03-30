import { describe, it, expect } from "vitest";
import {
  getEpicEffects,
  scaleSubStat,
  applyThiefPenalty,
  getCurrentDamageLevelEffect,
} from "./epic-items";
import type { EpicItemRow } from "@/lib/supabase/types";

function makeCondenser(overrides: Partial<EpicItemRow> = {}): EpicItemRow {
  return {
    id: "test-condenser",
    character_id: "char-1",
    slug: "constitution_condenser",
    name: "Konstitutions-Kondensator",
    name_en: "Constitution Condenser",
    description: "",
    description_en: null,
    icon: "heart-pulse",
    equipped: true,
    damage_level: 0,
    max_damage_level: 8,
    damage_levels: {
      "0": { stat_overrides: { con: 18 }, description: "Voll funktionsfähig", effects: [] },
      "1": { stat_overrides: { con: 17 }, description: "Stufe 1", effects: [] },
      "3": {
        stat_overrides: { con: 15 },
        description: "Stufe 3",
        effects: ["spell_failure_10"],
      },
      "4": {
        stat_overrides: { con: 14 },
        description: "Stufe 4",
        effects: ["spell_failure_10", "thief_penalty_10"],
      },
      "5": {
        stat_overrides: { con: 12 },
        description: "Stufe 5",
        effects: ["spell_failure_10", "thief_disabled", "electric_damage_1"],
      },
      "6": {
        stat_overrides: { con: 10 },
        description: "Stufe 6",
        effects: ["spell_failure_10", "thief_disabled", "electric_damage_1", "wild_magic_50"],
      },
      "8": {
        stat_overrides: { con: 5 },
        description: "Totalausfall",
        effects: ["thief_disabled", "device_offline"],
      },
    },
    simple_effects: {},
    notes: "",
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function makeGoggles(overrides: Partial<EpicItemRow> = {}): EpicItemRow {
  return {
    id: "test-goggles",
    character_id: "char-1",
    slug: "sharpvision_goggles",
    name: "Scharfsicht-Brille",
    name_en: "Sharpvision Goggles",
    description: "",
    description_en: null,
    icon: "glasses",
    equipped: true,
    damage_level: 0,
    max_damage_level: 0,
    damage_levels: {},
    simple_effects: { perception_bonus: 2 },
    notes: "",
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("getCurrentDamageLevelEffect", () => {
  it("returns the effect for the current damage level", () => {
    const item = makeCondenser({ damage_level: 3 });
    const effect = getCurrentDamageLevelEffect(item);
    expect(effect?.stat_overrides?.con).toBe(15);
    expect(effect?.effects).toContain("spell_failure_10");
  });

  it("returns undefined for items without damage levels", () => {
    const item = makeGoggles();
    expect(getCurrentDamageLevelEffect(item)).toBeUndefined();
  });
});

describe("getEpicEffects", () => {
  it("returns stat overrides for equipped condenser at level 0", () => {
    const effects = getEpicEffects([makeCondenser()]);
    expect(effects.statOverrides.con).toBe(18);
    expect(effects.thiefPenalty).toBe(0);
    expect(effects.spellFailure).toBe(0);
  });

  it("returns thief penalty at damage level 4", () => {
    const effects = getEpicEffects([makeCondenser({ damage_level: 4 })]);
    expect(effects.statOverrides.con).toBe(14);
    expect(effects.thiefPenalty).toBe(10);
    expect(effects.spellFailure).toBe(10);
    expect(effects.thiefDisabled).toBe(false);
  });

  it("disables thief skills at damage level 5", () => {
    const effects = getEpicEffects([makeCondenser({ damage_level: 5 })]);
    expect(effects.statOverrides.con).toBe(12);
    expect(effects.thiefDisabled).toBe(true);
  });

  it("adds wild magic at damage level 6", () => {
    const effects = getEpicEffects([makeCondenser({ damage_level: 6 })]);
    expect(effects.wildMagic).toBe(50);
  });

  it("ignores unequipped items", () => {
    const effects = getEpicEffects([makeCondenser({ equipped: false })]);
    expect(effects.statOverrides.con).toBeUndefined();
  });

  it("ignores items without damage levels (simple effects)", () => {
    const effects = getEpicEffects([makeGoggles()]);
    expect(effects.statOverrides.con).toBeUndefined();
    expect(effects.miscEffects).toHaveLength(0);
  });

  it("combines effects from multiple equipped items", () => {
    const effects = getEpicEffects([makeCondenser(), makeGoggles()]);
    expect(effects.statOverrides.con).toBe(18);
  });
});

describe("scaleSubStat", () => {
  it("scales sub-stat proportionally", () => {
    // Base CON 5, base sub 5, override to 18 → 18
    expect(scaleSubStat(5, 5, 18)).toBe(18);
  });

  it("scales down when override is lower", () => {
    // Base CON 18, base sub 16, override to 10 → round(10 * 16/18) = 9
    expect(scaleSubStat(18, 16, 10)).toBe(9);
  });

  it("returns null when sub-stat is null", () => {
    expect(scaleSubStat(5, null, 18)).toBeNull();
  });

  it("clamps to minimum 1", () => {
    expect(scaleSubStat(18, 1, 3)).toBe(1);
  });

  it("clamps to maximum of override", () => {
    expect(scaleSubStat(3, 18, 5)).toBe(5);
  });
});

describe("applyThiefPenalty", () => {
  it("returns base value when no penalty", () => {
    const effects = getEpicEffects([makeCondenser()]);
    expect(applyThiefPenalty(50, effects)).toBe(50);
  });

  it("subtracts penalty percentage", () => {
    const effects = getEpicEffects([makeCondenser({ damage_level: 4 })]);
    expect(applyThiefPenalty(50, effects)).toBe(40);
  });

  it("returns 0 when thief skills disabled", () => {
    const effects = getEpicEffects([makeCondenser({ damage_level: 5 })]);
    expect(applyThiefPenalty(50, effects)).toBe(0);
  });

  it("does not go below 0", () => {
    const effects = getEpicEffects([makeCondenser({ damage_level: 4 })]);
    expect(applyThiefPenalty(5, effects)).toBe(0);
  });
});
