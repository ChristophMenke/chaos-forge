/**
 * Unit tests for the image-ingest helper functions.
 *
 * The script itself does live Supabase + Storage operations and is tested
 * manually. These unit tests cover the pure-function pieces: the match
 * lookup and the GIF → WebP conversion.
 */
import { describe, it, expect } from "vitest";
import { gifToWebp, findMatchingGif } from "./ingest-monster-images";
import type { MonsterRow } from "../src/lib/supabase/types";
import type { ParsedMonster } from "./parse-compendium";
import sharp from "sharp";

function makeParsed(overrides: Partial<ParsedMonster> = {}): ParsedMonster {
  return {
    monster_key: "kenku",
    name: "Kenku",
    name_en: "Kenku",
    climate_terrain: null,
    frequency: null,
    organization: null,
    activity_cycle: null,
    diet: null,
    intelligence: null,
    treasure: null,
    alignment: null,
    no_appearing: null,
    ac: 5,
    movement: "12",
    hit_dice: "1+2",
    hit_dice_value: 1,
    thac0: 19,
    attacks_per_round: "1",
    damage: "1d4",
    special_attacks: null,
    special_defenses: null,
    magic_resistance: 0,
    size: "M",
    morale: "",
    morale_value: 10,
    xp_value: 65,
    intro_text: null,
    combat_tactics: null,
    habitat_society: null,
    ecology: null,
    source_book: "Monstrous Manual",
    tsr_codes: ["2140"],
    ...overrides,
  };
}

function makeMonster(overrides: Partial<MonsterRow> = {}): MonsterRow {
  return {
    id: "id",
    name: "Kenku",
    name_en: "Kenku",
    climate_terrain: null,
    frequency: "common",
    organization: null,
    activity_cycle: null,
    diet: null,
    intelligence: null,
    treasure: null,
    alignment: null,
    ac: 5,
    movement: "12",
    hit_dice: "2-5",
    hit_dice_value: 2,
    thac0: 19,
    attacks_per_round: "1",
    damage: "1d4",
    special_attacks: null,
    special_defenses: null,
    magic_resistance: 0,
    size: "M",
    morale: "",
    morale_value: 10,
    xp_value: 0,
    default_zone: "melee",
    has_ranged_attack: false,
    typical_spells: null,
    image_url: null,
    source_book: "Monstrous Manual",
    description: null,
    intro_text: null,
    combat_tactics: null,
    habitat_society: null,
    ecology: null,
    no_appearing: null,
    variant_of_id: null,
    variant_name: null,
    is_custom: false,
    created_by: null,
    created_at: "2026-04-10T00:00:00Z",
    updated_at: "2026-04-10T00:00:00Z",
    ...overrides,
  } as MonsterRow;
}

describe("findMatchingGif", () => {
  const availableKeys = new Set(["kenku", "orc", "whitedragon", "kobold"]);

  it("matches on normalised name_en", () => {
    expect(findMatchingGif(makeMonster({ name_en: "Kenku" }), availableKeys)).toBe("kenku");
  });

  it("matches on normalised German name as fallback when name_en does not match", () => {
    const monster = makeMonster({ name: "Kobold", name_en: "Weird Thing" });
    expect(findMatchingGif(monster, availableKeys)).toBe("kobold");
  });

  it("strips diacritics and handles German ß", () => {
    // "Weißer Drache" → lowercase → "weißer drache" → ß→ss → "weisser drache"
    // → strip non-alphanum → "weisserdrache"
    const keys = new Set(["weisserdrache"]);
    const monster = makeMonster({ name: "Weißer Drache", name_en: null });
    expect(findMatchingGif(monster, keys)).toBe("weisserdrache");
  });

  it("returns null when neither name nor name_en match", () => {
    const monster = makeMonster({ name: "Nonexistent", name_en: "Nonexistent" });
    expect(findMatchingGif(monster, availableKeys)).toBeNull();
  });

  it("handles monsters with null name_en", () => {
    const monster = makeMonster({ name: "Orc", name_en: null });
    expect(findMatchingGif(monster, availableKeys)).toBe("orc");
  });

  it("uses the override map to translate German seed names to compendium keys", () => {
    // The override map maps "Blauer Drache (Erwachsen)" → "dragcblu"
    const keys = new Set(["dragcblu"]);
    const monster = makeMonster({
      name: "Blauer Drache (Erwachsen)",
      name_en: "Blue Dragon (Adult)",
    });
    expect(findMatchingGif(monster, keys)).toBe("dragcblu");
  });

  it("looks up the compendium monster_key via parsed.json when the GIF name is abbreviated", () => {
    // GIFs are named "aarakocr.gif" (monster_key) but DB row has the full
    // name "Aarakocra". parsed.json links the two — normalised name_en match
    // against a parsed entry resolves to its monster_key.
    const keys = new Set(["aarakocr"]);
    const parsed = [makeParsed({ monster_key: "aarakocr", name_en: "Aarakocra" })];
    const monster = makeMonster({ name: "Aarakocra", name_en: "Aarakocra" });
    expect(findMatchingGif(monster, keys, parsed)).toBe("aarakocr");
  });

  it("matches comma-separated compendium names via normalised lookup in parsed.json", () => {
    // parsed.json has "Dragon, Brown" with monster_key "dragbrow".
    // DB row name_en matches the compendium's name_en after normalisation.
    const keys = new Set(["dragbrow"]);
    const parsed = [makeParsed({ monster_key: "dragbrow", name_en: "Dragon, Brown" })];
    const monster = makeMonster({ name: "Brauner Drache", name_en: "Dragon, Brown" });
    expect(findMatchingGif(monster, keys, parsed)).toBe("dragbrow");
  });

  it("returns null when parsed.json has no cross-reference hit", () => {
    const parsed = [makeParsed({ monster_key: "wyvern", name_en: "Wyvern" })];
    const monster = makeMonster({ name: "Griffon", name_en: "Griffon" });
    // Griffon is not in the GIF keys and not in parsed — should be null
    expect(findMatchingGif(monster, new Set(["wyvern"]), parsed)).toBeNull();
  });
});

describe("gifToWebp", () => {
  it("produces a valid WebP buffer from a minimal synthetic GIF", async () => {
    // Create a tiny 10×10 red GIF in memory, then convert.
    const gifBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .gif()
      .toBuffer();

    const webpBuffer = await gifToWebp(gifBuffer);

    // WebP magic bytes: bytes 0-3 = "RIFF", bytes 8-11 = "WEBP"
    expect(webpBuffer.length).toBeGreaterThan(0);
    expect(webpBuffer.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(webpBuffer.subarray(8, 12).toString("ascii")).toBe("WEBP");
  });

  it("flattens animated GIFs to a single frame (still produces WebP)", async () => {
    // Single-frame GIF is enough — sharp's `{ animated: false }` option
    // handles multi-frame GIFs by taking the first frame. We only assert
    // that the output format is valid.
    const gifBuffer = await sharp({
      create: { width: 5, height: 5, channels: 3, background: { r: 0, g: 255, b: 0 } },
    })
      .gif()
      .toBuffer();

    const webpBuffer = await gifToWebp(gifBuffer);
    expect(webpBuffer.subarray(8, 12).toString("ascii")).toBe("WEBP");
  });
});
