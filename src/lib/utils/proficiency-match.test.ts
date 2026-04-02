import { describe, it, expect } from "vitest";
import { matchesWeaponProf, findWeaponProf } from "./proficiency-match";
import type { CharacterWeaponProficiencyRow } from "@/lib/supabase/types";

function makeProf(weaponName: string, specialization = false): CharacterWeaponProficiencyRow {
  return {
    id: "test-id",
    character_id: "char-1",
    weapon_name: weaponName,
    specialization,
  };
}

describe("matchesWeaponProf", () => {
  it("matches when stored name equals DE name", () => {
    const wp = makeProf("Zweihänder");
    expect(matchesWeaponProf(wp, "Zweihänder", "Two-Handed Sword")).toBe(true);
  });

  it("matches when stored name equals EN name", () => {
    const wp = makeProf("Two-Handed Sword");
    expect(matchesWeaponProf(wp, "Zweihänder", "Two-Handed Sword")).toBe(true);
  });

  it("matches case-insensitively", () => {
    const wp = makeProf("zweihänder");
    expect(matchesWeaponProf(wp, "Zweihänder", "Two-Handed Sword")).toBe(true);
  });

  it("matches EN name case-insensitively", () => {
    const wp = makeProf("two-handed sword");
    expect(matchesWeaponProf(wp, "Zweihänder", "Two-Handed Sword")).toBe(true);
  });

  it("does not match when neither name matches", () => {
    const wp = makeProf("Langschwert");
    expect(matchesWeaponProf(wp, "Zweihänder", "Two-Handed Sword")).toBe(false);
  });

  it("handles null name_en gracefully", () => {
    const wp = makeProf("Zweihänder");
    expect(matchesWeaponProf(wp, "Zweihänder", null)).toBe(true);
  });

  it("does not match EN-stored name when name_en is null", () => {
    const wp = makeProf("Two-Handed Sword");
    expect(matchesWeaponProf(wp, "Zweihänder", null)).toBe(false);
  });

  it("handles undefined name_en gracefully", () => {
    const wp = makeProf("Zweihänder");
    expect(matchesWeaponProf(wp, "Zweihänder", undefined)).toBe(true);
  });
});

describe("findWeaponProf", () => {
  const profs = [
    makeProf("Zweihänder", true),
    makeProf("Long Sword", false),
    makeProf("Dolch", false),
  ];

  it("finds proficiency by DE name", () => {
    const result = findWeaponProf(profs, "Zweihänder", "Two-Handed Sword");
    expect(result).toBeDefined();
    expect(result!.specialization).toBe(true);
  });

  it("finds proficiency by EN name when stored as EN", () => {
    const result = findWeaponProf(profs, "Langschwert", "Long Sword");
    expect(result).toBeDefined();
    expect(result!.weapon_name).toBe("Long Sword");
  });

  it("returns undefined when no match", () => {
    const result = findWeaponProf(profs, "Streitkolben", "Mace");
    expect(result).toBeUndefined();
  });

  it("returns undefined for empty proficiency list", () => {
    const result = findWeaponProf([], "Zweihänder", "Two-Handed Sword");
    expect(result).toBeUndefined();
  });
});
