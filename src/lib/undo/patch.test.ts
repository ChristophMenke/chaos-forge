import { describe, it, expect } from "vitest";
import { rowDelete, rowInsert, rowUpdate } from "./changes";
import { patchList, patchRow } from "./patch";

const rope = { id: "i1", quantity: 1, item: { name: "Seil" } };

describe("patchList", () => {
  it("puts a deleted row back on undo (with its UI object) and removes it on redo", () => {
    const change = rowDelete("character_inventory", rope, rope);
    const undone = patchList([], "character_inventory", [change], "undo");
    expect(undone).toEqual([rope]);
    expect(patchList(undone, "character_inventory", [change], "undo")).toEqual([rope]);
    expect(patchList(undone, "character_inventory", [change], "redo")).toEqual([]);
  });

  it("merges updated columns into the existing object", () => {
    const change = rowUpdate(
      "character_inventory",
      { id: "i1" },
      { quantity: 1 },
      { quantity: 4 }
    )!;
    expect(patchList([{ ...rope, quantity: 4 }], "character_inventory", [change], "undo")).toEqual([
      rope,
    ]);
  });

  it("removes an inserted row on undo", () => {
    const change = rowInsert("character_inventory", rope, rope);
    expect(patchList([rope], "character_inventory", [change], "undo")).toEqual([]);
  });

  it("ignores other tables and matches composite keys", () => {
    const spell = { character_id: "c1", spell_id: "s1", expended: true };
    const change = rowUpdate(
      "character_spells",
      { character_id: "c1", spell_id: "s1" },
      { expended: false },
      { expended: true }
    )!;
    expect(patchList([spell], "character_spells", [change], "undo")[0].expended).toBe(false);
    expect(patchList([rope], "character_inventory", [change], "undo")).toEqual([rope]);
  });
});

describe("patchRow", () => {
  it("only patches the matching row", () => {
    const change = rowUpdate("characters", { id: "c1" }, { hp_current: 10 }, { hp_current: 5 })!;
    expect(patchRow({ id: "c1", hp_current: 5 }, "characters", [change], "undo")).toEqual({
      id: "c1",
      hp_current: 10,
    });
    expect(patchRow({ id: "c2", hp_current: 5 }, "characters", [change], "undo").hp_current).toBe(
      5
    );
  });
});
