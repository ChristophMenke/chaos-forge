import { describe, it, expect } from "vitest";
import type { CharacterEffectRow, CharacterRow, EffectModifier } from "@/lib/supabase/types";
import {
  getConstitutionModifiers,
  getDexterityModifiers,
  getStrengthModifiers,
  getWisdomModifiers,
} from "./abilities";
import { getEpicEffects } from "./epic-items";
import { getMagicItemEffects } from "./magic-items";
import { aggregateEffects } from "./temporary-effects";
import { resolveEffectiveStats } from "./effective-stats";

const character = {
  str: 16,
  str_exceptional: null,
  str_muscle: null,
  str_stamina: null,
  dex: 14,
  dex_aim: null,
  dex_balance: null,
  con: 15,
  con_health: null,
  con_fitness: null,
  int: 12,
  int_knowledge: null,
  int_reason: null,
  wis: 10,
  wis_intuition: null,
  wis_willpower: null,
  cha: 9,
  cha_leadership: null,
  cha_appearance: null,
} as unknown as CharacterRow;

const noItems = { epicEffects: getEpicEffects([]), magicEffects: getMagicItemEffects([]) };

function effects(...modifiers: EffectModifier[][]) {
  return aggregateEffects(
    modifiers.map(
      (m, i) =>
        ({
          id: `e${i}`,
          name: `Effekt ${i}`,
          modifiers: m,
          flags: [],
          temp_hp_remaining: 0,
          created_at: `2026-10-05T10:00:0${i}Z`,
          ended_at: null,
        }) as unknown as CharacterEffectRow
    )
  );
}

describe("resolveEffectiveStats", () => {
  it("returns the base scores without items or effects", () => {
    const stats = resolveEffectiveStats(character, noItems);
    expect(stats.values).toEqual({ str: 16, dex: 14, con: 15, int: 12, wis: 10, cha: 9 });
    expect(Object.values(stats.modified).some(Boolean)).toBe(false);
    expect(stats.mods.con.hpAdj).toBe(getConstitutionModifiers(15).hpAdj);
  });

  it("keeps the item rules: force override wins, otherwise max(base, overrides) + bonus, capped at 25", () => {
    const magicEffects = {
      ...getMagicItemEffects([]),
      statOverrides: { str: 19 },
      statBonuses: { dex: 2, wis: 30 },
    };
    const epicEffects = {
      ...getEpicEffects([]),
      forceStatOverrides: { con: 5 },
      statOverrides: { int: 11 },
    };
    const stats = resolveEffectiveStats(character, { epicEffects, magicEffects });
    expect(stats.values).toMatchObject({ str: 19, dex: 16, con: 5, int: 12, wis: 25 });
  });

  it("applies an active overclock as Constitution override", () => {
    const epicEffects = {
      ...getEpicEffects([]),
      overclockAbility: { conOverride: 20 } as never,
    };
    const stats = resolveEffectiveStats(character, {
      epicEffects,
      magicEffects: getMagicItemEffects([]),
      overclockActive: true,
    });
    expect(stats.values.con).toBe(20);
    expect(stats.modified.con).toBe(true);
  });

  it("applies temporary effects after the items", () => {
    const stats = resolveEffectiveStats(
      character,
      noItems,
      effects([{ target: "cha", op: "delta", value: -2 }], [{ target: "str", op: "set", value: 5 }])
    );
    expect(stats.values.cha).toBe(7);
    expect(stats.values.str).toBe(5);
    expect(stats.modified).toMatchObject({ cha: true, str: true, dex: false });
    expect(stats.mods.str).toEqual(getStrengthModifiers(5));
  });

  // A Dexterity effect must change the modifiers even when a sub-stat
  // (Balance) would otherwise replace the Dexterity row.
  it("scales sub-stats along with an effect", () => {
    const withBalance = { ...character, dex: 16, dex_balance: 16 } as CharacterRow;
    const stats = resolveEffectiveStats(
      withBalance,
      noItems,
      effects([{ target: "dex", op: "delta", value: -6 }])
    );
    expect(stats.values.dex).toBe(10);
    expect(stats.mods.dex.defensiveAdj).toBe(getDexterityModifiers(10, undefined, 10).defensiveAdj);
  });

  it("reads modifiers at the table floor when an effect drops a score below 3", () => {
    const stats = resolveEffectiveStats(
      character,
      noItems,
      effects([{ target: "wis", op: "delta", value: -9 }])
    );
    expect(stats.values.wis).toBe(1);
    expect(stats.mods.wis).toEqual(getWisdomModifiers(3));
  });

  it("ignores exceptional strength once an effect moves Strength away from 18", () => {
    const strong = { ...character, str: 18, str_exceptional: 76 } as CharacterRow;
    const stats = resolveEffectiveStats(
      strong,
      noItems,
      effects([{ target: "str", op: "delta", value: -2 }])
    );
    expect(stats.mods.str).toEqual(getStrengthModifiers(16));
    expect(resolveEffectiveStats(strong, noItems).mods.str).toEqual(getStrengthModifiers(18, 76));
  });
});
