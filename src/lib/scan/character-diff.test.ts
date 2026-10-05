import { describe, it, expect } from "vitest";
import { buildChangeSet } from "./character-diff";
import { makeSnapshot, makePayload, makeCatalogs, makeCharacter } from "./test-fixtures";
import type { ScanChange } from "./character-diff-types";

const catalogs = makeCatalogs();

function find(changes: ScanChange[], id: string): ScanChange | undefined {
  return changes.find((c) => c.id === id);
}

describe("buildChangeSet — no-op cases", () => {
  it("returns nothing for an empty payload", () => {
    expect(buildChangeSet(makeSnapshot(), makePayload(), catalogs)).toEqual([]);
  });

  it("returns nothing when every scanned value already matches the database", () => {
    const payload = makePayload({
      printed: { name: "Thalia Sturmwind", hpMax: 24, str: 12, goldGp: 120 },
    });
    expect(buildChangeSet(makeSnapshot(), payload, catalogs)).toEqual([]);
  });

  it("ignores null values instead of proposing to clear the field", () => {
    const payload = makePayload({ printed: { name: null as never, hpMax: null as never } });
    expect(buildChangeSet(makeSnapshot(), payload, catalogs)).toEqual([]);
  });

  it("ignores fields the scan did not report at all", () => {
    const payload = makePayload({ printed: { hpMax: 24 } });
    expect(buildChangeSet(makeSnapshot(), payload, catalogs)).toEqual([]);
  });
});

describe("buildChangeSet — scalar fields", () => {
  it("detects a changed max HP as a core change", () => {
    const changes = buildChangeSet(
      makeSnapshot(),
      makePayload({ printed: { hpMax: 29 } }),
      catalogs
    );
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      category: "core",
      kind: "scalar",
      currentValue: 24,
      proposedValue: 29,
      source: "printed",
      defaultSelected: true,
    });
    expect(changes[0].target.writes).toEqual([{ table: "characters", field: "hp_max" }]);
  });

  it("maps ability scores and gold onto the right columns", () => {
    const payload = makePayload({ printed: { dex: 18, goldGp: 200, goldEp: 5 } });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    const columns = changes.flatMap((c) => c.target.writes.map((w) => w.field));
    expect(columns).toContain("dex");
    expect(columns).toContain("gold_gp");
    expect(columns).toContain("gold_ep");
  });

  it("converts imperial height and weight before comparing", () => {
    const payload = makePayload({ printed: { height: "5'10\"", weight: 150 } });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    const height = changes.find((c) => c.target.writes[0].field === "height_cm");
    const weight = changes.find((c) => c.target.writes[0].field === "weight_kg");
    expect(height?.proposedValue).toBe(178);
    expect(weight?.proposedValue).toBe(68);
  });

  it("does not flag a height that already matches after conversion", () => {
    const snapshot = makeSnapshot({ character: makeCharacter({ height_cm: 178 }) });
    const payload = makePayload({ printed: { height: "5'10\"" } });
    expect(buildChangeSet(snapshot, payload, catalogs)).toEqual([]);
  });
});

describe("buildChangeSet — printed vs. handwritten", () => {
  it("prefers the handwritten value and records the conflict", () => {
    const payload = makePayload({ printed: { hpMax: 24 }, handwritten: { hpMax: 29 } });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      proposedValue: 29,
      source: "handwritten",
      conflict: { printed: 24, handwritten: 29 },
    });
  });

  it("marks a handwritten-only value as handwritten without a conflict", () => {
    const payload = makePayload({ handwritten: { hpMax: 29 } });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(changes[0].source).toBe("handwritten");
    expect(changes[0].conflict).toBeUndefined();
  });

  it("reports no change when the handwritten value already matches the database", () => {
    const payload = makePayload({ printed: { hpMax: 99 }, handwritten: { hpMax: 24 } });
    expect(buildChangeSet(makeSnapshot(), payload, catalogs)).toEqual([]);
  });

  it("does not record a conflict when both blocks agree", () => {
    const payload = makePayload({ printed: { hpMax: 29 }, handwritten: { hpMax: 29 } });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(changes[0].conflict).toBeUndefined();
  });
});

