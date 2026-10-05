import { describe, it, expect, vi, beforeEach } from "vitest";

const requested: { table: string; order: [string, { ascending?: boolean } | undefined] }[] = [];
let failTable: string | null = null;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({
        order: (column: string, options?: { ascending?: boolean }) => {
          requested.push({ table, order: [column, options] });
          return Promise.resolve(
            table === failTable
              ? { data: null, error: { message: `${table} offline` } }
              : { data: [{ id: `${table}-1` }], error: null }
          );
        },
      }),
    }),
  }),
}));

const { getEquipmentCatalogs, invalidateEquipmentCatalogs } = await import("./equipment-catalog");

describe("getEquipmentCatalogs", () => {
  beforeEach(() => {
    invalidateEquipmentCatalogs();
    requested.length = 0;
    failTable = null;
  });

  it("loads all four catalogs with the established sort order", async () => {
    const catalogs = await getEquipmentCatalogs();

    expect(catalogs).toEqual({
      weapons: [{ id: "weapons-1" }],
      armor: [{ id: "armor-1" }],
      generalItems: [{ id: "general_items-1" }],
      magicItems: [{ id: "magic_items-1" }],
    });
    expect(requested).toEqual([
      { table: "weapons", order: ["name", undefined] },
      { table: "armor", order: ["ac", { ascending: false }] },
      { table: "general_items", order: ["name", undefined] },
      { table: "magic_items", order: ["name", undefined] },
    ]);
  });

  it("serves later calls — e.g. a remounted equipment tab — from the session cache", async () => {
    await getEquipmentCatalogs();
    await getEquipmentCatalogs();

    expect(requested).toHaveLength(4);
  });

  it("shares one load between concurrent callers", async () => {
    await Promise.all([getEquipmentCatalogs(), getEquipmentCatalogs()]);

    expect(requested).toHaveLength(4);
  });

  it("reloads after invalidation", async () => {
    await getEquipmentCatalogs();
    invalidateEquipmentCatalogs();
    await getEquipmentCatalogs();

    expect(requested).toHaveLength(8);
  });

  it("does not cache a failed load", async () => {
    failTable = "armor";
    await expect(getEquipmentCatalogs()).rejects.toThrow("armor offline");

    failTable = null;
    await expect(getEquipmentCatalogs()).resolves.toMatchObject({ armor: [{ id: "armor-1" }] });
  });
});
