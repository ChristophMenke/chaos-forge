import { describe, it, expect } from "vitest";
import { loadCharacterBundles } from "./character-bundle";
import { createFakeQueryClient } from "./fake-query-client";

const tables = {
  characters: [
    { id: "a", name: "Elandril" },
    { id: "b", name: "Thorin" },
  ],
  character_classes: [
    { character_id: "a", class_id: "mage", level: 7 },
    { character_id: "b", class_id: "fighter", level: 6 },
  ],
  character_equipment: [{ character_id: "b", weapon: { name: "Axt" }, armor: null }],
  epic_items: [],
  character_weapon_proficiencies: [],
  character_fighting_styles: [],
  character_effects: [
    { character_id: "a", name: "Hast", ended_at: null },
    { character_id: "a", name: "Schlaf", ended_at: "2026-11-01T10:00:00Z" },
  ],
  character_spells: [{ character_id: "a", spell_id: "mm", spell: { name: "Magisches Geschoss" } }],
  character_nonweapon_proficiencies: [],
  character_inventory: [{ character_id: "a", custom_name: "Seil" }],
  character_languages: [{ character_id: "a", language_name: "Elfisch" }],
};

describe("loadCharacterBundles", () => {
  it("does not query anything without ids", async () => {
    const fake = createFakeQueryClient(tables);
    expect(await loadCharacterBundles(fake.client, [], "full")).toEqual([]);
    expect(fake.queries).toEqual([]);
  });

  it("loads full bundles grouped per character, in the order of the ids", async () => {
    const fake = createFakeQueryClient(tables);
    const bundles = await loadCharacterBundles(fake.client, ["b", "a"], "full");

    expect(bundles.map((b) => b.character.name)).toEqual(["Thorin", "Elandril"]);
    const [thorin, elandril] = bundles;
    expect(thorin.equipment).toHaveLength(1);
    expect(thorin.spells).toEqual([]);
    expect(elandril.classes[0].class_id).toBe("mage");
    expect(elandril.spells).toHaveLength(1);
    expect(elandril.inventory).toHaveLength(1);
    expect(elandril.languages[0].language_name).toBe("Elfisch");
  });

  it("only loads active effects", async () => {
    const fake = createFakeQueryClient(tables);
    const [elandril] = await loadCharacterBundles(fake.client, ["a"], "full");
    expect(elandril.effects.map((e) => e.name)).toEqual(["Hast"]);
  });

  it("filters every query by the given ids only", async () => {
    const fake = createFakeQueryClient(tables);
    await loadCharacterBundles(fake.client, ["a"], "full");
    for (const query of fake.queries) {
      const idFilter = query.filters.find((f) => f.op === "in");
      expect(idFilter?.value, query.table).toEqual(["a"]);
    }
    expect(fake.queries.map((q) => q.table)).toContain("character_languages");
  });

  it("compact bundles skip spells, skills, inventory and languages", async () => {
    const fake = createFakeQueryClient(tables);
    const [elandril] = await loadCharacterBundles(fake.client, ["a"], "compact");
    expect(elandril.spells).toEqual([]);
    expect(elandril.inventory).toEqual([]);
    const loaded = fake.queries.map((q) => q.table);
    expect(loaded).not.toContain("character_spells");
    expect(loaded).not.toContain("character_inventory");
    expect(loaded).not.toContain("character_languages");
    expect(loaded).not.toContain("character_nonweapon_proficiencies");
  });

  it("skips ids the client cannot read", async () => {
    const fake = createFakeQueryClient(tables);
    const bundles = await loadCharacterBundles(fake.client, ["a", "hidden"], "compact");
    expect(bundles.map((b) => b.character.id)).toEqual(["a"]);
  });

  it("throws when a query fails", async () => {
    const fake = createFakeQueryClient(tables, { failTable: "character_spells" });
    await expect(loadCharacterBundles(fake.client, ["a"], "full")).rejects.toThrow();
  });
});
