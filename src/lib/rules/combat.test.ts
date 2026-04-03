import { describe, it, expect } from "vitest";
import {
  getThac0,
  getAttackRoll,
  getSavingThrows,
  getAttacksPerRound,
  getAdjustedWeaponThac0,
  formatDamageWithBonus,
  getClassSaveAdjustments,
  getEffectiveWeaponSpeed,
} from "./combat";

describe("COMBAT-001: THAC0", () => {
  it("should return 20 for a level 1 warrior", () => {
    expect(getThac0("warrior", 1)).toBe(20);
  });

  it("should return 10 for a level 11 warrior (warriors improve every level)", () => {
    expect(getThac0("warrior", 11)).toBe(10);
  });

  it("should return 20 for a level 1 priest", () => {
    expect(getThac0("priest", 1)).toBe(20);
  });

  it("should return 18 for a level 4 priest (priests improve every 3 levels)", () => {
    expect(getThac0("priest", 4)).toBe(18);
  });

  it("should return 20 for a level 1 rogue", () => {
    expect(getThac0("rogue", 1)).toBe(20);
  });

  it("should return 18 for a level 5 rogue (rogues improve every 2 levels)", () => {
    expect(getThac0("rogue", 5)).toBe(18);
  });

  it("should return 20 for a level 1 wizard", () => {
    expect(getThac0("wizard", 1)).toBe(20);
  });

  it("should return 18 for a level 7 wizard (wizards improve every 3 levels)", () => {
    expect(getThac0("wizard", 7)).toBe(18);
  });

  it("should cap at minimum THAC0 of 1", () => {
    expect(getThac0("warrior", 20)).toBe(1);
  });
});

describe("Crusader THAC0 (Warrior rate, PO:S&M)", () => {
  it("L1 Crusader has THAC0 20 (warrior rate, not priest)", () => {
    expect(getThac0("priest", 1, "crusader")).toBe(20);
  });

  it("L5 Crusader has THAC0 16 (warrior: 21-5)", () => {
    expect(getThac0("priest", 5, "crusader")).toBe(16);
  });

  it("L10 Crusader has THAC0 11", () => {
    expect(getThac0("priest", 10, "crusader")).toBe(11);
  });

  it("L20 Crusader has THAC0 1 (minimum)", () => {
    expect(getThac0("priest", 20, "crusader")).toBe(1);
  });

  it("regular priest still uses priest progression (regression)", () => {
    expect(getThac0("priest", 5)).toBe(18);
  });

  it("without classId, priest group uses priest progression", () => {
    expect(getThac0("priest", 4)).toBe(18);
  });

  it("non-crusader classId does not override", () => {
    expect(getThac0("priest", 5, "cleric")).toBe(18);
  });
});

describe("COMBAT-002: Attack Roll Calculation", () => {
  it("should need 20 to hit AC 0 with THAC0 20", () => {
    expect(getAttackRoll(20, 0)).toBe(20);
  });

  it("should need 15 to hit AC 5 with THAC0 20", () => {
    expect(getAttackRoll(20, 5)).toBe(15);
  });

  it("should need 10 to hit AC 0 with THAC0 10", () => {
    expect(getAttackRoll(10, 0)).toBe(10);
  });

  it("should handle negative AC (e.g. AC -3)", () => {
    expect(getAttackRoll(20, -3)).toBe(23);
  });
});

describe("COMBAT-003: Saving Throws", () => {
  it("should return correct saves for a level 1 warrior", () => {
    const saves = getSavingThrows("warrior", 1);
    expect(saves.paralyzation).toBe(14);
    expect(saves.rod).toBe(16);
    expect(saves.petrification).toBe(15);
    expect(saves.breath).toBe(17);
    expect(saves.spell).toBe(17);
  });

  it("should return improved saves for a level 3 warrior", () => {
    const saves = getSavingThrows("warrior", 3);
    expect(saves.paralyzation).toBe(13);
    expect(saves.rod).toBe(15);
    expect(saves.petrification).toBe(14);
    expect(saves.breath).toBe(16);
    expect(saves.spell).toBe(16);
  });

  it("should return correct saves for a level 1 wizard", () => {
    const saves = getSavingThrows("wizard", 1);
    expect(saves.paralyzation).toBe(14);
    expect(saves.rod).toBe(11);
    expect(saves.petrification).toBe(13);
    expect(saves.breath).toBe(15);
    expect(saves.spell).toBe(12);
  });

  it("should return correct saves for a level 1 priest", () => {
    const saves = getSavingThrows("priest", 1);
    expect(saves.paralyzation).toBe(10);
    expect(saves.rod).toBe(14);
    expect(saves.petrification).toBe(13);
    expect(saves.breath).toBe(16);
    expect(saves.spell).toBe(15);
  });

  it("should return correct saves for a level 1 rogue", () => {
    const saves = getSavingThrows("rogue", 1);
    expect(saves.paralyzation).toBe(13);
    expect(saves.rod).toBe(14);
    expect(saves.petrification).toBe(12);
    expect(saves.breath).toBe(16);
    expect(saves.spell).toBe(15);
  });
});

