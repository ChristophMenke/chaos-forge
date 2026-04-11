import { describe, it, expect } from "vitest";
import { parseHitDiceValue } from "./hit-dice";

describe("parseHitDiceValue", () => {
  it("parses plain integer notation", () => {
    expect(parseHitDiceValue("8")).toBe(8);
    expect(parseHitDiceValue("1")).toBe(1);
  });

  it("parses plus notation (keeps the base)", () => {
    expect(parseHitDiceValue("3+3")).toBe(3);
    expect(parseHitDiceValue("8+8")).toBe(8);
    expect(parseHitDiceValue("12+4")).toBe(12);
  });

  it("parses fractional notation", () => {
    expect(parseHitDiceValue("1/2")).toBe(0.5);
    expect(parseHitDiceValue("1/4")).toBe(0.25);
  });

  it("parses range notation (keeps the minimum)", () => {
    expect(parseHitDiceValue("2-5")).toBe(2);
    expect(parseHitDiceValue("1-3")).toBe(1);
  });

  it("returns 1 as fallback for empty or unparseable input", () => {
    expect(parseHitDiceValue("")).toBe(1);
    expect(parseHitDiceValue("   ")).toBe(1);
    expect(parseHitDiceValue("unknown")).toBe(1);
  });

  it("handles leading whitespace", () => {
    expect(parseHitDiceValue("  4  ")).toBe(4);
  });
});
