import { describe, it, expect } from "vitest";
import {
  getMulticlassThac0,
  getMulticlassSaves,
  getMulticlassHpDivisor,
  isRuleCompliantMulticlass,
  multiclassHasExceptionalStr,
  getMulticlassGroups,
  getMulticlassArmorWarnings,
} from "./multiclass";

describe("MULTI-001: getMulticlassThac0", () => {
  it("returns 20 for empty class list", () => {
    expect(getMulticlassThac0([])).toBe(20);
  });

  it("returns single class THAC0 for single-class", () => {
    // Fighter L5: 21-5 = 16
    expect(getMulticlassThac0([{ classId: "fighter", level: 5 }])).toBe(16);
  });

  it("returns best (lowest) THAC0 for Fighter/Mage", () => {
    // Fighter L4: 21-4 = 17, Mage L4: 20-floor(3/3) = 19
    // Best = 17 (Fighter)
    expect(
      getMulticlassThac0([
        { classId: "fighter", level: 4 },
        { classId: "mage", level: 4 },
      ])
    ).toBe(17);
  });

  it("returns best THAC0 for triple-class Fighter/Mage/Thief", () => {
    // Fighter L6: 21-6 = 15, Mage L6: 20-floor(5/3) = 19, Thief L6: 20-floor(5/2) = 18
    // Best = 15 (Fighter)
    expect(
      getMulticlassThac0([
        { classId: "fighter", level: 6 },
        { classId: "mage", level: 6 },
        { classId: "thief", level: 6 },
      ])
    ).toBe(15);
  });

  it("handles different levels per class", () => {
    // Cleric L7: 20-floor(6/3)*2 = 16, Thief L10: 20-floor(9/2) = 16
    // Both = 16
    expect(
      getMulticlassThac0([
        { classId: "cleric", level: 7 },
        { classId: "thief", level: 10 },
      ])
    ).toBe(16);
  });
});

describe("MULTI-002: getMulticlassSaves", () => {
  it("returns worst saves for empty list", () => {
    const saves = getMulticlassSaves([]);
    expect(saves.paralyzation).toBe(20);
  });

  it("returns best saves per category for Fighter/Mage L5", () => {
    // Fighter L5: [11,13,12,13,14], Wizard L5: [14,11,13,15,12]
    // Best per category: [11,11,12,13,12]
    const saves = getMulticlassSaves([
      { classId: "fighter", level: 5 },
      { classId: "mage", level: 5 },
    ]);
    expect(saves.paralyzation).toBe(11); // Fighter better
    expect(saves.rod).toBe(11); // Wizard better
    expect(saves.petrification).toBe(12); // Fighter better
    expect(saves.breath).toBe(13); // Fighter better
    expect(saves.spell).toBe(12); // Wizard better
  });

  it("returns best saves for Cleric/Thief", () => {
    // Priest L4: [9,13,12,15,14], Rogue L5: [12,12,11,15,13]
    const saves = getMulticlassSaves([
      { classId: "cleric", level: 4 },
      { classId: "thief", level: 5 },
    ]);
    expect(saves.paralyzation).toBe(9); // Priest better
    expect(saves.rod).toBe(12); // Rogue better
    expect(saves.petrification).toBe(11); // Rogue better
    expect(saves.breath).toBe(15); // Tied
    expect(saves.spell).toBe(13); // Rogue better
  });
});

describe("MULTI-003: getMulticlassHpDivisor", () => {
  it("returns 1 for single class", () => {
    expect(getMulticlassHpDivisor(1)).toBe(1);
  });

  it("returns 2 for dual class", () => {
    expect(getMulticlassHpDivisor(2)).toBe(2);
  });

  it("returns 3 for triple class", () => {
    expect(getMulticlassHpDivisor(3)).toBe(3);
  });

  it("returns at least 1 for zero", () => {
    expect(getMulticlassHpDivisor(0)).toBe(1);
  });
});

describe("MULTI-004: isRuleCompliantMulticlass", () => {
  it("returns true for single class", () => {
    expect(isRuleCompliantMulticlass("elf", ["fighter"])).toBe(true);
  });

  it("returns true for valid Elf Fighter/Mage", () => {
    expect(isRuleCompliantMulticlass("elf", ["fighter", "mage"])).toBe(true);
  });

  it("returns true for valid Elf Fighter/Mage/Thief", () => {
    expect(isRuleCompliantMulticlass("elf", ["fighter", "mage", "thief"])).toBe(true);
  });

  it("returns true regardless of order", () => {
    expect(isRuleCompliantMulticlass("elf", ["mage", "fighter"])).toBe(true);
  });

  it("returns false for non-compliant Human multiclass", () => {
    // Humans have no multiclassOptions
    expect(isRuleCompliantMulticlass("human", ["fighter", "mage"])).toBe(false);
  });

  it("returns false for non-compliant Halfling multiclass", () => {
    // Halfling only has [fighter, thief]
    expect(isRuleCompliantMulticlass("halfling", ["fighter", "mage"])).toBe(false);
  });

  it("returns true for valid Dwarf Fighter/Cleric", () => {
    expect(isRuleCompliantMulticlass("dwarf", ["fighter", "cleric"])).toBe(true);
  });

  it("returns true for valid Half-Elf triple class", () => {
    expect(isRuleCompliantMulticlass("half_elf", ["fighter", "mage", "cleric"])).toBe(true);
  });
});

