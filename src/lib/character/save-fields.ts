import type { CharacterRow } from "@/lib/supabase/types";

/**
 * Fields the character sheet edits as a draft and writes with "Speichern".
 * Tabs that save immediately (equipment, spells, proficiencies, slot
 * adjustments, spell books) are not part of it.
 */
const SAVE_FIELDS = [
  "name",
  "race_id",
  "str",
  "str_exceptional",
  "dex",
  "con",
  "int",
  "wis",
  "cha",
  "hp_current",
  "hp_max",
  "alignment",
  "gold_pp",
  "gold_gp",
  "gold_ep",
  "gold_sp",
  "gold_cp",
  "notes",
  "player_name",
  "age",
  "height_cm",
  "weight_kg",
  "gender",
  "hair_color",
  "eye_color",
  "str_stamina",
  "str_muscle",
  "dex_aim",
  "dex_balance",
  "con_health",
  "con_fitness",
  "int_reason",
  "int_knowledge",
  "wis_intuition",
  "wis_willpower",
  "cha_leadership",
  "cha_appearance",
  "thief_pick_locks",
  "thief_find_traps",
  "thief_move_silently",
  "thief_hide_shadows",
  "thief_climb_walls",
  "thief_detect_noise",
  "thief_read_languages",
  "kit",
  "traits",
  "disadvantages",
  "spell_whitelist",
] as const satisfies readonly (keyof CharacterRow)[];

export type CharacterSaveFields = Pick<CharacterRow, (typeof SAVE_FIELDS)[number]>;

export function buildCharacterSaveFields(character: CharacterRow): CharacterSaveFields {
  return Object.fromEntries(
    SAVE_FIELDS.map((field) => [field, character[field]])
  ) as CharacterSaveFields;
}
