import type { SupabaseClient } from "@supabase/supabase-js";
import { isPriestCaster, getPriestSpheres } from "@/lib/rules/magic";
import type { ClassId, PriestSphere } from "@/lib/rules/types";
import type { CharacterRow, CharacterClassRow, SpellRow } from "./types";

/**
 * Compute the max castable spell level for a priest class at a given character level.
 */
function getMaxPriestSpellLevel(classId: ClassId, characterLevel: number): number {
  if (classId === "ranger") {
    if (characterLevel < 8) return 0;
    return characterLevel >= 15 ? 3 : characterLevel >= 12 ? 2 : 1;
  }
  if (classId === "paladin") {
    if (characterLevel < 9) return 0;
    return characterLevel >= 15 ? 4 : characterLevel >= 13 ? 3 : characterLevel >= 11 ? 2 : 1;
  }
  // Full priests (cleric/druid/crusader/monk/shaman)
  const thresholds = [1, 3, 5, 7, 9, 11, 14];
  let maxLevel = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (characterLevel >= thresholds[i]) maxLevel = i + 1;
  }
  return maxLevel;
}

/**
 * Fetches available priest spells for a character, pushing sphere + level filters to the DB.
 * Only fetches spells the character can actually access instead of the full 3200+ spell table.
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

  const classId = priestClass.class_id as ClassId;
  const maxSpellLevel = getMaxPriestSpellLevel(classId, priestClass.level);
  if (maxSpellLevel === 0) return [];

  // Get accessible spheres from the rules engine
  const spheres = getPriestSpheres(classId, character.priesthood, character.alignment);
  const allSphereNames = Object.keys(spheres) as PriestSphere[];
  if (allSphereNames.length === 0) return [];

  // Minor-access spheres are capped at level 3
  const minorSpheres = allSphereNames.filter((s) => spheres[s] === "minor");
  const majorSpheres = allSphereNames.filter((s) => spheres[s] === "major");

  // Build DB query with sphere + level filter
  // For major spheres: all levels up to maxSpellLevel
  // For minor spheres: only levels 1-3 (and capped by maxSpellLevel)
  const minorMaxLevel = Math.min(3, maxSpellLevel);

  let query = supabase
    .from("spells")
    .select("*")
    .eq("spell_type", "priest")
    .order("level")
    .order("name");

  if (minorSpheres.length === 0) {
    // Only major spheres — simple filter
    query = query.in("sphere", majorSpheres).lte("level", maxSpellLevel);
  } else if (majorSpheres.length === 0) {
    // Only minor spheres — cap at level 3
    query = query.in("sphere", minorSpheres).lte("level", minorMaxLevel);
  } else {
    // Both major and minor — fetch both, then filter minor level cap in JS
    query = query.in("sphere", allSphereNames).lte("level", maxSpellLevel);
  }

  const { data: spells } = await query.returns<SpellRow[]>();
  if (!spells || spells.length === 0) return [];

  // Post-filter: cap minor sphere spells to level 3 (only needed when both major+minor exist)
  let available =
    minorSpheres.length > 0 && majorSpheres.length > 0
      ? spells.filter((s) => {
          const access = spheres[s.sphere as PriestSphere];
          if (access === "minor" && s.level > 3) return false;
          return true;
        })
      : spells;

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
