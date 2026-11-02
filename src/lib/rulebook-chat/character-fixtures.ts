/**
 * Character bundles for the SvenBot character-context tests. Test helper only.
 */
import type {
  CharacterClassRow,
  CharacterEffectRow,
  CharacterEquipmentWithDetails,
  CharacterRow,
  CharacterSpellWithDetails,
  EpicItemRow,
  SpellRow,
} from "@/lib/supabase/types";
import type { CharacterBundle } from "./character-bundle";

export function makeCharacter(overrides: Partial<CharacterRow> = {}): CharacterRow {
  return {
    id: "char-1",
    user_id: "user-1",
    name: "Testheld",
    level: 5,
    race_id: "human",
    class_id: null,
    str: 16,
    str_exceptional: null,
    dex: 14,
    con: 15,
    int: 10,
    wis: 12,
    cha: 10,
    hp_current: 30,
    hp_max: 35,
    notes: "GEHEIME NOTIZ",
    avatar_url: null,
    alignment: "true_neutral",
    xp_current: 0,
    gold_pp: 0,
    gold_gp: 0,
    gold_ep: 0,
    gold_sp: 0,
    gold_cp: 0,
    player_name: "Spielerin Anna",
    age: 132,
    height_cm: 181,
    weight_kg: 77,
    gender: "weiblich",
    hair_color: "silbern",
    eye_color: "violett",
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
    thief_pick_locks: 0,
    thief_find_traps: 0,
    thief_move_silently: 0,
    thief_hide_shadows: 0,
    thief_climb_walls: 0,
    thief_detect_noise: 0,
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
    ignore_encumbrance: false,
    allowed_spell_books: [],
    spell_whitelist: [],
    traits: [],
    disadvantages: [],
    created_at: "",
    updated_at: "",
    last_accessed_at: "",
    ...overrides,
  };
}

export function makeClass(
  classId: string,
  level: number,
  extra: Partial<CharacterClassRow> = {}
): CharacterClassRow {
  return {
    id: `class-${classId}`,
    character_id: "char-1",
    class_id: classId,
    level,
    xp_current: 0,
    is_active: true,
    switch_level: null,
    ...extra,
  };
}

export function makeSpell(id: string, level: number, extra: Partial<SpellRow> = {}): SpellRow {
  return {
    id,
    name: id,
    name_en: id,
    level,
    spell_type: "wizard",
    school: "Invocation/Evocation",
    sphere: null,
    range: "",
    duration: "",
    area_of_effect: "",
    components: [],
    description: "LANGE BESCHREIBUNG",
    description_en: null,
    casting_time: "1",
    saving_throw: "None",
    source_book: "PHB",
    is_custom: false,
    created_by: null,
    ...extra,
  };
}

export function learned(
  spell: SpellRow,
  { prepared = false, expended = false } = {}
): CharacterSpellWithDetails {
  return { character_id: "char-1", spell_id: spell.id, prepared, expended, spell };
}

export function makeEffect(
  name: string,
  modifiers: CharacterEffectRow["modifiers"],
  extra: Partial<CharacterEffectRow> = {}
): CharacterEffectRow {
  return {
    id: `fx-${name}`,
    character_id: "char-1",
    name,
    notes: "",
    duration_text: "",
    preset_key: null,
    modifiers,
    flags: [],
    temp_hp_remaining: 0,
    created_by: null,
    created_at: "2026-11-01T10:00:00Z",
    ended_at: null,
    ...extra,
  };
}

export function makeRing(acBonus: number, saveAll: number): CharacterEquipmentWithDetails {
  return {
    id: "eq-ring",
    character_id: "char-1",
    weapon_id: null,
    armor_id: null,
    quantity: 1,
    equipped: true,
    hit_bonus: 0,
    damage_bonus: 0,
    magic_effects: { ac_bonus: acBonus, save_all: saveAll },
    custom_label: "Ring des Schutzes +1",
    weapon: null,
    armor: null,
  };
}

export function makeSword(): CharacterEquipmentWithDetails {
  return {
    id: "eq-sword",
    character_id: "char-1",
    weapon_id: "w-ls",
    armor_id: null,
    quantity: 1,
    equipped: true,
    hit_bonus: 1,
    damage_bonus: 1,
    magic_effects: {},
    custom_label: null,
    weapon: {
      id: "w-ls",
      name: "Langschwert",
      name_en: "Long Sword",
      damage_sm: "1d8",
      damage_l: "1d12",
      weapon_type: "melee",
      speed: 5,
      weight: 4,
      cost_gp: 15,
      range_short: null,
      range_medium: null,
      range_long: null,
      source_book: "PHB",
      is_custom: false,
      created_by: null,
      proficiency_name: "Long Sword",
    },
    armor: null,
  };
}

export function makeChainMail(): CharacterEquipmentWithDetails {
  return {
    id: "eq-chain",
    character_id: "char-1",
    weapon_id: null,
    armor_id: "a-chain",
    quantity: 1,
    equipped: true,
    hit_bonus: 0,
    damage_bonus: 0,
    magic_effects: {},
    custom_label: null,
    weapon: null,
    armor: {
      id: "a-chain",
      name: "Kettenhemd",
      name_en: "Chain Mail",
      ac: 5,
      weight: 40,
      cost_gp: 75,
      max_movement: 9,
      source_book: "PHB",
      is_custom: false,
      is_magical_protection: false,
      is_shield: false,
      shield_type: null,
      created_by: null,
    },
  };
}

export function makeEpicItem(extra: Partial<EpicItemRow> = {}): EpicItemRow {
  return {
    id: "epic-1",
    character_id: "char-1",
    slug: "klinge",
    name: "Klinge des Wassers",
    name_en: "Blade of Water",
    description: "",
    description_en: null,
    icon: "",
    equipped: true,
    damage_level: 1,
    max_damage_level: 4,
    damage_levels: { "1": { description: "Leicht angeschlagen" } },
    simple_effects: {},
    notes: "",
    created_at: "",
    updated_at: "",
    ...extra,
  };
}

export function makeBundle(overrides: Partial<CharacterBundle> = {}): CharacterBundle {
  return {
    character: makeCharacter(),
    classes: [makeClass("fighter", 5)],
    equipment: [],
    epicItems: [],
    weaponProficiencies: [],
    fightingStyles: [],
    effects: [],
    spells: [],
    nonweaponProficiencies: [],
    inventory: [],
    languages: [],
    ...overrides,
  };
}
