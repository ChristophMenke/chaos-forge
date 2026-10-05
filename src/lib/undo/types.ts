import type { UndoTable } from "./tables";

/** A database row or the changed columns of it. */
export type Row = Record<string, unknown>;

/**
 * One row before and after a write.
 * before = null → the write inserted the row; after = null → it deleted it.
 */
export interface RowChange {
  table: UndoTable;
  key: Record<string, string>;
  before: Row | null;
  after: Row | null;
  /** The UI object (with joins) before/after, so pages can patch their state. */
  uiBefore?: unknown;
  uiAfter?: unknown;
}

/** i18n key below `undo.labels` plus its values. */
export interface UndoLabel {
  key: string;
  values?: Record<string, string | number>;
}

export interface UndoEntry {
  id: string;
  label: UndoLabel;
  changes: RowChange[];
  /** draft = unsaved character sheet input; undo only patches the page. */
  kind: "db" | "draft";
  coalesceKey?: string;
  at: number;
}

export type UndoDirection = "undo" | "redo";
