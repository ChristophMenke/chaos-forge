import type { SupabaseClient } from "@supabase/supabase-js";
import { getHighestActiveClassLevel } from "@/lib/rules/multiclass";
import type { SkillAllocation, ThiefSkillKey } from "@/lib/rules/level-up";

/** characters columns holding the final thief skill percentages. */
export const THIEF_SKILL_COLUMNS: Record<ThiefSkillKey, string> = {
  pickLocks: "thief_pick_locks",
  findTraps: "thief_find_traps",
  moveSilently: "thief_move_silently",
  hideInShadows: "thief_hide_shadows",
  climbWalls: "thief_climb_walls",
  detectNoise: "thief_detect_noise",
  readLanguages: "thief_read_languages",
};

export interface LevelUpPlan {
  characterId: string;
  classRowId: string;
  toLevel: number;
  /** Stored hp_max after the level — current hit points stay as they are. */
  hpMaxAfter: number;
  /** characters.level kept in sync with the highest active class level (epic thresholds). */
  characterLevelAfter: number;
  thiefSkillUpdates: Record<string, number>;
}

export interface BuildLevelUpPlanInput {
  character: { id: string; hp_max: number } & Partial<Record<string, unknown>>;
  classes: { id: string; class_id: string; level: number; is_active: boolean }[];
  classRowId: string;
  hpGain: number;
  skillAllocation: SkillAllocation;
}

export function buildLevelUpPlan(input: BuildLevelUpPlanInput): LevelUpPlan {
  const row = input.classes.find((cc) => cc.id === input.classRowId);
  if (!row) throw new Error(`Unknown class row: ${input.classRowId}`);
  const toLevel = row.level + 1;
  const classesAfter = input.classes.map((cc) =>
    cc.id === row.id ? { ...cc, level: toLevel } : cc
  );

  const thiefSkillUpdates: Record<string, number> = {};
  for (const [skill, points] of Object.entries(input.skillAllocation) as [
    ThiefSkillKey,
    number,
  ][]) {
    if (!points) continue;
    const column = THIEF_SKILL_COLUMNS[skill];
    const current = Number(input.character[column] ?? 0);
    thiefSkillUpdates[column] = current + points;
  }

  return {
    characterId: input.character.id,
    classRowId: row.id,
    toLevel,
    hpMaxAfter: input.character.hp_max + input.hpGain,
    characterLevelAfter: getHighestActiveClassLevel(classesAfter, toLevel),
    thiefSkillUpdates,
  };
}

/** Writes a level-up. Thin I/O layer: collects errors instead of throwing. */
export async function applyLevelUp(
  supabase: SupabaseClient,
  plan: LevelUpPlan
): Promise<{ ok: boolean; errors: string[] }> {
  const results = await Promise.all([
    supabase.from("character_classes").update({ level: plan.toLevel }).eq("id", plan.classRowId),
    supabase
      .from("characters")
      .update({
        hp_max: plan.hpMaxAfter,
        level: plan.characterLevelAfter,
        ...plan.thiefSkillUpdates,
      })
      .eq("id", plan.characterId),
  ]);

  const errors = results
    .map((result) => result.error?.message)
    .filter((message): message is string => Boolean(message));
  return { ok: errors.length === 0, errors };
}
