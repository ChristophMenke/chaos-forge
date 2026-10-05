"use client";

import { useCallback, useEffect, useId, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  createEffect,
  endAllEffects,
  endEffect,
  saveTempHp,
  updateEffect,
  type EffectWriteResult,
} from "@/lib/effects/effects-api";
import { consumeTempHp } from "@/lib/rules/temporary-effects";
import type { EffectDraft } from "@/lib/rules/effect-presets";
import type { CharacterEffectRow } from "@/lib/supabase/types";
import { useUndo, useUndoSync } from "@/components/undo/undo-context";
import { rowInsert, rowUpdate } from "@/lib/undo/changes";
import type { RowChange, UndoDirection } from "@/lib/undo/types";

function upsert(list: CharacterEffectRow[], row: CharacterEffectRow): CharacterEffectRow[] {
  if (row.ended_at) return list.filter((e) => e.id !== row.id);
  const exists = list.some((e) => e.id === row.id);
  const next = exists ? list.map((e) => (e.id === row.id ? row : e)) : [...list, row];
  return next.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/** The effect list after an undo/redo of effect rows. */
function applyUndo(
  list: CharacterEffectRow[],
  changes: RowChange[],
  direction: UndoDirection
): CharacterEffectRow[] {
  let next = list;
  for (const change of changes) {
    if (change.table !== "character_effects") continue;
    const target = direction === "undo" ? change.before : change.after;
    const ui = (direction === "undo" ? change.uiBefore : change.uiAfter) as
      CharacterEffectRow | undefined;
    const id = change.key.id;
    if (target === null) {
      next = next.filter((e) => e.id !== id);
      continue;
    }
    const base = next.find((e) => e.id === id) ?? ui;
    if (base) next = upsert(next, { ...base, ...target } as CharacterEffectRow);
  }
  return next;
}

const effectKey = (e: CharacterEffectRow) => ({ id: e.id });

/**
 * Active temporary effects of one character: local state, live updates from
 * other tabs (ending is an UPDATE of ended_at, so it arrives over the filtered
 * channel) and the write operations.
 */
export function useCharacterEffects(characterId: string, initial: CharacterEffectRow[]) {
  const [effects, setEffects] = useState(() => initial.filter((e) => !e.ended_at));
  // A per-instance channel suffix — two subscribers with the same topic would
  // share an already-subscribed channel and .on() throws (#174).
  const instanceId = useId().replace(/:/g, "");
  const undo = useUndo();
  useUndoSync((changes, direction) => setEffects((prev) => applyUndo(prev, changes, direction)));

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`character-effects-${characterId}-${instanceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "character_effects",
          filter: `character_id=eq.${characterId}`,
        },
        (payload: RealtimePostgresChangesPayload<CharacterEffectRow>) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as CharacterEffectRow;
          if (!row?.id) return;
          setEffects((prev) => upsert(prev, row));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId, instanceId]);

  const add = useCallback(
    async (draft: EffectDraft): Promise<EffectWriteResult> => {
      const result = await createEffect(createClient(), characterId, draft);
      if (result.ok && result.after) {
        const after = result.after;
        setEffects((prev) => upsert(prev, after));
        undo?.record({
          label: { key: "effectAdded", values: { name: after.name } },
          changes: [rowInsert("character_effects", after, after)],
        });
      }
      return result;
    },
    [characterId, undo]
  );

  const update = useCallback(
    async (before: CharacterEffectRow, draft: EffectDraft) => {
      const result = await updateEffect(createClient(), before, draft);
      if (result.ok && result.after) {
        const after = result.after;
        setEffects((prev) => upsert(prev, after));
        const change = rowUpdate("character_effects", effectKey(before), before, after, {
          uiBefore: before,
          uiAfter: after,
        });
        if (change) {
          undo?.record({
            label: { key: "effectEdited", values: { name: after.name } },
            changes: [change],
          });
        }
      }
      return result;
    },
    [undo]
  );

  /** Ending: before = the active row, after = the row as the database ended it. */
  const endChange = (row: CharacterEffectRow, ended: CharacterEffectRow) =>
    rowUpdate("character_effects", effectKey(row), row, ended, { uiBefore: row, uiAfter: ended });

  const end = useCallback(
    async (effectId: string): Promise<EffectWriteResult> => {
      const previous = effects;
      const row = effects.find((e) => e.id === effectId);
      setEffects((prev) => prev.filter((e) => e.id !== effectId));
      const result = await endEffect(createClient(), effectId);
      if (!result.ok) setEffects(previous);
      else if (row && result.after) {
        const change = endChange(row, result.after);
        if (change) {
          undo?.record({
            label: { key: "effectEnded", values: { name: row.name } },
            changes: [change],
          });
        }
      }
      return result;
    },
    [effects, undo]
  );

  const endAll = useCallback(async (): Promise<EffectWriteResult> => {
    const previous = effects;
    setEffects([]);
    const result = await endAllEffects(createClient(), characterId);
    if (!result.ok) setEffects(previous);
    else {
      const changes = (result.rows ?? []).flatMap((ended) => {
        const row = previous.find((e) => e.id === ended.id);
        const change = row ? endChange(row, ended) : null;
        return change ? [change] : [];
      });
      undo?.record({ label: { key: "effectsEndedAll" }, changes });
    }
    return result;
  }, [characterId, effects, undo]);

  /**
   * Lets temporary hit points absorb damage first. Returns the damage left for
   * HP and the changed rows — the caller records them together with the HP.
   */
  const absorbDamage = useCallback(
    async (damage: number): Promise<{ remainingDamage: number; changes: RowChange[] }> => {
      const { updates, remainingDamage } = consumeTempHp(effects, damage);
      if (updates.length === 0) return { remainingDamage, changes: [] };
      setEffects((prev) =>
        prev.map((e) => {
          const u = updates.find((x) => x.id === e.id);
          return u ? { ...e, temp_hp_remaining: u.temp_hp_remaining } : e;
        })
      );
      const result = await saveTempHp(createClient(), updates);
      if (!result.ok) return { remainingDamage, changes: [] };
      const changes = updates.flatMap((u) => {
        const row = effects.find((e) => e.id === u.id);
        const change = row
          ? rowUpdate("character_effects", effectKey(row), row, {
              temp_hp_remaining: u.temp_hp_remaining,
            })
          : null;
        return change ? [change] : [];
      });
      return { remainingDamage, changes };
    },
    [effects]
  );

  return { effects, add, update, end, endAll, absorbDamage };
}