describe("COMBAT-004: Attacks Per Round", () => {
  it("warrior L1-6 gets 1 attack", () => {
    expect(getAttacksPerRound("warrior", 1)).toBe("1");
    expect(getAttacksPerRound("warrior", 6)).toBe("1");
  });

  it("warrior L7-12 gets 3/2 attacks", () => {
    expect(getAttacksPerRound("warrior", 7)).toBe("3/2");
    expect(getAttacksPerRound("warrior", 12)).toBe("3/2");
  });

  it("warrior L13+ gets 2 attacks", () => {
    expect(getAttacksPerRound("warrior", 13)).toBe("2");
    expect(getAttacksPerRound("warrior", 20)).toBe("2");
  });

  it("non-warriors always get 1 attack", () => {
    expect(getAttacksPerRound("priest", 10)).toBe("1");
    expect(getAttacksPerRound("rogue", 15)).toBe("1");
    expect(getAttacksPerRound("wizard", 20)).toBe("1");
  });

  it("specialist warrior L1-6 gets 3/2 attacks", () => {
    expect(getAttacksPerRound("warrior", 1, true)).toBe("3/2");
    expect(getAttacksPerRound("warrior", 6, true)).toBe("3/2");
  });

  it("specialist warrior L7-12 gets 2 attacks", () => {
    expect(getAttacksPerRound("warrior", 7, true)).toBe("2");
    expect(getAttacksPerRound("warrior", 12, true)).toBe("2");
  });

  it("specialist warrior L13+ gets 5/2 attacks", () => {
    expect(getAttacksPerRound("warrior", 13, true)).toBe("5/2");
    expect(getAttacksPerRound("warrior", 20, true)).toBe("5/2");
  });

  it("non-specialist with explicit false behaves like default", () => {
    expect(getAttacksPerRound("warrior", 1, false)).toBe("1");
    expect(getAttacksPerRound("warrior", 7, false)).toBe("3/2");
  });

  it("specialist non-warrior still gets 1 attack", () => {
    expect(getAttacksPerRound("priest", 10, true)).toBe("1");
    expect(getAttacksPerRound("rogue", 15, true)).toBe("1");
  });
});

describe("getClassSaveAdjustments (PHB: Druid +2 vs Fire/Electricity)", () => {
  it("druid should get -2 breath save adjustment", () => {
    const adj = getClassSaveAdjustments("druid");
    expect(adj.breath).toBe(-2);
  });

  it("cleric should get no adjustments", () => {
    const adj = getClassSaveAdjustments("cleric");
    expect(adj).toEqual({});
  });

  it("fighter should get no adjustments", () => {
    const adj = getClassSaveAdjustments("fighter");
    expect(adj).toEqual({});
  });

  it("mage should get no adjustments", () => {
    const adj = getClassSaveAdjustments("mage");
    expect(adj).toEqual({});
  });
});

