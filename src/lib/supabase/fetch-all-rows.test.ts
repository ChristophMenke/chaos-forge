import { describe, it, expect, vi } from "vitest";
import { fetchAllRows } from "./fetch-all-rows";

function rows(total: number) {
  return Array.from({ length: total }, (_, i) => ({ id: i }));
}

/** Simulates PostgREST: count works, but each page is capped at 1000 rows. */
function fakeTable(total: number) {
  const all = rows(total);
  const page = vi.fn((from: number, to: number) =>
    Promise.resolve({ data: all.slice(from, Math.min(to + 1, from + 1000)), error: null })
  );
  const count = vi.fn(() => Promise.resolve({ count: total, error: null }));
  return { all, page, count };
}

describe("fetchAllRows", () => {
  it("returns an empty list without loading a page when the table is empty", async () => {
    const { page, count } = fakeTable(0);

    await expect(fetchAllRows(count, page)).resolves.toEqual([]);
    expect(page).not.toHaveBeenCalled();
  });

  // Regression: .limit(5000) silently returned only the first 1000 of 1908
  // wizard spells because PostgREST caps each response at 1000 rows.
  it("loads every row beyond the 1000-row response cap, in order", async () => {
    const { all, page, count } = fakeTable(1908);

    const result = await fetchAllRows(count, page);

    expect(page).toHaveBeenCalledTimes(2);
    expect(page).toHaveBeenCalledWith(0, 999);
    expect(page).toHaveBeenCalledWith(1000, 1999);
    expect(result).toEqual(all);
  });

  it("loads the pages in parallel", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const page = vi.fn(async (from: number) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 0));
      inFlight--;
      return { data: [{ id: from }], error: null };
    });

    await fetchAllRows(() => Promise.resolve({ count: 3000, error: null }), page);

    expect(maxInFlight).toBe(3);
  });

  it("throws when counting fails", async () => {
    const { page } = fakeTable(10);
    const count = () => Promise.resolve({ count: null, error: { message: "boom" } });

    await expect(fetchAllRows(count, page)).rejects.toThrow("boom");
  });

  it("throws when a page fails", async () => {
    const { count } = fakeTable(1500);
    const page = vi.fn((from: number) =>
      Promise.resolve(
        from === 0
          ? { data: rows(1000), error: null }
          : { data: null, error: { message: "page 2" } }
      )
    );

    await expect(fetchAllRows(count, page)).rejects.toThrow("page 2");
  });
});
