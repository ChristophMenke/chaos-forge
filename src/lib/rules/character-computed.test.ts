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

  // ─── Custom Items with explicit type tagging ──────────────────────────

  describe("custom items with explicit type tagging", () => {
    function makeEquip(
      id: string,
      armorData: Partial<CharacterEquipmentWithDetails["armor"]> & { name: string }
    ): CharacterEquipmentWithDetails {
      return {
        id,
        character_id: "test-char",
        weapon_id: null,
        armor_id: id,
        quantity: 1,
        equipped: true,
        hit_bonus: 0,
        damage_bonus: 0,
        magic_effects: {},
        custom_label: null,
        weapon: null,
        armor: {
          id,
          name: armorData.name,
          name_en: armorData.name_en ?? null,
          ac: armorData.ac ?? 10,
          weight: armorData.weight ?? 0,
          cost_gp: armorData.cost_gp ?? 0,
          max_movement: armorData.max_movement ?? 12,
          source_book: armorData.source_book ?? "PHB",
          is_custom: armorData.is_custom ?? true,
          is_magical_protection: armorData.is_magical_protection ?? false,
          is_shield: armorData.is_shield ?? false,
          shield_type: armorData.shield_type ?? null,
          created_by: armorData.created_by ?? null,
        },
      };
    }

    it("custom armor (is_custom=true) applies AC correctly", () => {
      const char = makeCharacter({ dex: 10 });
      const classes = [makeClass("fighter", 5)];
      // Custom "Drachenrüstung" with proficiency name "Plattenpanzer" (AC 3)
      const equipment = [
        makeEquip("custom-armor", {
          name: "Plattenpanzer",
          name_en: "Plate Mail",
          ac: 3,
          weight: 45,
          is_custom: true,
          is_shield: false,
        }),
      ];

      const result = computeCharacterCombatData(char, classes, equipment, [], []);
      // AC = 3 (plate) + 0 (no DEX adj for DEX 10) = 3
      expect(result.ac).toBe(3);
    });

    it("custom shield (is_shield=true, shield_type set) gives -1 AC", () => {
      const char = makeCharacter({ dex: 10 });
      const classes = [makeClass("fighter", 5)];
      const equipment = [
        makeEquip("custom-shield", {
          name: "Mittlerer Schild",
          is_custom: true,
          is_shield: true,
          shield_type: "medium",
        }),
      ];

      const result = computeCharacterCombatData(char, classes, equipment, [], []);
      // AC = 10 - 1 (shield) - 2 (unarmored warrior) = 7
      expect(result.ac).toBe(7);
    });

    it("custom shield with proficiency gives shield proficiency bonus", () => {
      const char = makeCharacter({ dex: 10 });
      const classes = [makeClass("fighter", 5)];
      const equipment = [
        makeEquip("custom-shield", {
          name: "Großer Schild",
          is_custom: true,
          is_shield: true,
          shield_type: "large",
        }),
      ];
      // Character has proficiency for "Großer Schild"
      const profs = [{ weapon_name: "Großer Schild", specialization: false }];

      const result = computeCharacterCombatData(char, classes, equipment, [], profs as any);
      // AC = 10 - 1 (shield) - 2 (unarmored warrior) - 3 (large shield prof) = 4
      expect(result.ac).toBe(4);
    });

    it("custom shield without matching proficiency gives NO proficiency bonus", () => {
      const char = makeCharacter({ dex: 10 });
      const classes = [makeClass("fighter", 5)];
      const equipment = [
        makeEquip("custom-shield", {
          name: "Großer Schild",
          is_custom: true,
          is_shield: true,
          shield_type: "large",
        }),
      ];
      // Character has proficiency for a DIFFERENT shield type
      const profs = [{ weapon_name: "Buckler", specialization: false }];

      const result = computeCharacterCombatData(char, classes, equipment, [], profs as any);
      // AC = 10 - 1 (shield) - 2 (unarmored warrior) = 7 (no prof bonus)
      expect(result.ac).toBe(7);
    });

    it("custom armor + custom shield together compute AC correctly", () => {
      const char = makeCharacter({ dex: 16 }); // DEX 16 → -2
      const classes = [makeClass("fighter", 5)];
      const equipment = [
        makeEquip("custom-armor", {
          name: "Kettenpanzer",
          ac: 5,
          weight: 40,
          is_custom: true,
          is_shield: false,
        }),
        makeEquip("custom-shield", {
          name: "Buckler",
          is_custom: true,
          is_shield: true,
          shield_type: "buckler",
        }),
      ];
      const profs = [{ weapon_name: "Buckler", specialization: false }];

      const result = computeCharacterCombatData(char, classes, equipment, [], profs as any);
      // AC = 5 (chain) - 1 (shield) - 2 (DEX) - 1 (buckler prof) = 1
      expect(result.ac).toBe(1);
    });

    it("custom magical protection item counts as unarmored for warrior bonus", () => {
      const char = makeCharacter({ dex: 10 });
      const classes = [makeClass("fighter", 5)];
      const equipment = [
        makeEquip("custom-bracers", {
          name: "Armschienen",
          ac: 4, // Bracers of Defense AC 4 → gives -4 bonus from base 10
          is_custom: true,
          is_shield: false,
          is_magical_protection: true,
        }),
      ];

      const result = computeCharacterCombatData(char, classes, equipment, [], []);
      // Magical protection: base 10 - 4 (bracers) - 2 (unarmored warrior) = 4
      expect(result.ac).toBe(4);
    });

    it("custom item with is_shield=false is NOT treated as shield", () => {
      const char = makeCharacter({ dex: 10 });
      const classes = [makeClass("fighter", 5)];
      // An armor item whose name contains "Schild" but is_shield=false
      const equipment = [
        makeEquip("not-a-shield", {
          name: "Schildkrötenrüstung",
          ac: 4,
          is_custom: true,
          is_shield: false, // Explicitly NOT a shield despite name
          shield_type: null,
        }),
      ];

      const result = computeCharacterCombatData(char, classes, equipment, [], []);
      // Should be treated as regular armor (AC 4), NOT as a shield
      // AC = 4 (armor replaces base) + 0 (no shield) + 0 (no DEX adj) = 4
      // No unarmored bonus because character IS armored
      expect(result.ac).toBe(4);
    });

    it("shield_type from DB is used for equipped shield detection", () => {
      const char = makeCharacter({ dex: 10 });
      const classes = [makeClass("fighter", 5)];
      // Shield named with standard proficiency name "Mittlerer Schild"
      // but created as custom item with explicit is_shield + shield_type
      const equipment = [
        makeEquip("magic-shield", {
          name: "Mittlerer Schild",
          name_en: "Medium Shield",
          is_custom: true,
          is_shield: true,
          shield_type: "medium",
        }),
      ];
      // Proficiency matches by shield_type (medium) via getShieldType("Mittlerer Schild")
      const profs = [{ weapon_name: "Mittlerer Schild", specialization: false }];

      const result = computeCharacterCombatData(char, classes, equipment, [], profs as any);
      // AC = 10 - 1 (shield) - 2 (unarmored warrior) - 3 (medium shield prof) = 4
      expect(result.ac).toBe(4);
    });

    it("custom shield with non-standard name uses DB shield_type for AC", () => {
      const char = makeCharacter({ dex: 10 });
      const classes = [makeClass("fighter", 5)];
      // Custom shield with unusual name — is_shield=true means it gives -1 AC
      const equipment = [
        makeEquip("fancy-shield", {
          name: "Flammenbarriere",
          is_custom: true,
          is_shield: true,
          shield_type: "large",
        }),
      ];

      const result = computeCharacterCombatData(char, classes, equipment, [], []);
      // AC = 10 - 1 (shield via is_shield=true) - 2 (unarmored warrior) = 7
      // No proficiency bonus because no matching weapon_proficiency exists
      expect(result.ac).toBe(7);
    });
  });
});
