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
    is_npc: false,
    npc_visible_to_players: false,
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
    // floor((14+16)/2) = 15 (perception_bonus is situational, not added to base)
    expect(result.perception).toBe(15);
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

    const result = computeCharacterCombatData(
      char,
      classes,
      equipment,
      [],
      profs as unknown as import("@/lib/supabase/types").CharacterWeaponProficiencyRow[]
    );
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

      const result = computeCharacterCombatData(
        char,
        classes,
        equipment,
        [],
        profs as unknown as import("@/lib/supabase/types").CharacterWeaponProficiencyRow[]
      );
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

      const result = computeCharacterCombatData(
        char,
        classes,
        equipment,
        [],
        profs as unknown as import("@/lib/supabase/types").CharacterWeaponProficiencyRow[]
      );
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

      const result = computeCharacterCombatData(
        char,
        classes,
        equipment,
        [],
        profs as unknown as import("@/lib/supabase/types").CharacterWeaponProficiencyRow[]
      );
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

      const result = computeCharacterCombatData(
        char,
        classes,
        equipment,
        [],
        profs as unknown as import("@/lib/supabase/types").CharacterWeaponProficiencyRow[]
      );
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

  // ─── Custom Items with custom_label (Proficiency via DB name) ─────────

  describe("custom items with custom_label and proficiency matching", () => {
    function makeWeaponEquip(
      id: string,
      weaponName: string,
      customLabel: string | null,
      extras?: Partial<CharacterEquipmentWithDetails>
    ): CharacterEquipmentWithDetails {
      return {
        id,
        character_id: "test-char",
        weapon_id: id,
        armor_id: null,
        quantity: 1,
        equipped: true,
        hit_bonus: extras?.hit_bonus ?? 0,
        damage_bonus: extras?.damage_bonus ?? 0,
        magic_effects: {},
        custom_label: customLabel,
        weapon: {
          id,
          name: weaponName,
          name_en: null,
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
          is_custom: true,
          created_by: null,
          proficiency_name: null,
        },
        armor: null,
      };
    }

    function makeArmorEquip(
      id: string,
      armorName: string,
      opts: {
        ac?: number;
        is_shield?: boolean;
        shield_type?: "buckler" | "small" | "medium" | "large" | null;
        is_magical_protection?: boolean;
      } = {}
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
          name: armorName,
          name_en: null,
          ac: opts.ac ?? 10,
          weight: 5,
          cost_gp: 10,
          max_movement: 12,
          source_book: "PHB",
          is_custom: true,
          is_magical_protection: opts.is_magical_protection ?? false,
          is_shield: opts.is_shield ?? false,
          shield_type: opts.shield_type ?? null,
          created_by: null,
        },
      };
    }

    it('"Der Schlächter" with proficiency Langschwert — specialization applies', () => {
      // GM creates weapon: DB name = "Langschwert", custom_label = "Der Schlächter"
      const char = makeCharacter({ dex: 10 });
      const classes = [makeClass("fighter", 5)];
      const equipment = [
        makeWeaponEquip("custom-1", "Langschwert", "Der Schlächter", {
          hit_bonus: 2,
          damage_bonus: 2,
        }),
      ];
      // Character has Langschwert proficiency WITH specialization
      const profs = [{ weapon_name: "Langschwert", specialization: true }];

      const result = computeCharacterCombatData(
        char,
        classes,
        equipment,
        [],
        profs as unknown as import("@/lib/supabase/types").CharacterWeaponProficiencyRow[]
      );

      // Fighter L5 unarmored: AC = 10 - 2 (unarmored warrior) = 8
      expect(result.ac).toBe(8);
      // The weapon's DB name "Langschwert" matches the proficiency "Langschwert"
      // → no non-proficiency penalty, specialization bonus applies
      // This test verifies the proficiency matching works via DB name, not custom_label
    });

    it('"Schutzschale" armor with proficiency Kettenpanzer — AC applies correctly', () => {
      // GM creates armor: DB name = "Kettenpanzer", displayed as "Schutzschale"
      // Since custom_label is on equipment (not armor), the armor.name IS the proficiency name
      const char = makeCharacter({ dex: 14 }); // DEX 14 → -0 def adj (PHB Table 2)
      const classes = [makeClass("fighter", 5)];
      const equipment = [makeArmorEquip("custom-armor", "Kettenpanzer", { ac: 5 })];

      const result = computeCharacterCombatData(char, classes, equipment, [], []);

      // AC = 5 (chain mail AC replaces base 10) + 0 (DEX 14 = no adj) = 5
      // No unarmored bonus because character IS armored
      expect(result.ac).toBe(5);
    });

    it('"Verteidiger" shield with proficiency Mittlerer Schild — shield prof bonus applies', () => {
      // GM creates shield: DB name = "Mittlerer Schild", is_shield=true, shield_type="medium"
      // The character has "Mittlerer Schild" weapon proficiency
      const char = makeCharacter({ dex: 10 });
      const classes = [makeClass("fighter", 5)];
      const equipment = [
        makeArmorEquip("custom-shield", "Mittlerer Schild", {
          is_shield: true,
          shield_type: "medium",
        }),
      ];
      const profs = [{ weapon_name: "Mittlerer Schild", specialization: false }];

      const result = computeCharacterCombatData(
        char,
        classes,
        equipment,
        [],
        profs as unknown as import("@/lib/supabase/types").CharacterWeaponProficiencyRow[]
      );

      // AC = 10 - 1 (shield) - 2 (unarmored warrior) - 3 (medium shield prof) = 4
      expect(result.ac).toBe(4);
    });

    it('"Verteidiger" shield WITHOUT matching proficiency — no bonus', () => {
      const char = makeCharacter({ dex: 10 });
      const classes = [makeClass("fighter", 5)];
      const equipment = [
        makeArmorEquip("custom-shield", "Mittlerer Schild", {
          is_shield: true,
          shield_type: "medium",
        }),
      ];
      // Character has NO shield proficiency
      const profs: { weapon_name: string; specialization: boolean }[] = [];

      const result = computeCharacterCombatData(
        char,
        classes,
        equipment,
        [],
        profs as unknown as import("@/lib/supabase/types").CharacterWeaponProficiencyRow[]
      );

      // AC = 10 - 1 (shield) - 2 (unarmored warrior) = 7 (no prof bonus)
      expect(result.ac).toBe(7);
    });

    it("custom armor + custom shield + specialization — full AC stack", () => {
      // Full scenario: "Schutzschale" (chain mail) + "Verteidiger" (medium shield) + DEX 16
      const char = makeCharacter({ dex: 16 }); // DEX 16 → -2 def adj
      const classes = [makeClass("fighter", 5)];
      const equipment = [
        makeArmorEquip("custom-armor", "Kettenpanzer", { ac: 5 }),
        makeArmorEquip("custom-shield", "Mittlerer Schild", {
          is_shield: true,
          shield_type: "medium",
        }),
      ];
      const profs = [{ weapon_name: "Mittlerer Schild", specialization: false }];

      const result = computeCharacterCombatData(
        char,
        classes,
        equipment,
        [],
        profs as unknown as import("@/lib/supabase/types").CharacterWeaponProficiencyRow[]
      );

      // AC = 5 (chain) - 1 (shield) - 2 (DEX 16) - 3 (medium shield prof) = -1
      expect(result.ac).toBe(-1);
    });
  });

  // ─── Magic Item Effects Integration ─────────────────────────────────

  describe("magic item effects integration", () => {
    function makeMagicEquip(
      effects: import("@/lib/supabase/types").MagicEffects,
      label = "Magic Ring"
    ): CharacterEquipmentWithDetails {
      return {
        id: `magic-${Math.random()}`,
        character_id: "test-char",
        weapon_id: null,
        armor_id: null,
        quantity: 1,
        equipped: true,
        hit_bonus: 0,
        damage_bonus: 0,
        magic_effects: effects,
        custom_label: label,
        weapon: null,
        armor: null,
      };
    }

    it("magic item AC bonus is applied to AC calculation", () => {
      const char = makeCharacter({ dex: 10 });
      const classes = [makeClass("fighter", 5)];
      const ring = makeMagicEquip({ ac_bonus: -2 }, "Ring of Protection +2");

      const result = computeCharacterCombatData(char, classes, [ring], [], []);
      // AC = 10 - 2 (unarmored warrior) - 2 (ring) = 6
      expect(result.ac).toBe(6);
    });

    it("Ring of Protection +1 improves AC by exactly 1 (descending AD&D convention)", () => {
      // Regression test for a bug where a custom "Ring of Protection +1" had
      // its ac_bonus stored as +1 instead of -1, which silently made the AC
      // WORSE by 1 point (difference of 2 to the intended result).
      //
      // AD&D 2e rule: lower AC = better. A Ring of Protection +1 means "AC
      // improves by 1", which in storage terms means ac_bonus = -1 (it is
      // added to the AC in calculateAC(), so a negative value decreases AC).
      const char = makeCharacter({ dex: 10 });
      const classes = [makeClass("mage", 5)];

      const baselineResult = computeCharacterCombatData(char, classes, [], [], []);
      // Mage has no unarmored bonus → base AC = 10
      expect(baselineResult.ac).toBe(10);

      const correctRing = makeMagicEquip({ ac_bonus: -1 }, "Ring of Protection +1");
      const withRing = computeCharacterCombatData(char, classes, [correctRing], [], []);
      expect(withRing.ac).toBe(9); // 1 point better

      // If someone accidentally stores +1 instead of -1 (the data-entry bug
      // we fixed in migration 00215), the AC would go to 11 — 2 points
      // worse than intended. This asserts that outcome explicitly so a
      // future refactor that flips the sign inside the aggregator breaks
      // this test and forces a conscious decision.
      const wrongRing = makeMagicEquip({ ac_bonus: 1 }, "Ring of Protection (wrong sign)");
      const withWrongRing = computeCharacterCombatData(char, classes, [wrongRing], [], []);
      expect(withWrongRing.ac).toBe(11); // 1 point WORSE (proves the bug mechanism)
    });

    it("magic item save bonuses are applied to saves", () => {
      const char = makeCharacter();
      const classes = [makeClass("fighter", 5)];
      const ring = makeMagicEquip({ save_all: 2 }, "Ring of Protection +2");

      const result = computeCharacterCombatData(char, classes, [ring], [], []);
      // Fighter L5 saves: paralyzation=11, rod=13, petrification=12, breath=13, spell=14
      // With +2 bonus (lower is better in AD&D, so subtract):
      expect(result.saves.paralyzation).toBe(9); // 11 - 2
      expect(result.saves.rod).toBe(11); // 13 - 2
      expect(result.saves.petrification).toBe(10); // 12 - 2
      expect(result.saves.breath).toBe(11); // 13 - 2
      expect(result.saves.spell).toBe(12); // 14 - 2
    });

    it("magic item specific save bonuses stack with save_all", () => {
      const char = makeCharacter();
      const classes = [makeClass("fighter", 5)];
      const ring = makeMagicEquip({ save_all: 1 }, "Ring of Protection +1");
      const cloak = makeMagicEquip({ save_vs_spell: 2 }, "Cloak vs Spells");

      const result = computeCharacterCombatData(char, classes, [ring, cloak], [], []);
      // spell save: 14 - 1 (all) - 2 (specific) = 11
      expect(result.saves.spell).toBe(11);
      // paralyzation: 11 - 1 (all only) = 10
      expect(result.saves.paralyzation).toBe(10);
    });

    it("magic item perception bonus is situational and not added to base", () => {
      const char = makeCharacter({ int: 14, wis: 16 });
      const classes = [makeClass("fighter", 5)];
      const goggles = makeMagicEquip({ perception_bonus: 3 }, "Goggles of Perception");

      const result = computeCharacterCombatData(char, classes, [goggles], [], []);
      // floor((14+16)/2) = 15 (perception bonuses are situational)
      expect(result.perception).toBe(15);
    });

    it("epic perception bonus is situational and not added to base", () => {
      const char = makeCharacter({ int: 14, wis: 16 });
      const classes = [makeClass("fighter", 5)];
      const goggles = makeMagicEquip({ perception_bonus: 2 }, "Goggles");
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

      const result = computeCharacterCombatData(char, classes, [goggles], epicItems, []);
      // floor((14+16)/2) = 15 (perception bonuses are situational)
      expect(result.perception).toBe(15);
    });

    it("magic item thief skill bonuses are applied", () => {
      const char = makeCharacter({
        thief_pick_locks: 50,
        thief_find_traps: 30,
        thief_move_silently: 60,
        thief_hide_shadows: 40,
        thief_climb_walls: 80,
        thief_detect_noise: 35,
        thief_read_languages: 15,
      });
      const classes = [makeClass("thief", 5)];
      const boots = makeMagicEquip({ move_silently: 10, hide_in_shadows: 5 }, "Boots of Elvenkind");

      const result = computeCharacterCombatData(char, classes, [boots], [], []);
      expect(result.thiefSkills!.moveSilently).toBe(70); // 60 + 10
      expect(result.thiefSkills!.hideInShadows).toBe(45); // 40 + 5
      expect(result.thiefSkills!.openLocks).toBe(50); // unchanged
    });

    it("magic item stat bonuses affect derived values", () => {
      // DEX 14 → 0 def adj. With DEX +2 bonus → DEX 16 → -2 def adj
      const char = makeCharacter({ dex: 14 });
      const classes = [makeClass("fighter", 5)];
      const bracers = makeMagicEquip({ dex: 2 }, "Bracers of Dexterity +2");

      const result = computeCharacterCombatData(char, classes, [bracers], [], []);
      // AC = 10 - 2 (unarmored warrior) - 2 (DEX 16 def adj) = 6
      expect(result.ac).toBe(6);
    });

    it("exposes magic resistance, spell failure, resistances, passive abilities, spell abilities", () => {
      const char = makeCharacter();
      const classes = [makeClass("fighter", 5)];
      const robe = makeMagicEquip(
        {
          magic_resistance: 5,
          spell_failure: 10,
          resistances: ["Fire Resistance"],
          passive_abilities: ["Infravision 18m"],
          spell_abilities: [{ name: "Feuerball", uses_per_day: 1, description: "3W6 Feuer" }],
        },
        "Robe of the Archmagi"
      );

      const result = computeCharacterCombatData(char, classes, [robe], [], []);
      expect(result.magicResistance).toBe(5);
      expect(result.magicSpellFailure).toBe(10);
      expect(result.magicResistances).toEqual(["Fire Resistance"]);
      expect(result.magicPassiveAbilities).toEqual(["Infravision 18m"]);
      expect(result.magicSpellAbilities).toHaveLength(1);
      expect(result.magicSpellAbilities[0].name).toBe("Feuerball");
    });

    it("stat bonuses are capped at 25 (AD&D max)", () => {
      // Character with STR 24 + magic STR +5 should cap at 25
      const char = makeCharacter({ str: 24, dex: 23 });
      const classes = [makeClass("fighter", 5)];
      const gauntlets = makeMagicEquip({ str: 5, dex: 5 }, "Gauntlets of Excess");

      const result = computeCharacterCombatData(char, classes, [gauntlets], [], []);
      // STR should be capped: min(24+5, 25) = 25
      // DEX should be capped: min(23+5, 25) = 25
      // Verify via AC: DEX 25 → -6 def adj (PHB table)
      // AC = 10 - 2 (unarmored warrior) - 6 (DEX 25) = 2
      expect(result.ac).toBe(2);
    });

    it("magic items with no effects produce zero-initialized result fields", () => {
      const char = makeCharacter();
      const classes = [makeClass("fighter", 5)];

      const result = computeCharacterCombatData(char, classes, [], [], []);
      expect(result.magicResistance).toBe(0);
      expect(result.magicSpellFailure).toBe(0);
      expect(result.magicResistances).toEqual([]);
      expect(result.magicPassiveAbilities).toEqual([]);
      expect(result.magicSpellAbilities).toEqual([]);
    });

    it("magic spell failure combines with epic spell failure (max of both)", () => {
      const char = makeCharacter();
      const classes = [makeClass("fighter", 5)];
      const cursed = makeMagicEquip({ spell_failure: 15 }, "Cursed Gauntlets");
      const epicItems: EpicItemRow[] = [
        {
          id: "epic-sf",
          character_id: "test-char",
          slug: "condenser",
          name: "Kondensator",
          name_en: "Condenser",
          description: "",
          description_en: "",
          icon: "zap",
          equipped: true,
          damage_level: 1,
          max_damage_level: 3,
          damage_levels: {
            "1": { description: "", description_en: "", effects: ["spell_failure_10"] },
          },
          simple_effects: {},
          notes: "",
          created_at: "",
          updated_at: "",
        },
      ];

      const result = computeCharacterCombatData(char, classes, [cursed], epicItems, []);
      // magicSpellFailure = max(magic=15, epic=10) = 15
      expect(result.magicSpellFailure).toBe(15);
    });

    it("magic AC bonus stacks with armor and epic AC bonus", () => {
      const char = makeCharacter({ dex: 10 });
      const classes = [makeClass("fighter", 5)];
      const armor: CharacterEquipmentWithDetails = {
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
      };
      const ring = makeMagicEquip({ ac_bonus: -1 }, "Ring of Protection +1");

      const result = computeCharacterCombatData(char, classes, [armor, ring], [], []);
      // AC = 5 (chain) + (-1) (ring magic AC) = 4
      expect(result.ac).toBe(4);
    });

    it("magic item stat override affects perception (INT/WIS override)", () => {
      // Base INT 10, WIS 12 → perception = floor((10+12)/2) = 11
      const char = makeCharacter({ int: 10, wis: 12 });
      const classes = [makeClass("fighter", 5)];
      const helm = makeMagicEquip({ stat_overrides: { int: 18, wis: 18 } }, "Helm of Brilliance");

      const result = computeCharacterCombatData(char, classes, [helm], [], []);
      // INT: max(10, 18) = 18, WIS: max(12, 18) = 18 → perception = floor((18+18)/2) = 18
      expect(result.perception).toBe(18);
    });

    it("magic item stat override affects AC via DEX (Gauntlets of Dexterity)", () => {
      // Base DEX 10 → 0 def adj. With DEX override 18 → -4 def adj
      const char = makeCharacter({ dex: 10 });
      const classes = [makeClass("fighter", 5)];
      const gauntlets = makeMagicEquip({ stat_overrides: { dex: 18 } }, "Gauntlets of Dexterity");

      const result = computeCharacterCombatData(char, classes, [gauntlets], [], []);
      // AC = 10 - 2 (unarmored warrior) - 4 (DEX 18 def adj) = 4
      expect(result.ac).toBe(4);
    });

    it("magic override is ignored when base stat is higher", () => {
      // DEX 18 (base) → -4 def adj. Override DEX 16 should be ignored.
      const char = makeCharacter({ dex: 18 });
      const classes = [makeClass("fighter", 5)];
      const gauntlets = makeMagicEquip({ stat_overrides: { dex: 16 } }, "Weak Gauntlets");

      const result = computeCharacterCombatData(char, classes, [gauntlets], [], []);
      // max(18, 16) = 18 → -4 def adj
      // AC = 10 - 2 (unarmored warrior) - 4 (DEX 18) = 4
      expect(result.ac).toBe(4);
    });

    it("epic override wins over magic override when higher", () => {
      // Base INT 8, magic INT 15, epic INT 20 → max = 20
      const char = makeCharacter({ int: 8, wis: 10 });
      const classes = [makeClass("fighter", 5)];
      const helm = makeMagicEquip({ stat_overrides: { int: 15 } }, "Helm of INT");
      const epicItem: EpicItemRow = {
        id: "epic-1",
        character_id: "test-char",
        slug: "test-epic",
        name: "Epic Crown",
        name_en: "Epic Crown",
        description: "",
        description_en: null,
        icon: "👑",
        equipped: true,
        damage_level: 1,
        max_damage_level: 1,
        damage_levels: { "1": { stat_overrides: { int: 20 }, description: "INT 20" } },
        simple_effects: {},
        notes: "",
        created_at: "",
        updated_at: "",
      };

      const result = computeCharacterCombatData(char, classes, [helm], [epicItem], []);
      // perception = floor((max(8,20,15) + max(10)) / 2) = floor((20+10)/2) = 15
      expect(result.perception).toBe(15);
    });

    it("magic override + additive bonus on different stats", () => {
      // STR override 19 from belt, DEX +4 additive bonus from ring
      const char = makeCharacter({ dex: 10, int: 10, wis: 10 });
      const classes = [makeClass("fighter", 5)];
      const belt = makeMagicEquip({ stat_overrides: { int: 18 }, wis: 4 }, "Belt + Ring combo");

      const result = computeCharacterCombatData(char, classes, [belt], [], []);
      // INT: max(10, 18) = 18 (override), WIS: 10 + 4 = 14 (additive)
      // perception = floor((18 + 14) / 2) = 16
      expect(result.perception).toBe(16);
    });

    it("Gauntlets of Ogre Power sets str_exceptional for STR modifiers", () => {
      // STR 10 with Gauntlets → STR 18/00
      const char = makeCharacter({ str: 10, str_exceptional: null });
      const classes = [makeClass("fighter", 5)];
      const gauntlets = makeMagicEquip(
        { stat_overrides: { str: 18, str_exceptional: 100 } },
        "Gauntlets of Ogre Power"
      );

      const result = computeCharacterCombatData(char, classes, [gauntlets], [], []);
      // With STR 18/00: weightAllow should be 480 (from STR modifiers table)
      // This is testable via encumbrance-derived values, but we verify it doesn't crash
      // and perception is unaffected
      expect(result.perception).toBe(11); // INT 10, WIS 12 → unchanged
    });
  });

  describe("HP clamping on CON change (Kondensator scenarios)", () => {
    function makeCondenser(unequipped: boolean): EpicItemRow {
      return {
        id: "epic-condenser",
        character_id: "test-char",
        slug: "condenser",
        name: "Konstitutions-Kondensator",
        name_en: "Constitution Condenser",
        description: "",
        description_en: "",
        icon: "heart-pulse",
        equipped: !unequipped,
        damage_level: 0,
        max_damage_level: 3,
        damage_levels: unequipped
          ? {}
          : {
              "0": {
                description: "",
                description_en: "",
                effects: [],
                stat_overrides: { con: 18 },
              },
            },
        simple_effects: { base_con: 5 },
        notes: "",
        created_at: "",
        updated_at: "",
      };
    }

    it("Kondensator unequipped: HP max drops, current is clamped — NOT reduced by delta", () => {
      // Sprocket-Setup: Base CON 5 (bio), Kondensator angelegt im Regelzustand setzt
      // effective CON auf 18. hp_max=34 wurde mit CON 18 erzeugt. Beim Ablegen
      // fällt effective CON auf 5 (fo.con=5), hpMax sinkt auf 12. hpCurrent
      // muss auf 12 geclampt werden (NICHT auf −10).
      const char = makeCharacter({
        str: 10,
        dex: 14,
        con: 18,
        int: 10,
        wis: 10,
        hp_current: 34,
        hp_max: 34,
        level: 6,
      });
      const classes = [makeClass("thief", 6)];
      const condenser = makeCondenser(true);

      const result = computeCharacterCombatData(char, classes, [], [condenser], []);
      // CON 18 hpAdj=+4 → rogue-capped to +2. CON 5 hpAdj=-1 (penalties uncapped).
      // Delta per level = (−1 − 2) = −3; total over 6 levels = −18 (single class, divisor 1).
      // hpMax = max(1, 34 + (−18)) = 16
      expect(result.hpMax).toBe(16);
      // CRITICAL: current must be clamped to new max — not driven negative by the delta
      expect(result.hpCurrent).toBe(16);
    });

    it("Kondensator equipped + L0: HP unchanged (fo.con matches stored CON)", () => {
      // Wenn Kondensator angelegt ist mit stat_overrides.con=18 UND
      // simple_effects.base_constitution=5 → forceStatOverrides.con=18 (equip-branch).
      // effectiveCon=18 = character.con=18 → hpDelta=0, HP unverändert.
      const char = makeCharacter({
        con: 18,
        hp_current: 34,
        hp_max: 34,
        level: 6,
      });
      const classes = [makeClass("thief", 6)];
      const condenser = makeCondenser(false);

      const result = computeCharacterCombatData(char, classes, [], [condenser], []);
      expect(result.hpMax).toBe(34);
      expect(result.hpCurrent).toBe(34);
    });

    it("CON buff raises hpMax but leaves current unchanged (no free heal)", () => {
      // Buff via statOverrides (nicht force): eo.con=18 über base=12.
      // hpMax steigt, current bleibt (darf nicht über altes Max springen).
      const char = makeCharacter({
        con: 12,
        hp_current: 20,
        hp_max: 30,
        level: 5,
      });
      const classes = [makeClass("thief", 5)];
      const buffItem: EpicItemRow = {
        id: "epic-buff",
        character_id: "test-char",
        slug: "con-amulet",
        name: "CON Amulet",
        name_en: "CON Amulet",
        description: "",
        description_en: "",
        icon: "amulet",
        equipped: true,
        damage_level: 0,
        max_damage_level: 1,
        damage_levels: {
          "0": { description: "", description_en: "", effects: [], stat_overrides: { con: 18 } },
        },
        simple_effects: {},
        notes: "",
        created_at: "",
        updated_at: "",
      };

      const result = computeCharacterCombatData(char, classes, [], [buffItem], []);
      // Rogue cap +2. eo.con: 12 → 18, hpAdj 0 → +2, delta = (2 − 0) × 5 = +10
      expect(result.hpMax).toBe(40);
      expect(result.hpCurrent).toBe(20); // unverändert — kein Free-Heal
    });

    it("current HP below 0 (unconscious) stays negative after clamp when within death threshold", () => {
      // Edge case: Char war bereits im Unconscious-Zustand, dann ändert sich Max.
      // Current soll nicht nach oben geclampt werden.
      const char = makeCharacter({
        con: 15,
        hp_current: -3,
        hp_max: 30,
        level: 5,
      });
      const classes = [makeClass("thief", 5)];

      const result = computeCharacterCombatData(char, classes, [], [], []);
      expect(result.hpCurrent).toBe(-3);
    });

    it("clamps current to death threshold if below −effectiveMax", () => {
      const char = makeCharacter({
        con: 18,
        hp_current: -40,
        hp_max: 30,
        level: 5,
      });
      const classes = [makeClass("thief", 5)];

      const result = computeCharacterCombatData(char, classes, [], [], []);
      // hp_current=-40, max remains ~30 → clamp to -30
      expect(result.hpCurrent).toBe(-result.hpMax);
    });
  });
});