describe("buildChangeSet — default selection", () => {
  it("preselects ordinary core changes", () => {
    const changes = buildChangeSet(
      makeSnapshot(),
      makePayload({ printed: { hpMax: 29 } }),
      catalogs
    );
    expect(changes[0].defaultSelected).toBe(true);
  });

  it("does not preselect current HP and explains why", () => {
    const changes = buildChangeSet(
      makeSnapshot(),
      makePayload({ printed: { hpCurrent: 22 } }),
      catalogs
    );
    expect(changes[0].defaultSelected).toBe(false);
    expect(changes[0].noteKey).toBe("hpCurrentPlayModeHint");
  });

  it("does not preselect identity fields", () => {
    const payload = makePayload({
      printed: { name: "Thalia die Schnelle", race: "human", alignment: "true_neutral" },
    });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(changes).not.toHaveLength(0);
    expect(changes.every((c) => c.category === "identity")).toBe(true);
    expect(changes.every((c) => c.defaultSelected === false)).toBe(true);
  });

  it("does not preselect notes", () => {
    const payload = makePayload({ printed: { notes: "Neue Notiz vom Bogen" } });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(changes[0].category).toBe("extended");
    expect(changes[0].defaultSelected).toBe(false);
  });

  it("preselects ordinary extended fields", () => {
    const payload = makePayload({ printed: { deity: "Tymora" } });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(changes[0].defaultSelected).toBe(true);
  });

  it("never preselects a removal", () => {
    const snapshot = makeSnapshot({
      languages: [{ id: "lang-1", character_id: "char-1", language_name: "Elvish" }],
    });
    const payload = makePayload({ languages: [{ name: "Dwarvish", source: "printed" }] });
    const changes = buildChangeSet(snapshot, payload, catalogs);
    const removal = changes.find((c) => c.kind === "list-remove");
    expect(removal?.defaultSelected).toBe(false);
  });
});

describe("buildChangeSet — normalisation and validation", () => {
  it("normalises a subrace before comparing", () => {
    const payload = makePayload({ printed: { race: "wood_elf" } });
    expect(buildChangeSet(makeSnapshot(), payload, catalogs)).toEqual([]);
  });

  it("drops an unknown kit instead of proposing it", () => {
    const payload = makePayload({ printed: { kit: "kartoffelbauer" } });
    expect(buildChangeSet(makeSnapshot(), payload, catalogs)).toEqual([]);
  });

  it("accepts a known kit", () => {
    const payload = makePayload({ printed: { kit: "burglar" } });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(changes[0].proposedValue).toBe("burglar");
  });

  it("drops an unknown alignment", () => {
    const payload = makePayload({ printed: { alignment: "sehr_boese" } });
    expect(buildChangeSet(makeSnapshot(), payload, catalogs)).toEqual([]);
  });
});

describe("buildChangeSet — classes", () => {
  it("detects a level-up of the primary class and writes both tables", () => {
    const payload = makePayload({ printed: { classes: [{ class: "thief", level: 4, xp: 5500 }] } });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    const levelChange = find(changes, "core:class:thief:level");
    expect(levelChange).toMatchObject({ category: "core", currentValue: 3, proposedValue: 4 });
    expect(levelChange?.target.writes).toEqual([
      { table: "character_classes", field: "level", matchKey: { class_id: "thief" } },
      { table: "characters", field: "level" },
    ]);
  });

  it("writes only the junction table for a non-primary class", () => {
    const snapshot = makeSnapshot({
      classes: [
        {
          id: "cc-1",
          character_id: "char-1",
          class_id: "thief",
          level: 3,
          xp_current: 5500,
          is_active: true,
          switch_level: null,
        },
        {
          id: "cc-2",
          character_id: "char-1",
          class_id: "fighter",
          level: 2,
          xp_current: 3000,
          is_active: true,
          switch_level: null,
        },
      ],
    });
    const payload = makePayload({
      printed: { classes: [{ class: "fighter", level: 3, xp: 3000 }] },
    });
    const changes = buildChangeSet(snapshot, payload, catalogs);
    expect(find(changes, "core:class:fighter:level")?.target.writes).toEqual([
      { table: "character_classes", field: "level", matchKey: { class_id: "fighter" } },
    ]);
  });

  it("detects an XP change", () => {
    const payload = makePayload({ printed: { classes: [{ class: "thief", level: 3, xp: 9200 }] } });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(find(changes, "core:class:thief:xp")).toMatchObject({
      currentValue: 5500,
      proposedValue: 9200,
    });
  });

  it("proposes an added class as an unselected identity change", () => {
    const payload = makePayload({ printed: { classes: [{ class: "mage", level: 1, xp: 0 }] } });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    const added = changes.find((c) => c.kind === "list-add" && c.category === "identity");
    expect(added?.defaultSelected).toBe(false);
    expect(added?.target.writes[0].table).toBe("character_classes");
  });

  it("ignores an unknown class id", () => {
    const payload = makePayload({
      printed: { classes: [{ class: "kartoffel", level: 1, xp: 0 }] },
    });
    expect(buildChangeSet(makeSnapshot(), payload, catalogs)).toEqual([]);
  });

  it("takes the handwritten class level over the printed one", () => {
    const payload = makePayload({
      printed: { classes: [{ class: "thief", level: 3, xp: 5500 }] },
      handwritten: { classes: [{ class: "thief", level: 4, xp: 9200 }] },
    });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    const levelChange = find(changes, "core:class:thief:level");
    expect(levelChange).toMatchObject({
      proposedValue: 4,
      source: "handwritten",
      conflict: { printed: 3, handwritten: 4 },
    });
  });

  it("does not propose removing a class that the scan simply did not mention", () => {
    const payload = makePayload({ printed: { hpMax: 29 } });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(changes.some((c) => c.kind === "list-remove")).toBe(false);
  });
});

