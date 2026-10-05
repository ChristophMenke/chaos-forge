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
  const pending = useRef<{ entry: NewEntry; at: number }[]>([]);
  const listeners = useRef(new Set<UndoListener>());

  const update = useCallback((next: (h: HistoryState) => HistoryState) => {
    historyRef.current = next(historyRef.current);
    setHistory(historyRef.current);
  }, []);

  const label = useCallback(
    (l: UndoLabel) => t(`labels.${l.key}` as never, l.values as never),
    [t]
  );

  const record = useCallback(
    (entry: NewEntry) => {
      if (busyRef.current) pending.current.push({ entry, at: Date.now() });
      else update((h) => pushEntry(h, entry, Date.now()));
    },
    [update]
  );

  const run = useCallback(
    async (direction: UndoDirection) => {
      const entry =
        direction === "undo" ? peekUndo(historyRef.current) : peekRedo(historyRef.current);
      if (!entry || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      try {
        const result = await applyEntry(createClient(), entry, direction);
        if (result.ok) {
          update(direction === "undo" ? markUndone : markRedone);
          for (const listener of listeners.current) listener(entry.changes, direction);
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
        setBusy(false);
        const queued = pending.current;
        pending.current = [];
        for (const { entry: e, at } of queued) update((h) => pushEntry(h, e, at));
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

  const value = useMemo<UndoContextValue>(
    () => ({
      record,
      undo: () => run("undo"),
      redo: () => run("redo"),
      undoLabel: peekUndo(history)?.label ?? null,
      redoLabel: peekRedo(history)?.label ?? null,
      busy,
      subscribe,
      dropDraft: () => update(dropDraftState),
      collapseDraft: (saved) => update((h) => collapseDraftState(h, saved, Date.now())),
      hasDraft: hasDraftState(history),
      clear: () => update(createHistory),
    }),
    [busy, history, record, run, subscribe, update]
  );

  return <UndoContext.Provider value={value}>{children}</UndoContext.Provider>;
}
