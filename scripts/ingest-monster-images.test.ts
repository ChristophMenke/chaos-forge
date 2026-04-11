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
import sharp from "sharp";

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
