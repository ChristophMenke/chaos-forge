import { describe, it, expect } from "vitest";
import {
  getSpecialist,
  getOppositionSchools,
  getPriestSpheres,
  hasSphereAccess,
  getAvailablePriestSpells,
  isPriestCaster,
} from "./magic";
import type { PriestSphere } from "./types";

describe("MAGIC-001 MAGIC-002: Wizard Specialists", () => {
  it("should return null for a generic mage", () => {
    expect(getSpecialist("mage")).toBeNull();
  });

  it("should identify necromancer's school as necromancy", () => {
    const spec = getSpecialist("necromancer");
    expect(spec).not.toBeNull();
    expect(spec!.school).toBe("necromancy");
  });

  it("should return illusion and enchantment as opposition schools for necromancer", () => {
    const schools = getOppositionSchools("necromancer");
    expect(schools).toContain("illusion");
    expect(schools).toContain("enchantment");
    expect(schools).toHaveLength(2);
  });

  it("should return no opposition schools for generic mage", () => {
    expect(getOppositionSchools("mage")).toEqual([]);
  });

  it("should return diviner with only one opposition school (conjuration)", () => {
    const spec = getSpecialist("diviner");
    expect(spec!.oppositionSchools).toEqual(["conjuration"]);
  });

  it("should return illusionist with three opposition schools", () => {
    const schools = getOppositionSchools("illusionist");
    expect(schools).toHaveLength(3);
    expect(schools).toContain("necromancy");
    expect(schools).toContain("invocation");
    expect(schools).toContain("abjuration");
  });
});

describe("MAGIC-003 MAGIC-004: Priest Sphere Access", () => {
  it("should give clerics major access to healing", () => {
    expect(hasSphereAccess("cleric", "healing", "major")).toBe(true);
  });

  it("should give clerics minor access to elemental", () => {
    expect(hasSphereAccess("cleric", "elemental", "minor")).toBe(true);
    expect(hasSphereAccess("cleric", "elemental", "major")).toBe(false);
  });

  it("should not give clerics access to animal sphere", () => {
    expect(hasSphereAccess("cleric", "animal", "minor")).toBe(false);
  });

  it("should give druids major access to animal and plant", () => {
    expect(hasSphereAccess("druid", "animal", "major")).toBe(true);
    expect(hasSphereAccess("druid", "plant", "major")).toBe(true);
  });

  it("should give druids minor access to divination", () => {
    expect(hasSphereAccess("druid", "divination", "minor")).toBe(true);
    expect(hasSphereAccess("druid", "divination", "major")).toBe(false);
  });

  it("should return empty spheres for non-priest classes", () => {
    expect(getPriestSpheres("fighter")).toEqual({});
    expect(hasSphereAccess("fighter", "healing", "minor")).toBe(false);
  });
});

describe("Priesthood-aware Sphere Access", () => {
  it("getPriestSpheres with priesthood 'war' returns war spheres", () => {
    const spheres = getPriestSpheres("cleric", "war");
    expect(spheres.combat).toBe("major");
    expect(spheres.healing).toBe("major");
    expect(spheres.necromantic).toBe("minor");
    expect(spheres.protection).toBe("minor");
    expect(spheres.summoning).toBeUndefined();
  });

  it("getPriestSpheres without priesthood returns standard cleric spheres (backwards-compat)", () => {
    const spheres = getPriestSpheres("cleric");
    expect(spheres.healing).toBe("major");
    expect(spheres.summoning).toBe("major");
    expect(spheres.elemental).toBe("minor");
  });

  it("getPriestSpheres with null priesthood returns standard cleric spheres", () => {
    const spheres = getPriestSpheres("cleric", null);
    expect(spheres.healing).toBe("major");
    expect(spheres.summoning).toBe("major");
  });

  it("druid ignores priesthood parameter", () => {
    const spheres = getPriestSpheres("druid", "war");
    expect(spheres.animal).toBe("major");
    expect(spheres.plant).toBe("major");
    expect(spheres.combat).toBeUndefined();
  });

  it("hasSphereAccess with priesthood checks priesthood spheres", () => {
    // War has combat as major
    expect(hasSphereAccess("cleric", "combat", "major", "war")).toBe(true);
    // War has necromantic as minor only
    expect(hasSphereAccess("cleric", "necromantic", "major", "war")).toBe(false);
    expect(hasSphereAccess("cleric", "necromantic", "minor", "war")).toBe(true);
    // War has no summoning access
    expect(hasSphereAccess("cleric", "summoning", "minor", "war")).toBe(false);
  });
});

