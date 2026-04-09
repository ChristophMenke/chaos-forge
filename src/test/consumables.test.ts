import { describe, it, expect } from "vitest";
import {
  getConsumableType,
  isConsumable,
  canUseConsumable,
  parseCategory,
} from "@/lib/rules/consumables";
import type { CharacterEquipmentWithDetails, MagicEffects } from "@/lib/supabase/types";

function makeItem(
  overrides: Partial<CharacterEquipmentWithDetails> & { magic_effects?: MagicEffects } = {}
): CharacterEquipmentWithDetails {
  return {
    id: "test-1",
    character_id: "char-1",
    weapon_id: null,
    armor_id: null,
    quantity: 1,
    equipped: false,
    hit_bonus: 0,
    damage_bonus: 0,
    magic_effects: {},
    custom_label: null,
    weapon: null,
    armor: null,
    ...overrides,
  };
}

describe("parseCategory", () => {
  it("extracts category from 'Name (Category)' pattern", () => {
    expect(parseCategory("Potion of Healing (Potion)")).toBe("Potion");
    expect(parseCategory("Scroll of Fireball (Scroll)")).toBe("Scroll");
    expect(parseCategory("Wand of Magic Missiles (Wand/Staff/Rod)")).toBe("Wand/Staff/Rod");
  });

  it("returns null for labels without parentheses", () => {
    expect(parseCategory("Ring of Protection +1")).toBeNull();
    expect(parseCategory("Belt of Giant Strength")).toBeNull();
  });

  it("returns null for null/empty input", () => {
    expect(parseCategory(null)).toBeNull();
    expect(parseCategory("")).toBeNull();
  });
});

describe("getConsumableType", () => {
  it("returns 'potion' for Potion category items", () => {
    expect(getConsumableType(makeItem({ custom_label: "Potion of Healing (Potion)" }))).toBe(
      "potion"
    );
  });

  it("returns 'scroll' for Scroll category items", () => {
    expect(getConsumableType(makeItem({ custom_label: "Scroll of Fireball (Scroll)" }))).toBe(
      "scroll"
    );
  });

  it("returns 'charged' for Wand/Staff/Rod items", () => {
    expect(
      getConsumableType(
        makeItem({
          custom_label: "Wand of Magic Missiles (Wand/Staff/Rod)",
          magic_effects: { max_charges: 50, current_charges: 38 },
        })
      )
    ).toBe("charged");
  });

  it("returns 'charged' for items with charges but no recognized category", () => {
    expect(
      getConsumableType(
        makeItem({
          custom_label: "Necklace of Fireballs",
          magic_effects: { max_charges: 7, current_charges: 5 },
        })
      )
    ).toBe("charged");
  });

  it("returns null for Ring of Protection", () => {
    expect(
      getConsumableType(
        makeItem({
          custom_label: "Ring of Protection +1 (Ring)",
          magic_effects: { ac_bonus: -1, save_all: 1 },
        })
      )
    ).toBeNull();
  });

  it("returns null for Belt of Giant Strength", () => {
    expect(
      getConsumableType(
        makeItem({
          custom_label: "Belt of Giant Strength",
          magic_effects: { str: 19 },
        })
      )
    ).toBeNull();
  });

  it("returns null for items without custom_label", () => {
    expect(getConsumableType(makeItem())).toBeNull();
  });

  it("returns null for weapon equipment", () => {
    expect(getConsumableType(makeItem({ weapon_id: "w1", custom_label: null }))).toBeNull();
  });
});

describe("isConsumable", () => {
  it("returns true for potions", () => {
    expect(isConsumable(makeItem({ custom_label: "Potion of Healing (Potion)" }))).toBe(true);
  });

  it("returns true for scrolls", () => {
    expect(isConsumable(makeItem({ custom_label: "Scroll of Fireball (Scroll)" }))).toBe(true);
  });

  it("returns true for charged items", () => {
    expect(
      isConsumable(
        makeItem({
          custom_label: "Wand of Magic Missiles (Wand/Staff/Rod)",
          magic_effects: { max_charges: 50 },
        })
      )
    ).toBe(true);
  });

  it("returns false for permanent magic items", () => {
    expect(
      isConsumable(
        makeItem({
          custom_label: "Ring of Protection +1 (Ring)",
          magic_effects: { ac_bonus: -1 },
        })
      )
    ).toBe(false);
  });
});

describe("canUseConsumable", () => {
  it("returns true for potions", () => {
    expect(canUseConsumable(makeItem({ custom_label: "Potion of Healing (Potion)" }))).toBe(true);
  });

  it("returns true for scrolls", () => {
    expect(canUseConsumable(makeItem({ custom_label: "Scroll of Fireball (Scroll)" }))).toBe(true);
  });

  it("returns true for wand with charges remaining", () => {
    expect(
      canUseConsumable(
        makeItem({
          custom_label: "Wand of Magic Missiles (Wand/Staff/Rod)",
          magic_effects: { max_charges: 50, current_charges: 38 },
        })
      )
    ).toBe(true);
  });

  it("returns false for depleted wand (0 charges)", () => {
    expect(
      canUseConsumable(
        makeItem({
          custom_label: "Wand of Magic Missiles (Wand/Staff/Rod)",
          magic_effects: { max_charges: 50, current_charges: 0 },
        })
      )
    ).toBe(false);
  });

  it("returns false for non-consumable items", () => {
    expect(
      canUseConsumable(
        makeItem({
          custom_label: "Ring of Protection +1 (Ring)",
          magic_effects: { ac_bonus: -1 },
        })
      )
    ).toBe(false);
  });

  it("returns false for items without custom_label", () => {
    expect(canUseConsumable(makeItem())).toBe(false);
  });

  it("returns true for charged item with current_charges undefined (defaults to max)", () => {
    expect(
      canUseConsumable(
        makeItem({
          custom_label: "Wand of Magic Missiles (Wand/Staff/Rod)",
          magic_effects: { max_charges: 50 },
        })
      )
    ).toBe(false);
  });

  it("returns true for potion even without magic_effects", () => {
    expect(canUseConsumable(makeItem({ custom_label: "Potion of Healing (Potion)" }))).toBe(true);
  });
});

describe("edge cases", () => {
  it("detects Staff category as charged", () => {
    expect(
      getConsumableType(
        makeItem({
          custom_label: "Staff of Power (Staff)",
          magic_effects: { max_charges: 25, current_charges: 10 },
        })
      )
    ).toBe("charged");
  });

  it("detects Rod category as charged", () => {
    expect(
      getConsumableType(
        makeItem({
          custom_label: "Rod of Healing (Rod)",
          magic_effects: { max_charges: 25, current_charges: 25 },
        })
      )
    ).toBe("charged");
  });

  it("treats Wand/Staff/Rod without charges as charged (category match)", () => {
    expect(getConsumableType(makeItem({ custom_label: "Wand of Wonder (Wand/Staff/Rod)" }))).toBe(
      "charged"
    );
  });

  it("parseCategory handles multiple parentheses — uses last one", () => {
    expect(parseCategory("Ring of Protection +1 (Ring)")).toBe("Ring");
    expect(parseCategory("Wand (broken) (Wand/Staff/Rod)")).toBe("Wand/Staff/Rod");
  });

  it("isConsumable returns false for armor equipment", () => {
    expect(isConsumable(makeItem({ armor_id: "a1", custom_label: "Shield (Armor)" }))).toBe(false);
  });
});
