import { describe, it, expect } from "vitest";
import { parseTreasureCodes, TREASURE_CODE_DESCRIPTIONS } from "./treasure-codes";

describe("parseTreasureCodes", () => {
  it("returns an empty array for null, undefined and empty strings", () => {
    expect(parseTreasureCodes(null)).toEqual([]);
    expect(parseTreasureCodes(undefined)).toEqual([]);
    expect(parseTreasureCodes("")).toEqual([]);
    expect(parseTreasureCodes("   ")).toEqual([]);
  });

  it("returns empty for 'Nil' (case-insensitive)", () => {
    expect(parseTreasureCodes("Nil")).toEqual([]);
    expect(parseTreasureCodes("nil")).toEqual([]);
    expect(parseTreasureCodes("NIL")).toEqual([]);
  });

  it("parses a single code letter", () => {
    const result = parseTreasureCodes("F");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("F");
    expect(result[0].description).toBe(TREASURE_CODE_DESCRIPTIONS.F);
    expect(result[0].note).toBeUndefined();
  });

  it("normalises lowercase codes to uppercase", () => {
    const result = parseTreasureCodes("f");
    expect(result[0].code).toBe("F");
  });

  it("parses a comma-separated list of codes", () => {
    const result = parseTreasureCodes("L, M, N");
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.code)).toEqual(["L", "M", "N"]);
  });

  it("preserves parenthetical notes on individual codes", () => {
    const result = parseTreasureCodes("L, M, N (Q×10), S");
    expect(result).toHaveLength(4);
    expect(result[2].code).toBe("N");
    expect(result[2].note).toBe("(Q×10)");
    expect(result[3].code).toBe("S");
    expect(result[3].note).toBeUndefined();
  });

  it("does not split on commas that are inside parentheses", () => {
    const result = parseTreasureCodes("L (1, 2 or 3), M");
    expect(result).toHaveLength(2);
    expect(result[0].code).toBe("L");
    expect(result[0].note).toBe("(1, 2 or 3)");
    expect(result[1].code).toBe("M");
  });

  it("returns a fallback entry for completely non-standard content", () => {
    const result = parseTreasureCodes("see below");
    // The whole string becomes one fallback entry (it's not a single letter)
    expect(result).toHaveLength(1);
    expect(result[0].description).toContain("Kein DMG-Standardcode");
  });

  it("handles the most common MM treasure patterns", () => {
    // Kenku F
    expect(parseTreasureCodes("F")[0].description).toContain("Hort");
    // Many humanoids: J, O (individual carried + lair combo)
    const humanoid = parseTreasureCodes("J, O");
    expect(humanoid).toHaveLength(2);
    expect(humanoid[0].code).toBe("J");
    expect(humanoid[1].code).toBe("O");
  });
});

describe("TREASURE_CODE_DESCRIPTIONS", () => {
  it("covers all letters A through Z", () => {
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      expect(TREASURE_CODE_DESCRIPTIONS[letter], `missing description for ${letter}`).toBeTruthy();
    }
  });

  it("descriptions are in German", () => {
    // Heuristic: look for an umlaut or a capitalised German noun we know
    // is in the dataset.
    const joined = Object.values(TREASURE_CODE_DESCRIPTIONS).join(" ");
    expect(joined).toMatch(/Hort|Edelstein|Münzen|magische/);
  });
});
