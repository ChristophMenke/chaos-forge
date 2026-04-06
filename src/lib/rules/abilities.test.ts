import { describe, it, expect } from "vitest";
import {
  getStrengthModifiers,
  getDexterityModifiers,
  getConstitutionModifiers,
  getIntelligenceModifiers,
  getWisdomModifiers,
  getCharismaModifiers,
  rollAbilityScoresMethodI,
  rollAbilityScoresMethodII,
  rollAbilityScoresMethodIII,
  rollAbilityScoresMethodIV,
  rollAbilityScoresMethodV,
  getTotalLanguageSlots,
} from "./abilities";

describe("ABILITY-001 ABILITY-002: Strength Modifiers", () => {
  it("should return correct modifiers for STR 3", () => {
    const mods = getStrengthModifiers(3);
    expect(mods.hitAdj).toBe(-3);
    expect(mods.dmgAdj).toBe(-1);
    expect(mods.weightAllow).toBe(5);
    expect(mods.maxPress).toBe(10);
    expect(mods.openDoors).toBe(2);
    expect(mods.bendBars).toBe(0);
  });

  it("should return correct modifiers for STR 10 (average)", () => {
    const mods = getStrengthModifiers(10);
    expect(mods.hitAdj).toBe(0);
    expect(mods.dmgAdj).toBe(0);
    expect(mods.weightAllow).toBe(40);
    expect(mods.maxPress).toBe(115);
    expect(mods.openDoors).toBe(6);
    expect(mods.bendBars).toBe(2);
  });

  it("should return correct modifiers for STR 18 (no exceptional)", () => {
    const mods = getStrengthModifiers(18);
    expect(mods.hitAdj).toBe(1);
    expect(mods.dmgAdj).toBe(2);
    expect(mods.weightAllow).toBe(110);
    expect(mods.maxPress).toBe(255);
    expect(mods.openDoors).toBe(11);
    expect(mods.bendBars).toBe(16);
  });

  it("should return correct modifiers for STR 18/50 (exceptional)", () => {
    const mods = getStrengthModifiers(18, 50);
    expect(mods.hitAdj).toBe(1);
    expect(mods.dmgAdj).toBe(3);
    expect(mods.weightAllow).toBe(135);
    expect(mods.maxPress).toBe(280);
    expect(mods.openDoors).toBe(12);
    expect(mods.bendBars).toBe(20);
  });

  it("should return correct modifiers for STR 18/00 (=100, maximum)", () => {
    const mods = getStrengthModifiers(18, 100);
    expect(mods.hitAdj).toBe(3);
    expect(mods.dmgAdj).toBe(6);
    expect(mods.weightAllow).toBe(335);
    expect(mods.maxPress).toBe(480);
    expect(mods.openDoors).toBe(16);
    expect(mods.bendBars).toBe(40);
  });

  it("should ignore exceptional strength for non-18 STR", () => {
    const mods = getStrengthModifiers(16, 50);
    expect(mods.hitAdj).toBe(0);
    expect(mods.dmgAdj).toBe(1);
  });
});

describe("ABILITY-003: Dexterity Modifiers", () => {
  it("should return correct modifiers for DEX 3", () => {
    const mods = getDexterityModifiers(3);
    expect(mods.reactionAdj).toBe(-3);
    expect(mods.missileAdj).toBe(-3);
    expect(mods.defensiveAdj).toBe(4);
  });

  it("should return correct modifiers for DEX 10", () => {
    const mods = getDexterityModifiers(10);
    expect(mods.reactionAdj).toBe(0);
    expect(mods.missileAdj).toBe(0);
    expect(mods.defensiveAdj).toBe(0);
  });

  it("should return correct modifiers for DEX 18", () => {
    const mods = getDexterityModifiers(18);
    expect(mods.reactionAdj).toBe(2);
    expect(mods.missileAdj).toBe(2);
    expect(mods.defensiveAdj).toBe(-4);
  });
});

describe("ABILITY-004: Constitution Modifiers", () => {
  it("should return correct modifiers for CON 3", () => {
    const mods = getConstitutionModifiers(3);
    expect(mods.hpAdj).toBe(-2);
    expect(mods.systemShock).toBe(35);
    expect(mods.resurrectionSurvival).toBe(40);
    expect(mods.poisonSave).toBe(0);
    expect(mods.regeneration).toBeNull();
  });

  it("should return correct modifiers for CON 15", () => {
    const mods = getConstitutionModifiers(15);
    expect(mods.hpAdj).toBe(1);
    expect(mods.systemShock).toBe(90);
    expect(mods.resurrectionSurvival).toBe(94);
  });

  it("should return correct modifiers for CON 18", () => {
    const mods = getConstitutionModifiers(18);
    expect(mods.hpAdj).toBe(4);
    expect(mods.systemShock).toBe(99);
    expect(mods.resurrectionSurvival).toBe(100);
  });
});

