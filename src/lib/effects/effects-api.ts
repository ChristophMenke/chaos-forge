/**
 * Writes for temporary effects. Thin I/O layer: every operation returns
 * { ok, error, notApproved, before?, after? } instead of throwing, so the UI
 * can react and a future undo/redo can replay the before/after states.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CharacterEffectRow } from "@/lib/supabase/types";
import type { EffectDraft } from "@/lib/rules/effect-presets";

export interface EffectWriteResult {
  ok: boolean;
  error: string | null;
  /** The enforce_approval trigger rejected the write (account not approved yet). */
  notApproved: boolean;
  before?: CharacterEffectRow;
  after?: CharacterEffectRow;
}

type DbError = { message: string; code?: string } | null;

function toResult(error: DbError, extra: Partial<EffectWriteResult> = {}): EffectWriteResult {
  return {
    ok: !error,
    error: error?.message ?? null,
    notApproved: Boolean(error?.message?.includes("user_not_approved")),
    ...extra,
  };
}

/** Starting temporary hit points: the tempHp change of the draft. */
function initialTempHp(draft: EffectDraft): number {
  return draft.modifiers
    .filter((m) => m.target === "tempHp" && m.op === "delta" && !m.condition)
    .reduce((sum, m) => sum + Math.max(0, m.value), 0);
}

export async function createEffect(
  supabase: SupabaseClient,
  characterId: string,
  draft: EffectDraft
): Promise<EffectWriteResult> {
  const { data, error } = await supabase
    .from("character_effects")
    .insert({ character_id: characterId, ...draft, temp_hp_remaining: initialTempHp(draft) })
    .select()
    .single();
  return toResult(error, data ? { after: data as CharacterEffectRow } : {});
}

export async function updateEffect(
  supabase: SupabaseClient,
  before: CharacterEffectRow,
  draft: EffectDraft
): Promise<EffectWriteResult> {
  // A changed temp-HP amount resets the buffer; otherwise what is left stays.
  const tempChanged = initialTempHp(draft) !== initialTempHp(before);
  const { data, error } = await supabase
    .from("character_effects")
    .update({
      ...draft,
      ...(tempChanged ? { temp_hp_remaining: initialTempHp(draft) } : {}),
    })
    .eq("id", before.id)
    .select()
    .single();
  return toResult(error, { before, ...(data ? { after: data as CharacterEffectRow } : {}) });
}

export async function endEffect(
  supabase: SupabaseClient,
  effectId: string
): Promise<EffectWriteResult> {
  const { error } = await supabase
    .from("character_effects")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", effectId);
  return toResult(error);
}

export async function endAllEffects(
  supabase: SupabaseClient,
  characterId: string
): Promise<EffectWriteResult> {
  const { error } = await supabase
    .from("character_effects")
    .update({ ended_at: new Date().toISOString() })
    .eq("character_id", characterId)
    .is("ended_at", null);
  return toResult(error);
}

export async function saveTempHp(
  supabase: SupabaseClient,
  updates: { id: string; temp_hp_remaining: number }[]
): Promise<EffectWriteResult> {
  const results = await Promise.all(
    updates.map((u) =>
      supabase
        .from("character_effects")
        .update({ temp_hp_remaining: u.temp_hp_remaining })
        .eq("id", u.id)
    )
  );
  return toResult(results.map((r) => r.error as DbError).find(Boolean) ?? null);
}
