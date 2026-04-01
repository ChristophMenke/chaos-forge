import { describe, it, expect } from "vitest";
import { getXpForNextLevel, getXpThreshold, previewXpGain } from "./experience";

describe("XP-001 XP-002 XP-003: Experience Points", () => {
  it("should return 2000 XP for fighter level 2", () => {
    expect(getXpForNextLevel("fighter", 1)).toBe(2000);
  });

  it("should return 4000 XP for fighter level 3", () => {
    expect(getXpForNextLevel("fighter", 2)).toBe(4000);
  });

  it("should return 2500 XP for mage level 2", () => {
    expect(getXpForNextLevel("mage", 1)).toBe(2500);
  });

  it("should return 1500 XP for thief level 2", () => {
    expect(getXpForNextLevel("thief", 1)).toBe(1250);
  });

  it("should return 1500 XP for cleric level 2", () => {
    expect(getXpForNextLevel("cleric", 1)).toBe(1500);
  });

  it("should return 0 XP threshold for level 1", () => {
    expect(getXpThreshold("fighter", 1)).toBe(0);
  });

  it("should return correct threshold for ranger level 2", () => {
    expect(getXpForNextLevel("ranger", 1)).toBe(2250);
  });

  it("should return correct threshold for paladin level 2", () => {
    expect(getXpForNextLevel("paladin", 1)).toBe(2250);
  });

  it("should return null for max level", () => {
    expect(getXpForNextLevel("fighter", 20)).toBeNull();
  });
});

describe("Druid XP Table (PHB Table 23)", () => {
  it("should return correct XP for druid level 2", () => {
    expect(getXpForNextLevel("druid", 1)).toBe(2000);
  });

  it("should return correct XP for druid level 10", () => {
    expect(getXpForNextLevel("druid", 9)).toBe(125000);
  });

  it("should return 4,000,000 XP for druid level 17 (was corrupted)", () => {
    expect(getXpForNextLevel("druid", 16)).toBe(4000000);
  });

  it("should return 4,500,000 XP for druid level 18 (was corrupted)", () => {
    expect(getXpForNextLevel("druid", 17)).toBe(4500000);
  });

  it("should return 5,000,000 XP for druid level 19 (was corrupted)", () => {
    expect(getXpForNextLevel("druid", 18)).toBe(5000000);
  });

  it("should return 5,500,000 XP for druid level 20 (was corrupted)", () => {
    expect(getXpForNextLevel("druid", 19)).toBe(5500000);
  });

  it("should have monotonically increasing XP requirements", () => {
    for (let level = 1; level < 19; level++) {
      const current = getXpForNextLevel("druid", level);
      const next = getXpForNextLevel("druid", level + 1);
      if (current !== null && next !== null) {
        expect(next).toBeGreaterThan(current);
      }
    }
  });
});

describe("Crusader XP (uses cleric table, PO:S&M)", () => {
  it("should use cleric XP table for level 2", () => {
    expect(getXpForNextLevel("crusader", 1)).toBe(1500);
  });

  it("should use cleric XP table for level 3", () => {
    expect(getXpForNextLevel("crusader", 2)).toBe(3000);
  });

  it("should level up correctly with previewXpGain", () => {
    const preview = previewXpGain("crusader", 1, 0, 1500);
    expect(preview.newLevel).toBe(2);
    expect(preview.levelsGained).toBe(1);
  });
});

describe("previewXpGain", () => {
  it("should level up fighter from 1 to 2 with 2000 XP", () => {
    const preview = previewXpGain("fighter", 1, 0, 2000);
    expect(preview.currentLevel).toBe(1);
    expect(preview.newLevel).toBe(2);
    expect(preview.newXp).toBe(2000);
    expect(preview.levelsGained).toBe(1);
  });

  it("should handle multi-level jump (fighter 1 → 4 with 8000 XP)", () => {
    const preview = previewXpGain("fighter", 1, 0, 8000);
    expect(preview.newLevel).toBe(4);
    expect(preview.newXp).toBe(8000);
    expect(preview.levelsGained).toBe(3);
  });

  it("should not level up if XP insufficient", () => {
    const preview = previewXpGain("fighter", 1, 0, 500);
    expect(preview.newLevel).toBe(1);
    expect(preview.newXp).toBe(500);
    expect(preview.levelsGained).toBe(0);
  });

  it("should handle max level (no level up)", () => {
    const preview = previewXpGain("fighter", 20, 3000000, 100);
    expect(preview.newLevel).toBe(20);
    expect(preview.levelsGained).toBe(0);
  });

  it("should add XP to existing XP", () => {
    const preview = previewXpGain("fighter", 1, 1500, 600);
    expect(preview.newXp).toBe(2100);
    expect(preview.newLevel).toBe(2);
    expect(preview.levelsGained).toBe(1);
  });

  it("should work for mage class", () => {
    const preview = previewXpGain("mage", 1, 0, 5000);
    expect(preview.newLevel).toBe(3);
    expect(preview.levelsGained).toBe(2);
  });

  it("should work for specialist wizard (uses mage table)", () => {
    const preview = previewXpGain("illusionist", 1, 0, 2500);
    expect(preview.newLevel).toBe(2);
    expect(preview.levelsGained).toBe(1);
  });

  it("should preserve class ID in result", () => {
    const preview = previewXpGain("thief", 3, 3000, 2000);
    expect(preview.classId).toBe("thief");
    expect(preview.currentLevel).toBe(3);
    expect(preview.currentXp).toBe(3000);
  });
});
