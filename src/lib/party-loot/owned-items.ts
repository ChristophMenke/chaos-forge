import type {
  CharacterEquipmentWithDetails,
  CharacterInventoryWithDetails,
} from "@/lib/supabase/types";
import type { CollectOwnedItemsInput, OwnedItem, OwnedItemGroup } from "./types";

function inventoryToOwned(
  row: CharacterInventoryWithDetails,
  characterName: string
): OwnedItem | null {
  const name = row.item?.name ?? row.custom_name;
  if (!name) return null;

  return {
    sourceRowId: row.id,
    sourceType: "inventory",
    characterId: row.character_id,
    characterName,
    itemId: row.item?.id ?? null,
    name,
    nameEn: row.item?.name_en ?? null,
    quantity: row.quantity,
    equipped: false,
    stackable: true,
  };
}

function equipmentToOwned(
  row: CharacterEquipmentWithDetails,
  characterName: string
): OwnedItem | null {
  const source = row.weapon ?? row.armor;
  const name = row.custom_label ?? source?.name ?? null;
  if (!name) return null;

  return {
    sourceRowId: row.id,
    sourceType: "equipment",
    characterId: row.character_id,
    characterName,
    itemId: source?.id ?? null,
    name,
    nameEn: source?.name_en ?? null,
    quantity: 1,
    equipped: row.equipped,
    stackable: false,
  };
}

export function collectOwnedItems(input: CollectOwnedItemsInput): OwnedItemGroup[] {
  const groups = new Map<string, OwnedItemGroup>();

  for (const character of input.characters) {
    groups.set(character.id, {
      character,
      equipped: [],
      inventory: [],
    });
  }

  for (const row of input.inventory) {
    const group = groups.get(row.character_id);
    if (!group) continue;
    const owned = inventoryToOwned(row, group.character.name);
    if (owned) group.inventory.push(owned);
  }

  for (const row of input.equipment) {
    const group = groups.get(row.character_id);
    if (!group) continue;
    const owned = equipmentToOwned(row, group.character.name);
    if (!owned) continue;
    if (owned.equipped) {
      group.equipped.push(owned);
    } else {
      group.inventory.push(owned);
    }
  }

  return Array.from(groups.values());
}