describe("buildChangeSet — equipment", () => {
  const equippedLongsword = {
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
  };

  it("proposes an unmatched weapon as a new equipment row", () => {
    const payload = makePayload({
      equipment: [{ name: "Long Sword", magicBonus: 0, source: "printed" }],
    });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      category: "lists",
      kind: "list-add",
      defaultSelected: true,
    });
    expect(changes[0].target.writes[0]).toMatchObject({
      table: "character_equipment",
      values: { weapon_id: "w-longsword" },
    });
  });

  it("routes an item that matches no weapon or armor into the inventory", () => {
    const payload = makePayload({
      equipment: [{ name: "Rucksack", magicBonus: 0, source: "printed" }],
    });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(changes[0].target.writes[0]).toMatchObject({
      table: "character_inventory",
      values: { custom_name: "Rucksack" },
    });
  });

  it("recognises an item the character already owns and reports no change", () => {
    const snapshot = makeSnapshot({ equipment: [equippedLongsword] as never });
    const payload = makePayload({
      equipment: [{ name: "Long Sword", magicBonus: 0, source: "printed" }],
    });
    expect(buildChangeSet(snapshot, payload, catalogs)).toEqual([]);
  });

  it("detects a changed magic bonus on an owned weapon", () => {
    const snapshot = makeSnapshot({ equipment: [equippedLongsword] as never });
    const payload = makePayload({
      equipment: [{ name: "Long Sword +2", magicBonus: 2, source: "printed" }],
    });
    const changes = buildChangeSet(snapshot, payload, catalogs);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ kind: "list-update", currentValue: 0, proposedValue: 2 });
    expect(changes[0].target.writes[0].rowId).toBe("eq-1");
  });

  it("detects a changed inventory quantity", () => {
    const snapshot = makeSnapshot({
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
    const payload = makePayload({
      equipment: [{ name: "Heiltrank x4", magicBonus: 0, source: "printed" }],
    });
    const changes = buildChangeSet(snapshot, payload, catalogs);
    expect(changes[0]).toMatchObject({
      kind: "list-update",
      currentValue: 2,
      proposedValue: 4,
    });
    expect(changes[0].target.writes[0]).toMatchObject({
      table: "character_inventory",
      field: "quantity",
      rowId: "inv-1",
    });
  });

  it("proposes removing an owned item the scan did not find", () => {
    const snapshot = makeSnapshot({ equipment: [equippedLongsword] as never });
    const payload = makePayload({
      equipment: [{ name: "Dagger", magicBonus: 0, source: "printed" }],
    });
    const changes = buildChangeSet(snapshot, payload, catalogs);
    const removal = changes.find((c) => c.kind === "list-remove");
    expect(removal).toMatchObject({ defaultSelected: false });
    expect(removal?.target.writes[0]).toMatchObject({
      table: "character_equipment",
      rowId: "eq-1",
    });
  });

  it("does not propose removals when the scan found no equipment at all", () => {
    const snapshot = makeSnapshot({ equipment: [equippedLongsword] as never });
    const changes = buildChangeSet(snapshot, makePayload(), catalogs);
    expect(changes).toEqual([]);
  });

  it("carries the handwritten source through to a new item", () => {
    const payload = makePayload({
      equipment: [{ name: "Dagger", magicBonus: 0, source: "handwritten" }],
    });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(changes[0].source).toBe("handwritten");
  });
});

