"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { applyEntry } from "@/lib/undo/apply";
import {
  collapseDraft as collapseDraftState,
  createHistory,
  dropDraft as dropDraftState,
  hasDraft as hasDraftState,
  markRedone,
  markUndone,
  peekRedo,
  peekUndo,
  pushEntry,
  removeEntry,
  type HistoryState,
  type NewEntry,
} from "@/lib/undo/history";
import type { UndoDirection, UndoLabel } from "@/lib/undo/types";
import { UndoContext, type UndoContextValue, type UndoListener } from "./undo-context";

/** Undo/redo for one character, kept while switching manage/play/epic. */
export function UndoProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("undo");
  const router = useRouter();
  const [history, setHistory] = useState<HistoryState>(createHistory);
  const historyRef = useRef(history);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const runningRef = useRef(false);
  // History changes requested while an undo/redo runs wait for it, so the
  // cursor still points at the step that was applied.
  const queued = useRef<((h: HistoryState) => HistoryState)[]>([]);
  const listeners = useRef(new Set<UndoListener>());
  const flushers = useRef(new Set<() => Promise<void>>());

  const update = useCallback((next: (h: HistoryState) => HistoryState) => {
    historyRef.current = next(historyRef.current);
    setHistory(historyRef.current);
  }, []);

  const change = useCallback(
    (next: (h: HistoryState) => HistoryState) => {
      if (busyRef.current) queued.current.push(next);
      else update(next);
    },
    [update]
  );

  const label = useCallback(
    (l: UndoLabel) => t(`labels.${l.key}` as never, l.values as never),
    [t]
  );

  const record = useCallback(
    (entry: NewEntry) => {
      const at = Date.now();
      change((h) => pushEntry(h, entry, at));
    },
    [change]
  );

  const run = useCallback(
    async (direction: UndoDirection) => {
      if (runningRef.current) return;
      runningRef.current = true;
      setBusy(true);
      // Pending debounced writes land (and record) first — before the queue
      // closes, so they are the step undone now.
      await Promise.all([...flushers.current].map((flush) => flush()));
      busyRef.current = true;
      try {
        const entry =
          direction === "undo" ? peekUndo(historyRef.current) : peekRedo(historyRef.current);
        if (!entry) return;
        const result = await applyEntry(createClient(), entry, direction);
        if (result.ok) {
          update(direction === "undo" ? markUndone : markRedone);
          for (const listener of listeners.current) listener(entry.changes, direction, entry.kind);
          if (entry.kind === "db") router.refresh();
          toast.success(
            t(direction === "undo" ? "undone" : "redone", { label: label(entry.label) })
          );
        } else if (result.conflict) {
          update((h) => removeEntry(h, entry.id));
          toast.warning(t("conflict"));
        } else {
          toast.error(t("failed"));
        }
      } finally {
        busyRef.current = false;
        runningRef.current = false;
        setBusy(false);
        const waiting = queued.current;
        queued.current = [];
        for (const next of waiting) update(next);
      }
    },
    [label, router, t, update]
  );

  const subscribe = useCallback((listener: UndoListener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  // Stable callbacks: pages use them in effects (e.g. dropDraft on unmount).
  const undo = useCallback(() => run("undo"), [run]);
  const redo = useCallback(() => run("redo"), [run]);
  const dropDraft = useCallback(() => change(dropDraftState), [change]);
  const collapseDraft = useCallback(
    (saved: NewEntry) => {
      const at = Date.now();
      change((h) => collapseDraftState(h, saved, at));
    },
    [change]
  );
  const clear = useCallback(() => change(createHistory), [change]);
  const registerPending = useCallback((flush: () => Promise<void>) => {
    flushers.current.add(flush);
    return () => {
      flushers.current.delete(flush);
    };
  }, []);

  const value = useMemo<UndoContextValue>(
    () => ({
      record,
      undo,
      redo,
      undoLabel: peekUndo(history)?.label ?? null,
      redoLabel: peekRedo(history)?.label ?? null,
      busy,
      subscribe,
      dropDraft,
      collapseDraft,
      hasDraft: hasDraftState(history),
      clear,
      registerPending,
    }),
    [busy, history, record, undo, redo, subscribe, dropDraft, collapseDraft, clear, registerPending]
  );

  return <UndoContext.Provider value={value}>{children}</UndoContext.Provider>;
}
