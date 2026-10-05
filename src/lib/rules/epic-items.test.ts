import { describe, it, expect } from "vitest";
import {
  getEpicEffects,
  scaleSubStat,
  applyThiefPenalty,
  getCurrentDamageLevelEffect,
  getFragilityChance,
  getFragilityInfo,
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

describe("overclock ability", () => {
  const overclockData = {
    name: "Übertakten",
    name_en: "Overclock",
    duration_hours: 1,
    requires_check: "Ingenieurskunst",
    requires_check_en: "Engineering",
    con_override: 20,
    poison_save_penalty: 1,
    heals_per_hour: 1,
    description: "Übertaktet den Kondensator",
    description_en: "Overclocks the Condenser",
  };

  it("parses overclock from simple_effects", () => {
    const item = makeCondenser({ simple_effects: { overclock: overclockData } });
    const effects = getEpicEffects([item]);
    expect(effects.overclockAbility).not.toBeNull();
    expect(effects.overclockAbility!.name).toBe("Übertakten");
    expect(effects.overclockAbility!.conOverride).toBe(20);
    expect(effects.overclockAbility!.poisonSavePenalty).toBe(1);
    expect(effects.overclockAbility!.healsPerHour).toBe(1);
    expect(effects.overclockAbility!.requiresCheck).toBe("Ingenieurskunst");
    expect(effects.overclockAbility!.durationHours).toBe(1);
  });

  it("returns null when item is not equipped", () => {
    const item = makeCondenser({
      equipped: false,
      simple_effects: { overclock: overclockData },
    });
    const effects = getEpicEffects([item]);
    expect(effects.overclockAbility).toBeNull();
  });

  it("returns null when device_offline (damage level 8)", () => {
    const item = makeCondenser({
      damage_level: 8,
      simple_effects: { overclock: overclockData },
    });
    const effects = getEpicEffects([item]);
    expect(effects.overclockAbility).toBeNull();
  });

  it("returns overclock even at high damage levels without device_offline", () => {
    const item = makeCondenser({
      damage_level: 6,
      simple_effects: { overclock: overclockData },
    });
    const effects = getEpicEffects([item]);
    expect(effects.overclockAbility).not.toBeNull();
    expect(effects.overclockAbility!.conOverride).toBe(20);
  });

  it("returns null when no overclock in simple_effects", () => {
    const effects = getEpicEffects([makeCondenser()]);
    expect(effects.overclockAbility).toBeNull();
  });

  it("returns null when device_offline comes from a separate item (any order)", () => {
    const offlineItem = makeCondenser({ id: "offline", damage_level: 8 });
    const overclockItem = makeCondenser({
      id: "condenser-2",
      damage_level: 0,
      simple_effects: { overclock: overclockData },
    });
    // Both orderings must suppress overclock
    expect(getEpicEffects([overclockItem, offlineItem]).overclockAbility).toBeNull();
    expect(getEpicEffects([offlineItem, overclockItem]).overclockAbility).toBeNull();
  });

  it("does not merge conOverride into statOverrides automatically", () => {
    const item = makeCondenser({ simple_effects: { overclock: overclockData } });
    const effects = getEpicEffects([item]);
    expect(effects.statOverrides.con).toBe(18);
    expect(effects.overclockAbility?.conOverride).toBe(20);
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

// ── Fragility ──────────────────────────────────────────────

describe("getFragilityChance", () => {
  it("returns baseChance when reductionPerLevel is 0", () => {
    expect(getFragilityChance(50, 0, 10)).toBe(50);
  });

  it("reduces chance by reductionPerLevel × level", () => {
    expect(getFragilityChance(50, 2, 7)).toBe(36);
    expect(getFragilityChance(50, 2, 10)).toBe(30);
  });

  it("clamps at 0 — never returns negative", () => {
    expect(getFragilityChance(50, 2, 30)).toBe(0);
  });

  it("handles level 0 safely", () => {
    expect(getFragilityChance(50, 2, 0)).toBe(50);
  });
});

describe("getFragilityInfo", () => {
  it("returns null when simple_effects is null", () => {
    expect(getFragilityInfo(null)).toBeNull();
  });

  it("returns null when fragility key is absent", () => {
    expect(getFragilityInfo({ overclock: {} })).toBeNull();
  });

  it("parses a well-formed fragility object", () => {
    const result = getFragilityInfo({
      fragility: {
        base_chance: 50,
        reduction_per_level: 2,
        trigger_de: "Physischer Rettungswurf",
        trigger_en: "Physical saving throw",
      },
    });
    expect(result).toEqual({
      baseChance: 50,
      reductionPerLevel: 2,
      trigger: "Physischer Rettungswurf",
      trigger_en: "Physical saving throw",
    });
  });

  it("uses fallback values when fields are missing", () => {
    const result = getFragilityInfo({ fragility: {} });
    expect(result?.baseChance).toBe(50);
    expect(result?.reductionPerLevel).toBe(0);
    expect(result?.trigger).toBe("Physischer Rettungswurf");
    expect(result?.trigger_en).toBe("Physical saving throw");
  });

  it("falls back to 'trigger' key if 'trigger_de' is absent", () => {
    const result = getFragilityInfo({
      fragility: {
        base_chance: 40,
        trigger: "Angriffswurf",
        trigger_en: "Attack roll",
      },
    });
    expect(result?.trigger).toBe("Angriffswurf");
  });
});

// ── Spell Abilities ──────────────────────────────────────────

function makeBladeOfWater(overrides: Partial<EpicItemRow> = {}): EpicItemRow {
  return {
    id: "test-blade",
    character_id: "char-1",
    slug: "klinge-des-wassers",
    name: "Klinge des Wassers",
    name_en: "Blade of Water",
    description: "",
    description_en: null,
    icon: "swords",
    equipped: true,
    damage_level: 0,
    max_damage_level: 4,
    damage_levels: {
      "0": { description: "Base", description_en: "Base", effects: [] },
      "1": { description: "L3-4", description_en: "L3-4", effects: [] },
      "2": { description: "L5-6", description_en: "L5-6", effects: [] },
      "3": {
        description: "L7-8",
        description_en: "L7-8",
        effects: ["cold_damage_1d6"],
      },
      "4": {
        description: "L9-10",
        description_en: "L9-10",
        effects: ["cold_damage_1d6"],
      },
    },
    simple_effects: {
      level_thresholds: [3, 5, 7, 9],
      spell_abilities: [
        {
          key: "water_walk",
          name: "Water Walk",
          name_en: "Water Walk",
          unlock_level: 1,
          usesPerDay: 1,
          usesPerWeek: 0,
          effect: "Auf Wasser laufen",
          effect_en: "Walk on water",
        },
        {
          key: "water_walk_3",
          name: "Water Walk",
          name_en: "Water Walk",
          unlock_level: 2,
          usesPerDay: 3,
          usesPerWeek: 0,
          replaces: "water_walk",
          effect: "Auf Wasser laufen",
          effect_en: "Walk on water",
        },
        {
          key: "water_breathing",
          name: "Water Breathing",
          name_en: "Water Breathing",
          unlock_level: 2,
          usesPerDay: 1,
          usesPerWeek: 0,
          effect: "Unter Wasser atmen",
          effect_en: "Breathe underwater",
        },
        {
          key: "water_breathing_3",
          name: "Water Breathing",
          name_en: "Water Breathing",
          unlock_level: 3,
          usesPerDay: 3,
          usesPerWeek: 0,
          replaces: "water_breathing",
          effect: "Unter Wasser atmen",
          effect_en: "Breathe underwater",
        },
        {
          key: "cone_of_cold",
          name: "Cone of Cold",
          name_en: "Cone of Cold",
          unlock_level: 4,
          usesPerDay: 0,
          usesPerWeek: 1,
          effect: "10d4+10 Kälteschaden",
          effect_en: "10d4+10 cold damage",
        },
      ],
    },
    notes: "",
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("spell abilities", () => {
  // Tier mapping with thresholds [3,5,7,9] and max_damage_level=4:
  // tier 0 = base (level < 3), tier 1 = L3-4, tier 2 = L5-6, tier 3 = L7-8, tier 4 = L9-10

  it("returns spell abilities for character level 3 (tier 1)", () => {
    const effects = getEpicEffects([makeBladeOfWater()], 3);
    expect(effects.spellAbilities).toHaveLength(1);
    expect(effects.spellAbilities[0].key).toBe("water_walk");
    expect(effects.spellAbilities[0].usesPerDay).toBe(1);
  });

  it("replaces water_walk with water_walk_3 at tier 2 (level 5)", () => {
    const effects = getEpicEffects([makeBladeOfWater()], 5);
    expect(effects.spellAbilities).toHaveLength(2);
    const keys = effects.spellAbilities.map((a) => a.key);
    expect(keys).toContain("water_walk_3");
    expect(keys).toContain("water_breathing");
    expect(keys).not.toContain("water_walk");
  });

  it("replaces water_breathing with water_breathing_3 at tier 3 (level 7)", () => {
    const effects = getEpicEffects([makeBladeOfWater()], 7);
    expect(effects.spellAbilities).toHaveLength(2);
    const keys = effects.spellAbilities.map((a) => a.key);
    expect(keys).toContain("water_walk_3");
    expect(keys).toContain("water_breathing_3");
    expect(keys).not.toContain("water_breathing");
  });

  it("includes cone_of_cold at tier 4 (level 9)", () => {
    const effects = getEpicEffects([makeBladeOfWater()], 9);
    expect(effects.spellAbilities).toHaveLength(3);
    const cone = effects.spellAbilities.find((a) => a.key === "cone_of_cold");
    expect(cone).toBeDefined();
    expect(cone!.usesPerWeek).toBe(1);
    expect(cone!.usesPerDay).toBe(0);
  });

  it("includes cold_damage_1d6 in miscEffects at tier 3+ (level 7)", () => {
    const effects = getEpicEffects([makeBladeOfWater()], 7);
    expect(effects.miscEffects).toContain("cold_damage_1d6");
  });

  it("does not include cold_damage_1d6 at tier 1-2 (level 5)", () => {
    const effects = getEpicEffects([makeBladeOfWater()], 5);
    expect(effects.miscEffects).not.toContain("cold_damage_1d6");
  });

  it("returns no spellAbilities at tier 0 (level 2)", () => {
    const effects = getEpicEffects([makeBladeOfWater()], 2);
    expect(effects.spellAbilities).toHaveLength(0);
  });

  it("returns empty spellAbilities when no spell_abilities in simple_effects", () => {
    const effects = getEpicEffects([makeCondenser()]);
    expect(effects.spellAbilities).toHaveLength(0);
  });

  it("returns empty spellAbilities when item is not equipped", () => {
    const effects = getEpicEffects([makeBladeOfWater({ equipped: false })], 9);
    expect(effects.spellAbilities).toHaveLength(0);
  });

  it("does not break existing effects when spell_abilities is present", () => {
    const condenser = makeCondenser({ damage_level: 3 });
    const blade = makeBladeOfWater();
    const effects = getEpicEffects([condenser, blade], 9);
    expect(effects.statOverrides.con).toBe(15);
    expect(effects.spellFailure).toBe(10);
    expect(effects.spellAbilities).toHaveLength(3);
  });
});

// ── Bonus Spell Points & HP-to-SP Conversion ──────────────────

function makeNethereseBlooded(overrides: Partial<EpicItemRow> = {}): EpicItemRow {
  return {
    id: "test-netherese-blooded",
    character_id: "char-1",
    slug: "netherese-blooded",
    name: "Netherese Blooded",
    name_en: "Netherese Blooded",
    description: "",
    description_en: null,
    icon: "sparkles",
    equipped: true,
    damage_level: 0,
    max_damage_level: 4,
    damage_levels: {
      "0": { description: "Base", description_en: "Base", effects: [] },
      "1": { description: "L3-4", description_en: "L3-4", effects: [] },
      "2": { description: "L5-6", description_en: "L5-6", effects: [] },
      "3": { description: "L7-8", description_en: "L7-8", effects: [] },
      "4": { description: "L9-10", description_en: "L9-10", effects: [] },
    },
    simple_effects: {
      level_thresholds: [3, 5, 7, 9],
      spell_points_bonus_multiplier: 2,
      hp_to_sp_conversion: { unlock_level: 4, ratio: 2 },
    },
    notes: "",
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("bonus spell points", () => {
  it("scales with characterLevel × multiplier", () => {
    const effects = getEpicEffects([makeNethereseBlooded()], 9);
    expect(effects.bonusSpellPoints).toBe(18);
  });

  it("is 0 when characterLevel is not provided", () => {
    const effects = getEpicEffects([makeNethereseBlooded()]);
    expect(effects.bonusSpellPoints).toBe(0);
  });

  it("is 0 when the item is not equipped", () => {
    const effects = getEpicEffects([makeNethereseBlooded({ equipped: false })], 9);
    expect(effects.bonusSpellPoints).toBe(0);
  });

  it("applies regardless of the item's own unlocked tier", () => {
    // Level 1 is below every level_threshold (tier 0), but the bonus is a
    // base effect, not tied to the item's own damage-level progression.
    const effects = getEpicEffects([makeNethereseBlooded()], 1);
    expect(effects.bonusSpellPoints).toBe(2);
  });

  it("combines additively across multiple items", () => {
    const a = makeNethereseBlooded({ id: "a", slug: "a" });
    const b = makeNethereseBlooded({ id: "b", slug: "b" });
    const effects = getEpicEffects([a, b], 9);
    expect(effects.bonusSpellPoints).toBe(36);
  });
});

describe("HP-to-SP conversion", () => {
  it("is null below the unlock_level tier", () => {
    const effects = getEpicEffects([makeNethereseBlooded()], 7);
    expect(effects.hpToSpConversion).toBeNull();
  });

  it("is set with the correct ratio at the unlock_level tier", () => {
    const effects = getEpicEffects([makeNethereseBlooded()], 9);
    expect(effects.hpToSpConversion).toEqual({ ratio: 2 });
  });

  it("is null when the item is not equipped", () => {
    const effects = getEpicEffects([makeNethereseBlooded({ equipped: false })], 9);
    expect(effects.hpToSpConversion).toBeNull();
  });

  it("does not get overwritten by a second item without conversion", () => {
    const netherese = makeNethereseBlooded();
    const blade = makeBladeOfWater();
    const effects = getEpicEffects([netherese, blade], 9);
    expect(effects.hpToSpConversion).toEqual({ ratio: 2 });
  });
});

describe("getEpicEffects — base_<stat> unequipped semantic", () => {
  it("applies base_con as forceStatOverride when condenser is unequipped", () => {
    const condenser = makeCondenser({
      equipped: false,
      simple_effects: { base_con: 5 },
    });
    const effects = getEpicEffects([condenser]);
    expect(effects.forceStatOverrides.con).toBe(5);
    expect(effects.statOverrides.con).toBeUndefined();
  });

  it("applies damage-level override as forceStatOverride when item declares base_con (authoritative)", () => {
    const condenser = makeCondenser({
      damage_level: 3,
      simple_effects: { base_con: 5 },
    });
    const effects = getEpicEffects([condenser]);
    // Authoritative stat → override goes into forceStatOverrides so it replaces
    // (not max) the stored CON.
    expect(effects.forceStatOverrides.con).toBe(15);
    expect(effects.statOverrides.con).toBeUndefined();
  });

  it("keeps regular statOverrides for items without base_<stat>", () => {
    // Legacy condenser (no base_con) behaves as before — writes to statOverrides
    const condenser = makeCondenser({ damage_level: 3, simple_effects: {} });
    const effects = getEpicEffects([condenser]);
    expect(effects.statOverrides.con).toBe(15);
    expect(effects.forceStatOverrides.con).toBeUndefined();
  });

  it("does NOT apply base_con when item is unequipped but has no base_<stat>", () => {
    const condenser = makeCondenser({ equipped: false, simple_effects: {} });
    const effects = getEpicEffects([condenser]);
    expect(effects.statOverrides.con).toBeUndefined();
    expect(effects.forceStatOverrides.con).toBeUndefined();
  });

  it("scales sub-stats proportionally when forceStatOverride applies", () => {
    // Kondensator off → base_con 5; original con_health was 18, fitness 18
    // scaled: min(5, round(5 * 18/18)) = 5
    expect(scaleSubStat(18, 18, 5)).toBe(5);
    // Less proportional: original sub=12, base_stat=18, override=5
    // scaled: round(5 * 12/18) = 3; clamped to [1, 5] → 3
    expect(scaleSubStat(18, 12, 5)).toBe(3);
  });
});

// ── Thief Skill Bonuses (positive, from epic items) ──────────

function makeShadowdancer(overrides: Partial<EpicItemRow> = {}): EpicItemRow {
  return {
    id: "test-shadowdancer",
    character_id: "char-1",
    slug: "schattentaenzer",
    name: "Schattentänzer",
    name_en: "Shadowdancer",
    description: "",
    description_en: null,
    icon: "sparkles",
    equipped: true,
    damage_level: 0,
    max_damage_level: 4,
    damage_levels: {
      "0": { description: "Base", description_en: "Base", effects: [] },
      "1": { description: "L3-4", description_en: "L3-4", effects: [] },
      "2": {
        description: "L5-6",
        description_en: "L5-6",
        effects: ["thief_bonus_hide_10", "thief_bonus_move_10"],
      },
      "3": { description: "L7-8", description_en: "L7-8", effects: [] },
      "4": { description: "L9-10", description_en: "L9-10", effects: [] },
    },
    simple_effects: {
      level_thresholds: [3, 5, 7, 9],
      spell_abilities: [
        {
          key: "shadow_meld",
          name: "Schattenverschmelzung",
          name_en: "Shadow Meld",
          unlock_level: 1,
          usesPerDay: 3,
          usesPerWeek: 0,
          effect: "Im Schatten verschwinden",
          effect_en: "Vanish into shadows",
        },
        {
          key: "shadow_travel",
          name: "Schattenreise",
          name_en: "Shadow Travel",
          unlock_level: 3,
          usesPerDay: 3,
          usesPerWeek: 0,
          effect: "Durch Schatten reisen",
          effect_en: "Travel through shadows",
        },
        {
          key: "shadow_travel_unlimited",
          name: "Schattenreise (unbegrenzt)",
          name_en: "Shadow Travel (unlimited)",
          unlock_level: 4,
          usesPerDay: -1,
          usesPerWeek: 0,
          replaces: "shadow_travel",
          effect: "Bei Nacht beliebig oft durch Schatten reisen",
          effect_en: "Travel through shadows at will at night",
        },
      ],
    },
    notes: "",
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("thief bonuses", () => {
  // thresholds [3,5,7,9], max_damage_level=4:
  // tier 0 = base (< L3), tier 1 = L3-4, tier 2 = L5-6, tier 3 = L7-8, tier 4 = L9-10
  it("has no thief bonus by default (condenser)", () => {
    expect(getEpicEffects([makeCondenser()]).thiefBonuses).toEqual({});
  });

  it("has no thief bonus below tier 2 (level 4)", () => {
    expect(getEpicEffects([makeShadowdancer()], 4).thiefBonuses).toEqual({});
  });

  it("accumulates hide/move bonus from tier 2 at level 5", () => {
    const fx = getEpicEffects([makeShadowdancer()], 5);
    expect(fx.thiefBonuses.hideInShadows).toBe(10);
    expect(fx.thiefBonuses.moveSilently).toBe(10);
  });

  it("keeps the cumulative bonus at higher tiers (level 9)", () => {
    const fx = getEpicEffects([makeShadowdancer()], 9);
    expect(fx.thiefBonuses.hideInShadows).toBe(10);
    expect(fx.thiefBonuses.moveSilently).toBe(10);
  });

  it("ignores thief bonus when unequipped", () => {
    expect(getEpicEffects([makeShadowdancer({ equipped: false })], 9).thiefBonuses).toEqual({});
  });

  it("replaces shadow_travel with unlimited variant at tier 4 (level 9)", () => {
    const fx = getEpicEffects([makeShadowdancer()], 9);
    const keys = fx.spellAbilities.map((a) => a.key);
    expect(keys).toContain("shadow_meld");
    expect(keys).toContain("shadow_travel_unlimited");
    expect(keys).not.toContain("shadow_travel");
  });
});
