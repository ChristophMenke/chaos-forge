/** Database row types — mirrors Supabase schema */

export interface CharacterRow {
  id: string;
  user_id: string;
  name: string;
  level: number;
  race_id: string | null;
  class_id: string | null;
  str: number;
  str_exceptional: number | null;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  hp_current: number;
  hp_max: number;
  notes: string;
  avatar_url: string | null;
  alignment: string;
  xp_current: number;
  gold_pp: number;
  gold_gp: number;
  gold_ep: number;
  gold_sp: number;
  gold_cp: number;
  // Personal details
  player_name: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  gender: string;
  hair_color: string;
  eye_color: string;
  // Ability Sub-Scores (Player's Option)
  str_stamina: number | null;
  str_muscle: number | null;
  dex_aim: number | null;
  dex_balance: number | null;
  con_health: number | null;
  con_fitness: number | null;
  int_reason: number | null;
  int_knowledge: number | null;
  wis_intuition: number | null;
  wis_willpower: number | null;
  cha_leadership: number | null;
  cha_appearance: number | null;
  // Thief Skills (percentage-based, 0-99)
  thief_pick_locks: number;
  thief_find_traps: number;
  thief_move_silently: number;
  thief_hide_shadows: number;
  thief_climb_walls: number;
  thief_detect_noise: number;
  thief_read_languages: number;
  kit: string | null;
  is_public: boolean;
  is_active: boolean;
  // Manual slot adjustments
  weapon_slots_adj: number;
  nwp_slots_adj: number;
  language_slots_adj: number;
  spell_slots_adj: Record<string, number>;
  spell_system: "slots" | "points";
  spell_points_used: number;
  ignore_encumbrance: boolean;
  created_at: string;
  updated_at: string;
}

export interface CharacterInsert {
  name: string;
  level: number;
  race_id: string;
  class_id: string;
  str: number;
  str_exceptional?: number | null;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  hp_current: number;
  hp_max: number;
  notes?: string;
}

export interface CharacterEquipmentRow {
  id: string;
  character_id: string;
  weapon_id: string | null;
  armor_id: string | null;
  quantity: number;
  equipped: boolean;
  hit_bonus: number;
  damage_bonus: number;
}

export interface CharacterSpellRow {
  character_id: string;
  spell_id: string;
  prepared: boolean;
  expended: boolean;
}

export interface WeaponRow {
  id: string;
  name: string;
  name_en: string | null;
  damage_sm: string;
  damage_l: string;
  weapon_type: "melee" | "ranged" | "both";
  speed: number;
  weight: number;
  cost_gp: number;
  range_short: number | null;
  range_medium: number | null;
  range_long: number | null;
  source_book: string;
  is_custom: boolean;
  created_by: string | null;
}

export interface ArmorRow {
  id: string;
  name: string;
  name_en: string | null;
  ac: number;
  weight: number;
  cost_gp: number;
  max_movement: number;
  source_book: string;
  is_custom: boolean;
  is_magical_protection: boolean;
  created_by: string | null;
}

export interface SpellRow {
  id: string;
  name: string;
  name_en: string | null;
  level: number;
  spell_type: "wizard" | "priest";
  school: string | null;
  sphere: string | null;
  range: string;
  duration: string;
  area_of_effect: string;
  components: string[];
  description: string;
  description_en: string | null;
  casting_time: string;
  saving_throw: string;
  source_book: string;
  is_custom: boolean;
  created_by: string | null;
}

export interface CharacterLanguageRow {
  id: string;
  character_id: string;
  language_name: string;
}

export interface CharacterEquipmentWithDetails extends CharacterEquipmentRow {
  weapon: WeaponRow | null;
  armor: ArmorRow | null;
}

export interface CharacterSpellWithDetails extends CharacterSpellRow {
  spell: SpellRow;
}

export interface NonweaponProficiencyRow {
  id: string;
  name: string;
  name_en: string | null;
  ability: string;
  modifier: number;
  group_type: string;
  slots_required: number;
  is_custom: boolean;
  created_by: string | null;
}

export interface CharacterWeaponProficiencyRow {
  id: string;
  character_id: string;
  weapon_name: string;
  specialization: boolean;
}

export interface CharacterNonweaponProficiencyRow {
  id: string;
  character_id: string;
  proficiency_id: string;
}

export interface CharacterNWPWithDetails extends CharacterNonweaponProficiencyRow {
  proficiency: NonweaponProficiencyRow;
}

export interface CharacterFightingStyleRow {
  id: string;
  character_id: string;
  style_id: string;
  slots_invested: number;
}

// ── Epic Items ────────────────────────────────────────────────

export interface DamageLevelEffect {
  stat_overrides?: Partial<Record<"str" | "dex" | "con" | "int" | "wis" | "cha", number>>;
  description: string;
  description_en?: string;
  effects?: string[];
}

export interface EpicItemRow {
  id: string;
  character_id: string;
  slug: string;
  name: string;
  name_en: string | null;
  description: string;
  description_en: string | null;
  icon: string;
  equipped: boolean;
  damage_level: number;
  max_damage_level: number;
  damage_levels: Record<string, DamageLevelEffect>;
  simple_effects: Record<string, unknown>;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ── Sessions ──────────────────────────────────────────────────

export interface SessionRow {
  id: string;
  title: string;
  session_date: string;
  summary: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionEntryRow {
  id: string;
  session_id: string;
  character_id: string;
  user_id: string;
  content: string;
  audio_url: string | null;
  audio_transcription: string | null;
  created_at: string;
  updated_at: string;
}

export interface TagRow {
  id: string;
  name: string;
  type: "npc" | "location" | "item" | "quest";
  color: string;
}

export interface SessionTagRow {
  session_id: string;
  tag_id: string;
}

export interface CharacterClassRow {
  id: string;
  character_id: string;
  class_id: string;
  level: number;
  xp_current: number;
  is_active: boolean;
}

export interface GeneralItemRow {
  id: string;
  name: string;
  name_en: string | null;
  weight: number;
  cost_gp: number;
  category: string;
  source_book: string;
  is_custom: boolean;
  created_by: string | null;
}

export interface CharacterInventoryRow {
  id: string;
  character_id: string;
  item_id: string | null;
  custom_name: string | null;
  quantity: number;
  notes: string;
}

export interface CharacterInventoryWithDetails extends CharacterInventoryRow {
  item: GeneralItemRow | null;
}

export interface CharacterShareRow {
  id: string;
  character_id: string;
  shared_with_user_id: string;
  created_at: string;
}

export interface XpHistoryRow {
  id: string;
  character_id: string;
  session_id: string | null;
  xp_amount: number;
  note: string;
  created_at: string;
}

export interface AppUser {
  id: string;
  email: string;
  display_name: string;
}

export interface ChronicleNpcRow {
  id: string;
  name: string;
  location: string;
  description: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChronicleQuoteRow {
  id: string;
  content: string;
  attributed_to: string;
  created_by: string;
  created_at: string;
}

export interface QuoteReactionRow {
  id: string;
  quote_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}