describe("isPriestCaster", () => {
  it("returns true for cleric and druid", () => {
    expect(isPriestCaster("cleric")).toBe(true);
    expect(isPriestCaster("druid")).toBe(true);
  });

  it("returns true for ranger and paladin", () => {
    expect(isPriestCaster("ranger")).toBe(true);
    expect(isPriestCaster("paladin")).toBe(true);
  });

  it("returns false for non-priest casters", () => {
    expect(isPriestCaster("fighter")).toBe(false);
    expect(isPriestCaster("mage")).toBe(false);
    expect(isPriestCaster("thief")).toBe(false);
    expect(isPriestCaster("bard")).toBe(false);
  });
});

describe("Ranger/Paladin Sphere Access", () => {
  it("ranger gets druid spheres (animal, plant, elemental, healing, weather)", () => {
    const spheres = getPriestSpheres("ranger");
    expect(spheres.animal).toBe("major");
    expect(spheres.plant).toBe("major");
    expect(spheres.healing).toBe("major");
    // Rangers get same spheres as druid
    expect(spheres.elemental).toBe("major");
    expect(spheres.weather).toBe("major");
  });

  it("paladin gets standard cleric spheres", () => {
    const spheres = getPriestSpheres("paladin");
    expect(spheres.combat).toBe("major");
    expect(spheres.healing).toBe("major");
    expect(spheres.divination).toBe("major");
    expect(spheres.protection).toBe("major");
  });
});

