import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAvailablePriestSpells } from "./priest-spells";
import type { CharacterClassRow, CharacterRow } from "./types";

/** Fake PostgREST: every page is capped at 1000 rows like the real API. */
function fakeSupabase(total: number, failPages = false) {
  const orders: string[][] = [];
  const client = {
    from: () => ({
      select: (_columns: string, options?: { head?: boolean }) => {
        const call = { orders: [] as string[] };
        if (!options?.head) orders.push(call.orders);
        const builder = {
          eq: () => builder,
          in: () => builder,
          lte: () => builder,
          order: (column: string) => {
            call.orders.push(column);
            return builder;
          },
          range: (from: number, to: number) => {
            if (failPages) return Promise.resolve({ data: null, error: { message: "boom" } });
            const end = Math.min(to + 1, from + 1000, total);
            const data = Array.from({ length: Math.max(0, end - from) }, (_, i) => ({
              id: `s${from + i}`,
              level: 1,
              sphere: "All",
              source_book: "PHB",
            }));
            return Promise.resolve({ data, error: null });
          },
          then: (resolve: (v: unknown) => unknown) =>
            Promise.resolve({ count: total, error: null }).then(resolve),
        };
        return builder;
      },
    }),
  };
  return { client: client as unknown as SupabaseClient, orders };
}

const cleric = {
  priesthood: null,
  alignment: "lawful_good",
  allowed_spell_books: [],
  spell_whitelist: [],
} as unknown as CharacterRow;

const classes = [
  { class_id: "cleric", level: 14, is_active: true },
] as unknown as CharacterClassRow[];

describe("fetchAvailablePriestSpells", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  // Regression: a high-level priest with many spheres can match more spells
  // than the 1000 rows PostgREST returns per response.
  it("returns every matching spell beyond the 1000-row cap", async () => {
    const { client } = fakeSupabase(1200);

    const spells = await fetchAvailablePriestSpells(client, cleric, classes);

    expect(spells).toHaveLength(1200);
  });

  it("pages with a unique tie-breaker after level and name", async () => {
    const { client, orders } = fakeSupabase(1200);

    await fetchAvailablePriestSpells(client, cleric, classes);

    expect(orders[0]).toEqual(["level", "name", "id"]);
  });

  it("returns an empty list instead of failing the page when the DB errors", async () => {
    const { client } = fakeSupabase(1200, true);

    await expect(fetchAvailablePriestSpells(client, cleric, classes)).resolves.toEqual([]);
  });
});
