import { describe, it, expect } from "vitest";
import {
  getBardSpellSlots,
  getWizardSpellSlots,
  getPriestSpellSlots,
  getPriestBonusSlots,
  getPriestSpellPoints,
  getPriestBonusSpellPoints,
  getPriestSpellCost,
  canLearnSpell,
  getRangerSpellSlots,
  getPaladinSpellSlots,
  getSpecialistBonusSlots,
  getWizardSpellPoints,
  getWizardSpecialistBonusPoints,
  getWizardBonusSpellPoints,
  getWizardSpellCost,
} from "./spellslots";

describe("CLASS-009: Bard Spell Slots", () => {
  it("bard level 1 has no spells", () => {
    const slots = getBardSpellSlots(1);
    expect(slots.every((s) => s === 0)).toBe(true);
  });

  it("bard level 2 has 1 first-level slot", () => {
    const slots = getBardSpellSlots(2);
    expect(slots[0]).toBe(1);
    expect(slots[1]).toBe(0);
  });

  it("bard level 4 has 2 first-level and 1 second-level slot", () => {
    const slots = getBardSpellSlots(4);
    expect(slots[0]).toBe(2);
    expect(slots[1]).toBe(1);
  });

  it("bard level 10 gets 4th level spells", () => {
    const slots = getBardSpellSlots(10);
    expect(slots[3]).toBe(1);
    expect(slots[4]).toBe(0);
  });

  it("bard level 16 gets 6th level spells", () => {
    const slots = getBardSpellSlots(16);
    expect(slots[5]).toBe(1);
  });

  it("bard level 20 maxes at 6 spell levels", () => {
    const slots = getBardSpellSlots(20);
    expect(slots).toHaveLength(6);
    expect(slots[0]).toBe(4);
    expect(slots[5]).toBe(3);
  });

  it("bard has fewer slots than wizard at same level", () => {
    const bardSlots = getBardSpellSlots(10);
    const wizSlots = getWizardSpellSlots(10);
    expect(bardSlots[0]).toBeLessThan(wizSlots[0]);
  });
});

describe("MAGIC-007: Wizard Spell Slots", () => {
  it("should give a level 1 wizard 1 first-level slot", () => {
    const slots = getWizardSpellSlots(1);
    expect(slots[0]).toBe(1);
    expect(slots[1]).toBe(0);
  });

  it("should give a level 3 wizard 2 first-level and 1 second-level slot", () => {
    const slots = getWizardSpellSlots(3);
    expect(slots[0]).toBe(2);
    expect(slots[1]).toBe(1);
  });

  it("should give a level 9 wizard access to 5th level spells", () => {
    const slots = getWizardSpellSlots(9);
    expect(slots[4]).toBeGreaterThan(0); // 5th level
  });
});

describe("MAGIC-008: Priest Spell Slots", () => {
  it("should give a level 1 priest 1 first-level slot", () => {
    const slots = getPriestSpellSlots(1);
    expect(slots[0]).toBe(1);
    expect(slots[1]).toBe(0);
  });

  it("should give a level 3 priest 2 first-level and 1 second-level slot", () => {
    const slots = getPriestSpellSlots(3);
    expect(slots[0]).toBe(2);
    expect(slots[1]).toBe(1);
  });
});

describe("MAGIC-009: Priest Bonus Slots", () => {
  it("should give no bonus slots for WIS 12 or below", () => {
    const bonus = getPriestBonusSlots(12);
    expect(bonus.every((s) => s === 0)).toBe(true);
  });

  it("should give 1 first-level bonus slot for WIS 13", () => {
    const bonus = getPriestBonusSlots(13);
    expect(bonus[0]).toBe(1);
  });

  it("should give bonus slots for WIS 18", () => {
    const bonus = getPriestBonusSlots(18);
    expect(bonus[0]).toBe(2); // 2 first-level
    expect(bonus[1]).toBe(2); // 2 second-level
    expect(bonus[2]).toBe(1); // 1 third-level
    expect(bonus[3]).toBe(1); // 1 fourth-level
  });
});

describe("MAGIC-010: Priest Spell Points (Player's Option)", () => {
  it("should give 10 spell points at level 1", () => {
    expect(getPriestSpellPoints(1)).toBe(10);
  });

  it("should give 92 spell points at level 10", () => {
    expect(getPriestSpellPoints(10)).toBe(92);
  });

  it("should give 287 spell points at level 20", () => {
    expect(getPriestSpellPoints(20)).toBe(287);
  });

  it("should give bonus points for high WIS", () => {
    expect(getPriestBonusSpellPoints(12)).toBe(0);
    expect(getPriestBonusSpellPoints(13)).toBe(1);
    expect(getPriestBonusSpellPoints(16)).toBe(8);
    expect(getPriestBonusSpellPoints(18)).toBe(16);
  });

  it("should return correct spell costs", () => {
    expect(getPriestSpellCost(1)).toBe(1);
    expect(getPriestSpellCost(3)).toBe(4);
    expect(getPriestSpellCost(7)).toBe(12);
  });
});

