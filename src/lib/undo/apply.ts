/**
 * Writes an undo step back to the database. First every touched row is
 * compared with the state the step left behind; if anything differs (someone
 * else changed it), nothing is written. Thin I/O layer, returns instead of
 * throwing.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { deepEqual, mergeChanges, toDbRow } from "./changes";
import { IGNORED_COLUMNS, isUndoTable, softDeleteColumn } from "./tables";
import type { Row, RowChange, UndoDirection, UndoEntry } from "./types";

export interface ApplyResult {
  ok: boolean;
  /** The database no longer holds what the step wrote. */
  conflict: boolean;
  error: string | null;
}

const OK: ApplyResult = { ok: true, conflict: false, error: null };
const CONFLICT: ApplyResult = { ok: false, conflict: true, error: null };

/** Unique / foreign key violation: the row cannot come back as it was. */
const CONFLICT_CODES = new Set(["23505", "23503"]);

type DbError = { message: string; code?: string } | null;

function fail(error: DbError): ApplyResult {
  if (error?.code && CONFLICT_CODES.has(error.code)) return CONFLICT;
  return { ok: false, conflict: false, error: error?.message ?? "unknown" };
}

/** Is the row (as loaded) in the state `expected` describes? */
function matchesExpected(change: RowChange, current: Row | null, expected: Row | null): boolean {
  const softDelete = softDeleteColumn(change.table);
  const gone = current === null || (softDelete !== undefined && current[softDelete] != null);
  if (expected === null) return gone;
  if (current === null) return false;
  return Object.entries(expected).every(([column, value]) => {
    if ((IGNORED_COLUMNS as readonly string[]).includes(column)) return true;
    if (column === softDelete) return (current[column] != null) === (value != null);
    return deepEqual(current[column], value);
  });
}

async function write(
  supabase: SupabaseClient,
  change: RowChange,
  current: Row | null,
  target: Row | null
): Promise<DbError> {
  const softDelete = softDeleteColumn(change.table);
  const table = supabase.from(change.table);

  if (target === null) {
    if (softDelete) {
      const { error } = await table
        .update({ [softDelete]: new Date().toISOString() })
        .match(change.key);
      return error;
    }
    const { error } = await table.delete().match(change.key);
    return error;
  }

  const values = toDbRow(target);
  for (const column of IGNORED_COLUMNS) delete values[column];
  if (current === null) {
    const { error } = await table.insert({ ...values, ...change.key });
    return error;
  }
  // A soft-deleted row comes back unless the target itself is ended.
  if (softDelete && !(softDelete in values)) values[softDelete] = null;
  const { error } = await table.update(values).match(change.key);
  return error;
}

export async function applyEntry(
  supabase: SupabaseClient,
  entry: UndoEntry,
  direction: UndoDirection
): Promise<ApplyResult> {
  if (entry.kind === "draft") return OK;
  if (!entry.changes.every((c) => isUndoTable(c.table))) {
    return { ok: false, conflict: false, error: "table_not_undoable" };
  }

  // One change per row, so each row is checked against its final state.
  const merged = mergeChanges([], entry.changes);
  const ordered = direction === "undo" ? [...merged].reverse() : merged;

  const loaded: (Row | null)[] = [];
  for (const change of ordered) {
    const { data, error } = await supabase
      .from(change.table)
      .select("*")
      .match(change.key)
      .maybeSingle();
    if (error) return fail(error);
    const current = (data as Row | null) ?? null;
    const expected = direction === "undo" ? change.after : change.before;
    if (!matchesExpected(change, current, expected)) return CONFLICT;
    loaded.push(current);
  }

  for (const [index, change] of ordered.entries()) {
    const target = direction === "undo" ? change.before : change.after;
    const error = await write(supabase, change, loaded[index], target);
    if (error) return fail(error);
  }
  return OK;
}
