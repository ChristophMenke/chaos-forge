import type { SupabaseClient } from "@supabase/supabase-js";
import type { GameDateRow } from "@/lib/supabase/types";

/**
 * Dünner I/O-Layer für `game_dates`. Bewusst getrennt von `index.ts`, damit die
 * Rechenlogik dort ohne Supabase-Abhängigkeit testbar bleibt.
 */

export interface GameDateWriteInput {
  eventDate: string;
  title: string;
}

export interface CreateGameDateInput extends GameDateWriteInput {
  userId: string;
}

export interface GameDateMutationResult {
  data: GameDateRow | null;
  error: string | null;
}

/** Leerer Titel wird als NULL gespeichert — die UI zeigt dann den Fallback. */
function normalizeTitle(title: string): string | null {
  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function fetchGameDates(supabase: SupabaseClient): Promise<GameDateRow[]> {
  const { data, error } = await supabase
    .from("game_dates")
    .select("*")
    .order("event_date", { ascending: true });

  if (error) {
    console.error("[fetchGameDates] Failed to load game dates:", error.message);
    return [];
  }
  return (data ?? []) as GameDateRow[];
}

export async function createGameDate(
  supabase: SupabaseClient,
  input: CreateGameDateInput
): Promise<GameDateMutationResult> {
  const { data, error } = await supabase
    .from("game_dates")
    .insert({
      event_date: input.eventDate,
      title: normalizeTitle(input.title),
      created_by: input.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[createGameDate] Failed to insert game date:", error.message);
    return { data: null, error: error.message };
  }
  return { data: data as GameDateRow, error: null };
}

export async function updateGameDate(
  supabase: SupabaseClient,
  id: string,
  input: GameDateWriteInput
): Promise<GameDateMutationResult> {
  const { data, error } = await supabase
    .from("game_dates")
    .update({ event_date: input.eventDate, title: normalizeTitle(input.title) })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[updateGameDate] Failed to update game date:", error.message);
    return { data: null, error: error.message };
  }
  return { data: data as GameDateRow, error: null };
}

export async function deleteGameDate(
  supabase: SupabaseClient,
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("game_dates").delete().eq("id", id);

  if (error) {
    console.error("[deleteGameDate] Failed to delete game date:", error.message);
    return { error: error.message };
  }
  return { error: null };
}
