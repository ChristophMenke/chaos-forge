import { createClient } from "@/lib/supabase/client";
import type { ArmorRow, GeneralItemRow, MagicItemRow, WeaponRow } from "@/lib/supabase/types";

export interface EquipmentCatalogs {
  weapons: WeaponRow[];
  armor: ArmorRow[];
  generalItems: GeneralItemRow[];
  magicItems: MagicItemRow[];
}

// Session cache in module scope: the equipment tab remounts on every visit, so
// without it the four catalogs were re-fetched each time the tab was opened.
let cache: Promise<EquipmentCatalogs> | null = null;

function unwrap<T>(result: { data: T[] | null; error: { message: string } | null }): T[] {
  if (result.error) throw new Error(result.error.message);
  return result.data ?? [];
}

async function loadCatalogs(): Promise<EquipmentCatalogs> {
  const supabase = createClient();
  const [weapons, armor, generalItems, magicItems] = await Promise.all([
    supabase.from("weapons").select("*").order("name"),
    supabase.from("armor").select("*").order("ac", { ascending: false }),
    supabase.from("general_items").select("*").order("name"),
    supabase.from("magic_items").select("*").order("name"),
  ]);

  return {
    weapons: unwrap<WeaponRow>(weapons),
    armor: unwrap<ArmorRow>(armor),
    generalItems: unwrap<GeneralItemRow>(generalItems),
    magicItems: unwrap<MagicItemRow>(magicItems),
  };
}

/** Weapons, armor, general and magic items — loaded once per browser session. */
export function getEquipmentCatalogs(): Promise<EquipmentCatalogs> {
  if (!cache) {
    cache = loadCatalogs().catch((error) => {
      cache = null;
      throw error;
    });
  }
  return cache;
}

/** Drops the cached catalogs after one of them was changed. */
export function invalidateEquipmentCatalogs(): void {
  cache = null;
}
