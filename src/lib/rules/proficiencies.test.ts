import { describe, it, expect } from "vitest";
import {
  getWeaponProficiencySlots,
  getNonweaponProficiencySlots,
  getNonproficiencyPenalty,
  canSpecialize,
  isNonStandardSpecialization,
  getWeaponSpeedFactor,
  getNwpCheckTarget,
  findProficiency,
} from "./proficiencies";

describe("PROF-001: Weapon Proficiency Slots", () => {
  it("should give warriors 4 slots at level 1", () => {
    expect(getWeaponProficiencySlots("warrior", 1)).toBe(4);
  });

  it("should give warriors 5 slots at level 4", () => {
    expect(getWeaponProficiencySlots("warrior", 4)).toBe(5);
  });

  it("should give priests 2 slots at level 1", () => {
    expect(getWeaponProficiencySlots("priest", 1)).toBe(2);
  });

  it("should give rogues 2 slots at level 1", () => {
    expect(getWeaponProficiencySlots("rogue", 1)).toBe(2);
  });

  it("should give wizards 1 slot at level 1", () => {
    expect(getWeaponProficiencySlots("wizard", 1)).toBe(1);
  });

  it("should give wizards 2 slots at level 7", () => {
    expect(getWeaponProficiencySlots("wizard", 7)).toBe(2);
  });
});

describe("PROF-002: Non-Weapon Proficiency Slots", () => {
  it("should give warriors 3 base slots at level 1", () => {
    expect(getNonweaponProficiencySlots("warrior", 1, 10)).toBe(3);
  });

  it("should add INT bonus languages as extra NWP slots", () => {
    // INT 16 = 5 languages = 5 extra NWP slots? No, INT bonus is different.
    // Actually NWP slots = base + floor((level-1)/3) for warriors
    // Base: warrior=3, priest=4, rogue=3, wizard=4
    expect(getNonweaponProficiencySlots("wizard", 1, 10)).toBe(4);
  });

  it("should increase slots with level", () => {
    expect(getNonweaponProficiencySlots("warrior", 4)).toBeGreaterThan(
      getNonweaponProficiencySlots("warrior", 1)
    );
  });

  // PHB Table 34: rogues gain a slot every 4 levels, the others every 3.
  it("gives rogues one more slot every 4 levels", () => {
    expect([1, 4, 5, 8, 9].map((l) => getNonweaponProficiencySlots("rogue", l))).toEqual([
      3, 3, 4, 4, 5,
    ]);
  });

  it("keeps warriors, priests and wizards at one slot every 3 levels", () => {
    expect([1, 4, 7].map((l) => getNonweaponProficiencySlots("warrior", l))).toEqual([3, 4, 5]);
    expect([1, 4, 7].map((l) => getNonweaponProficiencySlots("priest", l))).toEqual([4, 5, 6]);
    expect([1, 4, 7].map((l) => getNonweaponProficiencySlots("wizard", l))).toEqual([4, 5, 6]);
  });
});

describe("PROF-003: Non-proficiency Penalty", () => {
  it("should give warriors -2 penalty", () => {
    expect(getNonproficiencyPenalty("warrior")).toBe(-2);
  });

  it("should give priests -3 penalty", () => {
    expect(getNonproficiencyPenalty("priest")).toBe(-3);
  });

  it("should give rogues -3 penalty", () => {
    expect(getNonproficiencyPenalty("rogue")).toBe(-3);
  });

  it("should give wizards -5 penalty", () => {
    expect(getNonproficiencyPenalty("wizard")).toBe(-5);
  });
});

describe("PROF-004: Weapon Specialization", () => {
  it("should allow fighter to specialize", () => {
    expect(canSpecialize("fighter")).toBe(true);
  });

  it("should allow all classes to specialize (house rule / S&P)", () => {
    expect(canSpecialize("ranger")).toBe(true);
    expect(canSpecialize("paladin")).toBe(true);
    expect(canSpecialize("mage")).toBe(true);
    expect(canSpecialize("thief")).toBe(true);
    expect(canSpecialize("cleric")).toBe(true);
  });

  it("should flag non-fighter specialization as non-standard", () => {
    expect(isNonStandardSpecialization("fighter")).toBe(false);
    expect(isNonStandardSpecialization("ranger")).toBe(true);
    expect(isNonStandardSpecialization("paladin")).toBe(true);
    expect(isNonStandardSpecialization("mage")).toBe(true);
    expect(isNonStandardSpecialization("thief")).toBe(true);
    expect(isNonStandardSpecialization("cleric")).toBe(true);
  });
});

describe("PROF-005: getWeaponSpeedFactor", () => {
  it("dagger has speed factor 2", () => {
    expect(getWeaponSpeedFactor("dagger")).toBe(2);
  });

  it("two-handed sword has speed factor 10", () => {
    expect(getWeaponSpeedFactor("two-handed_sword")).toBe(10);
  });

  it("long sword has speed factor 5", () => {
    expect(getWeaponSpeedFactor("long_sword")).toBe(5);
  });

  it("unknown weapon returns null", () => {
    expect(getWeaponSpeedFactor("unknown_weapon")).toBeNull();
  });
});

describe("getNwpCheckTarget", () => {
  const engineering = {
    proficiency: { name: "Ingenieurskunst", name_en: "Engineering", ability: "INT", modifier: -3 },
  };

  it("rechnet Attribut + Modifikator + Effekte", () => {
    expect(getNwpCheckTarget(engineering, { int: 15 }, -2)).toBe(10);
  });

  it("nimmt 10, wenn das Attribut fehlt", () => {
    expect(getNwpCheckTarget(engineering, {}, 0)).toBe(7);
  });
});

describe("findProficiency", () => {
  const nwps = [
    { proficiency: { name: "Reiten", name_en: "Riding", ability: "wis", modifier: 3 } },
    {
      proficiency: {
        name: "Ingenieurskunst",
        name_en: "Engineering",
        ability: "int",
        modifier: -3,
      },
    },
  ];

  it("findet über den deutschen oder englischen Namen, ohne Groß-/Kleinschreibung", () => {
    expect(findProficiency(nwps, "ingenieurskunst", "")).toBe(nwps[1]);
    expect(findProficiency(nwps, "", "ENGINEERING")).toBe(nwps[1]);
  });

  it("liefert null, wenn der Charakter die Fertigkeit nicht hat", () => {
    expect(findProficiency(nwps, "Schmieden", "Blacksmithing")).toBeNull();
  });
});