describe("MULTI-005: multiclassHasExceptionalStr", () => {
  it("returns true for Fighter/Mage", () => {
    expect(multiclassHasExceptionalStr(["fighter", "mage"])).toBe(true);
  });

  it("returns false for Cleric/Thief", () => {
    expect(multiclassHasExceptionalStr(["cleric", "thief"])).toBe(false);
  });

  it("returns true for single Fighter", () => {
    expect(multiclassHasExceptionalStr(["fighter"])).toBe(true);
  });

  it("returns true for Ranger/Cleric", () => {
    expect(multiclassHasExceptionalStr(["ranger", "cleric"])).toBe(true);
  });
});

describe("getMulticlassGroups", () => {
  it("returns single group for single class", () => {
    expect(getMulticlassGroups(["fighter"])).toEqual(["warrior"]);
  });

  it("returns both groups for Fighter/Mage", () => {
    const groups = getMulticlassGroups(["fighter", "mage"]);
    expect(groups).toHaveLength(2);
    expect(groups).toContain("warrior");
    expect(groups).toContain("wizard");
  });

  it("returns three groups for Fighter/Cleric/Thief", () => {
    const groups = getMulticlassGroups(["fighter", "cleric", "thief"]);
    expect(groups).toHaveLength(3);
    expect(groups).toContain("warrior");
    expect(groups).toContain("priest");
    expect(groups).toContain("rogue");
  });

  it("deduplicates groups for Fighter/Ranger", () => {
    // Both are warrior group
    expect(getMulticlassGroups(["fighter", "ranger"])).toEqual(["warrior"]);
  });
});

describe("getMulticlassArmorWarnings", () => {
  it("returns wizard warning for Fighter/Mage in armor", () => {
    const warnings = getMulticlassArmorWarnings(["fighter", "mage"], true, 5);
    expect(warnings).toEqual([{ type: "wizard" }]);
  });

  it("returns thief warning for Fighter/Thief in chain mail (AC 5)", () => {
    const warnings = getMulticlassArmorWarnings(["fighter", "thief"], true, 5);
    expect(warnings).toEqual([{ type: "thief" }]);
  });

  it("returns no thief warning for Fighter/Thief in leather (AC 8)", () => {
    const warnings = getMulticlassArmorWarnings(["fighter", "thief"], true, 8);
    expect(warnings).toHaveLength(0);
  });

  it("returns both warnings for Fighter/Mage/Thief in plate", () => {
    const warnings = getMulticlassArmorWarnings(["fighter", "mage", "thief"], true, 3);
    expect(warnings).toHaveLength(2);
    expect(warnings).toContainEqual({ type: "wizard" });
    expect(warnings).toContainEqual({ type: "thief" });
  });

  it("returns no warnings for single class", () => {
    expect(getMulticlassArmorWarnings(["fighter"], true, 3)).toHaveLength(0);
  });

  it("returns no warnings without armor", () => {
    expect(getMulticlassArmorWarnings(["fighter", "mage"], false, null)).toHaveLength(0);
  });

  it("returns wizard warning for specialist wizard multiclass", () => {
    const warnings = getMulticlassArmorWarnings(["fighter", "illusionist"], true, 5);
    expect(warnings).toEqual([{ type: "wizard" }]);
  });

  it("returns thief warning for Cleric/Bard in heavy armor", () => {
    const warnings = getMulticlassArmorWarnings(["cleric", "bard"], true, 5);
    expect(warnings).toEqual([{ type: "thief" }]);
  });

  it("returns no thief warning for Bard in studded leather (AC 7)", () => {
    // AC 7 is studded leather — thieves can wear this per PHB
    const warnings = getMulticlassArmorWarnings(["fighter", "bard"], true, 7);
    expect(warnings).toHaveLength(0);
  });

  it("returns thief warning for Fighter/Thief in scale mail (AC 6)", () => {
    const warnings = getMulticlassArmorWarnings(["fighter", "thief"], true, 6);
    expect(warnings).toEqual([{ type: "thief" }]);
  });

  it("returns no warnings for magical protection (Bracers of Defense)", () => {
    const warnings = getMulticlassArmorWarnings(["fighter", "mage"], true, 4, true);
    expect(warnings).toHaveLength(0);
  });

  it("returns wizard warning when wearsArmor=true but armorAC=null", () => {
    const warnings = getMulticlassArmorWarnings(["fighter", "mage"], true, null);
    expect(warnings).toEqual([{ type: "wizard" }]);
  });
});
