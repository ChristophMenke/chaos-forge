import { describe, it, expect } from "vitest";
import { levelUpChanges } from "./undo-changes";

describe("levelUpChanges", () => {
  it("covers the class level, hit points, character level and thief skills", () => {
    const changes = levelUpChanges(
      {
        characterId: "c1",
        classRowId: "cc1",
        toLevel: 5,
        hpMaxAfter: 31,
        characterLevelAfter: 5,
        thiefSkillUpdates: { thief_pick_locks: 45 },
      },
      {
        classLevel: 4,
        hp_max: 25,
        level: 4,
        thief: { thief_pick_locks: 35, thief_climb_walls: 80 },
      }
    );
    expect(changes).toEqual([
      { table: "character_classes", key: { id: "cc1" }, before: { level: 4 }, after: { level: 5 } },
      {
        table: "characters",
        key: { id: "c1" },
        before: { hp_max: 25, level: 4, thief_pick_locks: 35 },
        after: { hp_max: 31, level: 5, thief_pick_locks: 45 },
      },
    ]);
  });
});
