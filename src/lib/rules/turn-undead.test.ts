import { describe, it, expect } from "vitest";
import {
  getTurnTarget,
  resolveTurnAttempt,
  getPaladinTurnLevel,
  UNDEAD_TYPES,
} from "./turn-undead";

describe("getTurnTarget (PHB Table 61)", () => {
  it("skeleton at level 1 needs 10", () => {
    expect(getTurnTarget("skeleton", 1)).toBe(10);
  });

  it("skeleton at level 4 is auto-turn (T)", () => {
    expect(getTurnTarget("skeleton", 4)).toBe("T");
  });

  it("skeleton at level 6 is auto-destroy (D)", () => {
    expect(getTurnTarget("skeleton", 6)).toBe("D");
  });

  it("skeleton at level 8+ is D* (destroy + 2d4 extra)", () => {
    expect(getTurnTarget("skeleton", 8)).toBe("D*");
  });

  it("lich at level 1 cannot be turned (null)", () => {
    expect(getTurnTarget("lich", 1)).toBeNull();
  });

  it("lich at level 8 needs 20", () => {
    expect(getTurnTarget("lich", 8)).toBe(20);
  });

  it("lich at level 14+ needs 10", () => {
    expect(getTurnTarget("lich", 14)).toBe(10);
  });

  it("special at level 9 needs 20", () => {
    expect(getTurnTarget("special", 9)).toBe(20);
  });

  it("special at level 7 or below cannot be turned", () => {
    expect(getTurnTarget("special", 7)).toBeNull();
  });

  it("wight at level 7 needs 4", () => {
    expect(getTurnTarget("wight", 7)).toBe(4);
  });

  it("vampire at level 6 needs 20", () => {
    expect(getTurnTarget("vampire", 6)).toBe(20);
  });

  it("level 0 always returns null", () => {
    expect(getTurnTarget("skeleton", 0)).toBeNull();
  });

  it("level 10 and 11 use same column", () => {
    expect(getTurnTarget("wraith", 10)).toBe("T");
    expect(getTurnTarget("wraith", 11)).toBe("T");
  });

  it("level 12 and 13 use same column", () => {
    expect(getTurnTarget("wraith", 12)).toBe("T");
    expect(getTurnTarget("wraith", 13)).toBe("T");
  });

  it("level 14+ uses last column", () => {
    expect(getTurnTarget("wraith", 14)).toBe("D");
    expect(getTurnTarget("wraith", 20)).toBe("D");
  });
});

describe("resolveTurnAttempt", () => {
  it("successful turn when d20 >= target", () => {
    // Skeleton at L1 needs 10, roll 12
    const result = resolveTurnAttempt(1, "skeleton", 12, 7, false);
    expect(result.success).toBe(true);
    expect(result.result).toBe("turned");
    expect(result.affectedHD).toBe(7);
  });

  it("failed turn when d20 < target", () => {
    // Skeleton at L1 needs 10, roll 8
    const result = resolveTurnAttempt(1, "skeleton", 8, 7, false);
    expect(result.success).toBe(false);
    expect(result.result).toBe("failed");
    expect(result.affectedHD).toBe(0);
  });

  it("auto-turn (T) ignores d20 roll", () => {
    // Skeleton at L4 = T
    const result = resolveTurnAttempt(4, "skeleton", 1, 5, false);
    expect(result.success).toBe(true);
    expect(result.result).toBe("turned");
    expect(result.affectedHD).toBe(5);
  });

  it("auto-destroy (D) destroys undead", () => {
    // Skeleton at L6 = D
    const result = resolveTurnAttempt(6, "skeleton", 1, 8, false);
    expect(result.success).toBe(true);
    expect(result.result).toBe("destroyed");
    expect(result.affectedHD).toBe(8);
  });

  it("D* includes extra 2d4 affected", () => {
    // Skeleton at L8 = D*
    const result = resolveTurnAttempt(8, "skeleton", 1, 7, false, 5);
    expect(result.success).toBe(true);
    expect(result.result).toBe("destroyed");
    expect(result.affectedHD).toBe(7);
    expect(result.extraAffected).toBe(5);
  });

  it("evil cleric commands instead of turning", () => {
    // Skeleton at L4 = T, but evil → commanded
    const result = resolveTurnAttempt(4, "skeleton", 1, 7, true);
    expect(result.success).toBe(true);
    expect(result.result).toBe("commanded");
  });

  it("evil cleric command caps at 12 undead", () => {
    const result = resolveTurnAttempt(4, "skeleton", 1, 15, true);
    expect(result.affectedHD).toBe(12);
  });

  it("cannot turn returns failed", () => {
    // Lich at L1 = null
    const result = resolveTurnAttempt(1, "lich", 20, 12, false);
    expect(result.success).toBe(false);
    expect(result.result).toBe("failed");
    expect(result.targetNeeded).toBeNull();
  });
});

describe("getPaladinTurnLevel", () => {
  it("paladin level 5 turns as level 3", () => {
    expect(getPaladinTurnLevel(5)).toBe(3);
  });

  it("paladin level 3 turns as level 1", () => {
    expect(getPaladinTurnLevel(3)).toBe(1);
  });

  it("paladin level 2 returns 0 (cannot turn)", () => {
    expect(getPaladinTurnLevel(2)).toBe(0);
  });

  it("paladin level 1 returns 0 (cannot turn)", () => {
    expect(getPaladinTurnLevel(1)).toBe(0);
  });

  it("paladin level 10 turns as level 8", () => {
    expect(getPaladinTurnLevel(10)).toBe(8);
  });
});

describe("UNDEAD_TYPES", () => {
  it("should have 13 undead types", () => {
    expect(UNDEAD_TYPES).toHaveLength(13);
  });

  it("should include all standard types", () => {
    expect(UNDEAD_TYPES).toContain("skeleton");
    expect(UNDEAD_TYPES).toContain("vampire");
    expect(UNDEAD_TYPES).toContain("lich");
    expect(UNDEAD_TYPES).toContain("special");
  });
});
