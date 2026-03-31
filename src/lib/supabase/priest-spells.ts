import type { SupabaseClient } from "@supabase/supabase-js";
import { getAvailablePriestSpells, isPriestCaster } from "@/lib/rules/magic";
import type { ClassId } from "@/lib/rules/types";
import type { CharacterRow, CharacterClassRow, SpellRow } from "./types";

/**
 * Fetches all available priest spells for a character, considering multiclass,
 * priesthood spheres, and allowed source books.
 */
export async function fetchAvailablePriestSpells(
  supabase: SupabaseClient,
  character: CharacterRow,
  characterClasses: CharacterClassRow[]
): Promise<SpellRow[]> {
  // Find the active priest class (handles multiclass correctly)
  const priestClass = characterClasses.find(
    (cc) => cc.is_active && isPriestCaster(cc.class_id as ClassId)
  );
  if (!priestClass) return [];

  // Fetch all priest spells from DB
  const all: SpellRow[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data: page } = await supabase
      .from("spells")
      .select("*")
      .eq("spell_type", "priest")
      .order("level")
      .order("name")
      .range(from, from + PAGE - 1);
    if (!page || page.length === 0) break;
    all.push(...(page as SpellRow[]));
    if (page.length < PAGE) break;
    from += PAGE;
  }

  // Filter by sphere access + level
  let available = getAvailablePriestSpells(
    priestClass.class_id as ClassId,
    priestClass.level,
    character.priesthood,
    all
  );

  // Apply source book filter
  if (character.allowed_spell_books && character.allowed_spell_books.length > 0) {
    const whitelistSet = new Set(character.spell_whitelist ?? []);
    available = available.filter(
      (s) =>
        whitelistSet.has(s.id) ||
        (s.source_book && character.allowed_spell_books.includes(s.source_book))
    );
  }

  return available;
}
