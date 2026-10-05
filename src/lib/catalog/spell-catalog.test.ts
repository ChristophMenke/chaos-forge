import { describe, it, expect, vi, beforeEach } from "vitest";

type Call = {
  table: string;
  filters: [string, unknown][];
  orders: string[];
  range?: [number, number];
  head: boolean;
};
const calls: Call[] = [];
let total = 1500;
let failNext = false;

function builder(table: string, head: boolean) {
  const call: Call = { table, filters: [], orders: [], head };
  calls.push(call);
  const self = {
    eq(column: string, value: unknown) {
      call.filters.push([column, value]);
      return self;
    },
    order(column: string) {
      call.orders.push(column);
      return self;
    },
    range(from: number, to: number) {
      call.range = [from, to];
      return self;
    },
    then(resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) {
      if (failNext) {
        return Promise.resolve({ data: null, count: null, error: { message: "offline" } }).then(
          resolve,
          reject
        );
      }
      if (head) return Promise.resolve({ count: total, error: null }).then(resolve, reject);
      const [from, to] = call.range!;
      const data = Array.from(
        { length: Math.max(0, Math.min(to, total - 1) - from + 1) },
        (_, i) => ({
          id: `s${from + i}`,
        })
      );
      return Promise.resolve({ data, error: null }).then(resolve, reject);
    },
  };
  return self;
}

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: (_columns: string, options?: { head?: boolean }) => builder(table, !!options?.head),
    }),
  }),
}));

const { getSpellCatalog, getSpellNameIndex, invalidateSpellCatalog } =
  await import("./spell-catalog");

const requests = () => calls.filter((c) => !c.head).length;

describe("getSpellCatalog", () => {
  beforeEach(() => {
    invalidateSpellCatalog();
    calls.length = 0;
    total = 1500;
    failNext = false;
  });

  it("loads every spell of the type, beyond the 1000-row cap", async () => {
    const spells = await getSpellCatalog("wizard");

    expect(spells).toHaveLength(1500);
    const pages = calls.filter((c) => !c.head);
    expect(
      pages.every((c) => c.filters.some(([k, v]) => k === "spell_type" && v === "wizard"))
    ).toBe(true);
  });

  it("sorts by level and name with the id as unique tie-breaker", async () => {
    await getSpellCatalog("priest");

    const page = calls.find((c) => !c.head)!;
    expect(page.orders).toEqual(["level", "name", "id"]);
  });

  it("serves a second call from the session cache", async () => {
    await getSpellCatalog("wizard");
    const before = requests();
    await getSpellCatalog("wizard");

    expect(requests()).toBe(before);
  });

  it("shares one request between concurrent callers", async () => {
    await Promise.all([getSpellCatalog("wizard"), getSpellCatalog("wizard")]);

    expect(calls.filter((c) => c.head)).toHaveLength(1);
  });

  it("caches wizard and priest spells separately", async () => {
    await getSpellCatalog("wizard");
    await getSpellCatalog("priest");

    expect(calls.filter((c) => c.head)).toHaveLength(2);
  });

  it("reloads after invalidation", async () => {
    await getSpellCatalog("wizard");
    invalidateSpellCatalog();
    await getSpellCatalog("wizard");

    expect(calls.filter((c) => c.head)).toHaveLength(2);
  });

  it("does not cache a failed load", async () => {
    failNext = true;
    await expect(getSpellCatalog("wizard")).rejects.toThrow("offline");

    failNext = false;
    await expect(getSpellCatalog("wizard")).resolves.toHaveLength(1500);
  });
});

describe("getSpellNameIndex", () => {
  beforeEach(() => {
    invalidateSpellCatalog();
    calls.length = 0;
    total = 3211;
    failNext = false;
  });

  it("loads every spell of both types with a stable unique sort", async () => {
    const spells = await getSpellNameIndex();

    expect(spells).toHaveLength(3211);
    const pages = calls.filter((c) => !c.head);
    expect(pages).toHaveLength(4);
    expect(pages.every((c) => c.filters.length === 0 && c.orders.join() === "id")).toBe(true);
  });

  it("is cached for the session and dropped by invalidateSpellCatalog", async () => {
    await getSpellNameIndex();
    await getSpellNameIndex();
    expect(calls.filter((c) => c.head)).toHaveLength(1);

    invalidateSpellCatalog();
    await getSpellNameIndex();
    expect(calls.filter((c) => c.head)).toHaveLength(2);
  });
});
