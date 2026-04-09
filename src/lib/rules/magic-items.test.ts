import { describe, it, expect } from "vitest";
import { getMagicItemEffects } from "./magic-items";
import type { CharacterEquipmentWithDetails, MagicEffects } from "@/lib/supabase/types";

/** Helper to create a magic item (no weapon/armor refs) */
function makeMagicItem(
  effects: MagicEffects,
  equipped = true,
  label = "Test Item"
): CharacterEquipmentWithDetails {
  return {
    id: crypto.randomUUID(),
    character_id: "char-1",
    weapon_id: null,
    armor_id: null,
    quantity: 1,
    equipped,
    hit_bonus: 0,
    damage_bonus: 0,
    magic_effects: effects,
    custom_label: label,
    weapon: null,
    armor: null,
  };
}

/** Helper to create a weapon equipment entry (not a magic item) */
function makeWeaponEquip(): CharacterEquipmentWithDetails {
  return {
    id: crypto.randomUUID(),
    character_id: "char-1",
    weapon_id: "sword-1",
    armor_id: null,
    quantity: 1,
    equipped: true,
    hit_bonus: 1,
    damage_bonus: 1,
    magic_effects: {},
    custom_label: null,
    weapon: { id: "sword-1", name: "Langschwert", name_en: "Long Sword" } as never,
    armor: null,
  };
}

