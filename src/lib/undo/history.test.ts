import { describe, it, expect } from "vitest";
import { rowUpdate } from "./changes";
import {
  MAX_ENTRIES,
  clearHistory,
  collapseDraft,
  createHistory,
  dropDraft,
  hasDraft,
  markRedone,
  markUndone,
  peekRedo,
  peekUndo,
  pushEntry,
  removeEntry,
  type NewEntry,
} from "./history";

function hp(from: number, to: number, extra: Partial<NewEntry> = {}): NewEntry {
  return {
    label: { key: "hp" },
    changes: [rowUpdate("characters", { id: "c1" }, { hp_current: from }, { hp_current: to })!],
    ...extra,
  };
}

describe("undo history", () => {
  it("undoes and redoes in order", () => {
    let h = createHistory();
    h = pushEntry(h, hp(10, 8), 0);
    h = pushEntry(h, hp(8, 5), 5000);
    expect(peekUndo(h)?.changes[0].after).toEqual({ hp_current: 5 });
    h = markUndone(h);
    expect(peekUndo(h)?.changes[0].after).toEqual({ hp_current: 8 });
    expect(peekRedo(h)?.changes[0].after).toEqual({ hp_current: 5 });
    h = markRedone(h);
    expect(peekRedo(h)).toBeNull();
  });

  it("drops the redo part when a new change comes in", () => {
    let h = pushEntry(createHistory(), hp(10, 8), 0);
    h = markUndone(h);
    h = pushEntry(h, hp(10, 3), 5000);
    expect(peekRedo(h)).toBeNull();
    expect(h.entries).toHaveLength(1);
  });

  it(`keeps at most ${MAX_ENTRIES} steps`, () => {
    let h = createHistory();
    for (let i = 0; i < MAX_ENTRIES + 5; i++) h = pushEntry(h, hp(i, i + 1), i * 5000);
    expect(h.entries).toHaveLength(MAX_ENTRIES);
    expect(h.entries[0].changes[0].before).toEqual({ hp_current: 5 });
  });

  describe("coalescing", () => {
    it("merges quick changes with the same key into one step", () => {
      let h = pushEntry(createHistory(), hp(10, 9, { coalesceKey: "hp" }), 0);
      h = pushEntry(h, hp(9, 8, { coalesceKey: "hp" }), 800);
      h = pushEntry(h, hp(8, 6, { coalesceKey: "hp" }), 1600);
      expect(h.entries).toHaveLength(1);
      expect(h.entries[0].changes[0]).toMatchObject({
        before: { hp_current: 10 },
        after: { hp_current: 6 },
      });
    });

    it("starts a new step after a pause, another key or an undo", () => {
      let h = pushEntry(createHistory(), hp(10, 9, { coalesceKey: "hp" }), 0);
      h = pushEntry(h, hp(9, 8, { coalesceKey: "hp" }), 1500);
      expect(h.entries).toHaveLength(2);
      h = pushEntry(h, hp(8, 7, { coalesceKey: "gold" }), 1600);
      expect(h.entries).toHaveLength(3);
      h = markUndone(h);
      h = pushEntry(h, hp(8, 1, { coalesceKey: "gold" }), 1700);
      expect(h.entries).toHaveLength(3);
      expect(h.entries[2].changes[0].after).toEqual({ hp_current: 1 });
    });

    it("drops a merged step that ends where it started", () => {
      let h = pushEntry(createHistory(), hp(10, 9, { coalesceKey: "hp" }), 0);
      h = pushEntry(h, hp(9, 10, { coalesceKey: "hp" }), 500);
      expect(h.entries).toHaveLength(0);
      expect(peekUndo(h)).toBeNull();
    });
  });

  it("removes a conflicting step", () => {
    let h = pushEntry(createHistory(), hp(10, 8), 0);
    h = pushEntry(h, hp(8, 5), 5000);
    h = removeEntry(h, h.entries[1].id);
    expect(h.entries).toHaveLength(1);
    expect(peekUndo(h)?.changes[0].after).toEqual({ hp_current: 8 });
  });

  describe("draft steps", () => {
    it("drops all draft steps, also from the redo part", () => {
      let h = pushEntry(createHistory(), hp(10, 8), 0);
      h = pushEntry(h, hp(1, 2, { kind: "draft" }), 5000);
      h = pushEntry(h, hp(2, 3, { kind: "draft" }), 10000);
      h = markUndone(h);
      expect(hasDraft(h)).toBe(true);
      h = dropDraft(h);
      expect(h.entries).toHaveLength(1);
      expect(peekRedo(h)).toBeNull();
      expect(hasDraft(h)).toBe(false);
    });

    it("hasDraft only counts steps that are not undone", () => {
      let h = pushEntry(createHistory(), hp(1, 2, { kind: "draft" }), 0);
      h = markUndone(h);
      expect(hasDraft(h)).toBe(false);
    });

    it("collapses the draft into the saved step", () => {
      let h = pushEntry(createHistory(), hp(1, 2, { kind: "draft" }), 0);
      h = pushEntry(h, hp(10, 8), 5000);
      h = pushEntry(h, hp(2, 3, { kind: "draft" }), 10000);
      h = collapseDraft(h, { label: { key: "sheetSaved" }, changes: hp(1, 3).changes }, 15000);
      expect(h.entries.map((e) => e.label.key)).toEqual(["hp", "sheetSaved"]);
      expect(h.entries[1].kind).toBe("db");
    });
  });

  it("clears everything", () => {
    const h = clearHistory();
    expect(peekUndo(pushEntry(h, hp(1, 2), 0))).not.toBeNull();
    expect(h.entries).toEqual([]);
  });
});
