import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { CharacterEffectRow } from "@/lib/supabase/types";

type Handler = (payload: { eventType: string; new: CharacterEffectRow }) => void;
let handler: Handler | null = null;
const channelNames: string[] = [];
const removed: unknown[] = [];

const channel = {
  on: vi.fn((_e: string, _f: unknown, h: Handler) => {
    handler = h;
    return channel;
  }),
  subscribe: vi.fn(() => channel),
};

const api = {
  createEffect: vi.fn(),
  updateEffect: vi.fn(),
  endEffect: vi.fn(),
  endAllEffects: vi.fn(),
  saveTempHp: vi.fn(),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: (name: string) => {
      channelNames.push(name);
      return channel;
    },
    removeChannel: (c: unknown) => removed.push(c),
  }),
}));
vi.mock("@/lib/effects/effects-api", () => api);

const { useCharacterEffects } = await import("./use-character-effects");
const { createUndoStub } = await import("@/components/undo/undo-test-utils");

afterEach(cleanup);

const row = (id: string, extra: Partial<CharacterEffectRow> = {}) =>
  ({
    id,
    character_id: "c1",
    name: id,
    notes: "",
    duration_text: "",
    preset_key: null,
    modifiers: [],
    flags: [],
    temp_hp_remaining: 0,
    created_by: null,
    created_at: `2026-10-05T10:00:0${id.length}Z`,
    ended_at: null,
    ...extra,
  }) as CharacterEffectRow;

describe("useCharacterEffects", () => {
  beforeEach(() => {
    handler = null;
    channelNames.length = 0;
    removed.length = 0;
    Object.values(api).forEach((fn) => fn.mockReset());
  });

  it("subscribes per instance and adds effects created in another tab", async () => {
    const { result } = renderHook(() => useCharacterEffects("c1", [row("a")]));
    expect(channelNames[0]).toMatch(/^character-effects-c1-/);

    act(() => handler!({ eventType: "INSERT", new: row("bb") }));
    expect(result.current.effects.map((e) => e.id)).toEqual(["a", "bb"]);
  });

  it("removes an effect that was ended elsewhere", () => {
    const { result } = renderHook(() => useCharacterEffects("c1", [row("a"), row("bb")]));
    act(() =>
      handler!({ eventType: "UPDATE", new: row("a", { ended_at: "2026-10-05T11:00:00Z" }) })
    );
    expect(result.current.effects.map((e) => e.id)).toEqual(["bb"]);
  });

  it("ends an effect optimistically and restores it when saving fails", async () => {
    api.endEffect.mockResolvedValue({ ok: false, error: "boom", notApproved: false });
    const { result } = renderHook(() => useCharacterEffects("c1", [row("a")]));

    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.end("a");
    });
    expect(outcome).toMatchObject({ ok: false });
    expect(result.current.effects.map((e) => e.id)).toEqual(["a"]);
  });

  it("absorbs damage with temporary hit points and returns the rest", async () => {
    api.saveTempHp.mockResolvedValue({ ok: true, error: null, notApproved: false });
    const { result } = renderHook(() =>
      useCharacterEffects("c1", [row("aid", { temp_hp_remaining: 6 })])
    );

    let outcome = { remainingDamage: 0, changes: [] as unknown[] };
    await act(async () => {
      outcome = await result.current.absorbDamage(8);
    });
    expect(outcome.remainingDamage).toBe(2);
    expect(outcome.changes).toEqual([
      expect.objectContaining({
        key: { id: "aid" },
        before: { temp_hp_remaining: 6 },
        after: { temp_hp_remaining: 0 },
      }),
    ]);
    await waitFor(() => expect(result.current.effects[0].temp_hp_remaining).toBe(0));
    expect(api.saveTempHp).toHaveBeenCalledWith(expect.anything(), [
      { id: "aid", temp_hp_remaining: 0 },
    ]);
  });

  it("removes its channel on unmount", () => {
    const { unmount } = renderHook(() => useCharacterEffects("c1", []));
    unmount();
    expect(removed).toHaveLength(1);
  });

  describe("undo", () => {
    it("records an added effect and removes it again on undo", async () => {
      const added = row("bless");
      api.createEffect.mockResolvedValue({
        ok: true,
        error: null,
        notApproved: false,
        after: added,
      });
      const undo = createUndoStub();
      const { result } = renderHook(() => useCharacterEffects("c1", []), { wrapper: undo.Wrapper });

      await act(async () => {
        await result.current.add({} as never);
      });
      expect(undo.entries[0]).toMatchObject({
        label: { key: "effectAdded", values: { name: "bless" } },
        changes: [{ table: "character_effects", before: null }],
      });

      undo.replay("undo");
      expect(result.current.effects).toEqual([]);
      undo.replay("redo");
      expect(result.current.effects.map((e) => e.id)).toEqual(["bless"]);
    });

    it("brings an ended effect back on undo", async () => {
      api.endEffect.mockResolvedValue({
        ok: true,
        error: null,
        notApproved: false,
        after: row("a", { ended_at: "2026-10-05 11:00:00+00" }),
      });
      const undo = createUndoStub();
      const { result } = renderHook(() => useCharacterEffects("c1", [row("a")]), {
        wrapper: undo.Wrapper,
      });

      await act(async () => {
        await result.current.end("a");
      });
      expect(result.current.effects).toEqual([]);
      expect(undo.entries[0].changes[0]).toMatchObject({
        before: { ended_at: null },
        after: { ended_at: "2026-10-05 11:00:00+00" },
      });

      undo.replay("undo");
      expect(result.current.effects.map((e) => e.id)).toEqual(["a"]);
      expect(result.current.effects[0].ended_at).toBeNull();
    });

    it("records ending all effects as one step", async () => {
      api.endAllEffects.mockResolvedValue({
        ok: true,
        error: null,
        notApproved: false,
        rows: [row("a", { ended_at: "x" }), row("bb", { ended_at: "x" })],
      });
      const undo = createUndoStub();
      const { result } = renderHook(() => useCharacterEffects("c1", [row("a"), row("bb")]), {
        wrapper: undo.Wrapper,
      });
      await act(async () => {
        await result.current.endAll();
      });
      expect(undo.entries).toHaveLength(1);
      expect(undo.entries[0].changes).toHaveLength(2);
      undo.replay("undo");
      expect(result.current.effects).toHaveLength(2);
    });

    it("records nothing when saving fails", async () => {
      api.endEffect.mockResolvedValue({ ok: false, error: "boom", notApproved: false });
      const undo = createUndoStub();
      const { result } = renderHook(() => useCharacterEffects("c1", [row("a")]), {
        wrapper: undo.Wrapper,
      });
      await act(async () => {
        await result.current.end("a");
      });
      expect(undo.entries).toEqual([]);
    });
  });
});
