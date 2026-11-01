/**
 * Which tables go into the admin backup. Every table a migration creates must
 * appear in exactly one list — tables.test.ts fails otherwise, so a new table
 * forces a decision here.
 */

/** Group data and link tables: backed up completely. */
export const FULL_TABLES = [
  "profiles",
  "characters",
  "character_classes",
  "character_equipment",
  "character_spells",
  "character_weapon_proficiencies",
  "character_nonweapon_proficiencies",
  "character_inventory",
  "character_languages",
  "character_fighting_styles",
  "character_shares",
  "character_effects",
  "epic_items",
  "xp_history",
  "sessions",
  "session_entries",
  "session_participants",
  "session_tags",
  "tags",
  "chronicle_npcs",
  "chronicle_quotes",
  "chronicle_quote_reactions",
  "party_loot_gold",
  "party_loot_items",
  "party_loot_log",
  "notifications",
  "gm_bookmarks",
  "game_dates",
] as const;

/** Book reference data the group extends: only rows with is_custom = true. */
export const CUSTOM_ROW_TABLES = [
  "spells",
  "weapons",
  "armor",
  "nonweapon_proficiencies",
  "general_items",
  "magic_items",
] as const;

/** Not backed up, with the reason. */
export const EXCLUDED_TABLES: Record<string, string> = {
  races: "Stammdaten aus dem Player's Handbook (Seed-Migrationen)",
  classes: "Stammdaten aus dem Player's Handbook (Seed-Migrationen)",
  race_class_restrictions: "Stammdaten aus dem Player's Handbook (Seed-Migrationen)",
  rulebook_chunks: "Regelbuch-Embeddings, neu erzeugbar mit scripts/embed-books.ts",
  monsters: "Monster sind laut Entscheidung vom 2026-10-31 nicht Teil des Backups",
};

export type BackupTable = (typeof FULL_TABLES)[number] | (typeof CUSTOM_ROW_TABLES)[number];

/** Tables whose primary key is not `id`. */
const PRIMARY_KEYS: Partial<Record<BackupTable, string[]>> = {
  character_spells: ["character_id", "spell_id"],
  session_tags: ["session_id", "tag_id"],
};

/** A unique sort key per table, required for stable paging (fetchAllRows). */
export function orderColumns(table: string): string[] {
  return PRIMARY_KEYS[table as BackupTable] ?? ["id"];
}
