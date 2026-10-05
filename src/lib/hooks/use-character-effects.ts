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

function upsert(list: CharacterEffectRow[], row: CharacterEffectRow): CharacterEffectRow[] {
  if (row.ended_at) return list.filter((e) => e.id !== row.id);
  const exists = list.some((e) => e.id === row.id);
  const next = exists ? list.map((e) => (e.id === row.id ? row : e)) : [...list, row];
  return next.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

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
      if (result.ok && result.after) setEffects((prev) => upsert(prev, result.after!));
      return result;
    },
    [characterId]
  );

  const update = useCallback(async (before: CharacterEffectRow, draft: EffectDraft) => {
    const result = await updateEffect(createClient(), before, draft);
    if (result.ok && result.after) setEffects((prev) => upsert(prev, result.after!));
    return result;
  }, []);

  const end = useCallback(
    async (effectId: string): Promise<EffectWriteResult> => {
      const previous = effects;
      setEffects((prev) => prev.filter((e) => e.id !== effectId));
      const result = await endEffect(createClient(), effectId);
      if (!result.ok) setEffects(previous);
      return result;
    },
    [effects]
  );

  const endAll = useCallback(async (): Promise<EffectWriteResult> => {
    const previous = effects;
    setEffects([]);
    const result = await endAllEffects(createClient(), characterId);
    if (!result.ok) setEffects(previous);
    return result;
  }, [characterId, effects]);

  /** Lets temporary hit points absorb damage first; returns the damage left for HP. */
  const absorbDamage = useCallback(
    async (damage: number): Promise<number> => {
      const { updates, remainingDamage } = consumeTempHp(effects, damage);
      if (updates.length === 0) return remainingDamage;
      setEffects((prev) =>
        prev.map((e) => {
          const u = updates.find((x) => x.id === e.id);
          return u ? { ...e, temp_hp_remaining: u.temp_hp_remaining } : e;
        })
      );
      await saveTempHp(createClient(), updates);
      return remainingDamage;
    },
    [effects]
  );

  return { effects, add, update, end, endAll, absorbDamage };
}