describe("getMagicItemEffects", () => {
  it("returns empty effects for no equipment", () => {
    const result = getMagicItemEffects([]);
    expect(result.statBonuses).toEqual({});
    expect(result.acBonus).toBe(0);
    expect(result.saveBonuses).toEqual({});
    expect(result.thiefSkillBonuses).toEqual({});
    expect(result.perceptionBonus).toBe(0);
    expect(result.movementBonus).toBe(0);
    expect(result.magicResistance).toBe(0);
    expect(result.spellFailure).toBe(0);
    expect(result.spellAbilities).toEqual([]);
    expect(result.resistances).toEqual([]);
    expect(result.passiveAbilities).toEqual([]);
    expect(result.attackBonus).toBe(0);
    expect(result.damageBonus).toBe(0);
  });

  it("ignores weapon/armor equipment entries", () => {
    const result = getMagicItemEffects([makeWeaponEquip()]);
    expect(result.acBonus).toBe(0);
    expect(result.statBonuses).toEqual({});
  });

  it("ignores unequipped magic items", () => {
    const item = makeMagicItem({ str: 2, ac_bonus: -1 }, false);
    const result = getMagicItemEffects([item]);
    expect(result.statBonuses).toEqual({});
    expect(result.acBonus).toBe(0);
  });

  // ── Attribute bonuses ──
  it("sums attribute bonuses from a single item", () => {
    const item = makeMagicItem({ str: 2, dex: 1, con: 3 });
    const result = getMagicItemEffects([item]);
    expect(result.statBonuses).toEqual({ str: 2, dex: 1, con: 3 });
  });

  it("sums attribute bonuses across multiple items", () => {
    const gauntlets = makeMagicItem({ str: 3 }, true, "Gauntlets of Ogre Power");
    const ring = makeMagicItem({ dex: 1, wis: 1 }, true, "Ring of Dexterity");
    const result = getMagicItemEffects([gauntlets, ring]);
    expect(result.statBonuses.str).toBe(3);
    expect(result.statBonuses.dex).toBe(1);
    expect(result.statBonuses.wis).toBe(1);
  });

  // ── AC bonus ──
  it("sums AC bonuses", () => {
    const ring = makeMagicItem({ ac_bonus: -1 }, true, "Ring of Protection +1");
    const cloak = makeMagicItem({ ac_bonus: -2 }, true, "Cloak of Protection +2");
    const result = getMagicItemEffects([ring, cloak]);
    expect(result.acBonus).toBe(-3);
  });

  // ── Attack/Damage bonuses ──
  it("sums attack and damage bonuses", () => {
    const gauntlets = makeMagicItem({ attack_bonus: 2, damage_bonus: 3 });
    const result = getMagicItemEffects([gauntlets]);
    expect(result.attackBonus).toBe(2);
    expect(result.damageBonus).toBe(3);
  });

  // ── Saving throws ──
  it("sums saving throw bonuses with save_all distributing to all saves", () => {
    const ring = makeMagicItem({ save_all: 1 });
    const result = getMagicItemEffects([ring]);
    expect(result.saveBonuses.paralyzation).toBe(1);
    expect(result.saveBonuses.rod).toBe(1);
    expect(result.saveBonuses.petrification).toBe(1);
    expect(result.saveBonuses.breath).toBe(1);
    expect(result.saveBonuses.spell).toBe(1);
  });

  it("combines save_all with specific save bonuses", () => {
    const ring = makeMagicItem({ save_all: 1 });
    const cloak = makeMagicItem({ save_vs_spell: 2 });
    const result = getMagicItemEffects([ring, cloak]);
    expect(result.saveBonuses.spell).toBe(3); // 1 (all) + 2 (specific)
    expect(result.saveBonuses.paralyzation).toBe(1); // 1 (all) only
  });

  it("maps save_vs_poison to paralyze (Paralyzation/Poison/Death Magic)", () => {
    const periapt = makeMagicItem({ save_vs_poison: 4 });
    const result = getMagicItemEffects([periapt]);
    expect(result.saveBonuses.paralyzation).toBe(4);
  });

  it("maps save_vs_rod to rod save", () => {
    const item = makeMagicItem({ save_vs_rod: 2 });
    const result = getMagicItemEffects([item]);
    expect(result.saveBonuses.rod).toBe(2);
  });

  it("maps save_vs_petrification to petrification save", () => {
    const item = makeMagicItem({ save_vs_petrification: 3 });
    const result = getMagicItemEffects([item]);
    expect(result.saveBonuses.petrification).toBe(3);
  });

  it("maps save_vs_breath to breath save", () => {
    const item = makeMagicItem({ save_vs_breath: 2 });
    const result = getMagicItemEffects([item]);
    expect(result.saveBonuses.breath).toBe(2);
  });

  // ── Thief skills ──
  it("sums thief skill bonuses", () => {
    const boots = makeMagicItem({ move_silently: 10, hide_in_shadows: 5 });
    const gloves = makeMagicItem({ pick_pockets: 15 });
    const result = getMagicItemEffects([boots, gloves]);
    expect(result.thiefSkillBonuses.moveSilently).toBe(10);
    expect(result.thiefSkillBonuses.hideInShadows).toBe(5);
    expect(result.thiefSkillBonuses.pickPockets).toBe(15);
  });

  it("sums all 8 thief skills", () => {
    const item = makeMagicItem({
      hide_in_shadows: 5,
      move_silently: 10,
      pick_pockets: 15,
      open_locks: 20,
      find_traps: 25,
      climb_walls: 30,
      detect_noise: 35,
      read_languages: 40,
    });
    const result = getMagicItemEffects([item]);
    expect(result.thiefSkillBonuses).toEqual({
      hideInShadows: 5,
      moveSilently: 10,
      pickPockets: 15,
      openLocks: 20,
      findTraps: 25,
      climbWalls: 30,
      detectNoise: 35,
      readLanguages: 40,
    });
  });

  // ── Perception & Movement ──
  it("sums perception bonus", () => {
    const goggles = makeMagicItem({ perception_bonus: 2 });
    const helm = makeMagicItem({ perception_bonus: 1 });
    const result = getMagicItemEffects([goggles, helm]);
    expect(result.perceptionBonus).toBe(3);
  });

  it("sums movement bonus", () => {
    const boots = makeMagicItem({ movement_bonus: 30 }); // 30 feet
    const result = getMagicItemEffects([boots]);
    expect(result.movementBonus).toBe(30);
  });

  // ── Magic Resistance & Spell Failure ──
  it("takes max of magic resistance (not cumulative per AD&D)", () => {
    const robe = makeMagicItem({ magic_resistance: 5 });
    const ring = makeMagicItem({ magic_resistance: 15 });
    const result = getMagicItemEffects([robe, ring]);
    expect(result.magicResistance).toBe(15);
  });

  it("takes max of spell failure", () => {
    const armor = makeMagicItem({ spell_failure: 10 });
    const cursed = makeMagicItem({ spell_failure: 25 });
    const result = getMagicItemEffects([armor, cursed]);
    expect(result.spellFailure).toBe(25);
  });

  // ── Charges ──
  it("ignores items with current_charges = 0 for stat bonuses", () => {
    const wand = makeMagicItem({
      str: 5,
      max_charges: 10,
      current_charges: 0,
    });
    const result = getMagicItemEffects([wand]);
    expect(result.statBonuses).toEqual({});
  });

  it("includes items with remaining charges", () => {
    const wand = makeMagicItem({
      perception_bonus: 3,
      max_charges: 10,
      current_charges: 5,
    });
    const result = getMagicItemEffects([wand]);
    expect(result.perceptionBonus).toBe(3);
  });

  it("includes items without charges system (no max_charges)", () => {
    const ring = makeMagicItem({ ac_bonus: -2 });
    const result = getMagicItemEffects([ring]);
    expect(result.acBonus).toBe(-2);
  });

  // ── Spell Abilities ──
  it("concatenates spell abilities from multiple items", () => {
    const wand = makeMagicItem({
      spell_abilities: [
        {
          name: "Feuerball",
          name_en: "Fireball",
          uses_per_day: 3,
          description: "3W6 Feuer",
          description_en: "3d6 Fire",
        },
      ],
    });
    const ring = makeMagicItem({
      spell_abilities: [
        {
          name: "Unsichtbarkeit",
          name_en: "Invisibility",
          uses_per_day: 1,
          description: "1 Stunde",
          description_en: "1 hour",
        },
      ],
    });
    const result = getMagicItemEffects([wand, ring]);
    expect(result.spellAbilities).toHaveLength(2);
    expect(result.spellAbilities[0].name).toBe("Feuerball");
    expect(result.spellAbilities[1].name).toBe("Unsichtbarkeit");
  });

  // ── Resistances & Passive Abilities ──
  it("concatenates resistances from multiple items", () => {
    const ring = makeMagicItem({ resistances: ["Fire Resistance"] });
    const cloak = makeMagicItem({ resistances: ["Cold Resistance", "Immune to Charm"] });
    const result = getMagicItemEffects([ring, cloak]);
    expect(result.resistances).toEqual(["Fire Resistance", "Cold Resistance", "Immune to Charm"]);
  });

  it("concatenates passive abilities from multiple items", () => {
    const helm = makeMagicItem({ passive_abilities: ["Infravision 18m"] });
    const ring = makeMagicItem({ passive_abilities: ["Water Breathing", "Free Action"] });
    const result = getMagicItemEffects([helm, ring]);
    expect(result.passiveAbilities).toEqual(["Infravision 18m", "Water Breathing", "Free Action"]);
  });

  it("deduplicates resistances and passive abilities", () => {
    const item1 = makeMagicItem({ resistances: ["Fire Resistance"] });
    const item2 = makeMagicItem({ resistances: ["Fire Resistance", "Cold Resistance"] });
    const result = getMagicItemEffects([item1, item2]);
    expect(result.resistances).toEqual(["Fire Resistance", "Cold Resistance"]);
  });

  // ── Cursed items ──
  it("includes cursed items in aggregation (they still have effects)", () => {
    const cursedRing = makeMagicItem({ str: -3, is_cursed: true });
    const result = getMagicItemEffects([cursedRing]);
    expect(result.statBonuses.str).toBe(-3);
  });

  // ── Mixed equipment (weapons + magic items) ──
  it("only processes magic items, not weapon/armor entries", () => {
    const weapon = makeWeaponEquip();
    const ring = makeMagicItem({ ac_bonus: -1, str: 2 });
    const result = getMagicItemEffects([weapon, ring]);
    expect(result.acBonus).toBe(-1);
    expect(result.statBonuses.str).toBe(2);
  });

  // ── Complex multi-item scenario ──
  it("handles a realistic loadout correctly", () => {
    const equipment: CharacterEquipmentWithDetails[] = [
      makeWeaponEquip(), // ignored
      makeMagicItem({ str: 3, attack_bonus: 1 }, true, "Gauntlets of Ogre Power"),
      makeMagicItem({ ac_bonus: -2, save_all: 2 }, true, "Ring of Protection +2"),
      makeMagicItem({ hide_in_shadows: 10, move_silently: 10 }, true, "Boots of Elvenkind"),
      makeMagicItem({ magic_resistance: 5, perception_bonus: 1 }, true, "Robe of the Archmagi"),
      makeMagicItem({ dex: 1 }, false, "Unequipped Bracers"), // ignored
    ];

    const result = getMagicItemEffects(equipment);
    expect(result.statBonuses.str).toBe(3);
    expect(result.statBonuses.dex).toBeUndefined();
    expect(result.acBonus).toBe(-2);
    expect(result.attackBonus).toBe(1);
    expect(result.saveBonuses.spell).toBe(2);
    expect(result.saveBonuses.paralyzation).toBe(2);
    expect(result.thiefSkillBonuses.hideInShadows).toBe(10);
    expect(result.thiefSkillBonuses.moveSilently).toBe(10);
    expect(result.magicResistance).toBe(5);
    expect(result.perceptionBonus).toBe(1);
  });

  // ── Edge Cases ──
  it("items with max_charges=0 are NOT treated as depleted (no-charge item)", () => {
    const item = makeMagicItem({ str: 2, max_charges: 0 });
    const result = getMagicItemEffects([item]);
    expect(result.statBonuses.str).toBe(2);
  });

  it("items without custom_label are not treated as magic items", () => {
    const item: CharacterEquipmentWithDetails = {
      id: "no-label",
      character_id: "char-1",
      weapon_id: null,
      armor_id: null,
      quantity: 1,
      equipped: true,
      hit_bonus: 0,
      damage_bonus: 0,
      magic_effects: { str: 5 },
      custom_label: null,
      weapon: null,
      armor: null,
    };
    const result = getMagicItemEffects([item]);
    expect(result.statBonuses).toEqual({});
  });

  it("handles empty magic_effects object gracefully", () => {
    const item = makeMagicItem({});
    const result = getMagicItemEffects([item]);
    expect(result.acBonus).toBe(0);
    expect(result.statBonuses).toEqual({});
  });

  it("negative stat bonuses (cursed) reduce the total", () => {
    const good = makeMagicItem({ str: 3 });
    const cursed = makeMagicItem({ str: -2, is_cursed: true });
    const result = getMagicItemEffects([good, cursed]);
    expect(result.statBonuses.str).toBe(1); // 3 + (-2) = 1
  });

  it("description and description_en are not treated as effects", () => {
    const item = makeMagicItem({
      description: "A powerful artifact",
      description_en: "Ein mächtiges Artefakt",
    });
    const result = getMagicItemEffects([item]);
    expect(result.statBonuses).toEqual({});
    expect(result.acBonus).toBe(0);
  });

  // ── Stat Overrides ──
  it("aggregates stat_overrides from a single item", () => {
    const belt = makeMagicItem({ stat_overrides: { str: 19 } }, true, "Belt of Giant Strength");
    const result = getMagicItemEffects([belt]);
    expect(result.statOverrides).toEqual({ str: 19 });
    expect(result.statBonuses).toEqual({}); // no additive bonus
  });

  it("takes max when multiple items override the same stat", () => {
    const belt = makeMagicItem({ stat_overrides: { str: 19 } }, true, "Belt of Giant Strength");
    const gauntlets = makeMagicItem(
      { stat_overrides: { str: 18 } },
      true,
      "Gauntlets of Ogre Power"
    );
    const result = getMagicItemEffects([belt, gauntlets]);
    expect(result.statOverrides.str).toBe(19); // max(19, 18)
  });

  it("aggregates str_exceptional override", () => {
    const gauntlets = makeMagicItem(
      { stat_overrides: { str: 18, str_exceptional: 100 } },
      true,
      "Gauntlets of Ogre Power"
    );
    const result = getMagicItemEffects([gauntlets]);
    expect(result.statOverrides.str).toBe(18);
    expect(result.strExceptionalOverride).toBe(100);
  });

  it("handles stat_overrides and additive bonuses on different stats", () => {
    const belt = makeMagicItem(
      { stat_overrides: { str: 19 }, dex: 1 },
      true,
      "Belt of Giant Strength"
    );
    const result = getMagicItemEffects([belt]);
    expect(result.statOverrides.str).toBe(19);
    expect(result.statBonuses.dex).toBe(1);
    expect(result.statBonuses.str).toBeUndefined(); // no additive STR bonus
  });

  it("ignores stat_overrides from unequipped items", () => {
    const belt = makeMagicItem({ stat_overrides: { str: 19 } }, false, "Belt of Giant Strength");
    const result = getMagicItemEffects([belt]);
    expect(result.statOverrides).toEqual({});
  });

  it("ignores stat_overrides from depleted items", () => {
    const item = makeMagicItem({
      stat_overrides: { str: 19 },
      max_charges: 10,
      current_charges: 0,
    });
    const result = getMagicItemEffects([item]);
    expect(result.statOverrides).toEqual({});
  });

  it("returns empty statOverrides and null strExceptionalOverride by default", () => {
    const ring = makeMagicItem({ ac_bonus: -1 });
    const result = getMagicItemEffects([ring]);
    expect(result.statOverrides).toEqual({});
    expect(result.strExceptionalOverride).toBeNull();
  });

  it("takes max regardless of item order (lower first, higher second)", () => {
    const gauntlets = makeMagicItem(
      { stat_overrides: { str: 18 } },
      true,
      "Gauntlets of Ogre Power"
    );
    const belt = makeMagicItem({ stat_overrides: { str: 19 } }, true, "Belt of Giant Strength");
    const result = getMagicItemEffects([gauntlets, belt]); // reversed order
    expect(result.statOverrides.str).toBe(19);
  });

  it("override and additive bonus on the SAME stat coexist separately", () => {
    const belt = makeMagicItem({ stat_overrides: { str: 19 } }, true, "Belt of Giant Strength");
    const gloves = makeMagicItem({ str: 2 }, true, "Gloves of Strength");
    const result = getMagicItemEffects([belt, gloves]);
    expect(result.statOverrides.str).toBe(19);
    expect(result.statBonuses.str).toBe(2);
  });

  it("handles multiple different stat overrides from different items", () => {
    const belt = makeMagicItem({ stat_overrides: { str: 19 } }, true, "Belt");
    const gloves = makeMagicItem({ stat_overrides: { dex: 18 } }, true, "Gauntlets of Dexterity");
    const result = getMagicItemEffects([belt, gloves]);
    expect(result.statOverrides).toEqual({ str: 19, dex: 18 });
  });

  it("multiple save types stack correctly", () => {
    const ring = makeMagicItem({ save_all: 1, save_vs_spell: 2, save_vs_poison: 3 });
    const result = getMagicItemEffects([ring]);
    expect(result.saveBonuses.spell).toBe(3); // 1 (all) + 2 (specific)
    expect(result.saveBonuses.paralyzation).toBe(4); // 1 (all) + 3 (poison)
    expect(result.saveBonuses.rod).toBe(1); // 1 (all) only
    expect(result.saveBonuses.breath).toBe(1); // 1 (all) only
    expect(result.saveBonuses.petrification).toBe(1); // 1 (all) only
  });
});
