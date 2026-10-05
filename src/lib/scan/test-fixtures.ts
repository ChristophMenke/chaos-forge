/**
 * Fixture-Helfer für die Rescan-Tests. Bauen minimale, valide Snapshots und
 * Payloads, damit die Testfälle nur noch das Interessante überschreiben.
 */

import type { CharacterRow } from "@/lib/supabase/types";
import type { CharacterSnapshot, MatchCatalogs } from "./character-diff-types";
import type { ScannedUpdatePayload } from "./character-scan-prompt";

export function makeCharacter(overrides: Partial<CharacterRow> = {}): CharacterRow {
  return {
    id: "char-1",
    user_id: "user-1",
    name: "Thalia Sturmwind",
    level: 3,
    race_id: "elf",
    class_id: "thief",
    str: 12,
    str_exceptional: null,
    dex: 17,
    con: 13,
    int: 14,
    wis: 10,
    cha: 15,
    hp_current: 18,
    hp_max: 24,
    notes: "",
    avatar_url: null,
    alignment: "chaotic_neutral",
    xp_current: 5500,
    gold_pp: 0,
    gold_gp: 120,
    gold_ep: 0,
    gold_sp: 30,
    gold_cp: 12,
    player_name: "Anna",
    age: 96,
    height_cm: 170,
    weight_kg: 58,
    gender: "weiblich",
    hair_color: "",
    eye_color: "",
    str_stamina: null,
    str_muscle: null,
    dex_aim: null,
    dex_balance: null,
    con_health: null,
    con_fitness: null,
    int_reason: null,
    int_knowledge: null,
    wis_intuition: null,
    wis_willpower: null,
    cha_leadership: null,
    cha_appearance: null,
    thief_pick_locks: 40,
    thief_find_traps: 30,
    thief_move_silently: 35,
    thief_hide_shadows: 25,
    thief_climb_walls: 60,
    thief_detect_noise: 20,
    thief_read_languages: 0,
    kit: null,
    deity: null,
    priesthood: null,
    is_public: false,
    is_active: true,
    is_npc: false,
    npc_visible_to_players: false,
    weapon_slots_adj: 0,
    nwp_slots_adj: 0,
    language_slots_adj: 0,
    spell_slots_adj: {},
    spell_system: "slots",
    spell_points_used: 0,
    ignore_encumbrance: true,
    allowed_spell_books: ["Player's Handbook"],
    spell_whitelist: [],
    traits: [],
    disadvantages: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    last_accessed_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeSnapshot(overrides: Partial<CharacterSnapshot> = {}): CharacterSnapshot {
  return {
    character: makeCharacter(),
    classes: [
      {
        id: "cc-1",
        character_id: "char-1",
        class_id: "thief",
        level: 3,
        xp_current: 5500,
        is_active: true,
        switch_level: null,
      },
    ],
    equipment: [],
    inventory: [],
    spells: [],
    weaponProficiencies: [],
    nonweaponProficiencies: [],
    fightingStyles: [],
    languages: [],
    ...overrides,
  };
}

export function makePayload(overrides: Partial<ScannedUpdatePayload> = {}): ScannedUpdatePayload {
  return {
    printed: {},
    handwritten: {},
    equipment: [],
    spells: [],
    weaponProficiencies: [],
    nwps: [],
    languages: [],
    ...overrides,
  };
}

export function makeCatalogs(overrides: Partial<MatchCatalogs> = {}): MatchCatalogs {
  return {
    weapons: [
      { id: "w-longsword", name: "Langschwert", name_en: "Long Sword" },
      { id: "w-dagger", name: "Dolch", name_en: "Dagger" },
    ],
    armor: [{ id: "a-leather", name: "Lederrüstung", name_en: "Leather Armor" }],
    nwps: [
      { id: "rope_use", name: "Seilkunde", name_en: "Rope Use" },
      { id: "swimming", name: "Schwimmen", name_en: "Swimming" },
    ],
    spells: [
      { id: "sp-mm", name: "Magisches Geschoss", name_en: "Magic Missile", level: 1 },
      { id: "sp-inv", name: "Unsichtbarkeit", name_en: "Invisibility", level: 2 },
    ],
    ...overrides,
  };
}
