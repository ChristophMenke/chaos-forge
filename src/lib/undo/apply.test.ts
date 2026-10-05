import { describe, it, expect } from "vitest";
import { rowDelete, rowInsert, rowUpdate } from "./changes";
import { applyEntry } from "./apply";
import { createFakeDb } from "./fake-supabase";
import type { RowChange, UndoEntry } from "./types";

function entry(changes: RowChange[], kind: UndoEntry["kind"] = "db"): UndoEntry {
  return { id: "e1", label: { key: "x" }, changes, kind, at: 0 };
}

describe("applyEntry", () => {
  it("writes the before values back on undo and the after values on redo", async () => {
    const db = createFakeDb({ characters: [{ id: "c1", hp_current: 5 }] });
    const e = entry([
      rowUpdate("characters", { id: "c1" }, { hp_current: 10 }, { hp_current: 5 })!,
    ]);

    expect(await applyEntry(db.client, e, "undo")).toEqual({
      ok: true,
      conflict: false,
      error: null,
    });
    expect(db.tables.characters[0].hp_current).toBe(10);

    expect((await applyEntry(db.client, e, "redo")).ok).toBe(true);
    expect(db.tables.characters[0].hp_current).toBe(5);
  });

  it("writes nothing when the value changed in the meantime", async () => {
    const db = createFakeDb({ characters: [{ id: "c1", hp_current: 3 }] });
    const e = entry([
      rowUpdate("characters", { id: "c1" }, { hp_current: 10 }, { hp_current: 5 })!,
    ]);
    expect(await applyEntry(db.client, e, "undo")).toMatchObject({ ok: false, conflict: true });
    expect(db.writes).toEqual([]);
  });

  it("checks every row before writing any", async () => {
    const db = createFakeDb({
      characters: [{ id: "c1", hp_current: 5 }],
      character_effects: [{ id: "f1", temp_hp_remaining: 9, ended_at: null }],
    });
    const e = entry([
      rowUpdate(
        "character_effects",
        { id: "f1" },
        { temp_hp_remaining: 4 },
        { temp_hp_remaining: 0 }
      )!,
      rowUpdate("characters", { id: "c1" }, { hp_current: 10 }, { hp_current: 5 })!,
    ]);
    expect((await applyEntry(db.client, e, "undo")).conflict).toBe(true);
    expect(db.writes).toEqual([]);
  });

  it("deletes an inserted row on undo and inserts it again on redo", async () => {
    const row = { id: "i1", character_id: "c1", quantity: 2 };
    const db = createFakeDb({ character_inventory: [row] });
    const e = entry([rowInsert("character_inventory", row)]);

    await applyEntry(db.client, e, "undo");
    expect(db.tables.character_inventory).toEqual([]);
    await applyEntry(db.client, e, "redo");
    expect(db.tables.character_inventory).toEqual([row]);
  });

  it("restores a deleted row with the same id and without joins", async () => {
    const db = createFakeDb({ character_equipment: [] });
    const e = entry([
      rowDelete("character_equipment", { id: "e1", weapon_id: "w1", weapon: { name: "Schwert" } }),
    ]);
    await applyEntry(db.client, e, "undo");
    expect(db.tables.character_equipment).toEqual([{ id: "e1", weapon_id: "w1" }]);
  });

  it("treats a unique or foreign key violation as a conflict", async () => {
    const db = createFakeDb({ character_languages: [] });
    db.failNext({ message: "duplicate key", code: "23505" });
    const e = entry([rowDelete("character_languages", { id: "l1", name: "Elfisch" })]);
    expect(await applyEntry(db.client, e, "undo")).toMatchObject({ ok: false, conflict: true });
  });

  it("reports other database errors", async () => {
    const db = createFakeDb({ characters: [{ id: "c1", hp_current: 5 }] });
    db.failNext({ message: "boom" });
    const e = entry([
      rowUpdate("characters", { id: "c1" }, { hp_current: 10 }, { hp_current: 5 })!,
    ]);
    expect(await applyEntry(db.client, e, "undo")).toEqual({
      ok: false,
      conflict: false,
      error: "boom",
    });
  });

  it("uses a composite key for spells", async () => {
    const db = createFakeDb({
      character_spells: [{ character_id: "c1", spell_id: "s1", prepared: true, expended: true }],
    });
    const e = entry([
      rowUpdate(
        "character_spells",
        { character_id: "c1", spell_id: "s1" },
        { expended: false },
        { expended: true }
      )!,
    ]);
    await applyEntry(db.client, e, "undo");
    expect(db.tables.character_spells[0].expended).toBe(false);
  });

  describe("soft-deleted effects", () => {
    const effect = { id: "f1", character_id: "c1", name: "Segen", ended_at: null };

    it("ends an added effect on undo and brings it back on redo", async () => {
      const db = createFakeDb({ character_effects: [effect] });
      const e = entry([rowInsert("character_effects", effect)]);
      await applyEntry(db.client, e, "undo");
      expect(db.tables.character_effects[0].ended_at).toEqual(expect.any(String));
      expect(db.tables.character_effects).toHaveLength(1);
      await applyEntry(db.client, e, "redo");
      expect(db.tables.character_effects[0].ended_at).toBeNull();
    });

    it("compares the end time only as set or not set", async () => {
      // The database returns its own timestamp format.
      const db = createFakeDb({
        character_effects: [{ ...effect, ended_at: "2026-10-05 10:00:00+00" }],
      });
      const e = entry([
        rowUpdate(
          "character_effects",
          { id: "f1" },
          { ended_at: null },
          { ended_at: "2026-10-05T10:00:00.000Z" }
        )!,
      ]);
      expect((await applyEntry(db.client, e, "undo")).ok).toBe(true);
      expect(db.tables.character_effects[0].ended_at).toBeNull();
    });
  });

  it("applies several changes in reverse order on undo", async () => {
    const db = createFakeDb({ character_inventory: [] });
    const a = { id: "i1", quantity: 1 };
    const e = entry([
      rowInsert("character_inventory", a),
      rowUpdate("character_inventory", { id: "i1" }, { quantity: 1 }, { quantity: 4 })!,
    ]);
    db.tables.character_inventory.push({ id: "i1", quantity: 4 });
    expect((await applyEntry(db.client, e, "undo")).ok).toBe(true);
    expect(db.tables.character_inventory).toEqual([]);
  });

  it("rejects tables outside the character scope", async () => {
    const db = createFakeDb();
    const e = entry([
      {
        table: "party_loot_items" as never,
        key: { id: "x" },
        before: { quantity: 1 },
        after: { quantity: 0 },
      },
    ]);
    expect((await applyEntry(db.client, e, "undo")).ok).toBe(false);
    expect(db.writes).toEqual([]);
  });

  it("never touches the database for draft steps", async () => {
    const db = createFakeDb();
    const e = entry([rowUpdate("characters", { id: "c1" }, { str: 16 }, { str: 17 })!], "draft");
    expect((await applyEntry(db.client, e, "undo")).ok).toBe(true);
    expect(db.writes).toEqual([]);
  });
});
