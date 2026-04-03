import { describe, it, expect } from "vitest";
import { getXpForNextLevel, getXpThreshold, previewXpGain, getLevelForXp } from "./experience";

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

describe("Monk/Shaman XP (PO:S&M)", () => {
  it("monk uses cleric XP table", () => {
    expect(getXpForNextLevel("monk", 1)).toBe(1500);
    expect(getXpForNextLevel("monk", 2)).toBe(3000);
  });

  it("shaman uses cleric XP table", () => {
    expect(getXpForNextLevel("shaman", 1)).toBe(1500);
    expect(getXpForNextLevel("shaman", 2)).toBe(3000);
  });
});

// ── Next Level Changes ─────────────────────────────────────

import { getNextLevelChanges } from "./experience";

describe("getNextLevelChanges", () => {
  it("returns THAC0 improvement for fighter 6→7", () => {
    const changes = getNextLevelChanges("fighter", 6);
    const thac0 = changes.find((c) => c.type === "thac0");
    expect(thac0).toBeDefined();
    expect(thac0!.before).toBe("15");
    expect(thac0!.after).toBe("14");
  });

  it("returns spell slots improvement for mage 2→3", () => {
    const changes = getNextLevelChanges("mage", 2);
    const spells = changes.find((c) => c.type === "spellSlots");
    expect(spells).toBeDefined();
    expect(spells!.before).toBe("2");
    expect(spells!.after).toBe("2/1");
  });

  it("returns APR improvement for fighter 6→7", () => {
    const changes = getNextLevelChanges("fighter", 6);
    const apr = changes.find((c) => c.type === "attacks");
    expect(apr).toBeDefined();
    expect(apr!.before).toBe("1");
    expect(apr!.after).toBe("3/2");
  });

  it("returns proficiency slot improvements when applicable", () => {
    // Fighter gets weapon prof slot at L3→L4 (every 3 levels)
    const changes = getNextLevelChanges("fighter", 3);
    const wp = changes.find((c) => c.type === "weaponProf");
    expect(wp).toBeDefined();
    expect(wp!.before).toBe("4");
    expect(wp!.after).toBe("5");
  });

  it("returns no THAC0 change when THAC0 stays the same", () => {
    // Thief L1→L2: THAC0 stays 20
    const changes = getNextLevelChanges("thief", 1);
    const thac0 = changes.find((c) => c.type === "thac0");
    expect(thac0).toBeUndefined();
  });

  it("returns saving throw improvement for fighter 4→5", () => {
    const changes = getNextLevelChanges("fighter", 4);
    const saves = changes.find((c) => c.type === "saves");
    expect(saves).toBeDefined();
  });

  it("returns warrior THAC0 for crusader (PO:S&M exception)", () => {
    // Crusader is priest group but uses warrior THAC0 (21 - level)
    // L6→L7: warrior THAC0 goes from 15 to 14
    const changes = getNextLevelChanges("crusader", 6);
    const thac0 = changes.find((c) => c.type === "thac0");
    expect(thac0).toBeDefined();
    expect(thac0!.before).toBe("15");
    expect(thac0!.after).toBe("14");
  });

  it("returns warrior APR for crusader", () => {
    // Crusader gets warrior APR progression (3/2 at L7)
    const changes = getNextLevelChanges("crusader", 6);
    const apr = changes.find((c) => c.type === "attacks");
    expect(apr).toBeDefined();
    expect(apr!.after).toBe("3/2");
  });
});

describe("getLevelForXp", () => {
  it("returns level 1 for 0 XP", () => {
    expect(getLevelForXp("fighter", 0)).toBe(1);
  });

  it("returns level 1 for XP below level 2 threshold", () => {
    expect(getLevelForXp("fighter", 1999)).toBe(1);
  });

  it("returns level 2 at exactly 2000 XP (fighter)", () => {
    expect(getLevelForXp("fighter", 2000)).toBe(2);
  });

  it("returns level 6 for 32000 XP (fighter)", () => {
    // Fighter thresholds: L2=2000, L3=4000, L4=8000, L5=16000, L6=32000
    expect(getLevelForXp("fighter", 32000)).toBe(6);
  });

  it("works for mage class", () => {
    expect(getLevelForXp("mage", 2500)).toBe(2);
    expect(getLevelForXp("mage", 5000)).toBe(3);
  });

  it("returns correct level after XP reduction", () => {
    // Fighter had 32000 XP (L6), lost 10000 → 22000 XP = L5 (16000 needed for L5)
    expect(getLevelForXp("fighter", 22000)).toBe(5);
  });
});
