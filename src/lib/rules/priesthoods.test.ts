import { describe, it, expect } from "vitest";
import {
  getAllPriesthoods,
  getPriesthood,
  getPriesthoodsForDisplay,
  getActivePowers,
  priesthoodHasTurnUndead,
  priesthoodHasCommandUndead,
  PRIESTHOODS,
} from "./priesthoods";
import type { PriestSphere } from "./types";

const VALID_SPHERES: PriestSphere[] = [
  "all",
  "animal",
  "astral",
  "charm",
  "combat",
  "creation",
  "divination",
  "elemental",
  "guardian",
  "healing",
  "necromantic",
  "plant",
  "protection",
  "summoning",
  "sun",
  "weather",
];

describe("Priesthood Definitions", () => {
  it("should have at least 59 priesthoods", () => {
    expect(getAllPriesthoods().length).toBeGreaterThanOrEqual(59);
  });

  it("each priesthood should have valid spheres (only known PriestSphere values)", () => {
    for (const priesthood of getAllPriesthoods()) {
      for (const sphere of Object.keys(priesthood.spheres)) {
        expect(VALID_SPHERES).toContain(sphere);
      }
      for (const access of Object.values(priesthood.spheres)) {
        expect(["major", "minor"]).toContain(access);
      }
    }
  });

  it("each priesthood should have at least wis in minAbilities", () => {
    for (const priesthood of getAllPriesthoods()) {
      expect(priesthood.minAbilities.wis).toBeDefined();
      expect(priesthood.minAbilities.wis).toBeGreaterThanOrEqual(9);
    }
  });

  it("each priesthood should have a valid combatRating", () => {
    for (const priesthood of getAllPriesthoods()) {
      expect(["good", "medium", "poor"]).toContain(priesthood.combatRating);
    }
  });

  it("each priesthood should have a unique id matching its key", () => {
    for (const [key, priesthood] of Object.entries(PRIESTHOODS)) {
      expect(priesthood.id).toBe(key);
    }
  });

  it("each priesthood should have DE and EN names", () => {
    for (const priesthood of getAllPriesthoods()) {
      expect(priesthood.name.length).toBeGreaterThan(0);
      expect(priesthood.name_en.length).toBeGreaterThan(0);
    }
  });
});

describe("getPriesthood()", () => {
  it("should return war priesthood with correct spheres", () => {
    const war = getPriesthood("war");
    expect(war).not.toBeNull();
    expect(war!.spheres.combat).toBe("major");
    expect(war!.spheres.healing).toBe("major");
    expect(war!.combatRating).toBe("good");
  });

  it("should return agriculture priesthood with 5 major + 5 minor spheres", () => {
    const agri = getPriesthood("agriculture");
    expect(agri).not.toBeNull();
    const majorCount = Object.values(agri!.spheres).filter((a) => a === "major").length;
    const minorCount = Object.values(agri!.spheres).filter((a) => a === "minor").length;
    expect(majorCount).toBe(5);
    expect(minorCount).toBe(5);
  });

  it("should return null for unknown priesthood", () => {
    expect(getPriesthood("nonexistent")).toBeNull();
  });
});

describe("getPriesthoodsForDisplay()", () => {
  it("should return German labels for 'de' locale", () => {
    const items = getPriesthoodsForDisplay("de");
    expect(items.length).toBeGreaterThanOrEqual(59);
    const war = items.find((i) => i.id === "war");
    expect(war).toBeDefined();
    expect(war!.label).not.toBe("War"); // should be German
  });

  it("should return English labels for 'en' locale", () => {
    const items = getPriesthoodsForDisplay("en");
    const war = items.find((i) => i.id === "war");
    expect(war).toBeDefined();
    expect(war!.label).toBe("War");
  });
});

describe("getActivePowers()", () => {
  it("war at level 1 returns only berserker rage", () => {
    const powers = getActivePowers("war", 1);
    expect(powers.length).toBeGreaterThanOrEqual(1);
    expect(powers.some((p) => p.mechanical?.type === "berserker_rage")).toBe(true);
    expect(powers.some((p) => p.mechanical?.type === "inspire_fear")).toBe(false);
  });

  it("war at level 5 returns berserker rage + inspire fear", () => {
    const powers = getActivePowers("war", 5);
    expect(powers.some((p) => p.mechanical?.type === "berserker_rage")).toBe(true);
    expect(powers.some((p) => p.mechanical?.type === "inspire_fear")).toBe(true);
  });

  it("unknown priesthood returns empty array", () => {
    expect(getActivePowers("nonexistent", 1)).toEqual([]);
  });
});

describe("priesthoodHasTurnUndead()", () => {
  it("community has turn undead", () => {
    expect(priesthoodHasTurnUndead("community")).toBe(true);
  });

  it("war does not have turn undead", () => {
    expect(priesthoodHasTurnUndead("war")).toBe(false);
  });
});

describe("priesthoodHasCommandUndead()", () => {
  it("death has command undead", () => {
    expect(priesthoodHasCommandUndead("death")).toBe(true);
  });

  it("agriculture does not have command undead", () => {
    expect(priesthoodHasCommandUndead("agriculture")).toBe(false);
  });
});
