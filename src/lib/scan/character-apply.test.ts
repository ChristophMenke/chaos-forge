import { describe, it, expect } from "vitest";
import { buildApplyPlan } from "./character-apply";
import { buildChangeSet } from "./character-diff";
import { makeSnapshot, makePayload, makeCatalogs } from "./test-fixtures";
import type { ScanChange, SelectedChange, ApplyOperation } from "./character-diff-types";

const catalogs = makeCatalogs();
const snapshot = makeSnapshot();

/** Baut ein Change-Set und wählt es nach der übergebenen Regel aus. */
function selectAll(changes: ScanChange[], selected = true): SelectedChange[] {
  return changes.map((c) => ({ ...c, selected }));
}

function planFor(payload = makePayload(), snap = snapshot): ApplyOperation[] {
  return buildApplyPlan(selectAll(buildChangeSet(snap, payload, catalogs)), snap);
}

function opFor(ops: ApplyOperation[], table: string, op?: string): ApplyOperation | undefined {
  return ops.find((o) => o.table === table && (op ? o.op === op : true));
}

describe("buildApplyPlan — selection", () => {
  it("returns an empty plan for an empty change set", () => {
    expect(buildApplyPlan([], snapshot)).toEqual([]);
  });

  it("returns an empty plan when nothing is selected", () => {
    const changes = buildChangeSet(snapshot, makePayload({ printed: { hpMax: 29 } }), catalogs);
    expect(buildApplyPlan(selectAll(changes, false), snapshot)).toEqual([]);
  });

  it("only writes the selected changes", () => {
    const changes = buildChangeSet(
      snapshot,
      makePayload({ printed: { hpMax: 29, dex: 18 } }),
      catalogs
    );
    const selected = changes.map((c) => ({
      ...c,
      selected: c.target.writes[0].field === "hp_max",
    }));
    const ops = buildApplyPlan(selected, snapshot);
    expect(ops).toHaveLength(1);
    expect(ops[0].values).toEqual({ hp_max: 29 });
  });

  it("prefers an edited value over the scanned proposal", () => {
    const changes = buildChangeSet(snapshot, makePayload({ printed: { hpMax: 29 } }), catalogs);
    const ops = buildApplyPlan([{ ...changes[0], selected: true, editedValue: 31 }], snapshot);
    expect(ops[0].values).toEqual({ hp_max: 31 });
  });

  it("keeps an edited value of 0", () => {
    const changes = buildChangeSet(snapshot, makePayload({ printed: { goldGp: 200 } }), catalogs);
    const ops = buildApplyPlan([{ ...changes[0], selected: true, editedValue: 0 }], snapshot);
    expect(ops[0].values).toEqual({ gold_gp: 0 });
  });
});

describe("buildApplyPlan — scalar updates", () => {
  it("merges every characters field into a single update", () => {
    const ops = planFor(makePayload({ printed: { hpMax: 29, dex: 18, goldGp: 200 } }));
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({
      table: "characters",
      op: "update",
      match: { id: "char-1" },
      values: { hp_max: 29, dex: 18, gold_gp: 200 },
    });
  });

  it("writes both tables for a primary-class level-up", () => {
    const ops = planFor(
      makePayload({ printed: { classes: [{ class: "thief", level: 4, xp: 5500 }] } })
    );
    expect(opFor(ops, "character_classes", "update")).toMatchObject({
      match: { character_id: "char-1", class_id: "thief" },
      values: { level: 4 },
    });
    expect(opFor(ops, "characters", "update")).toMatchObject({ values: { level: 4 } });
  });

  it("merges level and xp of the same class into one update", () => {
    const ops = planFor(
      makePayload({ printed: { classes: [{ class: "thief", level: 4, xp: 9200 }] } })
    );
    const classOps = ops.filter((o) => o.table === "character_classes");
    expect(classOps).toHaveLength(1);
    expect(classOps[0].values).toEqual({ level: 4, xp_current: 9200 });
  });
});

describe("buildApplyPlan — inserts", () => {
  it("uses a plain insert for equipment, which has no unique constraint", () => {
    const ops = planFor(
      makePayload({ equipment: [{ name: "Long Sword", magicBonus: 0, source: "printed" }] })
    );
    const op = opFor(ops, "character_equipment")!;
    expect(op.op).toBe("insert");
    expect(op.onConflict).toBeUndefined();
    expect(op.rows).toEqual([
      {
        character_id: "char-1",
        weapon_id: "w-longsword",
        quantity: 1,
        equipped: true,
        hit_bonus: 0,
        damage_bonus: 0,
      },
    ]);
  });

  it("uses an upsert with the right conflict target for spells", () => {
    const ops = planFor(
      makePayload({ spells: [{ name: "Magic Missile", level: 1, source: "printed" }] })
    );
    expect(opFor(ops, "character_spells")).toMatchObject({
      op: "upsert",
      onConflict: "character_id,spell_id",
      rows: [{ character_id: "char-1", spell_id: "sp-mm", prepared: false }],
    });
  });

  it("uses upserts for every constrained junction table", () => {
    const ops = planFor(
      makePayload({
        weaponProficiencies: [{ name: "Long Sword", specialized: true, source: "printed" }],
        nwps: [{ name: "Rope Use", source: "printed" }],
        languages: [{ name: "Elvish", source: "printed" }],
      })
    );
    expect(opFor(ops, "character_weapon_proficiencies")).toMatchObject({
      op: "upsert",
      onConflict: "character_id,weapon_name",
    });
    expect(opFor(ops, "character_nonweapon_proficiencies")).toMatchObject({
      op: "upsert",
      onConflict: "character_id,proficiency_id",
    });
    expect(opFor(ops, "character_languages")).toMatchObject({
      op: "upsert",
      onConflict: "character_id,language_name",
    });
  });

  it("bundles several inserts into the same table into one operation", () => {
    const ops = planFor(
      makePayload({
        equipment: [
          { name: "Long Sword", magicBonus: 0, source: "printed" },
          { name: "Dagger", magicBonus: 1, source: "printed" },
        ],
      })
    );
    const op = opFor(ops, "character_equipment")!;
    expect(ops.filter((o) => o.table === "character_equipment")).toHaveLength(1);
    expect(op.rows).toHaveLength(2);
  });

  it("applies an edited quantity to the inserted row", () => {
    const changes = buildChangeSet(
      snapshot,
      makePayload({ equipment: [{ name: "Fackel", magicBonus: 0, source: "printed" }] }),
      catalogs
    );
    const ops = buildApplyPlan([{ ...changes[0], selected: true, editedValue: 5 }], snapshot);
    expect(opFor(ops, "character_inventory")!.rows![0]).toMatchObject({
      custom_name: "Fackel",
      quantity: 5,
    });
  });
});

