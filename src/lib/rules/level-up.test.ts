import { describe, it, expect } from "vitest";
import type { CharacterClassRow, EpicItemRow } from "@/lib/supabase/types";
import { getXpThreshold } from "./experience";
import { getConstitutionModifiers } from "./abilities";
import {
  getLevelUpHitPoints,
  getPendingLevelUps,
  getLevelUpSkillPoints,
  validateSkillAllocation,
  buildLevelUpSummary,
  type LevelUpChange,
} from "./level-up";
import { getFixedHitPointsAfterNameLevel, getHitDiceLevelCap } from "./hitpoints";

// Rule coverage: CLASS-011, CLASS-014, THIEF-001

function row(class_id: string, level: number, extra: Partial<CharacterClassRow> = {}) {
  return {
    id: `${class_id}-row`,
    character_id: "c1",
    class_id,
    level,
    xp_current: 0,
    is_active: true,
    switch_level: null,
    ...extra,
  } as CharacterClassRow;
}

const con = (score: number, fitness?: number) =>
  getConstitutionModifiers(score, null, fitness).hpAdj;

describe("hit dice level caps (CLASS-011)", () => {
  it("rolls through 9th for warriors and priests, 10th for rogues and wizards", () => {
    expect(getHitDiceLevelCap("warrior")).toBe(9);
    expect(getHitDiceLevelCap("priest")).toBe(9);
    expect(getHitDiceLevelCap("rogue")).toBe(10);
    expect(getHitDiceLevelCap("wizard")).toBe(10);
  });

  it("adds fixed hit points afterwards", () => {
    expect(getFixedHitPointsAfterNameLevel("warrior")).toBe(3);
    expect(getFixedHitPointsAfterNameLevel("priest")).toBe(2);
    expect(getFixedHitPointsAfterNameLevel("rogue")).toBe(2);
    expect(getFixedHitPointsAfterNameLevel("wizard")).toBe(1);
  });
});

