import { describe, it, expect } from "vitest";
import {
  calculateHitPointsLevel1,
  clampHpCurrentToMax,
  computeEffectiveMaxHp,
  getConBonusCap,
  getDeathThreshold,
  getHpStatus,
} from "./hitpoints";

describe("CLASS-010: calculateHitPointsLevel1", () => {
  it("fighter with CON 16 gets 10 + 2 = 12 HP (max hit die + CON mod)", () => {
    expect(calculateHitPointsLevel1("warrior", 10, 2)).toBe(12);
  });

  it("mage with CON 10 gets 4 + 0 = 4 HP", () => {
    expect(calculateHitPointsLevel1("wizard", 4, 0)).toBe(4);
  });

  it("minimum 1 HP even with negative CON mod", () => {
    expect(calculateHitPointsLevel1("wizard", 4, -2)).toBe(2);
    expect(calculateHitPointsLevel1("wizard", 4, -5)).toBe(1);
  });

  it("priest with CON 15 gets 8 + 1 = 9 HP", () => {
    expect(calculateHitPointsLevel1("priest", 8, 1)).toBe(9);
  });
});

describe("CLASS-011: getConBonusCap", () => {
  it("warriors can get up to +4 CON HP bonus", () => {
    expect(getConBonusCap("warrior")).toBe(4);
  });

  it("priests are capped at +2", () => {
    expect(getConBonusCap("priest")).toBe(2);
  });

  it("rogues are capped at +2", () => {
    expect(getConBonusCap("rogue")).toBe(2);
  });

  it("wizards are capped at +2", () => {
    expect(getConBonusCap("wizard")).toBe(2);
  });

  it("warrior with CON 18 (+4) keeps full bonus", () => {
    const cap = getConBonusCap("warrior");
    expect(Math.min(4, cap)).toBe(4);
  });

  it("priest with CON 18 (+4) is reduced to +2", () => {
    const cap = getConBonusCap("priest");
    expect(Math.min(4, cap)).toBe(2);
  });
});

describe("COMBAT-020: getDeathThreshold", () => {
  it("returns negative of max HP", () => {
    expect(getDeathThreshold(50)).toBe(-50);
  });

  it("returns -1 for 1 HP character", () => {
    expect(getDeathThreshold(1)).toBe(-1);
  });

  it("returns -100 for 100 HP character", () => {
    expect(getDeathThreshold(100)).toBe(-100);
  });
});

describe("COMBAT-020: getHpStatus", () => {
  it("returns 'alive' when HP > 0", () => {
    expect(getHpStatus(25, 50)).toBe("alive");
    expect(getHpStatus(1, 50)).toBe("alive");
    expect(getHpStatus(50, 50)).toBe("alive");
  });

  it("returns 'unconscious' when HP is exactly 0", () => {
    expect(getHpStatus(0, 50)).toBe("unconscious");
  });

  it("returns 'unconscious' when HP is negative but above threshold", () => {
    expect(getHpStatus(-1, 50)).toBe("unconscious");
    expect(getHpStatus(-25, 50)).toBe("unconscious");
    expect(getHpStatus(-49, 50)).toBe("unconscious");
  });

  it("returns 'dead' when HP equals negative max", () => {
    expect(getHpStatus(-50, 50)).toBe("dead");
  });

  it("returns 'dead' when HP is below negative max", () => {
    expect(getHpStatus(-51, 50)).toBe("dead");
    expect(getHpStatus(-100, 50)).toBe("dead");
  });

  it("works with small HP pools", () => {
    expect(getHpStatus(0, 1)).toBe("unconscious");
    expect(getHpStatus(-1, 1)).toBe("dead");
  });

  it("treats maxHp=0 as dead (cannot exist per rules but defined boundary)", () => {
    expect(getHpStatus(0, 0)).toBe("dead");
  });
});

describe("computeEffectiveMaxHp", () => {
  it("returns stored max when CON is unchanged", () => {
    expect(computeEffectiveMaxHp(50, 2, 2, 9, "rogue")).toBe(50);
  });

  it("raises max on CON increase (delta positive) — warrior uncapped", () => {
    // Warrior level 5, CON 0 → 4 bonus: delta = (4 − 0) × 5 = 20
    expect(computeEffectiveMaxHp(40, 0, 4, 5, "warrior")).toBe(60);
  });

  it("lowers max on CON drop (Kondensator unequip scenario)", () => {
    // Sprocket: single-class for simplicity. CON 18 (+2 cap) → CON 5 (-2).
    // delta = (-2 − 2) × 9 = -36
    expect(computeEffectiveMaxHp(50, 2, -2, 9, "rogue")).toBe(50 - 36);
  });

  it("caps non-warrior CON bonus at +2 in delta calc", () => {
    // Would be +4 without cap, but rogue caps at +2 → delta = (2 − 0) × 3 = 6
    expect(computeEffectiveMaxHp(20, 0, 4, 3, "rogue")).toBe(26);
  });

  it("applies HP penalty (negative mod) without cap for non-warriors", () => {
    // Negative adjustments aren't capped by class bonus cap
    expect(computeEffectiveMaxHp(30, 0, -2, 5, "rogue")).toBe(20);
  });

  it("clamps effective max to at least 1", () => {
    expect(computeEffectiveMaxHp(5, 0, -2, 10, "rogue")).toBe(1);
  });

  it("treats level 0 as level 1 (defensive)", () => {
    expect(computeEffectiveMaxHp(50, 2, -2, 0, "rogue")).toBe(50 + (-2 - 2) * 1);
  });
});

describe("clampHpCurrentToMax", () => {
  it("caps current down to new max when current > max (Kondensator unequip)", () => {
    // Sprocket: vorher 34/34, Kondensator ab → neues Max 12
    expect(clampHpCurrentToMax(34, 12)).toBe(12);
  });

  it("leaves current unchanged when ≤ max", () => {
    expect(clampHpCurrentToMax(10, 12)).toBe(10);
    expect(clampHpCurrentToMax(5, 12)).toBe(5);
    expect(clampHpCurrentToMax(12, 12)).toBe(12);
  });

  it("does NOT reduce current proportionally — pure cap only", () => {
    // Regression: früher reduzierte der Code current um den (negativen) Delta,
    // statt nur zu clampen. 34 → 12/12 ist korrekt; 34 → -10/12 war der Bug.
    expect(clampHpCurrentToMax(34, 12)).not.toBe(-10);
    expect(clampHpCurrentToMax(34, 12)).toBe(12);
  });

  it("allows unconscious (negative but above death threshold)", () => {
    expect(clampHpCurrentToMax(-5, 12)).toBe(-5);
    expect(clampHpCurrentToMax(0, 12)).toBe(0);
    expect(clampHpCurrentToMax(-11, 12)).toBe(-11);
  });

  it("clamps current to death threshold when below −max", () => {
    expect(clampHpCurrentToMax(-20, 12)).toBe(-12);
    expect(clampHpCurrentToMax(-100, 50)).toBe(-50);
  });

  it("handles stored current already above stored max (edge case)", () => {
    // Shouldn't happen under normal rules, but function must be defensive
    expect(clampHpCurrentToMax(20, 12)).toBe(12);
  });
});
