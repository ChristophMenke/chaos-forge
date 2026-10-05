// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const SRC = path.resolve(__dirname, "..");
const read = (file: string) => readFileSync(path.join(SRC, file), "utf8");

// Pages compute combat values on the server; without the effects they would
// silently show the values without temporary effects.
describe("temporary effects wiring", () => {
  it.each(["app/master/page.tsx", "app/dashboard/page.tsx"])(
    "%s loads active effects and passes them to the combat computation",
    (file) => {
      const source = read(file);
      expect(source).toMatch(/from\("character_effects"\)[\s\S]*?\.is\("ended_at", null\)/);
      expect(source).toMatch(/computeCharacterCombatData\([^)]*(charEffects|effects)\s*\)/);
    }
  );

  it.each(["app/characters/[id]/play/page.tsx", "app/characters/[id]/manage/page.tsx"])(
    "%s passes the active effects",
    (file) => {
      expect(read(file)).toContain("effects={activeEffects ?? []}");
    }
  );

  // NPCs have no player who maintains effects; their pages use the default [].
  it.each(["app/master/npcs/[id]/play/page.tsx", "app/master/npcs/[id]/manage/page.tsx"])(
    "%s does not load effects",
    (file) => {
      const source = read(file);
      expect(source).not.toContain("character_effects");
      expect(source).not.toMatch(/effects=\{/);
    }
  );
});
