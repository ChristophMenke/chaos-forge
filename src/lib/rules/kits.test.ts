import { describe, it, expect } from "vitest";
import { getEffectiveHitDie, getKit, getKitsForClass, KITS } from "./kits";

describe("Kit System", () => {
  describe("KITS registry", () => {
    it("contains exactly 80 kits", () => {
      expect(Object.keys(KITS)).toHaveLength(80);
    });

    const expectedKits = [
      // Fighter (11)
      "barbarian",
      "cavalier",
      "swashbuckler",
      "berserker",
      "gladiator",
      "myrmidon",
      "beast_rider",
      "noble_warrior",
      "peasant_hero",
      "samurai",
      "wilderness_warrior",
      // Thief (9)
      "assassin",
      "bounty_hunter",
      "acrobat",
      "scout",
      "burglar",
      "spy",
      "adventurer",
      "investigator",
      "smuggler",
      // Wizard (7)
      "witch",
      "militant_wizard",
      "savage_wizard",
      "academician",
      "amazon_sorceress",
      "peasant_wizard",
      "wild_mage",
      // Cleric (11)
      "fighting_priest",
      "pacifist_priest",
      "amazon_priestess",
      "barbarian_priest",
      "fighting_monk",
      "nobleman_priest",
      "outlaw_priest",
      "peasant_priest",
      "prophet",
      "savage_priest",
      "scholar_priest",
      // Ranger (11)
      "beastmaster",
      "cleric_ranger",
      "crusader_ranger",
      "feralan",
      "forest_runner",
      "greenwood_ranger",
      "guardian_ranger",
      "mountain_man",
      "pathfinder",
      "sea_ranger",
      "stalker",
      // Bard (11)
      "blade",
      "charlatan",
      "gallant",
      "gypsy_bard",
      "herald",
      "jester",
      "loremaster",
      "meistersinger",
      "riddlemaster",
      "skald",
      "thespian",
      // Paladin (9)
      "chevalier",
      "divinate",
      "envoy",
      "ghosthunter",
      "medician",
      "militarist",
      "skyrider",
      "votary",
      "wyrmslayer",
      // Druid (11)
      "avenger_druid",
      "guardian_druid",
      "hivemaster",
      "lost_druid",
      "natural_philosopher",
      "outlaw_druid",
      "pacifist_druid",
      "savage_druid",
      "shapeshifter_druid",
      "totemic_druid",
      "village_druid",
    ];

    it.each(expectedKits)("kit '%s' exists", (kitId) => {
      expect(KITS[kitId]).toBeDefined();
      expect(KITS[kitId].id).toBe(kitId);
      expect(KITS[kitId].abilities.length).toBeGreaterThanOrEqual(2);
    });

    it("barbarian kit has correct properties", () => {
      const kit = KITS["barbarian"];
      expect(kit.classId).toBe("fighter");
      expect(kit.hitDieOverride).toBe(12);
      expect(kit.maxArmorAC).toBe(5);
      expect(kit.abilities).toHaveLength(3);
    });
  });

  describe("getKitsForClass", () => {
    it("returns 11 fighter kits", () => {
      const kits = getKitsForClass("fighter");
      expect(kits).toHaveLength(11);
      expect(kits.map((k) => k.id)).toEqual(
        expect.arrayContaining([
          "barbarian",
          "cavalier",
          "swashbuckler",
          "berserker",
          "gladiator",
          "myrmidon",
          "beast_rider",
          "noble_warrior",
          "peasant_hero",
          "samurai",
          "wilderness_warrior",
        ])
      );
    });

    it("returns 9 thief kits", () => {
      const kits = getKitsForClass("thief");
      expect(kits).toHaveLength(9);
      expect(kits.map((k) => k.id)).toEqual(
        expect.arrayContaining([
          "assassin",
          "bounty_hunter",
          "acrobat",
          "scout",
          "burglar",
          "spy",
          "adventurer",
          "investigator",
          "smuggler",
        ])
      );
    });

    it("returns 7 mage kits", () => {
      const kits = getKitsForClass("mage");
      expect(kits).toHaveLength(7);
      expect(kits.map((k) => k.id)).toEqual(
        expect.arrayContaining([
          "witch",
          "militant_wizard",
          "savage_wizard",
          "academician",
          "amazon_sorceress",
          "peasant_wizard",
          "wild_mage",
        ])
      );
    });

    it("returns 11 cleric kits", () => {
      const kits = getKitsForClass("cleric");
      expect(kits).toHaveLength(11);
      expect(kits.map((k) => k.id)).toEqual(
        expect.arrayContaining([
          "fighting_priest",
          "pacifist_priest",
          "amazon_priestess",
          "barbarian_priest",
          "fighting_monk",
          "nobleman_priest",
          "outlaw_priest",
          "peasant_priest",
          "prophet",
          "savage_priest",
          "scholar_priest",
        ])
      );
    });

    it("returns 11 ranger kits", () => {
      const kits = getKitsForClass("ranger");
      expect(kits).toHaveLength(11);
      expect(kits.map((k) => k.id)).toEqual(
        expect.arrayContaining([
          "beastmaster",
          "cleric_ranger",
          "crusader_ranger",
          "feralan",
          "forest_runner",
          "greenwood_ranger",
          "guardian_ranger",
          "mountain_man",
          "pathfinder",
          "sea_ranger",
          "stalker",
        ])
      );
    });

    it("returns 11 bard kits", () => {
      const kits = getKitsForClass("bard");
      expect(kits).toHaveLength(11);
      expect(kits.map((k) => k.id)).toEqual(
        expect.arrayContaining([
          "blade",
          "charlatan",
          "gallant",
          "gypsy_bard",
          "herald",
          "jester",
          "loremaster",
          "meistersinger",
          "riddlemaster",
          "skald",
          "thespian",
        ])
      );
    });

    it("returns 9 paladin kits", () => {
      const kits = getKitsForClass("paladin");
      expect(kits).toHaveLength(9);
      expect(kits.map((k) => k.id)).toEqual(
        expect.arrayContaining([
          "chevalier",
          "divinate",
          "envoy",
          "ghosthunter",
          "medician",
          "militarist",
          "skyrider",
          "votary",
          "wyrmslayer",
        ])
      );
    });

    it("returns 11 druid kits", () => {
      const kits = getKitsForClass("druid");
      expect(kits).toHaveLength(11);
      expect(kits.map((k) => k.id)).toEqual(
        expect.arrayContaining([
          "avenger_druid",
          "guardian_druid",
          "hivemaster",
          "lost_druid",
          "natural_philosopher",
          "outlaw_druid",
          "pacifist_druid",
          "savage_druid",
          "shapeshifter_druid",
          "totemic_druid",
          "village_druid",
        ])
      );
    });

    it("returns empty array for class with no kits", () => {
      expect(getKitsForClass("abjurer")).toHaveLength(0);
    });
  });

  describe("getEffectiveHitDie", () => {
    it("returns kit override for barbarian", () => {
      expect(getEffectiveHitDie(10, "barbarian")).toBe(12);
    });

    it("returns base when kit has no override (cavalier)", () => {
      expect(getEffectiveHitDie(10, "cavalier")).toBe(10);
    });

    it("returns base when no kit", () => {
      expect(getEffectiveHitDie(10, null)).toBe(10);
    });

    it("returns base for unknown kit", () => {
      expect(getEffectiveHitDie(10, "unknown")).toBe(10);
    });
  });

  describe("getKit", () => {
    it("returns definition for known kit", () => {
      const kit = getKit("barbarian");
      expect(kit).not.toBeNull();
      expect(kit!.name).toBe("Barbar");
      expect(kit!.abilities).toHaveLength(3);
    });

    it("returns null for unknown kit", () => {
      expect(getKit("nonexistent")).toBeNull();
    });

    it("returns null for null input", () => {
      expect(getKit(null)).toBeNull();
    });
  });
});
