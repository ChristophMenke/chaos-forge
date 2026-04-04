import { describe, it, expect } from "vitest";
import { computeCharacterCombatData } from "./character-computed";
import type {
  CharacterRow,
  CharacterClassRow,
  CharacterEquipmentWithDetails,
  EpicItemRow,
} from "@/lib/supabase/types";

// Helper: minimal CharacterRow with sensible defaults
function makeCharacter(overrides: Partial<CharacterRow> = {}): CharacterRow {
  return {
    id: "test-char",
    user_id: "test-user",
    name: "Test Fighter",
    level: 5,
    race_id: "human",
    class_id: "fighter",
    str: 16,
    str_exceptional: null,
    dex: 14,
    con: 15,
    int: 10,
    wis: 12,
    cha: 10,
    hp_current: 35,
    hp_max: 40,
    notes: "",
    avatar_url: null,
    alignment: "true_neutral",
    xp_current: 0,
    gold_pp: 0,
    gold_gp: 0,
    gold_ep: 0,
    gold_sp: 0,
    gold_cp: 0,
    player_name: "Test",
    age: null,
    height_cm: null,
    weight_kg: null,
    gender: "",
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
    weapon_slots_adj: 0,
    nwp_slots_adj: 0,
    language_slots_adj: 0,
    spell_slots_adj: {},
    spell_system: "slots" as const,
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

function makeClass(classId: string, level: number): CharacterClassRow {
  return {
    id: `class-${classId}`,
    character_id: "test-char",
    class_id: classId,
    level,
    xp_current: 0,
    is_active: true,
    switch_level: null,
  };
}

describe("computeCharacterCombatData", () => {
  it("computes basic fighter values", () => {
    const char = makeCharacter({ str: 16, dex: 14, int: 10, wis: 12 });
    const classes = [makeClass("fighter", 5)];

    const result = computeCharacterCombatData(char, classes, [], [], []);

    expect(result.thac0).toBe(16); // Fighter L5
    expect(result.classGroups).toEqual(["warrior"]);
    expect(result.primaryClassGroup).toBe("warrior");
    expect(result.maxLevel).toBe(5);
    expect(result.hpCurrent).toBe(35);
    expect(result.hpMax).toBe(40);
    expect(result.perception).toBe(11); // floor((10+12)/2)
    expect(result.thiefSkills).toBeNull();
    expect(result.backstabMultiplier).toBeNull();
    expect(result.saves).toBeDefined();
    expect(result.saves.paralyzation).toBeDefined();
  });

  it("computes AC with armor and shield", () => {
    const char = makeCharacter({ dex: 16 }); // DEX 16 → -2 def adj
    const classes = [makeClass("fighter", 5)];
    const equipment: CharacterEquipmentWithDetails[] = [
      {
        id: "eq-armor",
        character_id: "test-char",
        weapon_id: null,
        armor_id: "armor-1",
        quantity: 1,
        equipped: true,
        hit_bonus: 0,
        damage_bonus: 0,
        magic_effects: {},
        custom_label: null,
        weapon: null,
        armor: {
          id: "armor-1",
          name: "Kettenpanzer",
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
      },
      {
        id: "eq-shield",
        character_id: "test-char",
        weapon_id: null,
        armor_id: "shield-1",
        quantity: 1,
        equipped: true,
        hit_bonus: 0,
        damage_bonus: 0,
        magic_effects: {},
        custom_label: null,
        weapon: null,
        armor: {
          id: "shield-1",
          name: "Schild",
          name_en: "Shield",
          ac: 8,
          weight: 5,
          cost_gp: 3,
          max_movement: 12,
          source_book: "PHB",
          is_custom: false,
          is_magical_protection: false,
          is_shield: true,
          shield_type: "small",
          created_by: null,
        },
      },
    ];

    const result = computeCharacterCombatData(char, classes, equipment, [], []);
    // AC = 5 (chain) - 1 (shield) - 2 (DEX 16) = 2
    expect(result.ac).toBe(2);
  });

  it("computes thief skills for multiclass fighter/thief", () => {
    const char = makeCharacter({
      thief_pick_locks: 55,
      thief_find_traps: 35,
      thief_move_silently: 60,
      thief_hide_shadows: 45,
      thief_climb_walls: 80,
      thief_detect_noise: 40,
      thief_read_languages: 20,
    });
    const classes = [makeClass("fighter", 5), makeClass("thief", 6)];

    const result = computeCharacterCombatData(char, classes, [], [], []);

    expect(result.thiefSkills).not.toBeNull();
    expect(result.thiefSkills!.openLocks).toBe(55);
    expect(result.thiefSkills!.climbWalls).toBe(80);
    expect(result.backstabMultiplier).toBe(3); // Thief L6 → ×3
    expect(result.classGroups).toContain("warrior");
    expect(result.classGroups).toContain("rogue");
  });

  it("computes perception with epic bonus", () => {
    const char = makeCharacter({ int: 14, wis: 16 });
    const classes = [makeClass("fighter", 5)];
    const epicItems: EpicItemRow[] = [
      {
        id: "epic-1",
        character_id: "test-char",
        slug: "totem",
        name: "Totem",
        name_en: "Totem",
        description: "",
        description_en: "",
        icon: "eye",
        equipped: true,
        damage_level: 0,
        max_damage_level: 1,
        damage_levels: { "0": { description: "", description_en: "", effects: [] } },
        simple_effects: { perception_bonus: 3 },
        notes: "",
        created_at: "",
        updated_at: "",
      },
    ];

    const result = computeCharacterCombatData(char, classes, [], epicItems, []);
    // floor((14+16)/2) + 3 = 15 + 3 = 18
    expect(result.perception).toBe(18);
  });

  it("computes shield proficiency bonus", () => {
    const char = makeCharacter({ dex: 10 }); // no DEX adj
    const classes = [makeClass("fighter", 5)];
    const equipment: CharacterEquipmentWithDetails[] = [
      {
        id: "eq-shield",
        character_id: "test-char",
        weapon_id: null,
        armor_id: "shield-1",
        quantity: 1,
        equipped: true,
        hit_bonus: 0,
        damage_bonus: 0,
        magic_effects: {},
        custom_label: null,
        weapon: null,
        armor: {
          id: "shield-1",
          name: "Mittlerer Schild",
          name_en: "Medium Shield",
          ac: 8,
          weight: 7.5,
          cost_gp: 12,
          max_movement: 12,
          source_book: "PHB",
          is_custom: false,
          is_magical_protection: false,
          is_shield: true,
          shield_type: "medium",
          created_by: null,
        },
      },
    ];
    const profs = [{ weapon_name: "Mittlerer Schild", specialization: false }];

    const result = computeCharacterCombatData(char, classes, equipment, [], profs as any);
    // AC = 10 - 1 (shield) - 2 (unarmored warrior) - 3 (medium shield prof) = 4
    expect(result.ac).toBe(4);
  });

  it("handles unarmored warrior bonus", () => {
    const char = makeCharacter({ dex: 10 });
    const classes = [makeClass("fighter", 3)];

    const result = computeCharacterCombatData(char, classes, [], [], []);
    // AC = 10 - 2 (unarmored warrior) = 8
    expect(result.ac).toBe(8);
  });
});
