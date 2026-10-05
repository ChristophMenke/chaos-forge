/**
 * Test helper: an UndoContext without database or history, that captures the
 * recorded entries and lets tests replay undo/redo into the page listeners.
 */
import { vi } from "vitest";
import { act } from "@testing-library/react";
import type { NewEntry } from "@/lib/undo/history";
import type { UndoDirection } from "@/lib/undo/types";
import { UndoContext, type UndoContextValue, type UndoListener } from "./undo-context";

export function createUndoStub() {
  const entries: NewEntry[] = [];
  const listeners = new Set<UndoListener>();
  const value: UndoContextValue = {
    record: vi.fn((entry: NewEntry) => {
      entries.push(entry);
    }),
    undo: vi.fn(async () => {}),
    redo: vi.fn(async () => {}),
    undoLabel: null,
    redoLabel: null,
    busy: false,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dropDraft: vi.fn(),
    collapseDraft: vi.fn(),
    // Read at render time; pages re-render after recording a draft step.
    get hasDraft() {
      return entries.some((e) => e.kind === "draft");
    },
    clear: vi.fn(),
    registerPending: () => () => {},
  };

  /** Plays the last (or given) recorded entry back into the page. */
  function replay(direction: UndoDirection, entry: NewEntry = entries[entries.length - 1]) {
    act(() => {
      for (const listener of listeners) listener(entry.changes, direction, entry.kind ?? "db");
    });
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <UndoContext.Provider value={value}>{children}</UndoContext.Provider>;
  }

  return { value, entries, replay, Wrapper };
}