describe("ABILITY-005 MAGIC-012: Intelligence Modifiers", () => {
  it("should return correct modifiers for INT 3", () => {
    const mods = getIntelligenceModifiers(3);
    expect(mods.numberOfLanguages).toBe(1);
    expect(mods.spellLevel).toBeNull();
    expect(mods.chanceToLearn).toBe(0);
    expect(mods.maxSpellsPerLevel).toBe(0);
  });

  it("should return correct modifiers for INT 9", () => {
    const mods = getIntelligenceModifiers(9);
    expect(mods.numberOfLanguages).toBe(2);
    expect(mods.spellLevel).toBe(4);
    expect(mods.chanceToLearn).toBe(35);
    expect(mods.maxSpellsPerLevel).toBe(6);
  });

  it("should return correct modifiers for INT 18", () => {
    const mods = getIntelligenceModifiers(18);
    expect(mods.numberOfLanguages).toBe(7);
    expect(mods.spellLevel).toBe(9);
    expect(mods.chanceToLearn).toBe(85);
    expect(mods.maxSpellsPerLevel).toBe(18);
    expect(mods.spellImmunity).toBeNull();
  });
});

describe("ABILITY-006: Wisdom Modifiers", () => {
  it("should return correct modifiers for WIS 3", () => {
    const mods = getWisdomModifiers(3);
    expect(mods.magicalDefenseAdj).toBe(-3);
    expect(mods.bonusSpells).toEqual([]);
    expect(mods.spellFailure).toBe(30);
  });

  it("should return correct modifiers for WIS 13", () => {
    const mods = getWisdomModifiers(13);
    expect(mods.magicalDefenseAdj).toBe(0);
    expect(mods.bonusSpells).toEqual([1]);
    expect(mods.spellFailure).toBe(0);
  });

  it("should return correct modifiers for WIS 18", () => {
    const mods = getWisdomModifiers(18);
    expect(mods.magicalDefenseAdj).toBe(4);
    expect(mods.bonusSpells).toEqual([2, 2, 1, 1]);
    expect(mods.spellFailure).toBe(0);
  });
});

describe("ABILITY-007: Charisma Modifiers", () => {
  it("should return correct modifiers for CHA 3", () => {
    const mods = getCharismaModifiers(3);
    expect(mods.maxHenchmen).toBe(1);
    expect(mods.loyaltyBase).toBe(-5);
    expect(mods.reactionAdj).toBe(-5);
  });

  it("should return correct modifiers for CHA 10", () => {
    const mods = getCharismaModifiers(10);
    expect(mods.maxHenchmen).toBe(4);
    expect(mods.loyaltyBase).toBe(0);
    expect(mods.reactionAdj).toBe(0);
  });

  it("should return correct modifiers for CHA 18", () => {
    const mods = getCharismaModifiers(18);
    expect(mods.maxHenchmen).toBe(15);
    expect(mods.loyaltyBase).toBe(8);
    expect(mods.reactionAdj).toBe(7);
  });
});

