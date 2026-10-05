import { IGNORED_COLUMNS, JOIN_FIELDS, tableKeyColumns, type UndoTable } from "./tables";
import type { Row, RowChange } from "./types";

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual((a as Row)[k], (b as Row)[k]));
}

function isIgnored(column: string): boolean {
  return (IGNORED_COLUMNS as readonly string[]).includes(column);
}

/** The row as stored in the table: without joined relations. */
export function toDbRow(row: Row): Row {
  const copy: Row = {};
  for (const [k, v] of Object.entries(row)) {
    if (!(JOIN_FIELDS as readonly string[]).includes(k)) copy[k] = v;
  }
  return copy;
}

function keyOf(table: UndoTable, row: Row): Record<string, string> {
  return Object.fromEntries(tableKeyColumns(table).map((c) => [c, String(row[c])]));
}

interface UiObjects {
  uiBefore?: unknown;
  uiAfter?: unknown;
}

/** An update with only the columns that differ; null when nothing changed. */
export function rowUpdate(
  table: UndoTable,
  key: Record<string, string>,
  before: Row,
  after: Row,
  ui: UiObjects = {}
): RowChange | null {
  const columns = Object.keys(after).filter(
    (c) => !isIgnored(c) && !deepEqual(before[c], after[c])
  );
  if (columns.length === 0) return null;
  return {
    table,
    key,
    before: Object.fromEntries(columns.map((c) => [c, before[c]])),
    after: Object.fromEntries(columns.map((c) => [c, after[c]])),
    ...ui,
  };
}

export function rowInsert(table: UndoTable, row: Row, uiAfter?: unknown): RowChange {
  return {
    table,
    key: keyOf(table, row),
    before: null,
    after: toDbRow(row),
    ...(uiAfter !== undefined ? { uiAfter } : {}),
  };
}

export function rowDelete(table: UndoTable, row: Row, uiBefore?: unknown): RowChange {
  return {
    table,
    key: keyOf(table, row),
    before: toDbRow(row),
    after: null,
    ...(uiBefore !== undefined ? { uiBefore } : {}),
  };
}

export function invertChange(change: RowChange): RowChange {
  return {
    ...change,
    before: change.after,
    after: change.before,
    uiBefore: change.uiAfter,
    uiAfter: change.uiBefore,
  };
}

export function isNoopChange(change: RowChange): boolean {
  if (change.before === null || change.after === null) return change.before === change.after;
  return Object.keys(change.after).every((c) => deepEqual(change.before![c], change.after![c]));
}

function sameRow(a: RowChange, b: RowChange): boolean {
  return a.table === b.table && deepEqual(a.key, b.key);
}

/** Combines two consecutive change lists: first before, latest after per row. */
export function mergeChanges(older: RowChange[], newer: RowChange[]): RowChange[] {
  const merged = [...older];
  for (const change of newer) {
    const index = merged.findIndex((c) => sameRow(c, change));
    if (index === -1) {
      merged.push(change);
      continue;
    }
    const old = merged[index];
    merged[index] = {
      ...old,
      before: old.before === null ? null : { ...change.before, ...old.before },
      after: change.after === null ? null : { ...old.after, ...change.after },
      uiBefore: old.uiBefore,
      uiAfter: change.uiAfter ?? old.uiAfter,
    };
  }
  return merged;
}
