import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { applyLevelUp, buildLevelUpPlan } from "./apply-level-up";

const classes = [
  { id: "thief-row", class_id: "thief", level: 8, is_active: true },
  { id: "fighter-row", class_id: "fighter", level: 9, is_active: true },
];

describe("buildLevelUpPlan", () => {
  it("raises the class level, adds the hit points to the stored maximum and syncs characters.level", () => {
    const plan = buildLevelUpPlan({
      character: { id: "c1", hp_max: 40, thief_pick_locks: 50, thief_find_traps: 20 },
      classes,
      classRowId: "thief-row",
      hpGain: 5,
      skillAllocation: { pickLocks: 15, findTraps: 10 },
    });

    expect(plan).toEqual({
      characterId: "c1",
      classRowId: "thief-row",
      toLevel: 9,
      hpMaxAfter: 45,
      characterLevelAfter: 9,
      thiefSkillUpdates: { thief_pick_locks: 65, thief_find_traps: 30 },
    });
  });

  it("uses the highest active class level for characters.level", () => {
    const plan = buildLevelUpPlan({
      character: { id: "c1", hp_max: 40 },
      classes: [
        { id: "thief-row", class_id: "thief", level: 4, is_active: true },
        { id: "fighter-row", class_id: "fighter", level: 6, is_active: true },
      ],
      classRowId: "thief-row",
      hpGain: 3,
      skillAllocation: {},
    });
    expect(plan.characterLevelAfter).toBe(6);
    expect(plan.thiefSkillUpdates).toEqual({});
  });
});

function fakeSupabase(failTable?: string) {
  const updates: { table: string; values: Record<string, unknown>; id: string }[] = [];
  const client = {
    from: (table: string) => ({
      update: (values: Record<string, unknown>) => ({
        eq: (_column: string, id: string) => {
          updates.push({ table, values, id });
          return Promise.resolve({
            error: table === failTable ? { message: `${table} failed` } : null,
          });
        },
      }),
    }),
  };
  return { client: client as unknown as SupabaseClient, updates };
}

const plan = {
  characterId: "c1",
  classRowId: "thief-row",
  toLevel: 9,
  hpMaxAfter: 45,
  characterLevelAfter: 9,
  thiefSkillUpdates: { thief_pick_locks: 65 },
};

describe("applyLevelUp", () => {
  it("writes the class level and the character fields", async () => {
    const { client, updates } = fakeSupabase();

    await expect(applyLevelUp(client, plan)).resolves.toEqual({ ok: true, errors: [] });
    expect(updates).toContainEqual({
      table: "character_classes",
      values: { level: 9 },
      id: "thief-row",
    });
    expect(updates).toContainEqual({
      table: "characters",
      values: { hp_max: 45, level: 9, thief_pick_locks: 65 },
      id: "c1",
    });
  });

  it("reports failures instead of throwing", async () => {
    const { client } = fakeSupabase("characters");
    const result = await applyLevelUp(client, plan);
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(["characters failed"]);
  });

  it("never touches the current hit points", async () => {
    const { client, updates } = fakeSupabase();
    await applyLevelUp(client, plan);
    expect(updates.every((u) => !("hp_current" in u.values))).toBe(true);
  });
});
