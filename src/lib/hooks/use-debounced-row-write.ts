"use client";

import { useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UndoTable } from "@/lib/undo/tables";

export const ROW_WRITE_DELAY_MS = 400;

export interface RowWrite {
  table: UndoTable;
  id: string;
  field: string;
  value: unknown;
  /** Value before the first change of this burst. */
  before: unknown;
}

interface Pending extends RowWrite {
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Number inputs that save while typing: the page updates at once, the
 * database once the input rests (one write and one undo step per burst
 * instead of one per keystroke). Pending writes are flushed on unmount.
 */
export function useDebouncedRowWrite(
  onWritten: (write: RowWrite, ok: boolean) => void,
  delay = ROW_WRITE_DELAY_MS
) {
  const pending = useRef(new Map<string, Pending>());
  const onWrittenRef = useRef(onWritten);
  useEffect(() => {
    onWrittenRef.current = onWritten;
  });

  const flush = useCallback(async (key: string) => {
    const write = pending.current.get(key);
    if (!write) return;
    clearTimeout(write.timer);
    pending.current.delete(key);
    const { error } = await createClient()
      .from(write.table)
      .update({ [write.field]: write.value })
      .eq("id", write.id);
    onWrittenRef.current(write, !error);
  }, []);

  useEffect(() => {
    const map = pending.current;
    return () => {
      for (const key of [...map.keys()]) void flush(key);
    };
  }, [flush]);

  return useCallback(
    (write: RowWrite) => {
      const key = `${write.table}:${write.id}:${write.field}`;
      const existing = pending.current.get(key);
      if (existing) clearTimeout(existing.timer);
      pending.current.set(key, {
        ...write,
        before: existing ? existing.before : write.before,
        timer: setTimeout(() => void flush(key), delay),
      });
    },
    [delay, flush]
  );
}
