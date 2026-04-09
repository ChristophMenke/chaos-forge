import { describe, it, expect } from "vitest";
import type {
  MagicItemRow,
  GmBookmarkRow,
  BookmarkEntityType,
  PartyLootItemRow,
} from "@/lib/supabase/types";

// ─── MagicItemRow Type Tests ──────────────────────────────────────────

describe("MagicItemRow type", () => {
  it("accepts a complete magic item", () => {
    const item: MagicItemRow = {
      id: "abc-123",
      name: "Ring des Schutzes +1",
      name_en: "Ring of Protection +1",
      category: "Ring",
      magic_effects: { ac_bonus: -1 },
      weight: 0,
      source_book: "DMG",
      is_custom: false,
      created_by: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(item.name).toBe("Ring des Schutzes +1");
    expect(item.magic_effects.ac_bonus).toBe(-1);
  });

  it("accepts a minimal custom magic item", () => {
    const item: MagicItemRow = {
      id: "def-456",
      name: "Mysterious Amulet",
      name_en: null,
      category: null,
      magic_effects: {},
      weight: 0.5,
      source_book: "Custom",
      is_custom: true,
      created_by: "user-id",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(item.is_custom).toBe(true);
    expect(item.category).toBeNull();
  });

  it("supports complex magic effects", () => {
    const item: MagicItemRow = {
      id: "ghi-789",
      name: "Blade of Water",
      name_en: "Blade of Water",
      category: "Weapon",
      magic_effects: {
        str: 2,
        ac_bonus: -1,
        attack_bonus: 2,
        damage_bonus: 3,
        save_all: 1,
        magic_resistance: 15,
        resistances: ["Cold", "Fire"],
        passive_abilities: ["Water Breathing"],
        spell_abilities: [
          { name: "Cone of Cold", uses_per_day: 1, description: "Frost blast" },
        ],
      },
      weight: 3,
      source_book: "Custom",
      is_custom: true,
      created_by: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(item.magic_effects.resistances).toHaveLength(2);
    expect(item.magic_effects.spell_abilities).toHaveLength(1);
  });
});

// ─── GmBookmarkRow Type + Set Derivation ──────────────────────────────

describe("Bookmark set derivation", () => {
  function deriveBookmarkSet(bookmarks: GmBookmarkRow[]): Set<string> {
    return new Set(bookmarks.map((b) => `${b.entity_type}:${b.entity_id}`));
  }

  const bookmarks: GmBookmarkRow[] = [
    {
      id: "b1",
      user_id: "u1",
      entity_type: "monster",
      entity_id: "m1",
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "b2",
      user_id: "u1",
      entity_type: "npc",
      entity_id: "n1",
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "b3",
      user_id: "u1",
      entity_type: "magic_item",
      entity_id: "mi1",
      created_at: "2026-01-01T00:00:00Z",
    },
  ];

  it("creates correct keys from bookmarks", () => {
    const set = deriveBookmarkSet(bookmarks);
    expect(set.has("monster:m1")).toBe(true);
    expect(set.has("npc:n1")).toBe(true);
    expect(set.has("magic_item:mi1")).toBe(true);
  });

  it("returns false for non-bookmarked items", () => {
    const set = deriveBookmarkSet(bookmarks);
    expect(set.has("monster:m2")).toBe(false);
    expect(set.has("weapon:w1")).toBe(false);
  });

  it("handles empty bookmarks", () => {
    const set = deriveBookmarkSet([]);
    expect(set.size).toBe(0);
  });

  it("handles all entity types", () => {
    const types: BookmarkEntityType[] = [
      "weapon",
      "armor",
      "general_item",
      "magic_item",
      "npc",
      "monster",
    ];
    const allBookmarks: GmBookmarkRow[] = types.map((t, i) => ({
      id: `b${i}`,
      user_id: "u1",
      entity_type: t,
      entity_id: `e${i}`,
      created_at: "2026-01-01T00:00:00Z",
    }));
    const set = deriveBookmarkSet(allBookmarks);
    expect(set.size).toBe(6);
    types.forEach((t, i) => {
      expect(set.has(`${t}:e${i}`)).toBe(true);
    });
  });
});

// ─── Party Magic Item Detection ───────────────────────────────────────

describe("Party magic item detection", () => {
  function isMagicItem(item: PartyLootItemRow): boolean {
    return !!(
      item.magic_item_id ||
      (item.magic_effects && Object.keys(item.magic_effects).length > 0)
    );
  }

  it("detects magic item by magic_item_id", () => {
    const item: PartyLootItemRow = {
      id: "p1",
      item_id: null,
      custom_name: "Ring +1",
      quantity: 1,
      notes: "",
      added_by: "u1",
      created_at: "",
      updated_at: "",
      magic_item_id: "mi1",
    };
    expect(isMagicItem(item)).toBe(true);
  });

  it("detects magic item by non-empty magic_effects", () => {
    const item: PartyLootItemRow = {
      id: "p2",
      item_id: null,
      custom_name: "Cloak +1",
      quantity: 1,
      notes: "",
      added_by: "u1",
      created_at: "",
      updated_at: "",
      magic_effects: { ac_bonus: -1 },
    };
    expect(isMagicItem(item)).toBe(true);
  });

  it("returns false for normal items", () => {
    const item: PartyLootItemRow = {
      id: "p3",
      item_id: "gi1",
      custom_name: null,
      quantity: 3,
      notes: "",
      added_by: "u1",
      created_at: "",
      updated_at: "",
    };
    expect(isMagicItem(item)).toBe(false);
  });

  it("returns false for empty magic_effects", () => {
    const item: PartyLootItemRow = {
      id: "p4",
      item_id: null,
      custom_name: "Rope",
      quantity: 1,
      notes: "",
      added_by: "u1",
      created_at: "",
      updated_at: "",
      magic_effects: {},
    };
    expect(isMagicItem(item)).toBe(false);
  });

  it("returns false for undefined magic_effects", () => {
    const item: PartyLootItemRow = {
      id: "p5",
      item_id: null,
      custom_name: "Torch",
      quantity: 5,
      notes: "",
      added_by: "u1",
      created_at: "",
      updated_at: "",
    };
    expect(isMagicItem(item)).toBe(false);
  });
});
