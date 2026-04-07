import { describe, it, expect } from "vitest";
import { parseHitDice, parseDamageString, parseAttacksPerRound, rollMonsterHp } from "./monsters";

describe("parseHitDice", () => {
  it("parses simple HD (e.g. '4')", () => {
    expect(parseHitDice("4")).toEqual({ dice: 4, sides: 8, bonus: 0 });
  });

  it("parses HD with bonus (e.g. '4+1')", () => {
    expect(parseHitDice("4+1")).toEqual({ dice: 4, sides: 8, bonus: 1 });
  });

  it("parses HD with penalty (e.g. '3-1')", () => {
    expect(parseHitDice("3-1")).toEqual({ dice: 3, sides: 8, bonus: -1 });
  });

  it("parses fractional HD (e.g. '1/2')", () => {
    expect(parseHitDice("1/2")).toEqual({ dice: 0, sides: 0, bonus: 2 });
  });

  it("parses '1' HD", () => {
    expect(parseHitDice("1")).toEqual({ dice: 1, sides: 8, bonus: 0 });
  });

  it("parses large HD (e.g. '12+3')", () => {
    expect(parseHitDice("12+3")).toEqual({ dice: 12, sides: 8, bonus: 3 });
  });

  it("parses '1+1'", () => {
    expect(parseHitDice("1+1")).toEqual({ dice: 1, sides: 8, bonus: 1 });
  });

  it("handles whitespace", () => {
    expect(parseHitDice(" 4 + 1 ")).toEqual({ dice: 4, sides: 8, bonus: 1 });
  });
});

describe("parseDamageString", () => {
  it("parses single damage die (e.g. '1d8')", () => {
    expect(parseDamageString("1d8")).toEqual([{ count: 1, sides: 8, bonus: 0 }]);
  });

  it("parses damage with bonus (e.g. '1d8+2')", () => {
    expect(parseDamageString("1d8+2")).toEqual([{ count: 1, sides: 8, bonus: 2 }]);
  });

  it("parses multiple attacks (e.g. '1d4/1d4/2d6')", () => {
    expect(parseDamageString("1d4/1d4/2d6")).toEqual([
      { count: 1, sides: 4, bonus: 0 },
      { count: 1, sides: 4, bonus: 0 },
      { count: 2, sides: 6, bonus: 0 },
    ]);
  });

  it("parses damage with penalty (e.g. '1d6-1')", () => {
    expect(parseDamageString("1d6-1")).toEqual([{ count: 1, sides: 6, bonus: -1 }]);
  });

  it("parses flat damage (e.g. '1')", () => {
    expect(parseDamageString("1")).toEqual([{ count: 0, sides: 0, bonus: 1 }]);
  });

  it("handles whitespace in slash-separated list", () => {
    expect(parseDamageString("1d4 / 1d4 / 2d6")).toEqual([
      { count: 1, sides: 4, bonus: 0 },
      { count: 1, sides: 4, bonus: 0 },
      { count: 2, sides: 6, bonus: 0 },
    ]);
  });

  it("parses large damage (e.g. '3d10+5')", () => {
    expect(parseDamageString("3d10+5")).toEqual([{ count: 3, sides: 10, bonus: 5 }]);
  });
});

describe("parseAttacksPerRound", () => {
  it("parses whole number (e.g. '1')", () => {
    expect(parseAttacksPerRound("1")).toBe(1);
  });

  it("parses fraction (e.g. '3/2')", () => {
    expect(parseAttacksPerRound("3/2")).toBe(1.5);
  });

  it("parses '5/2'", () => {
    expect(parseAttacksPerRound("5/2")).toBe(2.5);
  });

  it("parses '2'", () => {
    expect(parseAttacksPerRound("2")).toBe(2);
  });

  it("parses '3'", () => {
    expect(parseAttacksPerRound("3")).toBe(3);
  });

  it("parses '1/2' (one attack every two rounds)", () => {
    expect(parseAttacksPerRound("1/2")).toBe(0.5);
  });
});

describe("rollMonsterHp", () => {
  it("returns fixed HP for fractional HD (1/2 = 2 HP flat)", () => {
    const parsed = parseHitDice("1/2");
    // With 0 dice, HP = bonus only = 2
    const hp = rollMonsterHp(parsed);
    expect(hp).toBe(2);
  });

  it("returns at least 1 HP", () => {
    const parsed = parseHitDice("1");
    const hp = rollMonsterHp(parsed);
    expect(hp).toBeGreaterThanOrEqual(1);
    expect(hp).toBeLessThanOrEqual(8);
  });

  it("applies bonus correctly for 4+1", () => {
    const parsed = parseHitDice("4+1");
    const hp = rollMonsterHp(parsed);
    // Min: 4*1+1=5, Max: 4*8+1=33
    expect(hp).toBeGreaterThanOrEqual(5);
    expect(hp).toBeLessThanOrEqual(33);
  });

  it("uses provided RNG", () => {
    const parsed = parseHitDice("2");
    // Provide a mock RNG that always returns max
    const hp = rollMonsterHp(parsed, () => 1.0 - Number.EPSILON);
    expect(hp).toBe(16); // 2 * 8
  });
});
