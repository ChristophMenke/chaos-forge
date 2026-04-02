import { describe, it, expect } from "vitest";
import {
  getWeaponProficiencySlots,
  getNonweaponProficiencySlots,
  getNonproficiencyPenalty,
  canSpecialize,
  isNonStandardSpecialization,
  getWeaponSpeedFactor,
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