describe("buildChangeSet — spells", () => {
  it("proposes a spell the character does not know yet", () => {
    const payload = makePayload({
      spells: [{ name: "Magic Missile", level: 1, source: "printed" }],
    });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(changes).toHaveLength(1);
    expect(changes[0].target.writes[0]).toMatchObject({
      table: "character_spells",
      values: { spell_id: "sp-mm" },
    });
  });

  it("reports no change for an already known spell", () => {
    const snapshot = makeSnapshot({
      spells: [
        {
          character_id: "char-1",
          spell_id: "sp-mm",
          prepared: false,
          expended: false,
          spell: { id: "sp-mm", name: "Magisches Geschoss", name_en: "Magic Missile", level: 1 },
        },
      ] as never,
    });
    const payload = makePayload({
      spells: [{ name: "Magic Missile", level: 1, source: "printed" }],
    });
    expect(buildChangeSet(snapshot, payload, catalogs)).toEqual([]);
  });

  it("ignores a spell that matches nothing in the catalogue", () => {
    const payload = makePayload({
      spells: [{ name: "Kartoffelsturm", level: 4, source: "printed" }],
    });
    expect(buildChangeSet(makeSnapshot(), payload, catalogs)).toEqual([]);
  });

  it("requires the spell level to match", () => {
    const payload = makePayload({
      spells: [{ name: "Magic Missile", level: 3, source: "printed" }],
    });
    expect(buildChangeSet(makeSnapshot(), payload, catalogs)).toEqual([]);
  });
});

describe("buildChangeSet — proficiencies and languages", () => {
  it("proposes a new weapon proficiency with the canonical name", () => {
    const payload = makePayload({
      weaponProficiencies: [{ name: "Long Sword", specialized: false, source: "printed" }],
    });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(changes[0].target.writes[0]).toMatchObject({
      table: "character_weapon_proficiencies",
      values: { weapon_name: "Langschwert", specialization: false },
    });
  });

  it("detects a specialisation change on an existing proficiency", () => {
    const snapshot = makeSnapshot({
      weaponProficiencies: [
        { id: "wp-1", character_id: "char-1", weapon_name: "Langschwert", specialization: false },
      ],
    });
    const payload = makePayload({
      weaponProficiencies: [{ name: "Long Sword", specialized: true, source: "printed" }],
    });
    const changes = buildChangeSet(snapshot, payload, catalogs);
    expect(changes[0]).toMatchObject({
      kind: "list-update",
      currentValue: false,
      proposedValue: true,
    });
  });

  it("routes a fighting-style entry to the fighting styles table", () => {
    const payload = makePayload({
      weaponProficiencies: [
        { name: "Fighting Style: Two Weapon", specialized: false, source: "printed" },
      ],
    });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(changes[0].target.writes[0]).toMatchObject({
      table: "character_fighting_styles",
      values: { style_id: "two_weapon" },
    });
  });

  it("proposes a new non-weapon proficiency by catalogue id", () => {
    const payload = makePayload({ nwps: [{ name: "Rope Use", source: "printed" }] });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(changes[0].target.writes[0]).toMatchObject({
      table: "character_nonweapon_proficiencies",
      values: { proficiency_id: "rope_use" },
    });
  });

  it("skips native-language pseudo entries", () => {
    const payload = makePayload({
      nwps: [{ name: "Native Languages: Common", source: "printed" }],
    });
    expect(buildChangeSet(makeSnapshot(), payload, catalogs)).toEqual([]);
  });

  it("proposes a new language", () => {
    const payload = makePayload({ languages: [{ name: "Elvish", source: "printed" }] });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    expect(changes[0].target.writes[0]).toMatchObject({
      table: "character_languages",
      values: { language_name: "Elvish" },
    });
  });

  it("reports no change for a language the character already speaks", () => {
    const snapshot = makeSnapshot({
      languages: [{ id: "lang-1", character_id: "char-1", language_name: "Elvish" }],
    });
    const payload = makePayload({ languages: [{ name: "elvish", source: "printed" }] });
    expect(buildChangeSet(snapshot, payload, catalogs)).toEqual([]);
  });
});

describe("buildChangeSet — change ids", () => {
  it("gives every change a unique id", () => {
    const payload = makePayload({
      printed: { hpMax: 29, dex: 18, goldGp: 200 },
      equipment: [
        { name: "Dagger", magicBonus: 0, source: "printed" },
        { name: "Dagger", magicBonus: 0, source: "printed" },
      ],
      spells: [{ name: "Magic Missile", level: 1, source: "printed" }],
    });
    const changes = buildChangeSet(makeSnapshot(), payload, catalogs);
    const ids = changes.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses stable, descriptive ids for scalar fields", () => {
    const changes = buildChangeSet(
      makeSnapshot(),
      makePayload({ printed: { hpMax: 29 } }),
      catalogs
    );
    expect(changes[0].id).toBe("core:hp_max");
  });
});
