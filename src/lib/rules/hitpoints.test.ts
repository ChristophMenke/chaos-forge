import { describe, it, expect } from "vitest";
import {
  calculateHitPointsLevel1,
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