describe("getAdjustedWeaponThac0", () => {
  it("melee weapon: base THAC0 - STR hitAdj", () => {
    // Fighter L1 (THAC0 20), STR 16 (hitAdj +1), proficient
    const result = getAdjustedWeaponThac0(20, 1, 0, "melee", 0);
    expect(result.melee).toBe(19);
    expect(result.ranged).toBeNull();
  });

  it("ranged weapon: base THAC0 - DEX missileAdj", () => {
    // Fighter L1 (THAC0 20), DEX 16 (missileAdj +1), proficient
    const result = getAdjustedWeaponThac0(20, 0, 1, "ranged", 0);
    expect(result.melee).toBe(20); // melee still calculated for thrown
    expect(result.ranged).toBe(19);
  });

  it("both (thrown) weapon: has melee and ranged THAC0", () => {
    // Fighter L5 (THAC0 16), STR 18 (hitAdj +1), DEX 15 (missileAdj 0)
    const result = getAdjustedWeaponThac0(16, 1, 0, "both", 0);
    expect(result.melee).toBe(15);
    expect(result.ranged).toBe(16);
  });

  it("non-proficient weapon adds penalty", () => {
    // Wizard L1 (THAC0 20), STR 10 (hitAdj 0), non-proficient (-5)
    const result = getAdjustedWeaponThac0(20, 0, 0, "melee", -5);
    expect(result.melee).toBe(25); // worse THAC0
  });

  it("high STR exceptional can bring THAC0 below base", () => {
    // Fighter L10 (THAC0 11), STR 18/00 (hitAdj +3), proficient
    const result = getAdjustedWeaponThac0(11, 3, 0, "melee", 0);
    expect(result.melee).toBe(8);
  });

  it("magical weapon bonus reduces THAC0", () => {
    // Fighter L1 (THAC0 20), STR 10, proficient, +2 weapon
    const result = getAdjustedWeaponThac0(20, 0, 0, "melee", 0, 2);
    expect(result.melee).toBe(18);
  });

  it("magical weapon bonus applies to both melee and ranged", () => {
    // Fighter L1 (THAC0 20), STR 10, DEX 16 (+1), +3 weapon (both)
    const result = getAdjustedWeaponThac0(20, 0, 1, "both", 0, 3);
    expect(result.melee).toBe(17);
    expect(result.ranged).toBe(16);
  });

  it("combines STR, proficiency, and weapon bonus", () => {
    // Fighter L5 (THAC0 16), STR 18 (+1), proficient, +2 weapon
    const result = getAdjustedWeaponThac0(16, 1, 0, "melee", 0, 2);
    expect(result.melee).toBe(13);
  });
});

describe("formatDamageWithBonus", () => {
  it("no bonus returns base damage", () => {
    expect(formatDamageWithBonus("1d8", 0)).toBe("1d8");
  });

  it("positive bonus adds +N", () => {
    expect(formatDamageWithBonus("1d8", 2)).toBe("1d8+2");
  });

  it("negative bonus shows -N", () => {
    expect(formatDamageWithBonus("1d6", -1)).toBe("1d6-1");
  });

  it("works with complex damage strings", () => {
    expect(formatDamageWithBonus("2d4+1", 3)).toBe("2d4+1+3");
  });

  it("weapon damage bonus adds to STR bonus", () => {
    expect(formatDamageWithBonus("1d8", 1, 2)).toBe("1d8+3");
  });

  it("weapon damage bonus alone", () => {
    expect(formatDamageWithBonus("1d6", 0, 2)).toBe("1d6+2");
  });

  it("weapon bonus and negative STR cancel out", () => {
    expect(formatDamageWithBonus("1d8", -2, 2)).toBe("1d8");
  });
});

// ── Lady Catrina Scenario Tests ──────────────────────────────────────────
// Level 11 Crusader, STR hitAdj +3, STR dmgAdj +5
// Zweihänder +3 (specialized), Dolch +2 (not specialized)
// House rules: Crusader gets warrior APR by level, spec gives +1 hit/+2 dmg,
// but spec does NOT give extra APR for non-fighter classes.