describe("getAvailablePriestSpells", () => {
  const mockSpells = [
    { id: "1", sphere: "healing" as PriestSphere, level: 1, spell_type: "priest" as const },
    { id: "2", sphere: "healing" as PriestSphere, level: 5, spell_type: "priest" as const },
    { id: "3", sphere: "combat" as PriestSphere, level: 1, spell_type: "priest" as const },
    { id: "4", sphere: "combat" as PriestSphere, level: 4, spell_type: "priest" as const },
    { id: "5", sphere: "animal" as PriestSphere, level: 2, spell_type: "priest" as const },
    { id: "6", sphere: "necromantic" as PriestSphere, level: 1, spell_type: "priest" as const },
    { id: "7", sphere: "necromantic" as PriestSphere, level: 4, spell_type: "priest" as const },
    { id: "8", sphere: "all" as PriestSphere, level: 1, spell_type: "priest" as const },
    {
      id: "9",
      sphere: "wizard-school" as unknown as PriestSphere,
      level: 1,
      spell_type: "wizard" as const,
    },
  ];

  it("cleric sees healing (major), combat (major), all (major) but not animal", () => {
    const available = getAvailablePriestSpells("cleric", 10, null, mockSpells);
    const ids = available.map((s) => s.id);
    expect(ids).toContain("1"); // healing L1
    expect(ids).toContain("2"); // healing L5
    expect(ids).toContain("3"); // combat L1
    expect(ids).toContain("4"); // combat L4
    expect(ids).toContain("8"); // all L1
    expect(ids).not.toContain("5"); // animal — cleric has no access
    expect(ids).not.toContain("9"); // wizard spell
  });

  it("cleric with minor sphere only sees levels 1-3", () => {
    // Cleric has elemental as minor — test with necromantic mock (not minor for cleric)
    // Use a priesthood where necromantic is minor
    const spells = [
      { id: "a", sphere: "necromantic" as PriestSphere, level: 1, spell_type: "priest" as const },
      { id: "b", sphere: "necromantic" as PriestSphere, level: 3, spell_type: "priest" as const },
      { id: "c", sphere: "necromantic" as PriestSphere, level: 4, spell_type: "priest" as const },
    ];
    // War priesthood has necromantic as minor
    const available = getAvailablePriestSpells("cleric", 10, "war", spells);
    const ids = available.map((s) => s.id);
    expect(ids).toContain("a"); // L1 — minor OK
    expect(ids).toContain("b"); // L3 — minor OK
    expect(ids).not.toContain("c"); // L4 — minor caps at 3
  });

  it("filters by character level (priest spell slots determine max castable level)", () => {
    // Level 1 priest can only cast level 1 spells
    const available = getAvailablePriestSpells("cleric", 1, null, mockSpells);
    const ids = available.map((s) => s.id);
    expect(ids).toContain("1"); // healing L1
    expect(ids).toContain("3"); // combat L1
    expect(ids).toContain("8"); // all L1
    expect(ids).not.toContain("2"); // healing L5 — too high
    expect(ids).not.toContain("4"); // combat L4 — too high
  });

  it("excludes wizard spells", () => {
    const available = getAvailablePriestSpells("cleric", 10, null, mockSpells);
    expect(available.find((s) => s.id === "9")).toBeUndefined();
  });

  it("druid sees animal but not combat", () => {
    const available = getAvailablePriestSpells("druid", 10, null, mockSpells);
    const ids = available.map((s) => s.id);
    expect(ids).toContain("5"); // animal L2
    expect(ids).not.toContain("3"); // combat L1 — druid has no combat
  });

  it("returns empty array for non-priest class", () => {
    const available = getAvailablePriestSpells("fighter", 10, null, mockSpells);
    expect(available).toEqual([]);
  });

  // Ranger level gates: no spells before L8, L1 spells at L8, L2 at L12, L3 at L15
  it("ranger gets no spells before level 8", () => {
    const available = getAvailablePriestSpells("ranger", 7, null, mockSpells);
    expect(available).toEqual([]);
  });

  it("ranger at level 8 only gets level 1 druid spells", () => {
    const available = getAvailablePriestSpells("ranger", 8, null, mockSpells);
    const ids = available.map((s) => s.id);
    expect(ids).toContain("8"); // all L1 — OK
    expect(ids).not.toContain("5"); // animal L2 — too high for L8 ranger
  });

  it("ranger at level 12 can access level 1-2 druid spells", () => {
    const available = getAvailablePriestSpells("ranger", 12, null, mockSpells);
    const ids = available.map((s) => s.id);
    expect(ids).toContain("5"); // animal L2 — OK at L12
    expect(ids).toContain("8"); // all L1 — OK
  });

  it("ranger at level 15 can access up to level 3 druid spells", () => {
    const spells = [
      { id: "r1", sphere: "animal" as PriestSphere, level: 1, spell_type: "priest" as const },
      { id: "r2", sphere: "animal" as PriestSphere, level: 3, spell_type: "priest" as const },
      { id: "r3", sphere: "animal" as PriestSphere, level: 4, spell_type: "priest" as const },
    ];
    const available = getAvailablePriestSpells("ranger", 15, null, spells);
    const ids = available.map((s) => s.id);
    expect(ids).toContain("r1"); // L1 OK
    expect(ids).toContain("r2"); // L3 OK
    expect(ids).not.toContain("r3"); // L4 — ranger max is 3
  });

  // Paladin level gates: no spells before L9, L1 at L9, L2 at L11, L3 at L13, L4 at L15
  it("paladin gets no spells before level 9", () => {
    const available = getAvailablePriestSpells("paladin", 8, null, mockSpells);
    expect(available).toEqual([]);
  });

  it("paladin at level 9 only gets level 1 cleric spells", () => {
    const available = getAvailablePriestSpells("paladin", 9, null, mockSpells);
    const ids = available.map((s) => s.id);
    expect(ids).toContain("1"); // healing L1 — OK
    expect(ids).toContain("8"); // all L1 — OK
    expect(ids).not.toContain("2"); // healing L5 — too high
  });

  it("paladin at level 15 can access up to level 4 cleric spells", () => {
    const available = getAvailablePriestSpells("paladin", 15, null, mockSpells);
    const ids = available.map((s) => s.id);
    expect(ids).toContain("1"); // healing L1
    expect(ids).toContain("4"); // combat L4
    expect(ids).not.toContain("2"); // healing L5 — paladin max is 4
  });
});
