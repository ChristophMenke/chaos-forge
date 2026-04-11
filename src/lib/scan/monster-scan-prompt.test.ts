import { describe, it, expect } from "vitest";
import { MONSTER_SCAN_PROMPT, parseScanResponse } from "./monster-scan-prompt";

describe("MONSTER_SCAN_PROMPT — instruction integrity", () => {
  it("requires the variants array", () => {
    expect(MONSTER_SCAN_PROMPT).toContain('"variants"');
    expect(MONSTER_SCAN_PROMPT).toContain("ALWAYS return");
  });

  it("documents the four narrative sections", () => {
    expect(MONSTER_SCAN_PROMPT).toContain("intro_text");
    expect(MONSTER_SCAN_PROMPT).toContain("combat_tactics");
    expect(MONSTER_SCAN_PROMPT).toContain("habitat_society");
    expect(MONSTER_SCAN_PROMPT).toContain("ecology");
  });

  it("requires no_appearing and variant_name", () => {
    expect(MONSTER_SCAN_PROMPT).toContain("no_appearing");
    expect(MONSTER_SCAN_PROMPT).toContain("variant_name");
  });

  it("forces magic_resistance to a numeric percentage", () => {
    expect(MONSTER_SCAN_PROMPT).toMatch(/magic_resistance.*NUMBER/);
    expect(MONSTER_SCAN_PROMPT).toMatch(/0 for "Nil"/);
  });

  it("mandates metric units in narrative fields", () => {
    expect(MONSTER_SCAN_PROMPT).toContain("MUST be in metric units");
    expect(MONSTER_SCAN_PROMPT).toMatch(/feet.*m/);
    expect(MONSTER_SCAN_PROMPT).toMatch(/pounds.*kg/);
  });

  it("asks the model to resolve source_book from the page", () => {
    expect(MONSTER_SCAN_PROMPT).toContain("source_book");
    expect(MONSTER_SCAN_PROMPT).toMatch(/page header\/footer/);
  });

  it("enforces attacks_per_round as a string", () => {
    expect(MONSTER_SCAN_PROMPT).toMatch(/attacks_per_round.*STRING/);
  });
});

describe("parseScanResponse", () => {
  const validVariant = {
    name: "Kenku",
    name_en: "Kenku",
    variant_name: null,
    climate_terrain: "Any land",
    frequency: "Uncommon",
    organization: "Clan",
    activity_cycle: "Any",
    diet: "Omnivore",
    intelligence: "Average (8-10)",
    treasure: "F",
    alignment: "Neutral",
    no_appearing: "2-8",
    ac: 5,
    movement: "6, Fl 18 (D)",
    hit_dice: "2-5",
    hit_dice_value: 2,
    thac0: 19,
    attacks_per_round: "3 or 1",
    damage: "1d4/1d4/1d6",
    special_attacks: null,
    special_defenses: null,
    magic_resistance: 30,
    size: "M",
    morale: "Elite (13)",
    morale_value: 13,
    xp_value: 175,
    intro_text: "Intro text here.",
    combat_tactics: "Combat text here.",
    habitat_society: "Habitat text here.",
    ecology: "Ecology text here.",
    source_book: "Monstrous Manual",
    has_ranged_attack: false,
    typical_spells: null,
    default_zone: "melee",
  };

  it("parses a clean JSON response with a single variant", () => {
    const raw = JSON.stringify({ variants: [validVariant] });
    const result = parseScanResponse(raw);
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].name_en).toBe("Kenku");
    expect(result.variants[0].magic_resistance).toBe(30);
  });

  it("parses a multi-variant response (Orc + Orog)", () => {
    const orc = { ...validVariant, name_en: "Orc", variant_name: null };
    const orog = { ...validVariant, name_en: "Orog", variant_name: "Orog", hit_dice: "3+3" };
    const raw = JSON.stringify({ variants: [orc, orog] });
    const result = parseScanResponse(raw);
    expect(result.variants).toHaveLength(2);
    expect(result.variants[0].variant_name).toBeNull();
    expect(result.variants[1].variant_name).toBe("Orog");
    expect(result.variants[1].hit_dice).toBe("3+3");
  });

  it("strips a ```json fenced block from the response", () => {
    const raw = "```json\n" + JSON.stringify({ variants: [validVariant] }) + "\n```";
    const result = parseScanResponse(raw);
    expect(result.variants).toHaveLength(1);
  });

  it("strips a plain ``` fenced block from the response", () => {
    const raw = "```\n" + JSON.stringify({ variants: [validVariant] }) + "\n```";
    const result = parseScanResponse(raw);
    expect(result.variants[0].name_en).toBe("Kenku");
  });

  it("auto-wraps a legacy single-variant response without `variants`", () => {
    // Older prompt returned the monster object at the top level. For
    // robustness we wrap such payloads in a one-element variants array.
    const raw = JSON.stringify(validVariant);
    const result = parseScanResponse(raw);
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].name_en).toBe("Kenku");
  });

  it("throws a descriptive error for invalid JSON", () => {
    expect(() => parseScanResponse("not json at all")).toThrow(/valid JSON/);
  });

  it("throws when neither variants nor a monster shape is present", () => {
    expect(() => parseScanResponse(JSON.stringify({ foo: "bar" }))).toThrow(/variants/);
  });
});
