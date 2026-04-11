/**
 * Unit tests for the backfill match plan and SQL emitters.
 *
 * These tests use in-memory fixtures instead of a live Supabase connection —
 * the pure functions (buildMatchPlan, buildUpdateSql, buildInsertSql) are
 * the load-bearing logic and are fully testable without DB access.
 */
import { describe, it, expect } from "vitest";
import {
  buildMatchPlan,
  buildUpdateSql,
  buildInsertSql,
  type MergedMonster,
  type MatchResult,
} from "./backfill-monsters-from-compendium";
import type { MonsterRow } from "../src/lib/supabase/types";

function makeSnapshot(overrides: Partial<MergedMonster> = {}): MergedMonster {
  return {
    monster_key: "kenku",
    name: "Kenku",
    name_en: "Kenku",
    tsr_codes: ["2140"],
    source_book: "Monstrous Manual",
    climate_terrain: "Any",
    frequency: "uncommon",
    organization: "Tribal",
    activity_cycle: "Any",
    diet: "Omnivore",
    intelligence: "Average (8-10)",
    treasure: "L, M, N",
    alignment: "Neutral",
    no_appearing: "6-24",
    ac: 5,
    movement: "12",
    hit_dice: "1+2",
    hit_dice_value: 1,
    thac0: 19,
    attacks_per_round: "1",
    damage: "1d4",
    special_attacks: "Mimicry",
    special_defenses: null,
    magic_resistance: 0,
    size: "M",
    morale: "Steady",
    morale_value: 11,
    xp_value: 65,
    intro_text: "Kenku are bipedal bird-humanoids...",
    combat_tactics: "All kenku have 4th-level thief skills...",
    habitat_society: "Kenku lair in wooded areas...",
    ecology: "Kenku play a minor role...",
    name_de: "Kenku",
    intro_text_de: "Kenku sind zweibeinige Vogel-Humanoide...",
    combat_tactics_de: "Alle Kenku verfügen über Fähigkeiten eines Diebes der 4. Stufe...",
    habitat_society_de: "Kenku hausen in bewaldeten Gebieten...",
    ecology_de: "Kenku spielen eine kleine Rolle...",
    ...overrides,
  };
}

function makeRow(overrides: Partial<MonsterRow> = {}): MonsterRow {
  return {
    id: "00000000-0000-0000-0000-000000000001",
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
  };
}

