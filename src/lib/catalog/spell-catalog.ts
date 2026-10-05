import { createClient } from "@/lib/supabase/client";
import { fetchAllRows } from "@/lib/supabase/fetch-all-rows";
import type { SpellRow } from "@/lib/supabase/types";

export type SpellCatalogType = "wizard" | "priest";

// Session cache in module scope: the full catalog (~1,300–1,900 rows with
// descriptions) is loaded once per browser session instead of on every dialog
// open. Promises are cached so concurrent callers share one request.
const cache = new Map<SpellCatalogType, Promise<SpellRow[]>>();

/** Slim spell entry for name matching in scan import and rescan. */
export type SpellNameEntry = Pick<SpellRow, "id" | "name" | "name_en" | "level">;

let nameIndexCache: Promise<SpellNameEntry[]> | null = null;

function loadSpells(type: SpellCatalogType): Promise<SpellRow[]> {
  const supabase = createClient();
  return fetchAllRows<SpellRow>(
    () =>
      supabase.from("spells").select("id", { count: "exact", head: true }).eq("spell_type", type),
    (from, to) =>
      supabase
        .from("spells")
        .select("*")
        .eq("spell_type", type)
        .order("level")
        .order("name")
        .order("id")
        .range(from, to)
  );
}

/** All wizard or priest spells, sorted by level and name. */
export function getSpellCatalog(type: SpellCatalogType): Promise<SpellRow[]> {
  const cached = cache.get(type);
  if (cached) return cached;

  const pending = loadSpells(type).catch((error) => {
    cache.delete(type);
    throw error;
  });
  cache.set(type, pending);
  return pending;
}

/** id, names and level of every spell (both types) — enough to match scanned names. */
export function getSpellNameIndex(): Promise<SpellNameEntry[]> {
  if (!nameIndexCache) {
    const supabase = createClient();
    nameIndexCache = fetchAllRows<SpellNameEntry>(
      () => supabase.from("spells").select("id", { count: "exact", head: true }),
      (from, to) =>
        supabase.from("spells").select("id, name, name_en, level").order("id").range(from, to)
    ).catch((error) => {
      nameIndexCache = null;
      throw error;
    });
  }
  return nameIndexCache;
}

/** Drops the cached catalogs, e.g. after a custom spell was created. */
export function invalidateSpellCatalog(): void {
  cache.clear();
  nameIndexCache = null;
}
