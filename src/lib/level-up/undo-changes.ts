import { rowUpdate } from "@/lib/undo/changes";
import type { RowChange } from "@/lib/undo/types";
import type { LevelUpPlan } from "./apply-level-up";

export interface LevelUpBefore {
  classLevel: number;
  hp_max: number;
  level: number;
  /** Stored thief skill values (thief_* columns). */
  thief: Record<string, number>;
}

/** The two rows a saved level-up changed, for one undo step. */
export function levelUpChanges(plan: LevelUpPlan, before: LevelUpBefore): RowChange[] {
  const thiefBefore = Object.fromEntries(
    Object.keys(plan.thiefSkillUpdates).map((k) => [k, before.thief[k]])
  );
  return [
    rowUpdate(
      "character_classes",
      { id: plan.classRowId },
      { level: before.classLevel },
      { level: plan.toLevel }
    ),
    rowUpdate(
      "characters",
      { id: plan.characterId },
      { hp_max: before.hp_max, level: before.level, ...thiefBefore },
      { hp_max: plan.hpMaxAfter, level: plan.characterLevelAfter, ...plan.thiefSkillUpdates }
    ),
  ].filter((c): c is RowChange => c !== null);
}
