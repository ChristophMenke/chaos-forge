"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import type { NewEntry } from "@/lib/undo/history";
import type { RowChange, UndoDirection, UndoEntry, UndoLabel } from "@/lib/undo/types";

/** Patches page state after an undo/redo; must be idempotent. */
export type UndoListener = (
  changes: RowChange[],
  direction: UndoDirection,
  kind: UndoEntry["kind"]
) => void;

export interface UndoContextValue {
  /** Records a successful write (changes that changed nothing are skipped). */
  record: (entry: NewEntry) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  undoLabel: UndoLabel | null;
  redoLabel: UndoLabel | null;
  busy: boolean;
  subscribe: (listener: UndoListener) => () => void;
  /** Leaves unsaved character sheet input out of the history. */
  dropDraft: () => void;
  /** Saving: all draft steps become one database step. */
  collapseDraft: (saved: NewEntry) => void;
  hasDraft: boolean;
  clear: () => void;
}

export const UndoContext = createContext<UndoContextValue | null>(null);

/** null outside an owned character page (shared view, NPCs in the GM area). */
export function useUndo(): UndoContextValue | null {
  return useContext(UndoContext);
}

/** Registers a state patcher for undo/redo of this page. */
export function useUndoSync(listener: UndoListener) {
  const undo = useUndo();
  const ref = useRef(listener);
  useEffect(() => {
    ref.current = listener;
  });
  const subscribe = undo?.subscribe;
  useEffect(() => {
    if (!subscribe) return;
    return subscribe((changes, direction, kind) => ref.current(changes, direction, kind));
  }, [subscribe]);
}
