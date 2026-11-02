/**
 * The characters SvenBot gets to know for one question: candidates from an
 * RLS-bound query (only heroes the asker could see in the app), selection by
 * name (character-match), then loading and formatting.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadCharacterBundles } from "./character-bundle";
import { formatCharacterBlock } from "./character-format";
import { selectCharacters, type CharacterCandidate } from "./character-match";
import type { CharacterContextInfo } from "./character-info";

export interface CharacterContextInput {
  message: string;
  history: { content: string }[];
  summary: string;
  scope: "player" | "gm";
}

export interface CharacterContext extends CharacterContextInfo {
  /** Markdown for the prompt; empty when no character is involved. */
  block: string;
}

export const EMPTY_CHARACTER_CONTEXT: CharacterContext = { block: "", names: [], groupSize: null };

/** Never throws — without character data SvenBot still answers rules questions. */
export async function buildCharacterContext(
  supabase: SupabaseClient,
  input: CharacterContextInput
): Promise<CharacterContext> {
  try {
    // Must stay the user's client: this query is the privacy boundary.
    const { data, error } = await supabase.from("characters").select("id, name, is_npc, is_active");
    if (error) throw new Error(error.message);
    const candidates = (data ?? []) as CharacterCandidate[];
    if (candidates.length === 0) return EMPTY_CHARACTER_CONTEXT;

    const selection = selectCharacters({ ...input, candidates });
    if (selection.fullIds.length === 0 && selection.groupIds.length === 0) {
      return EMPTY_CHARACTER_CONTEXT;
    }

    const [full, compact] = await Promise.all([
      loadCharacterBundles(supabase, selection.fullIds, "full"),
      loadCharacterBundles(supabase, selection.groupIds, "compact"),
    ]);
    const block = formatCharacterBlock(full, compact);
    if (!block) return EMPTY_CHARACTER_CONTEXT;

    return {
      block,
      names: full.map((b) => b.character.name),
      groupSize: selection.groupSize,
    };
  } catch (err) {
    console.error("SvenBot character context:", err instanceof Error ? err.message : err);
    return EMPTY_CHARACTER_CONTEXT;
  }
}
