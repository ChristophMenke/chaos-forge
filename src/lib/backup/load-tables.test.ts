import { describe, it, expect, vi } from "vitest";
import { loadBackupTables } from "./load-tables";
import { CUSTOM_ROW_TABLES, FULL_TABLES } from "./tables";

interface Call {
  table: string;
  head: boolean;
  filters: [string, unknown][];
  order: string[];
  range?: [number, number];
}

/** Minimal PostgREST builder: records every query and answers from `rows`. */
function fakeService(rows: Record<string, unknown[]>, failing?: string) {
  const calls: Call[] = [];
  const service = {
    from(table: string) {
      return {
        select(_cols: string, opts?: { count?: string; head?: boolean }) {
          const call: Call = { table, head: !!opts?.head, filters: [], order: [] };
          calls.push(call);
          const builder = {
            eq(column: string, value: unknown) {
              call.filters.push([column, value]);
              return builder;
            },
            order(column: string) {
              call.order.push(column);
              return builder;
            },
            range(from: number, to: number) {
              call.range = [from, to];
              return builder;
            },
            then(resolve: (value: unknown) => void) {
              if (table === failing)
                return resolve({ data: null, count: null, error: { message: "boom" } });
              const data = rows[table] ?? [];
              resolve(call.head ? { count: data.length, error: null } : { data, error: null });
            },
          };
          return builder;
        },
      };
    },
  };
  return { service, calls };
}

describe("loadBackupTables", () => {
  it("loads every group table completely and sorted by its key", async () => {
    const { service, calls } = fakeService({ characters: [{ id: "c1" }], character_spells: [{}] });

    const tables = await loadBackupTables(service as never);

    expect(Object.keys(tables).sort()).toEqual([...FULL_TABLES, ...CUSTOM_ROW_TABLES].sort());
    expect(tables.characters).toEqual([{ id: "c1" }]);
    const page = calls.find((c) => c.table === "character_spells" && !c.head)!;
    expect(page.order).toEqual(["character_id", "spell_id"]);
    expect(page.filters).toEqual([]);
  });

  it("filters mixed book tables to the group's own rows in count and page", async () => {
    const { service, calls } = fakeService({ spells: [{ id: "s1" }] });

    await loadBackupTables(service as never);

    const spellCalls = calls.filter((c) => c.table === "spells");
    expect(spellCalls.map((c) => c.head).sort()).toEqual([false, true]);
    for (const call of spellCalls) expect(call.filters).toEqual([["is_custom", true]]);
  });

  it("names the failing table and logs it", async () => {
    const { service } = fakeService({}, "notifications");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(loadBackupTables(service as never)).rejects.toThrow("notifications");
    expect(consoleError).toHaveBeenCalledWith(
      "[Backup] table failed:",
      "notifications",
      expect.any(Error)
    );
    consoleError.mockRestore();
  });
});
