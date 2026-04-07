import { describe, it, expect } from "vitest";
import { inferCharacterRole, inferMonsterRole, zoneFromRole } from "./roles";
import type { SimSpell } from "./types";

const healSpell: SimSpell = {
  name: "Cure Light Wounds",
  level: 1,
  type: "priest",
  castingTime: 5,
  savingThrow: "none",
  category: "heal",
  targetMode: "ally",
  estimatedDamage: null,
  duration: 0,
  counters: [],
  conditions: [],
};

const fireballSpell: SimSpell = {
  name: "Fireball",
  level: 3,
  type: "wizard",
  castingTime: 3,
  savingThrow: "spell",
  category: "aoe_damage",
  targetMode: "zone_aoe",
  estimatedDamage: { count: 6, sides: 6, bonus: 0 },
  duration: 0,
  counters: [],
  conditions: [],
};

describe("inferCharacterRole", () => {
  it("wizard → artillery", () => {
    expect(inferCharacterRole(["wizard"], 10, [])).toBe("artillery");
  });

  it("priest with heal → support", () => {
    expect(inferCharacterRole(["priest"], 5, [healSpell])).toBe("support");
  });

  it("priest without heal → striker", () => {
    expect(inferCharacterRole(["priest"], 5, [fireballSpell])).toBe("striker");
  });

  it("warrior with AC <= 3 → tank", () => {
    expect(inferCharacterRole(["warrior"], 2, [])).toBe("tank");
  });

  it("warrior with AC > 3 → striker", () => {
    expect(inferCharacterRole(["warrior"], 5, [])).toBe("striker");
  });

  it("rogue → striker", () => {
    expect(inferCharacterRole(["rogue"], 6, [])).toBe("striker");
  });

  it("multiclass fighter/wizard → artillery (wizard takes priority)", () => {
    expect(inferCharacterRole(["warrior", "wizard"], 3, [])).toBe("artillery");
  });
});

describe("inferMonsterRole", () => {
  it("monster with spells → artillery", () => {
    expect(inferMonsterRole(5, 4, false, ["fireball", "lightning bolt"])).toBe("artillery");
  });

  it("monster with heal spells → support", () => {
    expect(inferMonsterRole(5, 4, false, ["cure light wounds"])).toBe("support");
  });

  it("monster with ranged attack → artillery", () => {
    expect(inferMonsterRole(5, 4, true, [])).toBe("artillery");
  });

  it("heavily armored high-HD monster → tank", () => {
    expect(inferMonsterRole(0, 10, false, [])).toBe("tank");
  });

  it("basic monster → striker", () => {
    expect(inferMonsterRole(6, 2, false, [])).toBe("striker");
  });
});

describe("zoneFromRole", () => {
  it("tank → melee", () => expect(zoneFromRole("tank")).toBe("melee"));
  it("striker → melee", () => expect(zoneFromRole("striker")).toBe("melee"));
  it("artillery → ranged", () => expect(zoneFromRole("artillery")).toBe("ranged"));
  it("support → ranged", () => expect(zoneFromRole("support")).toBe("ranged"));
});
