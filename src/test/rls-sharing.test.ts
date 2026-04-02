import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const migrationsDir = join(process.cwd(), "supabase/migrations");

function readMigration(filename: string): string {
  return readFileSync(join(migrationsDir, filename), "utf-8");
}

describe("RLS policies for shared/public character data", () => {
  describe("00113: permissive SELECT for character subtables", () => {
    const sql = readMigration("00113_rls_shared_character_data.sql");

    const tables = [
      "character_equipment",
      "character_spells",
      "character_weapon_proficiencies",
      "character_nonweapon_proficiencies",
      "character_languages",
    ];

    it.each(tables)("drops old restrictive SELECT policy on %s", (table) => {
      expect(sql).toContain(`DROP POLICY IF EXISTS`);
      expect(sql).toContain(`ON ${table}`);
    });

    it.each(tables)("creates permissive SELECT policy on %s", (table) => {
      const pattern = new RegExp(
        `CREATE POLICY "Authenticated can view[^"]*"\\s+ON ${table} FOR SELECT TO authenticated USING \\(true\\)`
      );
      expect(sql).toMatch(pattern);
    });

    it("does NOT drop INSERT/UPDATE/DELETE policies", () => {
      const lines = sql.split("\n");
      for (const line of lines) {
        if (line.includes("DROP POLICY")) {
          expect(line).not.toMatch(/insert|update|delete/i);
        }
      }
    });
  });

  describe("00114: epic_items restricted to owner + shared (not public)", () => {
    const sql = readMigration("00114_rls_epic_items_shared_only.sql");

    it("drops the old permissive policy", () => {
      expect(sql).toContain(
        'DROP POLICY IF EXISTS "Authenticated can view epic items" ON epic_items'
      );
    });

    it("creates policy that checks owner OR shared", () => {
      expect(sql).toContain("character_shares");
      expect(sql).toContain("shared_with_user_id = auth.uid()");
      expect(sql).toContain("user_id = auth.uid()");
    });

    it("does NOT include is_public in the SQL policy definition", () => {
      const sqlWithoutComments = sql
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("--"))
        .join("\n");
      expect(sqlWithoutComments).not.toContain("is_public");
    });
  });
});
