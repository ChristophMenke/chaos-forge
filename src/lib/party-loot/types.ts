import type {
  CharacterRow,
  CharacterInventoryWithDetails,
  CharacterEquipmentWithDetails,
} from "@/lib/supabase/types";

export type OwnedItemSourceType = "inventory" | "equipment";

export interface OwnedItem {
  sourceRowId: string;
  sourceType: OwnedItemSourceType;
  characterId: string;
  characterName: string;
  itemId: string | null;
  name: string;
  nameEn: string | null;
  quantity: number;
  equipped: boolean;
  /** True when the row represents a magic item that cannot be stacked. */
  stackable: boolean;
}

export interface OwnedItemGroup {
  character: Pick<CharacterRow, "id" | "name" | "avatar_url">;
  equipped: OwnedItem[];
  inventory: OwnedItem[];
}

export interface CollectOwnedItemsInput {
  characters: Pick<CharacterRow, "id" | "name" | "avatar_url">[];
  inventory: CharacterInventoryWithDetails[];
  equipment: CharacterEquipmentWithDetails[];
}
