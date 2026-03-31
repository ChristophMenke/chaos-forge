import { describe, it, expect } from "vitest";
import {
  getClass,
  getAllClasses,
  getClassGroup,
  meetsAbilityRequirements,
  getAbilityRequirementFailures,
} from "./classes";

describe("CLASS-005 CLASS-006: Classes", () => {
  it("CLASS-001: should define 16 classes total", () => {
    expect(getAllClasses()).toHaveLength(16);
  });

  it("CLASS-004: should categorize fighter as warrior group", () => {
    expect(getClassGroup("fighter")).toBe("warrior");
  });

  it("should categorize mage as wizard group", () => {
    expect(getClassGroup("mage")).toBe("wizard");
  });

  it("should categorize cleric as priest group", () => {
    expect(getClassGroup("cleric")).toBe("priest");
  });

  it("should categorize thief as rogue group", () => {
    expect(getClassGroup("thief")).toBe("rogue");
  });

  it("CLASS-003: should give warriors d10 hit dice", () => {
    expect(getClass("fighter").hitDie).toBe(10);
    expect(getClass("ranger").hitDie).toBe(10);
    expect(getClass("paladin").hitDie).toBe(10);
  });

  it("should give wizards d4 hit dice", () => {
    expect(getClass("mage").hitDie).toBe(4);
    expect(getClass("illusionist").hitDie).toBe(4);
  });

  it("ABILITY-008: should allow exceptional strength only for warrior group", () => {
    expect(getClass("fighter").exceptionalStrength).toBe(true);
    expect(getClass("ranger").exceptionalStrength).toBe(true);
    expect(getClass("mage").exceptionalStrength).toBe(false);
    expect(getClass("thief").exceptionalStrength).toBe(false);
  });

  it("CLASS-002: should check ability requirements correctly", () => {
    const abilities = { str: 16, dex: 14, con: 15, int: 10, wis: 14, cha: 17 };
    expect(meetsAbilityRequirements("paladin", abilities)).toBe(true);
  });

  it("should reject characters not meeting ability requirements", () => {
    const abilities = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    expect(meetsAbilityRequirements("paladin", abilities)).toBe(false);
    expect(meetsAbilityRequirements("fighter", abilities)).toBe(true);
  });
});

describe("getAbilityRequirementFailures", () => {
  it("returns empty array when all requirements met", () => {
    const abilities = { str: 13, dex: 13, con: 14, wis: 14, int: 10, cha: 10 };
    expect(getAbilityRequirementFailures("ranger", abilities)).toEqual([]);
  });

  it("returns all failures with correct fields", () => {
    const abilities = { str: 10, dex: 10, con: 10, wis: 10, int: 10, cha: 10 };
    const failures = getAbilityRequirementFailures("ranger", abilities);
    expect(failures.length).toBeGreaterThanOrEqual(3);
    expect(failures).toContainEqual({ ability: "str", required: 13, actual: 10 });
    expect(failures).toContainEqual({ ability: "dex", required: 13, actual: 10 });
    expect(failures).toContainEqual({ ability: "con", required: 14, actual: 10 });
  });

  it("returns only the failing abilities, not the passing ones", () => {
    const abilities = { str: 10, dex: 16, con: 14, wis: 14, int: 10, cha: 10 };
    const failures = getAbilityRequirementFailures("ranger", abilities);
    expect(failures).toHaveLength(1);
    expect(failures[0].ability).toBe("str");
  });

  it("exact minimum value passes (not a failure)", () => {
    const abilities = { str: 13, dex: 13, con: 14, wis: 14, int: 10, cha: 10 };
    expect(getAbilityRequirementFailures("ranger", abilities)).toHaveLength(0);
  });
});