describe("getLevelUpHitPoints (CLASS-014)", () => {
  const thief = (level: number) => [row("thief", level)];

  it("adds the die roll and the Constitution bonus", () => {
    expect(
      getLevelUpHitPoints({
        classId: "thief",
        newLevel: 10,
        kit: null,
        conHpAdj: con(15),
        classes: thief(9),
        dieRoll: 4,
      })
    ).toMatchObject({ mode: "roll", die: 6, conBonus: 1, divisor: 1, gain: 5 });

    expect(
      getLevelUpHitPoints({
        classId: "thief",
        newLevel: 10,
        kit: null,
        conHpAdj: con(16),
        classes: thief(9),
        dieRoll: 4,
      }).gain
    ).toBe(6);
  });

  it("takes the Constitution bonus from the fitness sub-stat", () => {
    const result = getLevelUpHitPoints({
      classId: "thief",
      newLevel: 5,
      kit: null,
      conHpAdj: con(12, 16),
      classes: thief(4),
      dieRoll: 3,
    });
    expect(result.conBonus).toBe(2);
    expect(result.gain).toBe(5);
  });

  it("switches to fixed hit points without Constitution after the last hit die", () => {
    expect(
      getLevelUpHitPoints({
        classId: "thief",
        newLevel: 11,
        kit: null,
        conHpAdj: con(18),
        classes: thief(10),
      })
    ).toMatchObject({ mode: "fixed", conBonus: 0, gain: 2 });

    expect(
      getLevelUpHitPoints({
        classId: "fighter",
        newLevel: 10,
        kit: null,
        conHpAdj: con(18),
        classes: [row("fighter", 9)],
      })
    ).toMatchObject({ mode: "fixed", gain: 3 });
  });

  it("caps the Constitution bonus at +4 for warriors and +2 for everyone else", () => {
    const fighter = getLevelUpHitPoints({
      classId: "fighter",
      newLevel: 3,
      kit: null,
      conHpAdj: con(18),
      classes: [row("fighter", 2)],
      dieRoll: 5,
    });
    const mage = getLevelUpHitPoints({
      classId: "mage",
      newLevel: 3,
      kit: null,
      conHpAdj: con(18),
      classes: [row("mage", 2)],
      dieRoll: 3,
    });
    expect(fighter.conBonus).toBe(4);
    expect(mage.conBonus).toBe(2);
  });

  it("does not cap Constitution penalties", () => {
    const result = getLevelUpHitPoints({
      classId: "mage",
      newLevel: 2,
      kit: null,
      conHpAdj: con(3),
      classes: [row("mage", 1)],
      dieRoll: 4,
    });
    expect(result.conBonus).toBe(-2);
    expect(result.gain).toBe(2);
  });

  it("never yields less than 1 hit point", () => {
    expect(
      getLevelUpHitPoints({
        classId: "mage",
        newLevel: 2,
        kit: null,
        conHpAdj: con(4),
        classes: [row("mage", 1)],
        dieRoll: 1,
      }).gain
    ).toBe(1);
  });

  // PHB L7975-7988: the die is divided by the number of classes (min 1),
  // the Constitution bonus is split separately.
  it("divides die and Constitution bonus between multiclass classes", () => {
    const fighterMage = [row("fighter", 4), row("mage", 4)];
    expect(
      getLevelUpHitPoints({
        classId: "mage",
        newLevel: 5,
        kit: null,
        conHpAdj: con(18),
        classes: fighterMage,
        dieRoll: 3,
      })
    ).toMatchObject({ conBonus: 4, divisor: 2, gain: 3 });

    expect(
      getLevelUpHitPoints({
        classId: "mage",
        newLevel: 5,
        kit: null,
        conHpAdj: con(16),
        classes: fighterMage,
        dieRoll: 1,
      }).gain
    ).toBe(2);
  });

  it("divides fixed hit points between multiclass classes too", () => {
    expect(
      getLevelUpHitPoints({
        classId: "thief",
        newLevel: 11,
        kit: null,
        conHpAdj: 0,
        classes: [row("fighter", 9), row("thief", 10)],
      }).gain
    ).toBe(1);
  });

  it("uses the kit's hit die", () => {
    const input = { classId: "fighter", newLevel: 2, conHpAdj: 0, classes: [row("fighter", 1)] };
    expect(getLevelUpHitPoints({ ...input, kit: null }).die).toBe(10);
    expect(getLevelUpHitPoints({ ...input, kit: "barbarian" }).die).toBe(12);
    expect(getLevelUpHitPoints({ ...input, kit: "barbarian", dieRoll: 12 }).gain).toBe(12);
  });

  it("grants no hit points while a dual-class character's new class is dormant", () => {
    const classes = [row("cleric", 5, { switch_level: 5 }), row("fighter", 4)];
    expect(
      getLevelUpHitPoints({ classId: "fighter", newLevel: 5, kit: null, conHpAdj: 2, classes })
    ).toMatchObject({ mode: "none", gain: 0 });

    const awake = [row("cleric", 5, { switch_level: 5 }), row("fighter", 5)];
    expect(
      getLevelUpHitPoints({
        classId: "fighter",
        newLevel: 6,
        kit: null,
        conHpAdj: 2,
        classes: awake,
        dieRoll: 7,
      })
    ).toMatchObject({ mode: "roll", divisor: 1, gain: 9 });
  });

  it("rejects a roll outside the die", () => {
    const input = { classId: "thief", newLevel: 5, kit: null, conHpAdj: 0, classes: thief(4) };
    expect(() => getLevelUpHitPoints({ ...input, dieRoll: 0 })).toThrow();
    expect(() => getLevelUpHitPoints({ ...input, dieRoll: 7 })).toThrow();
    expect(() => getLevelUpHitPoints({ ...input, dieRoll: 2.5 })).toThrow();
  });

  it("reports the die but no gain while the roll is still missing", () => {
    expect(
      getLevelUpHitPoints({
        classId: "thief",
        newLevel: 5,
        kit: null,
        conHpAdj: 0,
        classes: thief(4),
      })
    ).toMatchObject({ mode: "roll", die: 6, gain: null });
  });
});

