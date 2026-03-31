import { describe, it, expect } from "vitest";
import {
  getRace,
  getAllRaces,
  canPlayClass,
  getLevelLimit,
  getStartingAge,
  getHeightRange,
  getWeightRange,
  getRacialSavingThrowBonus,
} from "./races";

describe("RACE-003 RACE-004 RACE-009 RACE-010 RACE-011: Races", () => {
  it("RACE-001: should define all 7 PHB core races + Kobold + Tiefling", () => {
    expect(getAllRaces()).toHaveLength(9);
  });

  it("should allow humans to play all classes", () => {
    const human = getRace("human");
    expect(human.allowedClasses).toHaveLength(16);
    expect(human.levelLimits).toEqual({});
  });

  it("RACE-002: should give elves +1 DEX, -1 CON", () => {
    const elf = getRace("elf");
    expect(elf.abilityAdjustments).toEqual({ dex: 1, con: -1 });
  });

  it("RACE-005: should not allow dwarves to be mages", () => {
    expect(canPlayClass("dwarf", "mage")).toBe(false);
    expect(canPlayClass("dwarf", "fighter")).toBe(true);
  });

  it("RACE-006: should return correct level limits for elves", () => {
    expect(getLevelLimit("elf", "fighter")).toBe(12);
    expect(getLevelLimit("elf", "mage")).toBe(15);
  });

  it("should return null for unlimited level (humans)", () => {
    expect(getLevelLimit("human", "fighter")).toBeNull();
    expect(getLevelLimit("human", "mage")).toBeNull();
  });

  it("RACE-007: should define multiclass options for elves", () => {
    const elf = getRace("elf");
    expect(elf.multiclassOptions).toContainEqual(["fighter", "mage"]);
    expect(elf.multiclassOptions).toContainEqual(["fighter", "mage", "thief"]);
  });

  it("should not allow humans to multiclass", () => {
    const human = getRace("human");
    expect(human.multiclassOptions).toHaveLength(0);
  });

  it("should give half-orcs +1 STR, +1 CON, -2 CHA", () => {
    const halfOrc = getRace("half_orc");
    expect(halfOrc.abilityAdjustments).toEqual({ str: 1, con: 1, cha: -2 });
  });

  it("RACE-008: should give dwarves and elves 60ft infravision", () => {
    expect(getRace("dwarf").infravision).toBe(60);
    expect(getRace("elf").infravision).toBe(60);
    expect(getRace("human").infravision).toBe(0);
  });
});

describe("RACE-012: getStartingAge", () => {
  it("returns base age + class modifier for human fighter", () => {
    const age = getStartingAge("human", "fighter");
    expect(age.base).toBe(15);
    expect(age.diceCount).toBeGreaterThan(0);
    expect(age.diceSides).toBeGreaterThan(0);
  });

  it("returns higher base age for elf mage", () => {
    const age = getStartingAge("elf", "mage");
    expect(age.base).toBeGreaterThanOrEqual(150);
  });

  it("returns different values for different class groups", () => {
    const warrior = getStartingAge("human", "fighter");
    const wizard = getStartingAge("human", "mage");
    expect(wizard.base).toBeGreaterThanOrEqual(warrior.base);
  });
});

describe("RACE-013: getHeightRange", () => {
  it("returns base + dice for human male", () => {
    const h = getHeightRange("human", "male");
    expect(h.baseInches).toBe(60);
    expect(h.diceCount).toBe(2);
    expect(h.diceSides).toBe(10);
  });

  it("returns smaller base for halfling", () => {
    const h = getHeightRange("halfling", "male");
    expect(h.baseInches).toBeLessThan(40);
  });

  it("returns slightly smaller base for female", () => {
    const male = getHeightRange("human", "male");
    const female = getHeightRange("human", "female");
    expect(female.baseInches).toBeLessThan(male.baseInches);
  });
});

describe("RACE-014: getWeightRange", () => {
  it("returns base + dice for human male", () => {
    const w = getWeightRange("human", "male");
    expect(w.baseLbs).toBe(140);
    expect(w.diceCount).toBeGreaterThan(0);
    expect(w.diceSides).toBeGreaterThan(0);
  });

  it("returns lighter base for halfling", () => {
    const w = getWeightRange("halfling", "male");
    expect(w.baseLbs).toBeLessThan(60);
  });
});

describe("RACE-015: getRacialSavingThrowBonus", () => {
  it("dwarf with CON 14 gets +4 vs poison/magic", () => {
    expect(getRacialSavingThrowBonus("dwarf", 14)).toBe(4);
  });

  it("dwarf with CON 4 gets +1", () => {
    expect(getRacialSavingThrowBonus("dwarf", 4)).toBe(1);
  });

  it("gnome with CON 10 gets +2 (floor(10/3.5))", () => {
    expect(getRacialSavingThrowBonus("gnome", 10)).toBe(2);
  });

  it("elf gets 0 (no bonus)", () => {
    expect(getRacialSavingThrowBonus("elf", 14)).toBe(0);
  });

  it("human gets 0", () => {
    expect(getRacialSavingThrowBonus("human", 16)).toBe(0);
  });

  it("tiefling gets 0 (no CON-based bonus)", () => {
    expect(getRacialSavingThrowBonus("tiefling", 16)).toBe(0);
  });
});

describe("Tiefling Race", () => {
  it("should have INT +1, CHA -1 adjustments", () => {
    const tiefling = getRace("tiefling");
    expect(tiefling.abilityAdjustments).toEqual({ int: 1, cha: -1 });
  });

  it("should allow all 16 classes", () => {
    const tiefling = getRace("tiefling");
    expect(tiefling.allowedClasses).toHaveLength(16);
  });

  it("should have no level limits", () => {
    const tiefling = getRace("tiefling");
    expect(tiefling.levelLimits).toEqual({});
  });

  it("should have 60ft infravision", () => {
    expect(getRace("tiefling").infravision).toBe(60);
  });

  it("should have base movement 12", () => {
    expect(getRace("tiefling").baseMovement).toBe(12);
  });

  it("should have 6 multiclass options", () => {
    const tiefling = getRace("tiefling");
    expect(tiefling.multiclassOptions).toHaveLength(6);
    expect(tiefling.multiclassOptions).toContainEqual(["fighter", "mage"]);
    expect(tiefling.multiclassOptions).toContainEqual(["cleric", "mage"]);
  });

  it("should have racial abilities (infravision, resistances, darkness)", () => {
    const tiefling = getRace("tiefling");
    expect(tiefling.racialAbilities.length).toBeGreaterThanOrEqual(4);
  });

  it("Darkness ability should have usesPerDay: 1", () => {
    const tiefling = getRace("tiefling");
    const darkness = tiefling.racialAbilities.find((a) => a.name_en.startsWith("Darkness"));
    expect(darkness).toBeDefined();
    expect(darkness?.usesPerDay).toBe(1);
  });

  it("should return starting age for tiefling fighter", () => {
    const age = getStartingAge("tiefling", "fighter");
    expect(age.base).toBe(15); // same as human
  });

  it("should return height range for tiefling", () => {
    const h = getHeightRange("tiefling", "male");
    expect(h.baseInches).toBe(60); // same as human
  });

  it("should return weight range for tiefling", () => {
    const w = getWeightRange("tiefling", "male");
    expect(w.baseLbs).toBe(140); // same as human
  });
});
