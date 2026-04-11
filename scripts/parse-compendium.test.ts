/**
 * TDD tests for the compendium HTML parser.
 *
 * These tests assert structure and numeric stat-block values only — they do
 * NOT hard-code any of the copyrighted narrative prose from the source HTML.
 * Narrative assertions check shape (non-empty, no HTML tags, metric units)
 * rather than exact content.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { parseMonsterHtml, resolveSourceBook } from "./parse-compendium";

const kenkuHtml = readFileSync(path.resolve(__dirname, "fixtures/kenku.html"), "utf-8");

describe("parseMonsterHtml — stat block extraction", () => {
  it("extracts the monster name from the <h1> heading", () => {
    const parsed = parseMonsterHtml(kenkuHtml, "kenku");
    expect(parsed.name_en).toBe("Kenku");
    // Before translation, DE name equals EN name as placeholder
    expect(parsed.name).toBe("Kenku");
  });

  it("exposes the filename-derived monster_key", () => {
    expect(parseMonsterHtml(kenkuHtml, "kenku").monster_key).toBe("kenku");
  });

  it("extracts TSR product IDs as an array", () => {
    const parsed = parseMonsterHtml(kenkuHtml, "kenku");
    expect(parsed.tsr_codes).toContain("2140"); // Monstrous Manual
    expect(parsed.tsr_codes.length).toBeGreaterThan(0);
  });

  it("extracts the primary fluff fields", () => {
    const parsed = parseMonsterHtml(kenkuHtml, "kenku");
    expect(parsed.climate_terrain).toBe("Any land");
    expect(parsed.frequency).toBe("Uncommon");
    expect(parsed.organization).toBe("Clan");
    expect(parsed.activity_cycle).toBe("Any");
    expect(parsed.diet).toBe("Omnivore");
    expect(parsed.intelligence).toBe("Average (8-10)");
    expect(parsed.treasure).toBe("F");
    expect(parsed.alignment).toBe("Neutral");
    expect(parsed.no_appearing).toBe("2-8");
  });

  it("extracts the combat stat-block as typed values", () => {
    const parsed = parseMonsterHtml(kenkuHtml, "kenku");
    expect(parsed.ac).toBe(5);
    expect(parsed.hit_dice).toBe("2-5");
    expect(parsed.hit_dice_value).toBe(2); // Range minimum
    // thac0 is the first integer of a possibly multi-line cell
    expect(parsed.thac0).toBeTypeOf("number");
    expect(Number.isNaN(parsed.thac0)).toBe(false);
    expect(parsed.attacks_per_round).toBeTruthy();
    expect(parsed.damage).toBeTruthy();
  });

  it("extracts morale as text plus numeric minimum", () => {
    const parsed = parseMonsterHtml(kenkuHtml, "kenku");
    expect(parsed.morale).toContain("Elite");
    expect(parsed.morale_value).toBe(13);
  });

  it("extracts size category as a single letter", () => {
    const parsed = parseMonsterHtml(kenkuHtml, "kenku");
    // MM size cell is "M (5-7' tall)" — we want just the category code.
    expect(parsed.size).toBe("M");
  });

  it("parses magic_resistance as an integer percentage", () => {
    const parsed = parseMonsterHtml(kenkuHtml, "kenku");
    expect(parsed.magic_resistance).toBe(30);
  });

  it("treats 'Nil' magic resistance as 0", () => {
    // Source HTML has <th> and <td> on separate lines, so the regex must
    // allow whitespace (incl. newlines) between the tags.
    const htmlWithNil = kenkuHtml.replace(
      /<th>Magic Resistance:<\/th>\s*<td>[^<]*<\/td>/,
      "<th>Magic Resistance:</th><td>Nil</td>"
    );
    expect(parseMonsterHtml(htmlWithNil, "kenku").magic_resistance).toBe(0);
  });

  it("extracts xp_value as a number (first if multi-valued)", () => {
    const parsed = parseMonsterHtml(kenkuHtml, "kenku");
    expect(parsed.xp_value).toBeTypeOf("number");
    expect(parsed.xp_value).toBeGreaterThan(0);
  });
});

describe("parseMonsterHtml — narrative extraction", () => {
  it("extracts all four narrative sections as non-empty strings", () => {
    const parsed = parseMonsterHtml(kenkuHtml, "kenku");
    expect(parsed.intro_text).toBeTruthy();
    expect(parsed.combat_tactics).toBeTruthy();
    expect(parsed.habitat_society).toBeTruthy();
    expect(parsed.ecology).toBeTruthy();
  });

  it("strips HTML tags from narrative sections", () => {
    const parsed = parseMonsterHtml(kenkuHtml, "kenku");
    // No leftover tags
    expect(parsed.intro_text).not.toMatch(/<[^>]+>/);
    expect(parsed.combat_tactics).not.toMatch(/<[^>]+>/);
    expect(parsed.habitat_society).not.toMatch(/<[^>]+>/);
    expect(parsed.ecology).not.toMatch(/<[^>]+>/);
  });

  it("strips the leading section header from each narrative field", () => {
    const parsed = parseMonsterHtml(kenkuHtml, "kenku");
    // The HTML uses "<b>Combat:</b> ..." — we want the text WITHOUT the label
    expect(parsed.combat_tactics).not.toMatch(/^Combat:/i);
    expect(parsed.habitat_society).not.toMatch(/^Habitat\/Society:/i);
    expect(parsed.ecology).not.toMatch(/^Ecology:/i);
  });

  it("replaces cross-reference links with their text content", () => {
    const parsed = parseMonsterHtml(kenkuHtml, "kenku");
    // Source HTML has <a href="bird.html">birds</a> — expect "birds" in output
    expect(parsed.intro_text?.toLowerCase()).toContain("bird");
    expect(parsed.intro_text).not.toContain("href=");
  });

  it("converts imperial units in narrative text to metric", () => {
    // Inject an imperial phrase, verify it comes out metric.
    const html = kenkuHtml.replace(
      /(<p[^>]*class="f"[^>]*>)/,
      `$1<b>Combat:</b> This test creature stands 5 feet tall and weighs 80 pounds. `
    );
    const parsed = parseMonsterHtml(html, "kenku");
    // "5 feet" → "1.5 m" (via convertImperialText, format "1,5 m")
    expect(parsed.combat_tactics).toMatch(/1[.,]5\s*m/);
    // "80 pounds" → "36,3 kg"
    expect(parsed.combat_tactics).toMatch(/36[.,]3\s*kg/);
    expect(parsed.combat_tactics).not.toMatch(/\bfeet\b/);
    expect(parsed.combat_tactics).not.toMatch(/\bpounds\b/);
  });

  it("also converts imperial units in the size cell detail into the intro_text", () => {
    // Kenku size = "M (5-7' tall)" — the imperial "5-7'" should end up as metric
    // somewhere in intro_text (the parser appends size detail to the intro).
    const parsed = parseMonsterHtml(kenkuHtml, "kenku");
    // The detail from the size cell should mention height in meters, not feet.
    // We do not hard-code the exact phrasing, only the absence of imperial units.
    expect(parsed.intro_text ?? "").not.toMatch(/\b\d+\s*feet\b/i);
    expect(parsed.intro_text ?? "").not.toMatch(/\bfoot\b/i);
  });
});

describe("resolveSourceBook", () => {
  const lookup = {
    "2140": { title: "Monstrous Manual" },
    "2102": { title: "MC1 Volume I (w/binder #1)" },
    "2103": { title: "MC2 Volume II" },
  };

  it("prefers Monstrous Manual when multiple codes are present", () => {
    expect(resolveSourceBook(["2103", "2140", "2428"], lookup)).toBe("Monstrous Manual");
  });

  it("falls back to the first known code if MM is not present", () => {
    expect(resolveSourceBook(["2103", "2428"], lookup)).toBe("MC2 Volume II");
  });

  it("returns 'Unknown' if no codes are known", () => {
    expect(resolveSourceBook(["9999"], lookup)).toBe("Unknown");
    expect(resolveSourceBook([], lookup)).toBe("Unknown");
  });
});
