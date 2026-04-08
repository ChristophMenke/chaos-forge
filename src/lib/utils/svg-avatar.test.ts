import { describe, it, expect } from "vitest";
import {
  nameToHue,
  monsterAvatar,
  npcAvatar,
  MONSTER_SILHOUETTES,
  NPC_SILHOUETTES,
} from "./svg-avatar";

describe("svg-avatar", () => {
  describe("nameToHue", () => {
    it("returns a number between 0 and 359", () => {
      const names = ["Arguille", "Bok", "Troll", "Goblin", "X", ""];
      for (const name of names) {
        const hue = nameToHue(name);
        expect(hue).toBeGreaterThanOrEqual(0);
        expect(hue).toBeLessThan(360);
      }
    });

    it("is deterministic — same name always produces same hue", () => {
      expect(nameToHue("Arguille")).toBe(nameToHue("Arguille"));
      expect(nameToHue("Bok")).toBe(nameToHue("Bok"));
    });

    it("produces different hues for different names", () => {
      const hues = new Set(["Arguille", "Bok", "Braxton", "Calden", "Elera"].map(nameToHue));
      expect(hues.size).toBeGreaterThan(1);
    });
  });

  describe("monsterAvatar", () => {
    it("returns a data URI SVG string", () => {
      const uri = monsterAvatar("Troll", "L");
      expect(uri).toMatch(/^data:image\/svg\+xml,/);
      expect(uri).toContain("T"); // First letter of name
    });

    it("is deterministic — same inputs produce same output", () => {
      expect(monsterAvatar("Goblin", "S")).toBe(monsterAvatar("Goblin", "S"));
    });

    it("uses different silhouettes for different sizes", () => {
      const tiny = monsterAvatar("Test", "T");
      const gargantuan = monsterAvatar("Test", "G");
      expect(tiny).not.toBe(gargantuan);
    });

    it("falls back to Medium silhouette for unknown size", () => {
      const unknown = monsterAvatar("Test", "X");
      const medium = monsterAvatar("Test", "M");
      expect(unknown).toBe(medium);
    });
  });

  describe("npcAvatar", () => {
    it("returns a data URI SVG string", () => {
      const uri = npcAvatar("Arguille", "normal");
      expect(uri).toMatch(/^data:image\/svg\+xml,/);
      expect(uri).toContain("A"); // First letter
    });

    it("is deterministic — same inputs produce same output", () => {
      expect(npcAvatar("Bok", "normal")).toBe(npcAvatar("Bok", "normal"));
    });

    it("uses different silhouettes for different tiers", () => {
      const normal = npcAvatar("Test", "normal");
      const advanced = npcAvatar("Test", "advanced");
      const character = npcAvatar("Test", "character");
      expect(normal).not.toBe(advanced);
      expect(advanced).not.toBe(character);
      expect(normal).not.toBe(character);
    });

    it("produces different colors for different names", () => {
      const a = npcAvatar("Arguille", "normal");
      const b = npcAvatar("Bok", "normal");
      expect(a).not.toBe(b);
    });
  });

  describe("silhouette paths", () => {
    it("MONSTER_SILHOUETTES has all 6 sizes", () => {
      expect(Object.keys(MONSTER_SILHOUETTES)).toEqual(
        expect.arrayContaining(["T", "S", "M", "L", "H", "G"])
      );
    });

    it("NPC_SILHOUETTES has all 3 tiers", () => {
      expect(Object.keys(NPC_SILHOUETTES)).toEqual(
        expect.arrayContaining(["normal", "advanced", "character"])
      );
    });

    it("all silhouette paths are non-empty SVG path strings", () => {
      for (const path of Object.values(MONSTER_SILHOUETTES)) {
        expect(path).toMatch(/^M\d/);
        expect(path.length).toBeGreaterThan(10);
      }
      for (const path of Object.values(NPC_SILHOUETTES)) {
        expect(path).toMatch(/^M\d/);
        expect(path.length).toBeGreaterThan(10);
      }
    });
  });
});