describe("Sub-Stats (Player's Option: Skills & Powers)", () => {
  describe("STR sub-stats: Muscle and Stamina", () => {
    it("muscle 19 overrides hit/damage to +3/+7 while base STR 18/13 stays for weightAllow", () => {
      const mods = getStrengthModifiers(18, 13, 19);
      expect(mods.hitAdj).toBe(3);
      expect(mods.dmgAdj).toBe(7);
      // weightAllow should still come from base STR 18/13
      expect(mods.weightAllow).toBe(135);
    });

    it("stamina 17 overrides weight allowance while base STR 18/13 stays for hit/damage", () => {
      const mods = getStrengthModifiers(18, 13, null, 17);
      expect(mods.weightAllow).toBe(85);
      // hit/damage should still come from STR 18/13
      expect(mods.hitAdj).toBe(1);
      expect(mods.dmgAdj).toBe(3);
    });

    it("both muscle and stamina override their respective fields", () => {
      const mods = getStrengthModifiers(10, undefined, 16, 15);
      // muscle 16 → hitAdj 0, dmgAdj 1
      expect(mods.hitAdj).toBe(0);
      expect(mods.dmgAdj).toBe(1);
      // stamina 15 → weightAllow 55
      expect(mods.weightAllow).toBe(55);
    });

    it("sub-stats equal to base STR are treated as no-op", () => {
      const withSub = getStrengthModifiers(14, undefined, 14, 14);
      const withoutSub = getStrengthModifiers(14);
      expect(withSub).toEqual(withoutSub);
    });

    it("null sub-stats are ignored (same as not providing them)", () => {
      const withNull = getStrengthModifiers(16, undefined, null, null);
      const without = getStrengthModifiers(16);
      expect(withNull).toEqual(without);
    });
  });

  describe("DEX sub-stats: Aim and Balance", () => {
    it("aim 18 overrides missileAdj while base DEX 10 stays for defensive/reaction", () => {
      const mods = getDexterityModifiers(10, 18, null);
      expect(mods.missileAdj).toBe(2);
      // defensiveAdj and reactionAdj from base DEX 10
      expect(mods.defensiveAdj).toBe(0);
      expect(mods.reactionAdj).toBe(0);
    });

    it("balance 3 overrides defensiveAdj and reactionAdj", () => {
      const mods = getDexterityModifiers(18, null, 3);
      // missileAdj from base DEX 18
      expect(mods.missileAdj).toBe(2);
      // defensiveAdj and reactionAdj from balance 3
      expect(mods.defensiveAdj).toBe(4);
      expect(mods.reactionAdj).toBe(-3);
    });

    it("aim 16 and balance 16 keep same as base dex 16", () => {
      const mods = getDexterityModifiers(16, 16, 16);
      expect(mods.missileAdj).toBe(1);
      expect(mods.defensiveAdj).toBe(-2);
    });
  });

  describe("CON sub-stats: Health and Fitness", () => {
    it("health 3 overrides systemShock and poisonSave", () => {
      const mods = getConstitutionModifiers(18, 3, null);
      // systemShock and poisonSave from health 3
      expect(mods.systemShock).toBe(35);
      expect(mods.poisonSave).toBe(0);
      // hpAdj and resurrectionSurvival from base CON 18
      expect(mods.hpAdj).toBe(4);
      expect(mods.resurrectionSurvival).toBe(100);
    });

    it("fitness 18 overrides hpAdj and resurrection to CON 18 values", () => {
      const mods = getConstitutionModifiers(10, null, 18);
      // hpAdj and resurrectionSurvival from fitness 18
      expect(mods.hpAdj).toBe(4);
      expect(mods.resurrectionSurvival).toBe(100);
      // systemShock and poisonSave from base CON 10
      expect(mods.systemShock).toBe(70);
      expect(mods.poisonSave).toBe(0);
    });

    it("fitness 15 overrides resurrection to 94%", () => {
      const mods = getConstitutionModifiers(3, null, 15);
      expect(mods.resurrectionSurvival).toBe(94);
      expect(mods.hpAdj).toBe(1);
    });
  });

  describe("INT sub-stats: Knowledge and Reason", () => {
    it("knowledge 18 overrides numberOfLanguages", () => {
      const mods = getIntelligenceModifiers(10, 18, null);
      expect(mods.numberOfLanguages).toBe(7);
      // spellLevel, chanceToLearn, maxSpellsPerLevel from base INT 10
      expect(mods.spellLevel).toBe(5);
    });

    it("reason 18 overrides maxSpellsPerLevel and chanceToLearn", () => {
      const mods = getIntelligenceModifiers(10, null, 18);
      expect(mods.maxSpellsPerLevel).toBe(18);
      expect(mods.chanceToLearn).toBe(85);
      // numberOfLanguages from base INT 10
      expect(mods.numberOfLanguages).toBe(2);
    });

    it("null sub-stats are no-op", () => {
      const withNull = getIntelligenceModifiers(12, null, null);
      const without = getIntelligenceModifiers(12);
      expect(withNull).toEqual(without);
    });
  });

  describe("WIS sub-stats: Intuition and Willpower", () => {
    it("intuition 18 overrides magicalDefenseAdj", () => {
      const mods = getWisdomModifiers(10, 18, null);
      expect(mods.magicalDefenseAdj).toBe(4);
      // bonusSpells and spellFailure from base WIS 10
      expect(mods.bonusSpells).toEqual([]);
      expect(mods.spellFailure).toBe(0);
    });

    it("willpower 3 overrides bonusSpells and spellFailure", () => {
      const mods = getWisdomModifiers(18, null, 3);
      expect(mods.bonusSpells).toEqual([]);
      expect(mods.spellFailure).toBe(30);
      // magicalDefenseAdj from base WIS 18
      expect(mods.magicalDefenseAdj).toBe(4);
    });

    it("null sub-stats are no-op", () => {
      const withNull = getWisdomModifiers(15, null, null);
      const without = getWisdomModifiers(15);
      expect(withNull).toEqual(without);
    });
  });

  describe("CHA sub-stats: Leadership and Appearance", () => {
    it("leadership 18 overrides maxHenchmen and loyaltyBase", () => {
      const mods = getCharismaModifiers(10, 18, null);
      expect(mods.maxHenchmen).toBe(15);
      expect(mods.loyaltyBase).toBe(8);
      // reactionAdj from base CHA 10
      expect(mods.reactionAdj).toBe(0);
    });

    it("appearance 18 overrides reactionAdj", () => {
      const mods = getCharismaModifiers(10, null, 18);
      expect(mods.reactionAdj).toBe(7);
      // maxHenchmen and loyaltyBase from base CHA 10
      expect(mods.maxHenchmen).toBe(4);
      expect(mods.loyaltyBase).toBe(0);
    });

    it("null sub-stats are no-op", () => {
      const withNull = getCharismaModifiers(12, null, null);
      const without = getCharismaModifiers(12);
      expect(withNull).toEqual(without);
    });
  });
});