describe("buildMatchPlan", () => {
  it("matches on normalised name_en", () => {
    const existing = [makeRow({ name: "Kenku", name_en: "Kenku" })];
    const snapshot = [makeSnapshot({ monster_key: "kenku", name_en: "Kenku" })];
    const plan = buildMatchPlan(snapshot, existing);
    expect(plan).toHaveLength(1);
    expect(plan[0].kind).toBe("update");
    expect(plan[0].matchedBy).toBe("name_en");
  });

  it("matches on the normalised German name as a fallback", () => {
    // Seed row has only a German name filled, no name_en
    const existing = [makeRow({ name: "Kobold", name_en: null })];
    const snapshot = [makeSnapshot({ monster_key: "kobold", name_en: "Kobold" })];
    const plan = buildMatchPlan(snapshot, existing);
    expect(plan[0].kind).toBe("update");
    expect(plan[0].matchedBy).toBe("name");
  });

  it("handles whitespace and case differences via normalisation", () => {
    const existing = [makeRow({ name: "White Dragon", name_en: "White Dragon" })];
    const snapshot = [makeSnapshot({ monster_key: "dragonwh", name_en: "white dragon" })];
    const plan = buildMatchPlan(snapshot, existing);
    expect(plan[0].kind).toBe("update");
  });

  it("produces an INSERT entry when no existing row matches", () => {
    const existing = [makeRow({ name: "Orc", name_en: "Orc" })];
    const snapshot = [makeSnapshot({ monster_key: "kenku", name_en: "Kenku" })];
    const plan = buildMatchPlan(snapshot, existing);
    expect(plan).toHaveLength(1);
    expect(plan[0].kind).toBe("insert");
    expect(plan[0].matchedBy).toBeUndefined();
  });

  it("prefers name_en over German name when both would match different rows", () => {
    const existing = [
      makeRow({ id: "row-a", name: "Falsch", name_en: "Kenku" }),
      makeRow({ id: "row-b", name: "Kenku", name_en: "Other" }),
    ];
    const snapshot = [makeSnapshot({ monster_key: "kenku", name_en: "Kenku" })];
    const plan = buildMatchPlan(snapshot, existing);
    expect(plan[0].kind).toBe("update");
    expect(plan[0].existing?.id).toBe("row-a");
    expect(plan[0].matchedBy).toBe("name_en");
  });

  it("emits one plan entry per snapshot input", () => {
    const existing: MonsterRow[] = [];
    const snapshot = [
      makeSnapshot({ monster_key: "a", name_en: "Alpha" }),
      makeSnapshot({ monster_key: "b", name_en: "Beta" }),
      makeSnapshot({ monster_key: "c", name_en: "Gamma" }),
    ];
    const plan = buildMatchPlan(snapshot, existing);
    expect(plan).toHaveLength(3);
    expect(plan.every((p) => p.kind === "insert")).toBe(true);
  });

  it("matches via token-sort when word order differs (Blue Dragon ↔ Dragon, Blue)", () => {
    const existing = [makeRow({ name: "Blauer Drache", name_en: "Blue Dragon" })];
    const snapshot = [makeSnapshot({ monster_key: "dragblue", name_en: "Dragon, Blue" })];
    const plan = buildMatchPlan(snapshot, existing);
    expect(plan[0].kind).toBe("update");
    expect(plan[0].matchedBy).toBe("token_sort");
  });

  it("skips INSERT when token overlap ≥50% with an existing row (hard-deduplicate)", () => {
    const existing = [makeRow({ id: "row-x", name: "Schwarzer Drache", name_en: "Black Dragon" })];
    const snapshot = [
      makeSnapshot({
        monster_key: "dragcbla",
        name_en: "Dragon, Chromatic, Black",
      }),
    ];
    const plan = buildMatchPlan(snapshot, existing);
    expect(plan[0].kind).toBe("skip-duplicate");
    if (plan[0].kind === "skip-duplicate") {
      expect(plan[0].duplicateOf?.id).toBe("row-x");
    }
  });

  it("still allows INSERT when token overlap is below threshold", () => {
    const existing = [makeRow({ name: "Goblin", name_en: "Goblin" })];
    const snapshot = [makeSnapshot({ monster_key: "aarakocr", name_en: "Aarakocra" })];
    const plan = buildMatchPlan(snapshot, existing);
    expect(plan[0].kind).toBe("insert");
  });
});

describe("buildUpdateSql", () => {
  it("uses COALESCE so empty columns are filled but existing ones untouched", () => {
    const plan: MatchResult & { kind: "update" } = {
      kind: "update",
      snapshot: makeSnapshot({ intro_text_de: "Deutscher Text" }),
      existing: makeRow({ id: "aaa-111" }),
      matchedBy: "name_en",
    };
    const sql = buildUpdateSql(plan);
    expect(sql).toContain("COALESCE(intro_text, 'Deutscher Text')");
    expect(sql).toContain("WHERE id = 'aaa-111' AND is_custom = FALSE");
  });

  it("escapes single quotes in translated text", () => {
    const plan: MatchResult & { kind: "update" } = {
      kind: "update",
      snapshot: makeSnapshot({ intro_text_de: "Vampir's Zahn" }),
      existing: makeRow({ id: "row-1" }),
      matchedBy: "name_en",
    };
    const sql = buildUpdateSql(plan);
    expect(sql).toContain("'Vampir''s Zahn'");
  });

  it("writes NULL for missing narrative", () => {
    const plan: MatchResult & { kind: "update" } = {
      kind: "update",
      snapshot: makeSnapshot({ ecology_de: null }),
      existing: makeRow({ id: "row-1" }),
      matchedBy: "name_en",
    };
    const sql = buildUpdateSql(plan);
    expect(sql).toContain("COALESCE(ecology, NULL)");
  });
});

describe("buildInsertSql", () => {
  it("emits a complete INSERT with is_custom=FALSE", () => {
    const plan: MatchResult & { kind: "insert" } = {
      kind: "insert",
      snapshot: makeSnapshot({ name_de: "Kenku", name_en: "Kenku" }),
    };
    const sql = buildInsertSql(plan);
    expect(sql).toContain("INSERT INTO monsters");
    expect(sql).toContain("FALSE"); // is_custom literal
    expect(sql).toContain("'Kenku'");
    expect(sql).toContain("'Monstrous Manual'");
  });

  it("falls back to 'common' for missing frequency", () => {
    const plan: MatchResult & { kind: "insert" } = {
      kind: "insert",
      snapshot: makeSnapshot({ frequency: null as unknown as string }),
    };
    const sql = buildInsertSql(plan);
    expect(sql).toContain("'common'");
  });
});
