/**
 * Unit tests for the Gemini prompt builder. The network-side of
 * generate-missing-monster-images.ts is tested manually because it hits
 * real Imagen and Supabase — the pure prompt logic is what we pin here.
 */
import { describe, it, expect } from "vitest";
import { buildImagePrompt } from "./generate-missing-monster-images";
import type { MonsterRow } from "../src/lib/supabase/types";

function makeMonster(overrides: Partial<MonsterRow> = {}): MonsterRow {
  return {
    id: "id",
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

describe("buildImagePrompt", () => {
  it("uses the English name to identify the creature", () => {
    const prompt = buildImagePrompt(makeMonster({ name_en: "Aboleth" }));
    expect(prompt).toContain("a Aboleth");
  });

  it("enforces the Monstrous Manual watercolor + ink style in every prompt", () => {
    const prompt = buildImagePrompt(makeMonster());
    expect(prompt).toContain("Monstrous Manual");
    expect(prompt).toContain("watercolor");
    expect(prompt).toContain("ink line art");
    expect(prompt).toContain("white background");
    expect(prompt).toContain("TSR");
  });

  it("explicitly forbids rendered text/captions/labels in the image", () => {
    const prompt = buildImagePrompt(makeMonster());
    // Imagen renders free-text prose as literal captions in the image
    // when given a Description: line — we drop all narrative text and
    // instead double down on the negative prompt.
    expect(prompt).toMatch(/no text/i);
    expect(prompt).toMatch(/no captions/i);
    expect(prompt).toMatch(/no labels/i);
    expect(prompt).toMatch(/no letters/i);
    expect(prompt).toMatch(/no borders/i);
  });

  it("never injects the intro_text narrative into the prompt (caption leakage)", () => {
    const monster = makeMonster({
      name_en: "Balor",
      intro_text: "Uralte amphibische Wesen, die sogar älter sind als die Götter.",
      description: "Ein mächtiger Tanar'ri-Dämon mit einer Feuerpeitsche.",
    });
    const prompt = buildImagePrompt(monster);
    expect(prompt).not.toContain("Uralte amphibische Wesen");
    expect(prompt).not.toContain("Feuerpeitsche");
  });

  it("falls back to the German name when name_en is null", () => {
    const monster = makeMonster({ name: "Schwarzer Drache", name_en: null });
    const prompt = buildImagePrompt(monster);
    expect(prompt).toContain("a Schwarzer Drache");
  });

  it("demands single-creature composition on plain background", () => {
    const prompt = buildImagePrompt(makeMonster());
    expect(prompt).toMatch(/single creature/i);
    expect(prompt).toMatch(/no environment/i);
  });
});
