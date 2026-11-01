// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { CUSTOM_ROW_TABLES, EXCLUDED_TABLES, FULL_TABLES, orderColumns } from "./tables";

const MIGRATIONS = path.resolve(__dirname, "../../../supabase/migrations");

/** Every table any migration creates (TEMP tables don't match "create table"). */
function tablesFromMigrations(): Set<string> {
  const tables = new Set<string>();
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql"))) {
    const sql = readFileSync(path.join(MIGRATIONS, file), "utf8");
    for (const match of sql.matchAll(
      /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:\w+\.)?(\w+)/gi
    )) {
      tables.add(match[1].toLowerCase());
    }
  }
  return tables;
}

const classified = [...FULL_TABLES, ...CUSTOM_ROW_TABLES, ...Object.keys(EXCLUDED_TABLES)];

describe("backup table classification", () => {
  it("classifies every table the migrations create — new tables must be sorted in", () => {
    const unclassified = [...tablesFromMigrations()].filter((t) => !classified.includes(t));
    expect(unclassified).toEqual([]);
  });

  it("puts every table into exactly one list", () => {
    expect(new Set(classified).size).toBe(classified.length);
  });

  it("only lists tables that exist (catches typos)", () => {
    const existing = tablesFromMigrations();
    expect(classified.filter((t) => !existing.has(t))).toEqual([]);
  });

  it("leaves out monsters, rulebook embeddings and book reference data", () => {
    for (const table of [
      "monsters",
      "rulebook_chunks",
      "races",
      "classes",
      "race_class_restrictions",
    ]) {
      expect(EXCLUDED_TABLES).toHaveProperty(table);
    }
  });

  it("keeps only the group's own rows of mixed book tables", () => {
    expect([...CUSTOM_ROW_TABLES].sort()).toEqual([
      "armor",
      "general_items",
      "magic_items",
      "nonweapon_proficiencies",
      "spells",
      "weapons",
    ]);
  });

  it("sorts tables without an id column by their primary key", () => {
    expect(orderColumns("character_spells")).toEqual(["character_id", "spell_id"]);
    expect(orderColumns("session_tags")).toEqual(["session_id", "tag_id"]);
    expect(orderColumns("characters")).toEqual(["id"]);
  });
});
