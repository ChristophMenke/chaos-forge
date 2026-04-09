import { describe, it, expect } from "vitest";
import { isMagicItem, isDepleted } from "@/lib/rules/magic-items";
import type { CharacterEquipmentWithDetails } from "@/lib/supabase/types";

function makeEquipment(
  overrides: Partial<CharacterEquipmentWithDetails> = {}
): CharacterEquipmentWithDetails {
  return {
    id: "test-1",
    character_id: "char-1",
    weapon_id: null,
    armor_id: null,
    quantity: 1,
    equipped: true,
    hit_bonus: 0,
    damage_bonus: 0,
    magic_effects: {},
    custom_label: null,
    weapon: null,
    armor: null,
    ...overrides,
  };
}

describe("isMagicItem", () => {
  it("identifies magic items (no weapon/armor, has custom_label)", () => {
    expect(isMagicItem(makeEquipment({ custom_label: "Ring of Protection +1 (Ring)" }))).toBe(true);
  });

  it("rejects weapons", () => {
    expect(isMagicItem(makeEquipment({ weapon_id: "w1" }))).toBe(false);
  });

  it("rejects armor", () => {
    expect(isMagicItem(makeEquipment({ armor_id: "a1" }))).toBe(false);
  });

  it("rejects items without custom_label", () => {
    expect(isMagicItem(makeEquipment())).toBe(false);
  });
});

describe("isDepleted", () => {
  it("returns true when charges are 0", () => {
    expect(isDepleted({ max_charges: 50, current_charges: 0 })).toBe(true);
  });

  it("returns false when charges remain", () => {
    expect(isDepleted({ max_charges: 50, current_charges: 25 })).toBe(false);
  });

  it("returns false when no charge system (max_charges undefined)", () => {
    expect(isDepleted({})).toBe(false);
  });

  it("returns false when max_charges is 0 (no-charge item)", () => {
    expect(isDepleted({ max_charges: 0 })).toBe(false);
  });
});

describe("magic items sorting for play mode", () => {
  it("sorts equipped before unequipped, then alphabetically", () => {
    const items = [
      makeEquipment({ id: "1", custom_label: "Wand of Magic Missiles", equipped: false }),
      makeEquipment({ id: "2", custom_label: "Ring of Protection +1", equipped: true }),
      makeEquipment({ id: "3", custom_label: "Potion of Healing", equipped: true }),
      makeEquipment({ id: "4", custom_label: "Amulet of Health", equipped: false }),
    ];

    const sorted = items.filter(isMagicItem).sort((a, b) => {
      if (a.equipped !== b.equipped) return a.equipped ? -1 : 1;
      return (a.custom_label ?? "").localeCompare(b.custom_label ?? "");
    });

    expect(sorted.map((i) => i.id)).toEqual(["3", "2", "4", "1"]);
  });

  it("filters out weapons and armor from magic items list", () => {
    const items = [
      makeEquipment({ id: "1", custom_label: "Ring of Protection", equipped: true }),
      makeEquipment({ id: "2", weapon_id: "w1", custom_label: null, equipped: true }),
      makeEquipment({ id: "3", armor_id: "a1", custom_label: null, equipped: true }),
      makeEquipment({ id: "4", custom_label: "Potion of Healing", equipped: false }),
    ];

    const magicItems = items.filter(isMagicItem);
    expect(magicItems).toHaveLength(2);
    expect(magicItems.map((i) => i.id)).toEqual(["1", "4"]);
  });
});