describe("Lady Catrina: Crusader L11 combat calculations", () => {
  const baseThac0 = 10; // getThac0("priest", 11, "crusader") = 21-11 = 10
  const strHitAdj = 3;
  const strDmgAdj = 5;
  const dexMissileAdj = 0;

  it("Crusader L11 base THAC0 is 10 (warrior rate)", () => {
    expect(getThac0("priest", 11, "crusader")).toBe(10);
  });

  describe("Two-Handed Sword +3 (specialized)", () => {
    const specHitBonus = 1;
    const specDmgBonus = 2;
    const weaponHitBonus = 3;
    const weaponDmgBonus = 3;

    it("THAC0 = 10 - 3(STR) - 1(spec) - 3(magic) = 3", () => {
      const result = getAdjustedWeaponThac0(
        baseThac0,
        strHitAdj + specHitBonus,
        dexMissileAdj + specHitBonus,
        "melee",
        0, // proficient
        weaponHitBonus
      );
      expect(result.melee).toBe(3);
      expect(result.ranged).toBeNull();
    });

    it("Damage S/M = 1d10 + 5(STR) + 2(spec) + 3(magic) = 1d10+10", () => {
      expect(formatDamageWithBonus("1d10", strDmgAdj + specDmgBonus, weaponDmgBonus)).toBe(
        "1d10+10"
      );
    });

    it("Damage L = 3d6 + 5(STR) + 2(spec) + 3(magic) = 3d6+10", () => {
      expect(formatDamageWithBonus("3d6", strDmgAdj + specDmgBonus, weaponDmgBonus)).toBe("3d6+10");
    });

    it("APR = 3/2 (S&P: non-warrior spec grants +1/2 APR, 1 → 3/2)", () => {
      // Crusader is a priest, base APR is 1
      // S&P specialization grants +1/2 APR → 3/2
      // The caller (UI) handles this: non-warrior + spec → "3/2"
      expect(getAttacksPerRound("priest", 11, false)).toBe("1");
    });
  });

  describe("Dagger +2 (NOT specialized)", () => {
    const specHitBonus = 0;
    const specDmgBonus = 0;
    const weaponHitBonus = 2;
    const weaponDmgBonus = 2;

    it("THAC0 = 10 - 3(STR) - 0(no spec) - 2(magic) = 5", () => {
      const result = getAdjustedWeaponThac0(
        baseThac0,
        strHitAdj + specHitBonus,
        dexMissileAdj + specHitBonus,
        "both", // dagger is melee/ranged
        0, // proficient
        weaponHitBonus
      );
      expect(result.melee).toBe(5);
    });

    it("Damage S/M = 1d4 + 5(STR) + 0(no spec) + 2(magic) = 1d4+7", () => {
      expect(formatDamageWithBonus("1d4", strDmgAdj + specDmgBonus, weaponDmgBonus)).toBe("1d4+7");
    });

    it("Damage L = 1d3 + 5(STR) + 0(no spec) + 2(magic) = 1d3+7", () => {
      expect(formatDamageWithBonus("1d3", strDmgAdj + specDmgBonus, weaponDmgBonus)).toBe("1d3+7");
    });

    it("APR = 1 (Crusader is priest group, base APR)", () => {
      // Without S&P spec, Crusader gets priest APR (1)
      expect(getAttacksPerRound("priest", 11, false)).toBe("1");
    });
  });
});

describe("Fighter vs non-warrior spec APR", () => {
  it("Fighter L9 with spec gets 2 APR (PHB table)", () => {
    expect(getAttacksPerRound("warrior", 9, true)).toBe("2");
  });

  it("Fighter L9 without spec gets 3/2 APR (PHB table)", () => {
    expect(getAttacksPerRound("warrior", 9, false)).toBe("3/2");
  });

  it("Priest base APR is always 1", () => {
    expect(getAttacksPerRound("priest", 11, false)).toBe("1");
  });

  it("Non-warrior S&P spec APR is handled by caller (3/2), not by engine", () => {
    // getAttacksPerRound for priests always returns "1"
    // The UI caller checks: if non-warrior + specialized → "3/2"
    expect(getAttacksPerRound("priest", 11, true)).toBe("1");
  });
});

describe("getEffectiveWeaponSpeed", () => {
  it("reduces speed by magic bonus", () => {
    expect(getEffectiveWeaponSpeed(10, 3, 3)).toBe(7);
  });

  it("uses the lower bonus when hit and damage differ", () => {
    expect(getEffectiveWeaponSpeed(10, 3, 1)).toBe(9);
    expect(getEffectiveWeaponSpeed(10, 1, 3)).toBe(9);
  });

  it("returns base speed for non-magical weapons (bonus 0)", () => {
    expect(getEffectiveWeaponSpeed(5, 0, 0)).toBe(5);
  });

  it("does not go below 0", () => {
    expect(getEffectiveWeaponSpeed(2, 5, 5)).toBe(0);
  });

  it("ignores negative bonuses (cursed weapons)", () => {
    expect(getEffectiveWeaponSpeed(5, -1, -1)).toBe(5);
  });

  it("defaults damageBonus to hitBonus when not provided", () => {
    expect(getEffectiveWeaponSpeed(10, 3)).toBe(7);
  });
});
