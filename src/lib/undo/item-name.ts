import type { CharacterEquipmentWithDetails } from "@/lib/supabase/types";
import { localized } from "@/lib/utils/localize";

/** Short equipment name for undo labels: own label (without category) or catalog name. */
export function equipmentName(item: CharacterEquipmentWithDetails, locale: string): string {
  const label = item.custom_label?.replace(/\s*\([^)]+\)\s*$/, "");
  if (label) return label;
  const source = item.weapon ?? item.armor;
  return source ? localized(source.name, source.name_en, locale) : "";
}
