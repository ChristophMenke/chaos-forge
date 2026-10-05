import { describe, it, expect } from "vitest";
import type { CharacterRow } from "@/lib/supabase/types";
import { buildCharacterSaveFields } from "./save-fields";

const character = {
  id: "c1",
  name: "Larry",
  traits: [{ name: "Scharfsinn", description: "", cp: 3 }],
  disadvantages: [{ name: "Höhenangst", description: "", cp: -5 }],
  spell_whitelist: ["spell-1"],
  hp_current: 7,
  str: 16,
} as unknown as CharacterRow;

describe("buildCharacterSaveFields", () => {
  it("includes traits, disadvantages and the spell whitelist", () => {
    const fields = buildCharacterSaveFields(character);
    expect(fields.traits).toEqual(character.traits);
    expect(fields.disadvantages).toEqual(character.disadvantages);
    expect(fields.spell_whitelist).toEqual(["spell-1"]);
  });

  it("keeps the draft fields of the sheet", () => {
    const fields = buildCharacterSaveFields(character);
    expect(fields).toMatchObject({ name: "Larry", hp_current: 7, str: 16 });
  });

  it("never writes the id or fields the tabs save themselves", () => {
    const fields = buildCharacterSaveFields(character) as Record<string, unknown>;
    expect(fields).not.toHaveProperty("id");
    expect(fields).not.toHaveProperty("allowed_spell_books");
    expect(fields).not.toHaveProperty("spell_slots_adj");
  });
});
