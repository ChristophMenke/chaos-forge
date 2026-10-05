import { describe, it, expect } from "vitest";
import {
  invertChange,
  isNoopChange,
  mergeChanges,
  rowDelete,
  rowInsert,
  rowUpdate,
} from "./changes";

describe("rowUpdate", () => {
  it("keeps only the changed columns", () => {
    const change = rowUpdate(
      "characters",
      { id: "c1" },
      { hp_current: 10, notes: "a", gold_gp: 5 },
      { hp_current: 7, notes: "a", gold_gp: 5 }
    );
    expect(change).toEqual({
      table: "characters",
      key: { id: "c1" },
      before: { hp_current: 10 },
      after: { hp_current: 7 },
    });
  });

  it("compares JSON columns and arrays by value", () => {
    const traits = [{ name: "Mut", cp: 3 }];
    expect(
      rowUpdate("characters", { id: "c1" }, { traits }, { traits: [{ name: "Mut", cp: 3 }] })
    ).toBeNull();
    expect(
      rowUpdate(
        "characters",
        { id: "c1" },
        { spell_whitelist: ["a"] },
        { spell_whitelist: ["a", "b"] }
      )
    ).not.toBeNull();
  });

  it("ignores bookkeeping timestamps", () => {
    expect(
      rowUpdate(
        "characters",
        { id: "c1" },
        { hp_current: 3, updated_at: "2026-01-01" },
        { hp_current: 3, updated_at: "2026-01-02" }
      )
    ).toBeNull();
  });

  it("carries the UI objects for the sync", () => {
    const change = rowUpdate(
      "character_inventory",
      { id: "i1" },
      { quantity: 1 },
      { quantity: 2 },
      {
        uiBefore: { id: "i1", quantity: 1, name: "Seil" },
        uiAfter: { id: "i1", quantity: 2, name: "Seil" },
      }
    );
    expect(change?.uiAfter).toEqual({ id: "i1", quantity: 2, name: "Seil" });
  });
});

describe("rowInsert / rowDelete", () => {
  it("derives the key from the table", () => {
    expect(rowInsert("character_inventory", { id: "i1", quantity: 1 }).key).toEqual({ id: "i1" });
    expect(
      rowDelete("character_spells", { character_id: "c1", spell_id: "s1", prepared: true }).key
    ).toEqual({ character_id: "c1", spell_id: "s1" });
  });

  it("drops joined objects from the stored row", () => {
    const change = rowDelete("character_equipment", {
      id: "e1",
      weapon_id: "w1",
      weapon: { id: "w1", name: "Langschwert" },
      magic_effects: { ac_bonus: -1 },
    });
    expect(change.before).toEqual({ id: "e1", weapon_id: "w1", magic_effects: { ac_bonus: -1 } });
  });
});

describe("invertChange / isNoopChange", () => {
  it("swaps before and after", () => {
    const change = rowInsert("character_inventory", { id: "i1" });
    expect(invertChange(change)).toMatchObject({ before: { id: "i1" }, after: null });
  });

  it("detects a change that ends where it started", () => {
    expect(
      isNoopChange({
        table: "characters",
        key: { id: "c1" },
        before: { hp_current: 10 },
        after: { hp_current: 10 },
      })
    ).toBe(true);
    expect(isNoopChange(rowInsert("character_inventory", { id: "i1" }))).toBe(false);
  });
});

describe("mergeChanges", () => {
  it("keeps the first before and the latest after per row", () => {
    const first = rowUpdate("characters", { id: "c1" }, { hp_current: 10 }, { hp_current: 9 })!;
    const second = rowUpdate("characters", { id: "c1" }, { hp_current: 9 }, { hp_current: 4 })!;
    expect(mergeChanges([first], [second])).toEqual([
      {
        table: "characters",
        key: { id: "c1" },
        before: { hp_current: 10 },
        after: { hp_current: 4 },
      },
    ]);
  });

  it("adds columns that only the later change touched", () => {
    const first = rowUpdate("characters", { id: "c1" }, { gold_gp: 1 }, { gold_gp: 2 })!;
    const second = rowUpdate("characters", { id: "c1" }, { gold_sp: 0 }, { gold_sp: 5 })!;
    expect(mergeChanges([first], [second])[0]).toMatchObject({
      before: { gold_gp: 1, gold_sp: 0 },
      after: { gold_gp: 2, gold_sp: 5 },
    });
  });

  it("keeps an insert an insert when the new row is edited right away", () => {
    const insert = rowInsert("character_inventory", { id: "i1", quantity: 1 });
    const edit = rowUpdate("character_inventory", { id: "i1" }, { quantity: 1 }, { quantity: 3 })!;
    expect(mergeChanges([insert], [edit])[0]).toMatchObject({
      before: null,
      after: { id: "i1", quantity: 3 },
    });
  });
});