describe("ABILITY-009: rollAbilityScoresMethodI — 3d6 in order", () => {
  it("returns 6 scores between 3 and 18", () => {
    const scores = rollAbilityScoresMethodI();
    expect(scores).toHaveLength(6);
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(3);
      expect(s).toBeLessThanOrEqual(18);
    }
  });

  it("returns different results on repeated calls (statistical)", () => {
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      results.add(rollAbilityScoresMethodI().join(","));
    }
    expect(results.size).toBeGreaterThan(1);
  });
});

describe("ABILITY-010: rollAbilityScoresMethodII — 3d6 twice, best of each", () => {
  it("returns 6 scores between 3 and 18", () => {
    const scores = rollAbilityScoresMethodII();
    expect(scores).toHaveLength(6);
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(3);
      expect(s).toBeLessThanOrEqual(18);
    }
  });
});

describe("ABILITY-011: rollAbilityScoresMethodIII — 3d6 ×6, arrange freely", () => {
  it("returns 6 scores between 3 and 18", () => {
    const scores = rollAbilityScoresMethodIII();
    expect(scores).toHaveLength(6);
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(3);
      expect(s).toBeLessThanOrEqual(18);
    }
  });
});

describe("ABILITY-012: rollAbilityScoresMethodIV — 3d6 ×12, pick best 6", () => {
  it("returns 6 scores between 3 and 18, sorted descending", () => {
    const scores = rollAbilityScoresMethodIV();
    expect(scores).toHaveLength(6);
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(3);
      expect(s).toBeLessThanOrEqual(18);
    }
    // Should be sorted descending (best first)
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }
  });
});

describe("ABILITY-013: rollAbilityScoresMethodV — 4d6 drop lowest, arrange freely", () => {
  it("returns 6 scores between 3 and 18", () => {
    const scores = rollAbilityScoresMethodV();
    expect(scores).toHaveLength(6);
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(3);
      expect(s).toBeLessThanOrEqual(18);
    }
  });

  it("statistically produces higher averages than method I", () => {
    let sumI = 0;
    let sumV = 0;
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
      sumI += rollAbilityScoresMethodI().reduce((a, b) => a + b, 0);
      sumV += rollAbilityScoresMethodV().reduce((a, b) => a + b, 0);
    }
    expect(sumV / iterations).toBeGreaterThan(sumI / iterations);
  });
});

