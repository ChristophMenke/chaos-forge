/**
 * Undo history as pure functions: entries[0..cursor) can be undone,
 * entries[cursor..) can be redone.
 */
import { isNoopChange, mergeChanges } from "./changes";
import type { UndoEntry } from "./types";

export const MAX_ENTRIES = 50;
/** Changes with the same coalesceKey closer than this form one step. */
export const COALESCE_MS = 1000;

export interface HistoryState {
  entries: UndoEntry[];
  cursor: number;
  /** The newest entry may still absorb changes (no undo/redo since). */
  coalesceOpen: boolean;
}

export type NewEntry = Omit<UndoEntry, "id" | "at" | "kind"> & { kind?: UndoEntry["kind"] };

let nextId = 0;

export function createHistory(): HistoryState {
  return { entries: [], cursor: 0, coalesceOpen: false };
}

export const clearHistory = createHistory;

export function pushEntry(state: HistoryState, input: NewEntry, now: number): HistoryState {
  const entries = state.entries.slice(0, state.cursor);
  const last = entries[entries.length - 1];
  const changes = input.changes.filter((c) => !isNoopChange(c));

  if (
    state.coalesceOpen &&
    last &&
    input.coalesceKey &&
    last.coalesceKey === input.coalesceKey &&
    last.kind === (input.kind ?? "db") &&
    now - last.at < COALESCE_MS
  ) {
    const merged = mergeChanges(last.changes, changes).filter((c) => !isNoopChange(c));
    const rest = entries.slice(0, -1);
    const next =
      merged.length === 0
        ? rest
        : [...rest, { ...last, label: input.label, changes: merged, at: now }];
    return { entries: next, cursor: next.length, coalesceOpen: true };
  }

  if (changes.length === 0) return { ...state, entries, cursor: entries.length };

  const entry: UndoEntry = {
    id: `undo-${++nextId}`,
    label: input.label,
    changes,
    kind: input.kind ?? "db",
    coalesceKey: input.coalesceKey,
    at: now,
  };
  const next = [...entries, entry].slice(-MAX_ENTRIES);
  return { entries: next, cursor: next.length, coalesceOpen: true };
}

export function peekUndo(state: HistoryState): UndoEntry | null {
  return state.cursor > 0 ? state.entries[state.cursor - 1] : null;
}

export function peekRedo(state: HistoryState): UndoEntry | null {
  return state.entries[state.cursor] ?? null;
}

export function markUndone(state: HistoryState): HistoryState {
  return { ...state, cursor: Math.max(0, state.cursor - 1), coalesceOpen: false };
}

export function markRedone(state: HistoryState): HistoryState {
  return {
    ...state,
    cursor: Math.min(state.entries.length, state.cursor + 1),
    coalesceOpen: false,
  };
}

function keepOnly(state: HistoryState, keep: (e: UndoEntry) => boolean): HistoryState {
  const undoable = state.entries.slice(0, state.cursor).filter(keep);
  const redoable = state.entries.slice(state.cursor).filter(keep);
  return {
    entries: [...undoable, ...redoable],
    cursor: undoable.length,
    coalesceOpen: false,
  };
}

/** A step that could not be applied (conflict) leaves the history. */
export function removeEntry(state: HistoryState, id: string): HistoryState {
  return keepOnly(state, (e) => e.id !== id);
}

export function dropDraft(state: HistoryState): HistoryState {
  return keepOnly(state, (e) => e.kind !== "draft");
}

/** Saving turns all draft steps into one database step on top. */
export function collapseDraft(state: HistoryState, saved: NewEntry, now: number): HistoryState {
  return pushEntry(dropDraft(state), { ...saved, kind: "db" }, now);
}

export function hasDraft(state: HistoryState): boolean {
  return state.entries.slice(0, state.cursor).some((e) => e.kind === "draft");
}
