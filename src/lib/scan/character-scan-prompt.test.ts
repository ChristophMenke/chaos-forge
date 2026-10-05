import { describe, it, expect } from "vitest";
import {
  CHARACTER_SCAN_PROMPT,
  CHARACTER_UPDATE_SCAN_PROMPT,
  MULTI_FILE_HINT,
  buildCharacterScanPrompt,
  parseUpdateScanResponse,
} from "./character-scan-prompt";

describe("CHARACTER_SCAN_PROMPT — create mode", () => {
  it("still instructs the model to ignore handwriting", () => {
    expect(CHARACTER_SCAN_PROMPT).toContain("MASCHINENGEDRUCKTEN");
    expect(CHARACTER_SCAN_PROMPT).toContain("IGNORIERE");
  });

  it("documents the race and class id enums", () => {
    expect(CHARACTER_SCAN_PROMPT).toContain("half_elf");
    expect(CHARACTER_SCAN_PROMPT).toContain("illusionist");
  });

  it("keeps the XP-not-next-level rule", () => {
    expect(CHARACTER_SCAN_PROMPT).toMatch(/NICHT "Next Level:"/);
  });
});

describe("CHARACTER_UPDATE_SCAN_PROMPT — update mode", () => {
  it("requires the printed and handwritten blocks", () => {
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain('"printed"');
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain('"handwritten"');
  });

  it("explicitly reverses the create-mode handwriting rule", () => {
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toMatch(/handschriftlich/i);
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain("NICHT ignorieren");
  });

  it("restricts the handwritten block to deviating fields only", () => {
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toMatch(/NUR die Felder/);
  });

  it("requires a source marker on every list entry", () => {
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain('"source"');
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain('"printed" | "handwritten"');
  });

  it("covers the fields the create import never captured", () => {
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain("goldEp");
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain("languages");
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain("deity");
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain("priesthood");
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain("traits");
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain("disadvantages");
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain("notes");
  });

  it("still covers the core fields", () => {
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain("hpMax");
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain("strExceptional");
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain("weaponProficiencies");
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain("equipment");
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toContain("spells");
  });

  it("tells the model to omit unreadable fields rather than guess", () => {
    expect(CHARACTER_UPDATE_SCAN_PROMPT).toMatch(/weglassen|nicht aufnehmen/i);
  });
});

describe("buildCharacterScanPrompt", () => {
  it("adds the multi-file hint only when more than one file was uploaded", () => {
    const single = buildCharacterScanPrompt({ mode: "create", isMultiFile: false });
    const multi = buildCharacterScanPrompt({ mode: "create", isMultiFile: true });
    expect(single).not.toContain(MULTI_FILE_HINT);
    expect(multi).toContain(MULTI_FILE_HINT);
  });

  it("never leaves the placeholder in the rendered prompt", () => {
    for (const mode of ["create", "update"] as const) {
      for (const isMultiFile of [true, false]) {
        expect(buildCharacterScanPrompt({ mode, isMultiFile })).not.toContain("{{");
      }
    }
  });

  it("selects the prompt matching the mode", () => {
    expect(buildCharacterScanPrompt({ mode: "update", isMultiFile: false })).toContain('"printed"');
    expect(buildCharacterScanPrompt({ mode: "create", isMultiFile: false })).toContain(
      "MASCHINENGEDRUCKTEN"
    );
  });
});

describe("parseUpdateScanResponse", () => {
  it("parses a plain JSON payload", () => {
    const result = parseUpdateScanResponse('{"printed":{"name":"Thalia"},"handwritten":{}}');
    expect(result.printed.name).toBe("Thalia");
  });

  it("strips a markdown code fence", () => {
    const result = parseUpdateScanResponse('```json\n{"printed":{"name":"Thalia"}}\n```');
    expect(result.printed.name).toBe("Thalia");
  });

  it("tolerates prose around the JSON object", () => {
    const result = parseUpdateScanResponse('Hier das Ergebnis:\n{"printed":{"name":"Thalia"}}');
    expect(result.printed.name).toBe("Thalia");
  });

  it("defaults a missing handwritten block to an empty object", () => {
    const result = parseUpdateScanResponse('{"printed":{"name":"Thalia"}}');
    expect(result.handwritten).toEqual({});
  });

  it("defaults every missing list to an empty array", () => {
    const result = parseUpdateScanResponse('{"printed":{}}');
    expect(result.equipment).toEqual([]);
    expect(result.spells).toEqual([]);
    expect(result.weaponProficiencies).toEqual([]);
    expect(result.nwps).toEqual([]);
    expect(result.languages).toEqual([]);
  });

  it("defaults a missing source on a list entry to printed", () => {
    const result = parseUpdateScanResponse(
      '{"printed":{},"equipment":[{"name":"Fackel","magicBonus":0}]}'
    );
    expect(result.equipment[0].source).toBe("printed");
  });

  it("keeps an explicit handwritten source", () => {
    const result = parseUpdateScanResponse(
      '{"printed":{},"spells":[{"name":"Invisibility","level":2,"source":"handwritten"}]}'
    );
    expect(result.spells[0].source).toBe("handwritten");
  });

  it("wraps a bare field object that omitted the printed wrapper", () => {
    const result = parseUpdateScanResponse('{"name":"Thalia","hpMax":24}');
    expect(result.printed.name).toBe("Thalia");
    expect(result.printed.hpMax).toBe(24);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseUpdateScanResponse("kein json")).toThrow();
  });

  it("throws on a non-object payload", () => {
    expect(() => parseUpdateScanResponse("[1,2,3]")).toThrow();
  });
});