describe("Extended Ability Scores (19-25)", () => {
  it("DEX 19: reactionAdj +3, missileAdj +3, defensiveAdj -4", () => {
    const mods = getDexterityModifiers(19);
    expect(mods.reactionAdj).toBe(3);
    expect(mods.missileAdj).toBe(3);
    expect(mods.defensiveAdj).toBe(-4);
  });

  it("DEX 25: reactionAdj +5, missileAdj +5, defensiveAdj -6", () => {
    const mods = getDexterityModifiers(25);
    expect(mods.reactionAdj).toBe(5);
    expect(mods.missileAdj).toBe(5);
    expect(mods.defensiveAdj).toBe(-6);
  });

  it("CON 19: hpAdj +5, poisonSave +1", () => {
    const mods = getConstitutionModifiers(19);
    expect(mods.hpAdj).toBe(5);
    expect(mods.poisonSave).toBe(1);
    expect(mods.systemShock).toBe(99);
  });

  it("CON 25: hpAdj +7, poisonSave +4", () => {
    const mods = getConstitutionModifiers(25);
    expect(mods.hpAdj).toBe(7);
    expect(mods.poisonSave).toBe(4);
  });

  it("INT 19: 8 languages, spellLevel 9, chanceToLearn 95, spellImmunity 1", () => {
    const mods = getIntelligenceModifiers(19);
    expect(mods.numberOfLanguages).toBe(8);
    expect(mods.spellLevel).toBe(9);
    expect(mods.chanceToLearn).toBe(95);
    expect(mods.maxSpellsPerLevel).toBe("All");
    expect(mods.spellImmunity).toBe(1);
  });

  it("INT 25: 20 languages, chanceToLearn 100, spellImmunity 7", () => {
    const mods = getIntelligenceModifiers(25);
    expect(mods.numberOfLanguages).toBe(20);
    expect(mods.chanceToLearn).toBe(100);
    expect(mods.spellImmunity).toBe(7);
  });

  it("WIS 19: magicalDefenseAdj +4, bonusSpells [3,2,1,1]", () => {
    const mods = getWisdomModifiers(19);
    expect(mods.magicalDefenseAdj).toBe(4);
    expect(mods.bonusSpells).toEqual([3, 2, 1, 1]);
    expect(mods.spellFailure).toBe(0);
  });

  it("WIS 25: bonusSpells [3,3,2,2,2,1,1]", () => {
    const mods = getWisdomModifiers(25);
    expect(mods.bonusSpells).toEqual([3, 3, 2, 2, 2, 1, 1]);
  });

  it("CHA 19: maxHenchmen 20, loyaltyBase +10, reactionAdj +8", () => {
    const mods = getCharismaModifiers(19);
    expect(mods.maxHenchmen).toBe(20);
    expect(mods.loyaltyBase).toBe(10);
    expect(mods.reactionAdj).toBe(8);
  });

  it("CHA 25: maxHenchmen 50, loyaltyBase +20, reactionAdj +14", () => {
    const mods = getCharismaModifiers(25);
    expect(mods.maxHenchmen).toBe(50);
    expect(mods.loyaltyBase).toBe(20);
    expect(mods.reactionAdj).toBe(14);
  });

  it("Sub-stats work with values over 18 (Aim 20)", () => {
    const mods = getDexterityModifiers(15, 20);
    expect(mods.missileAdj).toBe(3); // from aim 20
    expect(mods.defensiveAdj).toBe(-1); // from base DEX 15
  });
});

describe("ABILITY-014: getTotalLanguageSlots", () => {
  it("Human INT 10: 1 racial (Common) + 2 INT bonus = 3", () => {
    expect(getTotalLanguageSlots(10, "human")).toBe(3);
  });

  it("Elf INT 12: 2 racial (Common, Elfisch) + 3 INT bonus = 5", () => {
    expect(getTotalLanguageSlots(12, "elf")).toBe(5);
  });

  it("Dwarf INT 18: 2 racial (Common, Zwergisch) + 7 INT bonus = 9", () => {
    expect(getTotalLanguageSlots(18, "dwarf")).toBe(9);
  });

  it("Kobold INT 8: 4 racial + 1 INT bonus = 5", () => {
    // Kobold: Common, Koboldisch, Orkisch, Untercommon
    expect(getTotalLanguageSlots(8, "kobold")).toBe(5);
  });

  it("Human INT 3: 1 racial + 1 INT bonus = 2", () => {
    expect(getTotalLanguageSlots(3, "human")).toBe(2);
  });

  it("respects Knowledge sub-stat override", () => {
    // INT 10 with Knowledge 16: uses Knowledge for numberOfLanguages (5)
    // Elf: 2 racial + 5 = 7
    expect(getTotalLanguageSlots(10, "elf", 16)).toBe(7);
  });
});