describe("getPendingLevelUps", () => {
  const xpFor = (classId: "thief" | "fighter", level: number) => getXpThreshold(classId, level);

  it("is empty while the XP do not reach the next level", () => {
    expect(getPendingLevelUps([row("thief", 3, { xp_current: xpFor("thief", 4) - 1 })])).toEqual(
      []
    );
  });

  it("offers one level at a time even with XP for several", () => {
    const thief = row("thief", 3, { xp_current: xpFor("thief", 6) });
    expect(getPendingLevelUps([thief])).toEqual([
      { classRowId: thief.id, classId: "thief", fromLevel: 3, toLevel: 4 },
    ]);
  });

  it("lists every class that is ready, in a stable order", () => {
    const fighter = row("fighter", 2, { id: "b", xp_current: xpFor("fighter", 3) });
    const thief = row("thief", 2, { id: "a", xp_current: xpFor("thief", 3) });
    expect(getPendingLevelUps([fighter, thief]).map((p) => p.classId)).toEqual([
      "thief",
      "fighter",
    ]);
  });

  it("ignores inactive classes", () => {
    expect(
      getPendingLevelUps([row("thief", 2, { is_active: false, xp_current: xpFor("thief", 5) })])
    ).toEqual([]);
  });
});

describe("skill points per level (THIEF-001)", () => {
  it("gives thieves 30 points for all skills and bards 15 for their three", () => {
    expect(getLevelUpSkillPoints("thief")).toMatchObject({
      points: 30,
      maxPerSkill: 15,
      cap: 95,
    });
    expect(getLevelUpSkillPoints("thief")?.skills).toHaveLength(7);
    expect(getLevelUpSkillPoints("bard")).toMatchObject({
      points: 15,
      skills: ["climbWalls", "detectNoise", "readLanguages"],
    });
    expect(getLevelUpSkillPoints("fighter")).toBeNull();
  });

  const thiefRules = getLevelUpSkillPoints("thief")!;
  const current = {
    pickLocks: 40,
    findTraps: 30,
    moveSilently: 85,
    hideInShadows: 95,
    climbWalls: 70,
    detectNoise: 20,
    readLanguages: 10,
  };

  it("accepts a full, valid allocation", () => {
    expect(
      validateSkillAllocation(
        current,
        { pickLocks: 15, findTraps: 10, moveSilently: 5 },
        thiefRules
      )
    ).toEqual({ valid: true, remaining: 0, errors: [] });
  });

  it("accepts leftover points (e.g. for Pick Pockets, not tracked in the app)", () => {
    expect(validateSkillAllocation(current, { pickLocks: 10 }, thiefRules)).toMatchObject({
      valid: true,
      remaining: 20,
    });
  });

  it("rejects more than 15 points on one skill", () => {
    expect(validateSkillAllocation(current, { pickLocks: 16 }, thiefRules).errors).toContainEqual({
      skill: "pickLocks",
      reason: "maxPerSkill",
    });
  });

  it("rejects a final value above 95%", () => {
    expect(
      validateSkillAllocation(current, { moveSilently: 11 }, thiefRules).errors
    ).toContainEqual({ skill: "moveSilently", reason: "cap" });
    expect(validateSkillAllocation(current, { hideInShadows: 0 }, thiefRules).valid).toBe(true);
  });

  it("rejects negative points, skills outside the class and overspending", () => {
    const bard = getLevelUpSkillPoints("bard")!;
    expect(validateSkillAllocation(current, { pickLocks: -5 }, thiefRules).errors).toContainEqual({
      skill: "pickLocks",
      reason: "negative",
    });
    expect(validateSkillAllocation(current, { pickLocks: 5 }, bard).errors).toContainEqual({
      skill: "pickLocks",
      reason: "notAllowed",
    });
    expect(
      validateSkillAllocation(current, { pickLocks: 15, findTraps: 15, detectNoise: 5 }, thiefRules)
    ).toMatchObject({ valid: false, remaining: -5 });
  });
});

