import { describe, it, expect } from "vitest";
import { collectOwnedItems } from "./owned-items";
import type {
  CharacterInventoryWithDetails,
  CharacterEquipmentWithDetails,
  CharacterRow,
} from "@/lib/supabase/types";

const char = (id: string, name: string) =>
  ({ id, name, avatar_url: null }) as Pick<CharacterRow, "id" | "name" | "avatar_url">;

const inv = (overrides: Partial<CharacterInventoryWithDetails>): CharacterInventoryWithDetails => ({
  id: "inv-1",
  character_id: "char-1",
  item_id: "item-1",
  custom_name: null,
  quantity: 1,
  notes: "",
  item: {
    id: "item-1",
    name: "Heiltrank",
    name_en: "Healing Potion",
    weight: 0.5,
    cost_gp: 50,
    category: "potion",
    source_book: "PHB",
    is_custom: false,
    created_by: null,
  },
  ...overrides,
});

const equip = (
  overrides: Partial<CharacterEquipmentWithDetails>
): CharacterEquipmentWithDetails => ({
  id: "eq-1",
  character_id: "char-1",
  weapon_id: "weapon-1",
  armor_id: null,
  quantity: 1,
  equipped: true,
  hit_bonus: 0,
  damage_bonus: 0,
  magic_effects: {},
  custom_label: null,
  magic_item_id: null,
  weapon: {
    id: "weapon-1",
    name: "Langschwert",
    name_en: "Long Sword",
    damage_sm: "1d8",
    damage_l: "1d12",
    weapon_type: "melee",
    speed: 5,
    weight: 4,
    cost_gp: 15,
    range_short: null,
    range_medium: null,
    range_long: null,
    source_book: "PHB",
    is_custom: false,
    created_by: null,
    proficiency_name: "Long Sword",
  },
  armor: null,
  ...overrides,
});

describe("collectOwnedItems", () => {
  it("returns empty groups when no data", () => {
    const result = collectOwnedItems({
      characters: [char("char-1", "Thalion")],
      inventory: [],
      equipment: [],
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.equipped).toEqual([]);
    expect(result[0]!.inventory).toEqual([]);
  });

  it("groups inventory items by character", () => {
    const result = collectOwnedItems({
      characters: [char("char-1", "Thalion")],
      inventory: [inv({ id: "inv-1", quantity: 3 })],
      equipment: [],
    });
    expect(result[0]!.inventory).toHaveLength(1);
    expect(result[0]!.inventory[0]).toMatchObject({
      sourceRowId: "inv-1",
      sourceType: "inventory",
      name: "Heiltrank",
      quantity: 3,
      equipped: false,
      stackable: true,
    });
  });

  it("uses custom_name when item is a free-text entry", () => {
    const result = collectOwnedItems({
      characters: [char("char-1", "Thalion")],
      inventory: [
        inv({
          id: "inv-2",
          item_id: null,
          custom_name: "Drachenherz",
          item: null,
        }),
      ],
      equipment: [],
    });
    expect(result[0]!.inventory[0]!.name).toBe("Drachenherz");
    expect(result[0]!.inventory[0]!.itemId).toBeNull();
  });

  it("splits equipment into equipped vs not-equipped", () => {
    const result = collectOwnedItems({
      characters: [char("char-1", "Thalion")],
      inventory: [],
      equipment: [
        equip({ id: "eq-1", equipped: true }),
        equip({
          id: "eq-2",
          equipped: false,
          weapon_id: "weapon-2",
          weapon: {
            id: "weapon-2",
            name: "Dolch",
            name_en: "Dagger",
            damage_sm: "1d4",
            damage_l: "1d3",
            weapon_type: "melee",
            speed: 2,
            weight: 0.5,
            cost_gp: 2,
            range_short: 10,
            range_medium: 20,
            range_long: 30,
            source_book: "PHB",
            is_custom: false,
            created_by: null,
            proficiency_name: "Dagger",
          },
        }),
      ],
    });
    expect(result[0]!.equipped).toHaveLength(1);
    expect(result[0]!.equipped[0]!.name).toBe("Langschwert");
    expect(result[0]!.inventory).toHaveLength(1);
    expect(result[0]!.inventory[0]!.name).toBe("Dolch");
  });

  it("marks equipment as non-stackable (quantity always 1)", () => {
    const result = collectOwnedItems({
      characters: [char("char-1", "Thalion")],
      inventory: [],
      equipment: [equip({ id: "eq-1" })],
    });
    expect(result[0]!.equipped[0]!.stackable).toBe(false);
    expect(result[0]!.equipped[0]!.quantity).toBe(1);
  });

  it("handles armor equipment entries", () => {
    const result = collectOwnedItems({
      characters: [char("char-1", "Thalion")],
      inventory: [],
      equipment: [
        equip({
          id: "eq-armor",
          weapon_id: null,
          weapon: null,
          armor_id: "armor-1",
          armor: {
            id: "armor-1",
            name: "Kettenhemd",
            name_en: "Chain Mail",
            ac: 5,
            weight: 20,
            cost_gp: 75,
            max_movement: 9,
            source_book: "PHB",
            is_custom: false,
            created_by: null,
            is_magical_protection: false,
            is_shield: false,
            shield_type: null,
          },
          equipped: false,
        }),
      ],
    });
    expect(result[0]!.inventory[0]!.name).toBe("Kettenhemd");
    expect(result[0]!.inventory[0]!.itemId).toBe("armor-1");
  });

  it("keeps characters without items in the result", () => {
    const result = collectOwnedItems({
      characters: [char("char-1", "Thalion"), char("char-2", "Lyra")],
      inventory: [inv({ character_id: "char-1" })],
      equipment: [],
    });
    expect(result).toHaveLength(2);
    const lyra = result.find((g) => g.character.id === "char-2")!;
    expect(lyra.equipped).toEqual([]);
    expect(lyra.inventory).toEqual([]);
  });

  it("skips inventory rows without any usable name", () => {
    const result = collectOwnedItems({
      characters: [char("char-1", "Thalion")],
      inventory: [inv({ id: "inv-bad", item_id: null, custom_name: null, item: null })],
      equipment: [],
    });
    expect(result[0]!.inventory).toEqual([]);
  });

  it("includes magic-only equipment rows (no weapon/armor FK, custom_label set)", () => {
    const result = collectOwnedItems({
      characters: [char("char-1", "Thalion")],
      inventory: [],
      equipment: [
        equip({
          id: "eq-magic",
          weapon_id: null,
          weapon: null,
          armor_id: null,
          armor: null,
          custom_label: "Amulett der Macht",
          equipped: true,
        }),
      ],
    });
    expect(result[0]!.equipped).toHaveLength(1);
    expect(result[0]!.equipped[0]!.name).toBe("Amulett der Macht");
    expect(result[0]!.equipped[0]!.itemId).toBeNull();
  });

  it("includes character avatar_url for UI", () => {
    const result = collectOwnedItems({
      characters: [{ id: "char-1", name: "Thalion", avatar_url: "/x.webp" }],
      inventory: [],
      equipment: [],
    });
    expect(result[0]!.character.avatar_url).toBe("/x.webp");
  });
});
