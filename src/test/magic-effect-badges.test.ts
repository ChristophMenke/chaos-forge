import { describe, it, expect } from "vitest";
import { getMagicEffectBadgeList } from "@/components/shared/magic-effect-badges";
import type { MagicEffects } from "@/lib/supabase/types";

describe("getMagicEffectBadgeList", () => {
  it("returns empty array for empty effects", () => {
    expect(getMagicEffectBadgeList({})).toEqual([]);
  });

  it("returns empty array for null-like effects", () => {
    expect(getMagicEffectBadgeList(null as unknown as MagicEffects)).toEqual([]);
  });

  it("generates attribute badges", () => {
    const badges = getMagicEffectBadgeList({ str: 3, dex: -1 });
    expect(badges).toContain("STR +3");
    expect(badges).toContain("DEX -1");
  });

  it("generates combat badges", () => {
    const badges = getMagicEffectBadgeList({ ac_bonus: -2, attack_bonus: 1, damage_bonus: 3 });
    expect(badges).toContain("AC -2");
    expect(badges).toContain("Atk +1");
    expect(badges).toContain("Dmg +3");
  });

  it("generates save badges", () => {
    const badges = getMagicEffectBadgeList({ save_all: 2, save_vs_spell: 1 });
    expect(badges).toContain("Saves +2");
    expect(badges).toContain("vs Spell +1");
  });

  it("generates perception and movement badges", () => {
    const badges = getMagicEffectBadgeList({ perception_bonus: 3, movement_bonus: 6 });
    expect(badges).toContain("Perception +3");
    expect(badges).toContain("Mov +6");
  });

  it("generates magic resistance and spell failure badges", () => {
    const badges = getMagicEffectBadgeList({ magic_resistance: 25, spell_failure: 10 });
    expect(badges).toContain("MR 25%");
    expect(badges).toContain("Spell Fail 10%");
  });

  it("generates charges badge", () => {
    const badges = getMagicEffectBadgeList({ max_charges: 10, current_charges: 7 });
    expect(badges).toContain("7/10 charges");
  });

  it("generates charges badge with 0 current", () => {
    const badges = getMagicEffectBadgeList({ max_charges: 5 });
    expect(badges).toContain("0/5 charges");
  });

  it("includes resistances and passive abilities", () => {
    const badges = getMagicEffectBadgeList({
      resistances: ["Fire Resistance"],
      passive_abilities: ["Infravision 18m"],
    });
    expect(badges).toContain("Fire Resistance");
    expect(badges).toContain("Infravision 18m");
  });

  it("includes spell abilities", () => {
    const badges = getMagicEffectBadgeList({
      spell_abilities: [
        { name: "Fireball", uses_per_day: 3, description: "A ball of fire" },
        { name: "Detect Magic", uses_per_day: 0, description: "Detect magic" },
      ],
    });
    expect(badges).toContain("Fireball (3/day)");
    expect(badges).toContain("Detect Magic (at-will)");
  });

  it("handles comprehensive item with all effects", () => {
    const badges = getMagicEffectBadgeList({
      str: 2,
      ac_bonus: -1,
      save_all: 1,
      magic_resistance: 15,
      resistances: ["Cold"],
    });
    expect(badges).toHaveLength(5);
  });
});