describe("buildApplyPlan — list updates", () => {
  const withLongsword = makeSnapshot({
    equipment: [
      {
        id: "eq-1",
        character_id: "char-1",
        weapon_id: "w-longsword",
        armor_id: null,
        quantity: 1,
        equipped: true,
        hit_bonus: 0,
        damage_bonus: 0,
        magic_effects: {},
        custom_label: null,
        weapon: { id: "w-longsword", name: "Langschwert", name_en: "Long Sword" },
        armor: null,
      },
    ] as never,
  });

  it("updates the matched row by id and sets both bonus columns", () => {
    const ops = planFor(
      makePayload({ equipment: [{ name: "Long Sword +2", magicBonus: 2, source: "printed" }] }),
      withLongsword
    );
    expect(opFor(ops, "character_equipment", "update")).toMatchObject({
      match: { id: "eq-1" },
      values: { hit_bonus: 2, damage_bonus: 2 },
    });
  });

  it("updates an inventory quantity by row id", () => {
    const withPotion = makeSnapshot({
      inventory: [
        {
          id: "inv-1",
          character_id: "char-1",
          item_id: null,
          custom_name: "Heiltrank",
          quantity: 2,
          notes: "",
          item: null,
        },
      ] as never,
    });
    const ops = planFor(
      makePayload({ equipment: [{ name: "Heiltrank x4", magicBonus: 0, source: "printed" }] }),
      withPotion
    );
    expect(opFor(ops, "character_inventory", "update")).toMatchObject({
      match: { id: "inv-1" },
      values: { quantity: 4 },
    });
  });
});

describe("buildApplyPlan — deletes", () => {
  it("bulk-deletes rows by id", () => {
    const withLanguages = makeSnapshot({
      languages: [
        { id: "lang-1", character_id: "char-1", language_name: "Elvish" },
        { id: "lang-2", character_id: "char-1", language_name: "Dwarvish" },
      ],
    });
    const ops = planFor(
      makePayload({ languages: [{ name: "Orcish", source: "printed" }] }),
      withLanguages
    );
    const del = opFor(ops, "character_languages", "delete")!;
    expect(del.ids).toEqual(["lang-1", "lang-2"]);
  });

  it("deletes a spell via its composite match instead of a row id", () => {
    const withSpell = makeSnapshot({
      spells: [
        {
          character_id: "char-1",
          spell_id: "sp-inv",
          prepared: false,
          expended: false,
          spell: { id: "sp-inv", name: "Unsichtbarkeit", name_en: "Invisibility", level: 2 },
        },
      ] as never,
    });
    const ops = planFor(
      makePayload({ spells: [{ name: "Magic Missile", level: 1, source: "printed" }] }),
      withSpell
    );
    expect(opFor(ops, "character_spells", "delete")).toMatchObject({
      match: { character_id: "char-1", spell_id: "sp-inv" },
    });
  });

  it("skips deletes that were left unselected — the default", () => {
    const withLanguages = makeSnapshot({
      languages: [{ id: "lang-1", character_id: "char-1", language_name: "Elvish" }],
    });
    const changes = buildChangeSet(
      withLanguages,
      makePayload({ languages: [{ name: "Orcish", source: "printed" }] }),
      catalogs
    );
    const ops = buildApplyPlan(
      changes.map((c) => ({ ...c, selected: c.defaultSelected })),
      withLanguages
    );
    expect(ops.some((o) => o.op === "delete")).toBe(false);
  });
});

describe("buildApplyPlan — ordering", () => {
  it("runs deletes before inserts so a rename does not collide", () => {
    const withLanguages = makeSnapshot({
      languages: [{ id: "lang-1", character_id: "char-1", language_name: "Elvish" }],
    });
    const ops = planFor(
      makePayload({ languages: [{ name: "Orcish", source: "printed" }] }),
      withLanguages
    );
    const deleteIndex = ops.findIndex((o) => o.op === "delete");
    const insertIndex = ops.findIndex((o) => o.op === "upsert" || o.op === "insert");
    expect(deleteIndex).toBeGreaterThanOrEqual(0);
    expect(insertIndex).toBeGreaterThan(deleteIndex);
  });
});