describe("MAGIC-005 MAGIC-006: canLearnSpell", () => {
  it("should allow a mage to learn any school", () => {
    const result = canLearnSpell("mage", "invocation", undefined, 1, 15);
    expect(result.allowed).toBe(true);
  });

  it("should block a necromancer from learning illusion spells", () => {
    const result = canLearnSpell("necromancer", "illusion", undefined, 1, 15);
    expect(result.allowed).toBe(false);
  });

  it("should block a wizard with INT 9 from level 5+ spells", () => {
    const result = canLearnSpell("mage", "invocation", undefined, 5, 9);
    expect(result.allowed).toBe(false);
  });

  it("should allow a cleric to learn healing sphere spells", () => {
    const result = canLearnSpell("cleric", undefined, "healing", 1, 10);
    expect(result.allowed).toBe(true);
  });

  it("should block a cleric from animal sphere", () => {
    const result = canLearnSpell("cleric", undefined, "animal", 1, 10);
    expect(result.allowed).toBe(false);
  });

  it("should allow a fighter to NOT learn spells", () => {
    const result = canLearnSpell("fighter", "invocation", undefined, 1, 15);
    expect(result.allowed).toBe(false);
  });
});

describe("CLASS-007: getRangerSpellSlots", () => {
  it("ranger level 7 has no spells", () => {
    const slots = getRangerSpellSlots(7);
    expect(slots.druid.every((s) => s === 0)).toBe(true);
    expect(slots.wizard.every((s) => s === 0)).toBe(true);
  });

  it("ranger level 8 has 1 druid spell level 1", () => {
    const slots = getRangerSpellSlots(8);
    expect(slots.druid[0]).toBe(1);
  });

  it("ranger level 9 has 1 wizard spell level 1", () => {
    const slots = getRangerSpellSlots(9);
    expect(slots.wizard[0]).toBe(1);
  });

  it("ranger level 16 has druid spells up to level 3", () => {
    const slots = getRangerSpellSlots(16);
    expect(slots.druid[0]).toBeGreaterThan(0);
    expect(slots.druid[1]).toBeGreaterThan(0);
    expect(slots.druid[2]).toBeGreaterThan(0);
  });
});

describe("CLASS-008: getPaladinSpellSlots", () => {
  it("paladin level 8 has no spells", () => {
    const slots = getPaladinSpellSlots(8);
    expect(slots.every((s) => s === 0)).toBe(true);
  });

  it("paladin level 9 has 1 priest spell level 1", () => {
    const slots = getPaladinSpellSlots(9);
    expect(slots[0]).toBe(1);
  });

  it("paladin level 20 has spells up to level 4", () => {
    const slots = getPaladinSpellSlots(20);
    expect(slots[0]).toBeGreaterThan(0);
    expect(slots[1]).toBeGreaterThan(0);
    expect(slots[2]).toBeGreaterThan(0);
    expect(slots[3]).toBeGreaterThan(0);
  });
});

describe("Specialist Bonus Slots", () => {
  it("illusionist level 5 gets +1 at levels 1-3 (where base > 0)", () => {
    const bonus = getSpecialistBonusSlots("illusionist", 5);
    expect(bonus[0]).toBe(1); // base = 4
    expect(bonus[1]).toBe(1); // base = 2
    expect(bonus[2]).toBe(1); // base = 1
    expect(bonus[3]).toBe(0); // base = 0
  });

  it("illusionist level 1 gets +1 only at level 1", () => {
    const bonus = getSpecialistBonusSlots("illusionist", 1);
    expect(bonus[0]).toBe(1);
    expect(bonus[1]).toBe(0);
    expect(bonus.slice(2).every((b) => b === 0)).toBe(true);
  });

  it("mage (non-specialist) gets no bonus", () => {
    const bonus = getSpecialistBonusSlots("mage", 10);
    expect(bonus.every((b) => b === 0)).toBe(true);
  });

  it("fighter (non-caster) gets no bonus", () => {
    const bonus = getSpecialistBonusSlots("fighter", 10);
    expect(bonus.every((b) => b === 0)).toBe(true);
  });

  it("necromancer level 12 gets +1 at levels 1-6", () => {
    const bonus = getSpecialistBonusSlots("necromancer", 12);
    expect(bonus.slice(0, 6).every((b) => b === 1)).toBe(true);
    expect(bonus[6]).toBe(0);
  });
});

describe("Wizard Spell Points (Player's Option)", () => {
  it("level 1 wizard has 15 spell points", () => {
    expect(getWizardSpellPoints(1)).toBe(15);
  });

  it("level 7 wizard has 80 spell points", () => {
    expect(getWizardSpellPoints(7)).toBe(80);
  });

  it("level 20 wizard has 422 spell points", () => {
    expect(getWizardSpellPoints(20)).toBe(422);
  });

  it("specialist bonus at level 1 is 10", () => {
    expect(getWizardSpecialistBonusPoints(1)).toBe(10);
  });

  it("INT 18 gives +11 bonus spell points", () => {
    expect(getWizardBonusSpellPoints(18)).toBe(11);
  });

  it("INT 10 gives no bonus spell points", () => {
    expect(getWizardBonusSpellPoints(10)).toBe(0);
  });

  it("level 1 fixed spell costs 3 points", () => {
    expect(getWizardSpellCost(1, false)).toBe(3);
  });

  it("level 1 free magick costs 5 points", () => {
    expect(getWizardSpellCost(1, true)).toBe(5);
  });

  it("level 5 fixed spell costs 21 points", () => {
    expect(getWizardSpellCost(5, false)).toBe(21);
  });
});