describe("buildLevelUpSummary", () => {
  const kinds = (changes: LevelUpChange[]) => changes.map((c) => c.kind);
  const find = <K extends LevelUpChange["kind"]>(changes: LevelUpChange[], kind: K) =>
    changes.filter((c): c is Extract<LevelUpChange, { kind: K }> => c.kind === kind);

  const summary = (
    classes: CharacterClassRow[],
    classRowId: string,
    extra: Partial<Parameters<typeof buildLevelUpSummary>[0]> = {}
  ) =>
    buildLevelUpSummary({
      character: { level: classes[0].level, priesthood: null },
      classes,
      classRowId,
      epicItems: [],
      ...extra,
    });

  it("lists THAC0, saves, backstab and the new proficiency slot for a thief 8 → 9", () => {
    const changes = summary([row("thief", 8)], "thief-row");

    expect(find(changes, "thac0")).toEqual([{ kind: "thac0", before: 17, after: 16 }]);
    expect(find(changes, "save").length).toBeGreaterThan(0);
    expect(find(changes, "backstab")).toEqual([{ kind: "backstab", before: 3, after: 4 }]);
    expect(find(changes, "nwpSlots")).toEqual([{ kind: "nwpSlots", before: 4, after: 5 }]);
  });

  it("has no combat changes but a followers note for a thief 9 → 10", () => {
    const changes = summary([row("thief", 9)], "thief-row");

    expect(kinds(changes)).not.toContain("thac0");
    expect(kinds(changes)).not.toContain("save");
    expect(find(changes, "note")).toContainEqual({ kind: "note", note: "followers" });
    expect(find(changes, "note")).toContainEqual({ kind: "note", note: "fixedHpNext" });
  });

  it("shows the extra attacks of a fighter 6 → 7", () => {
    expect(find(summary([row("fighter", 6)], "fighter-row"), "attacks")).toEqual([
      { kind: "attacks", before: "1", after: "3/2" },
    ]);
  });

  it("shows spell slots, turn undead and new granted powers for a cleric 4 → 5", () => {
    const changes = summary([row("cleric", 4)], "cleric-row", {
      character: { level: 4, priesthood: "light" },
    });

    expect(find(changes, "spellSlots").length).toBe(1);
    expect(find(changes, "turnUndead").length).toBeGreaterThan(0);
    expect(find(changes, "grantedPower").map((c) => c.power.id)).toEqual(["light-charm"]);
  });

  it("starts turning undead for a paladin 2 → 3 and spellcasting for a ranger 7 → 8", () => {
    expect(find(summary([row("paladin", 2)], "paladin-row"), "turnUndead").length).toBeGreaterThan(
      0
    );
    expect(find(summary([row("ranger", 7)], "ranger-row"), "spellSlots").length).toBe(1);
  });

  it("takes THAC0 only from the new class while a dual-class character is dormant", () => {
    const classes = [row("fighter", 9, { switch_level: 9 }), row("thief", 4)];
    const changes = summary(classes, "thief-row");
    // Fighter 9 would give THAC0 12; the dormant thief 4 → 5 goes 19 → 18.
    expect(find(changes, "thac0")).toEqual([{ kind: "thac0", before: 19, after: 18 }]);
  });

  const epicItem = {
    id: "e1",
    name: "Schattentänzer",
    name_en: "Shadowdancer",
    max_damage_level: 4,
    damage_level: 0,
    simple_effects: { level_thresholds: [3, 5, 7, 9] },
  } as unknown as EpicItemRow;

  it("announces the epic item stage unlocked by the new level", () => {
    const changes = summary([row("thief", 8)], "thief-row", {
      character: { level: 8, priesthood: null },
      epicItems: [epicItem],
    });
    expect(find(changes, "epicUnlock")).toEqual([
      {
        kind: "epicUnlock",
        itemName: "Schattentänzer",
        itemNameEn: "Shadowdancer",
        before: 3,
        after: 4,
      },
    ]);
  });

  it("also names stages the stale character level had not unlocked yet", () => {
    const changes = summary([row("thief", 8)], "thief-row", {
      character: { level: 1, priesthood: null },
      epicItems: [epicItem],
    });
    expect(find(changes, "epicUnlock")[0]).toMatchObject({ before: 0, after: 4 });
  });
});
