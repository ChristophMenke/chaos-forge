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
  deity: string | null;
  priesthood: string | null;
  is_public: boolean;
  is_active: boolean;
  is_npc: boolean;
  npc_visible_to_players: boolean;
  // Manual slot adjustments
  weapon_slots_adj: number;
  nwp_slots_adj: number;
  language_slots_adj: number;
  spell_slots_adj: Record<string, number>;
  spell_system: "slots" | "points";
  spell_points_used: number;
  ignore_encumbrance: boolean;
  allowed_spell_books: string[];
  spell_whitelist: string[];
  traits: TraitEntry[];
  disadvantages: TraitEntry[];
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
}

export interface TraitEntry {
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  cost: number;
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

export interface MagicSpellAbility {
  name: string;
  name_en?: string;
  uses_per_day: number; // 0 = at-will / unlimited
  description: string;
  description_en?: string;
}

export interface MagicItemRow {
  id: string;
  name: string;
  name_en: string | null;
  category: string | null;
  magic_effects: MagicEffects;
  weight: number;
  source_book: string;
  is_custom: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type BookmarkEntityType =
  | "weapon"
  | "armor"
  | "general_item"
  | "magic_item"
  | "npc"
  | "monster";

export interface GmBookmarkRow {
  id: string;
  user_id: string;
  entity_type: BookmarkEntityType;
  entity_id: string;
  created_at: string;
}

export interface MagicStatOverrides {
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  /** Exceptional STR override (e.g. 100 = 18/00 from Gauntlets of Ogre Power) */
  str_exceptional?: number;
}

export interface MagicEffects {
  // Attribute (additive bonuses, e.g. STR +2)
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;

  // Stat overrides — set attribute to fixed value (e.g. Belt of Giant Strength STR=19)
  // When multiple items override the same stat, highest wins (max)
  stat_overrides?: MagicStatOverrides;

  // Combat
  ac_bonus?: number; // Negative = better AC (AD&D descending)
  attack_bonus?: number;
  damage_bonus?: number;

  // Saving Throws
  save_all?: number;
  save_vs_spell?: number;
  save_vs_poison?: number; // Includes Death Magic
  save_vs_breath?: number;
  save_vs_petrification?: number; // Includes Polymorph
  save_vs_rod?: number; // Rod/Staff/Wand

  // Thief Skills
  hide_in_shadows?: number;
  move_silently?: number;
  pick_pockets?: number;
  open_locks?: number;
  find_traps?: number;
  climb_walls?: number;
  detect_noise?: number;
  read_languages?: number;

  // Movement & Perception
  perception_bonus?: number;
  movement_bonus?: number; // In feet (displayed metric in UI)

  // Magic
  magic_resistance?: number; // Percentage (0-100)
  spell_failure?: number; // Percentage (0-100)

  // Charges (Wands/Staves/Rods)
  max_charges?: number;
  current_charges?: number;

  // Spell-Like Abilities
  spell_abilities?: MagicSpellAbility[];

  // Free-form arrays
  resistances?: string[]; // e.g. "Fire Resistance", "Immune to Charm"
  passive_abilities?: string[]; // e.g. "Infravision 18m", "Water Breathing"

  // Meta
  description?: string;
  description_en?: string;
  is_cursed?: boolean;
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
  magic_effects: MagicEffects;
  custom_label: string | null;
  magic_item_id?: string | null;
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
  proficiency_name: string | null;
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
  is_shield: boolean;
  shield_type: "buckler" | "small" | "medium" | "large" | null;
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
  description: string | null;
  description_en: string | null;
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
  image_url: string | null;
  image_generated_at: string | null;
  external_participants: string[];
  xp_awarded: number | null;
}

export interface SessionParticipantRow {
  id: string;
  session_id: string;
  character_id: string;
  created_at: string;
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
  /** Dual-class: level at which the character switched away. NULL = active class. */
  switch_level: number | null;
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
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Enhanced NPC fields
  tier: "normal" | "advanced";
  is_visible_to_players: boolean;
  // Advanced tier fields (nullable)
  race_id: string | null;
  class_ids: string[];
  level: number | null;
  str: number | null;
  dex: number | null;
  con: number | null;
  int: number | null;
  wis: number | null;
  cha: number | null;
  hp_current: number | null;
  hp_max: number | null;
  ac: number | null;
  thac0: number | null;
  equipment_notes: string | null;
  spell_notes: string | null;
  notes: string;
}

export interface MonsterRow {
  id: string;
  name: string;
  name_en: string | null;
  climate_terrain: string | null;
  frequency: string;
  organization: string | null;
  activity_cycle: string | null;
  diet: string | null;
  intelligence: string | null;
  treasure: string | null;
  alignment: string | null;
  ac: number;
  movement: string;
  hit_dice: string;
  hit_dice_value: number;
  thac0: number;
  attacks_per_round: string;
  damage: string;
  special_attacks: string | null;
  special_defenses: string | null;
  magic_resistance: number;
  size: "T" | "S" | "M" | "L" | "H" | "G";
  morale: string;
  morale_value: number;
  xp_value: number;
  default_zone: "melee" | "ranged";
  has_ranged_attack: boolean;
  /** Spell names this monster can cast — matched against combat spell catalog */
  typical_spells: string[] | null;
  image_url: string | null;
  source_book: string;
  description: string | null;
  description_en: string | null;
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

// ── Party Loot ───────────────────────────────────────────

export interface PartyLootGoldRow {
  id: string;
  pp: number;
  gp: number;
  ep: number;
  sp: number;
  cp: number;
  updated_at: string;
  updated_by: string | null;
}

export interface PartyLootItemRow {
  id: string;
  item_id: string | null;
  custom_name: string | null;
  quantity: number;
  notes: string;
  added_by: string;
  created_at: string;
  updated_at: string;
  magic_effects?: MagicEffects;
  custom_label?: string | null;
  magic_item_id?: string | null;
  source_character_id?: string | null;
  source_type?: "inventory" | "equipment" | null;
  source_row_id?: string | null;
  weapon_id?: string | null;
  armor_id?: string | null;
  hit_bonus?: number;
  damage_bonus?: number;
}

export interface PartyLootItemWithDetails extends PartyLootItemRow {
  item: GeneralItemRow | null;
}

// ── Notifications ───────────────────────────────────────

export type NotificationType =
  | "gm_item_received"
  | "gm_gold_received"
  | "party_item_received"
  | "party_gold_received"
  | "trade_item_received"
  | "trade_gold_received"
  | "session_xp_awarded";

export interface NotificationRow {
  id: string;
  user_id: string;
  character_id: string | null;
  type: NotificationType;
  details: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface PartyLootLogRow {
  id: string;
  action:
    | "add_gold"
    | "add_item"
    | "distribute_gold"
    | "distribute_item"
    | "remove_item"
    | "remove_gold";
  user_id: string;
  character_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}
