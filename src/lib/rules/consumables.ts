/**
 * Consumable item detection and classification.
 *
 * Consumables are magic items that get used up: Potions (single use, removed after),
 * Scrolls (single use, removed after), and Charged items like Wands/Rods/Staves
 * (charges deducted per use, item remains when depleted).
 */

import type { CharacterEquipmentWithDetails } from "@/lib/supabase/types";

export type ConsumableType = "potion" | "scroll" | "charged";

const CONSUMABLE_CATEGORIES = ["Potion", "Scroll"];
const CHARGED_CATEGORIES = ["Wand/Staff/Rod", "Wand", "Rod", "Staff"];

/**
 * Extract the category from a custom_label with the pattern "Name (Category)".
 * Returns null if no parenthesized category is found.
 */
export function parseCategory(customLabel: string | null): string | null {
  if (!customLabel) return null;
  const match = customLabel.match(/\(([^)]+)\)\s*$/);
  return match ? match[1] : null;
}

/**
 * Determine the consumable type of an equipment item.
 * Returns null if the item is not consumable.
 */
export function getConsumableType(item: CharacterEquipmentWithDetails): ConsumableType | null {
  if (!item.custom_label) return null;
  // Weapons and armor are never consumable
  if (item.weapon_id != null || item.armor_id != null) return null;

  const category = parseCategory(item.custom_label);

  if (category && CONSUMABLE_CATEGORIES.includes(category)) {
    return category.toLowerCase() as "potion" | "scroll";
  }

  if (category && CHARGED_CATEGORIES.includes(category)) {
    return "charged";
  }

  // Items with charges but no recognized category are still charged consumables
  const fx = item.magic_effects;
  if (fx && fx.max_charges != null && fx.max_charges > 0) {
    return "charged";
  }

  return null;
}

/** Check if an equipment item is a consumable (potion, scroll, or charged). */
export function isConsumable(item: CharacterEquipmentWithDetails): boolean {
  return getConsumableType(item) !== null;
}

/**
 * Check if a consumable can currently be used.
 * Returns false for non-consumables and for depleted charged items.
 */
export function canUseConsumable(item: CharacterEquipmentWithDetails): boolean {
  const type = getConsumableType(item);
  if (!type) return false;

  // Potions and scrolls are always usable (single-use, removed on use)
  if (type !== "charged") return true;

  // Charged items require at least one charge remaining
  const fx = item.magic_effects;
  if (fx && fx.max_charges != null && fx.max_charges > 0) {
    return (fx.current_charges ?? 0) > 0;
  }

  // Charged item with no max_charges configured — treat as not usable
  return false;
}
