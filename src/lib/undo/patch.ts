/**
 * Applies undone/redone changes to page state (lists of rows or one row), so
 * the open view follows without reloading. Idempotent: applying twice gives
 * the same result.
 */
import { tableKeyColumns, type UndoTable } from "./tables";
import type { Row, RowChange, UndoDirection } from "./types";

function target(change: RowChange, direction: UndoDirection) {
  return direction === "undo"
    ? { row: change.before, ui: change.uiBefore }
    : { row: change.after, ui: change.uiAfter };
}

function sameKey(item: object, change: RowChange): boolean {
  return tableKeyColumns(change.table).every(
    (column) => String((item as Row)[column]) === change.key[column]
  );
}

export function patchList<T extends object>(
  list: T[],
  table: UndoTable,
  changes: RowChange[],
  direction: UndoDirection
): T[] {
  let next = list;
  for (const change of changes) {
    if (change.table !== table) continue;
    const { row, ui } = target(change, direction);
    const exists = next.some((item) => sameKey(item, change));
    if (row === null) {
      if (exists) next = next.filter((item) => !sameKey(item, change));
    } else if (exists) {
      next = next.map((item) => (sameKey(item, change) ? { ...item, ...row } : item));
    } else {
      next = [...next, (ui as T | undefined) ?? (row as T)];
    }
  }
  return next;
}

/** One row (e.g. the character): merges the target columns of its changes. */
export function patchRow<T extends object>(
  item: T,
  table: UndoTable,
  changes: RowChange[],
  direction: UndoDirection
): T {
  let next = item;
  for (const change of changes) {
    if (change.table !== table || !sameKey(item, change)) continue;
    const { row } = target(change, direction);
    if (row) next = { ...next, ...row };
  }
  return next;
}

export function touches(changes: RowChange[], table: UndoTable): boolean {
  return changes.some((c) => c.table === table);
}
