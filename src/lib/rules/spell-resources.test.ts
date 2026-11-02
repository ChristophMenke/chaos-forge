import { describe, it, expect } from "vitest";
import { computeSpellResources, type SpellResourceInput } from "./spell-resources";

function input(overrides: Partial<SpellResourceInput> = {}): SpellResourceInput {
  return {
    character: { int: 12, spell_system: "slots", spell_points_used: 0, spell_slots_adj: null },
    classEntries: [{ classId: "mage", level: 7 }],
    effectiveWis: 12,
    spells: [],
    ...overrides,
  };
}

const prepared = (level: number, expended = false) => ({
  prepared: true,
  expended,
  spell: { level },
});

describe("computeSpellResources", () => {
  it("wizard 7 uses the PHB slot table", () => {
    const r = computeSpellResources(input());
    expect(r.mode).toBe("slots");
    expect(r.totalSlots.slice(0, 5)).toEqual([4, 3, 2, 1, 0]);
    expect(r.maxSpellLevel).toBe(9);
    expect(r.casterClass).toEqual({ classId: "mage", level: 7 });
  });

  it("specialist gets one bonus slot per available level", () => {
    const r = computeSpellResources(input({ classEntries: [{ classId: "invoker", level: 7 }] }));
    expect(r.totalSlots.slice(0, 5)).toEqual([5, 4, 3, 2, 0]);
  });

  it("priest bonus slots follow the effective WIS", () => {
    const r = computeSpellResources(
      input({ classEntries: [{ classId: "cleric", level: 5 }], effectiveWis: 17 })
    );
    expect(r.isPriest).toBe(true);
    expect(r.maxSpellLevel).toBe(7);
    expect(r.totalSlots.slice(0, 3)).toEqual([5, 5, 2]);
  });

  it("wizard points use stored INT plus epic bonus", () => {
    const r = computeSpellResources(
      input({
        character: { int: 16, spell_system: "points", spell_points_used: 5, spell_slots_adj: null },
        classEntries: [{ classId: "mage", level: 5 }],
        epicBonusSpellPoints: 2,
      })
    );
    expect(r.mode).toBe("points");
    expect(r.totalSlots).toEqual([]);
    expect(r.totalPoints).toBe(59);
    expect(r.pointsRemaining).toBe(54);
  });

  it("priest points use the effective WIS", () => {
    const r = computeSpellResources(
      input({
        character: { int: 10, spell_system: "points", spell_points_used: 0, spell_slots_adj: null },
        classEntries: [{ classId: "cleric", level: 3 }],
        effectiveWis: 16,
      })
    );
    expect(r.totalPoints).toBe(28);
  });

  it("bard uses the bard table and caps at level 6", () => {
    const r = computeSpellResources(input({ classEntries: [{ classId: "bard", level: 5 }] }));
    expect(r.isBard).toBe(true);
    expect(r.maxSpellLevel).toBe(6);
    expect(r.totalSlots.slice(0, 3)).toEqual([3, 1, 0]);
  });

  it("non-casters have no resources", () => {
    const r = computeSpellResources(input({ classEntries: [{ classId: "fighter", level: 9 }] }));
    expect(r.mode).toBe("none");
    expect(r.totalSlots.every((s) => s === 0)).toBe(true);
  });

  it("applies manual slot adjustments and counts expended prepared spells only", () => {
    const r = computeSpellResources(
      input({
        character: {
          int: 12,
          spell_system: "slots",
          spell_points_used: 0,
          spell_slots_adj: { "1": 1 },
        },
        classEntries: [{ classId: "mage", level: 3 }],
        spells: [
          prepared(1, true),
          prepared(1, true),
          { prepared: false, expended: true, spell: { level: 2 } },
        ],
      })
    );
    expect(r.totalSlots.slice(0, 2)).toEqual([3, 1]);
    expect(r.expendedByLevel).toEqual({ 1: 2 });
  });

  it("a dormant dual class is ignored when only active classes are passed", () => {
    // Fighter 4 → mage 6: the fighter class is dormant and not in classEntries
    const r = computeSpellResources(input({ classEntries: [{ classId: "mage", level: 6 }] }));
    expect(r.casterClass.classId).toBe("mage");
    expect(r.classGroups).toEqual(["wizard"]);
  });

  it("multiclass fighter/mage uses the mage level", () => {
    const r = computeSpellResources(
      input({
        classEntries: [
          { classId: "fighter", level: 6 },
          { classId: "mage", level: 5 },
        ],
      })
    );
    expect(r.casterClass).toEqual({ classId: "mage", level: 5 });
    expect(r.classGroups).toEqual(["warrior", "wizard"]);
  });
});
