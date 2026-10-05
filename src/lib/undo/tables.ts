/**
 * Tables undo/redo may write, with their key columns. Everything here belongs
 * to one character and is writable by its owner (RLS).
 */
export const UNDO_TABLES = {
  characters: { key: ["id"] },
  character_classes: { key: ["id"] },
  character_equipment: { key: ["id"] },
  character_inventory: { key: ["id"] },
  character_spells: { key: ["character_id", "spell_id"] },
  character_weapon_proficiencies: { key: ["id"] },
  character_nonweapon_proficiencies: { key: ["id"] },
  character_fighting_styles: { key: ["id"] },
  character_languages: { key: ["id"] },
  xp_history: { key: ["id"] },
  epic_items: { key: ["id"] },
  // Ended effects stay as rows (realtime cannot filter DELETEs).
  character_effects: { key: ["id"], softDelete: "ended_at" },
} as const satisfies Record<string, { key: readonly string[]; softDelete?: string }>;

export type UndoTable = keyof typeof UNDO_TABLES;

export function tableKeyColumns(table: UndoTable): readonly string[] {
  return UNDO_TABLES[table].key;
}

export function softDeleteColumn(table: UndoTable): string | undefined {
  const config = UNDO_TABLES[table];
  return "softDelete" in config ? config.softDelete : undefined;
}

export function isUndoTable(table: string): table is UndoTable {
  return Object.prototype.hasOwnProperty.call(UNDO_TABLES, table);
}

/** Joined relations the pages select alongside the rows (never columns). */
export const JOIN_FIELDS = ["weapon", "armor", "item", "spell", "proficiency"] as const;

/** Columns the database maintains itself; never compared or written back. */
export const IGNORED_COLUMNS = ["created_at", "updated_at"] as const;
