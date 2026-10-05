import { getEffectPreset, presetToDraft } from "@/lib/rules/effect-presets";
import type { CharacterEffectRow, CharacterRow } from "@/lib/supabase/types";

/** Active effect row built from a preset, as the hook would return it. */
export function presetEffect(key: string, index = 0): CharacterEffectRow {
  const preset = getEffectPreset(key);
  if (!preset) throw new Error(`unknown preset ${key}`);
  return {
    id: `fx-${key}-${index}`,
    character_id: "char-1",
    ...presetToDraft(preset, "de"),
    temp_hp_remaining: 0,
    created_by: "user-1",
    created_at: `2026-10-05T10:00:0${index}Z`,
    ended_at: null,
  };
}

export const baseCharacter = {
  id: "char-1",
  name: "Testheld",
  str: 16,
  str_exceptional: null,
  str_muscle: null,
  str_stamina: null,
  dex: 14,
  dex_aim: null,
  dex_balance: null,
  con: 15,
  con_health: null,
  con_fitness: null,
  int: 12,
  int_knowledge: null,
  int_reason: null,
  wis: 12,
  wis_intuition: null,
  wis_willpower: null,
  cha: 13,
  cha_leadership: null,
  cha_appearance: null,
  hp_current: 20,
  hp_max: 30,
} as unknown as CharacterRow;
