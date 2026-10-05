import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

const updates: { table: string; values: unknown; id: unknown }[] = [];
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => ({
      update: (values: unknown) => ({
        eq: async (_c: string, id: unknown) => {
          updates.push({ table, values, id });
          return { error: null };
        },
      }),
    }),
  }),
}));

const { useDebouncedRowWrite, ROW_WRITE_DELAY_MS } = await import("./use-debounced-row-write");

beforeEach(() => {
  vi.useFakeTimers();
  updates.length = 0;
});
afterEach(() => vi.useRealTimers());

describe("useDebouncedRowWrite", () => {
  it("writes once after typing stops, with the first before and the last value", async () => {
    const onWritten = vi.fn();
    const { result } = renderHook(() => useDebouncedRowWrite(onWritten));
    const base = { table: "character_inventory" as const, id: "i1", field: "quantity" };

    act(() => {
      result.current({ ...base, value: 1, before: 2 });
      result.current({ ...base, value: 12, before: 1 });
    });
    expect(updates).toEqual([]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(ROW_WRITE_DELAY_MS);
    });
    expect(updates).toEqual([{ table: "character_inventory", values: { quantity: 12 }, id: "i1" }]);
    expect(onWritten).toHaveBeenCalledWith(expect.objectContaining({ value: 12, before: 2 }), true);
  });

  it("flushes pending writes on unmount", async () => {
    const { result, unmount } = renderHook(() => useDebouncedRowWrite(vi.fn()));
    act(() => {
      result.current({
        table: "character_equipment",
        id: "e1",
        field: "hit_bonus",
        value: 2,
        before: 0,
      });
    });
    unmount();
    await act(async () => {
      await Promise.resolve();
    });
    expect(updates).toHaveLength(1);
  });
});
