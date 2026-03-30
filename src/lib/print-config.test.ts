import { describe, it, expect, beforeEach } from "vitest";
import {
  PRINT_SECTION_IDS,
  DEFAULT_PRINT_PREFERENCES,
  loadPrintPreferences,
  savePrintPreferences,
} from "./print-config";

describe("print-config", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("DEFAULT_PRINT_PREFERENCES", () => {
    it("contains all section IDs", () => {
      expect(DEFAULT_PRINT_PREFERENCES.sections).toHaveLength(PRINT_SECTION_IDS.length);
      for (const id of PRINT_SECTION_IDS) {
        expect(DEFAULT_PRINT_PREFERENCES.sections.find((s) => s.id === id)).toBeDefined();
      }
    });

    it("all sections are visible by default", () => {
      for (const s of DEFAULT_PRINT_PREFERENCES.sections) {
        expect(s.visible).toBe(true);
      }
    });
  });

  describe("loadPrintPreferences", () => {
    it("returns defaults when no stored data", () => {
      const prefs = loadPrintPreferences("char-1");
      expect(prefs).toEqual(DEFAULT_PRINT_PREFERENCES);
    });

    it("returns defaults for corrupt JSON", () => {
      localStorage.setItem("chaos-forge-print-char-1", "not-json");
      const prefs = loadPrintPreferences("char-1");
      expect(prefs).toEqual(DEFAULT_PRINT_PREFERENCES);
    });

    it("returns defaults for invalid structure", () => {
      localStorage.setItem("chaos-forge-print-char-1", JSON.stringify({ sections: "nope" }));
      const prefs = loadPrintPreferences("char-1");
      expect(prefs).toEqual(DEFAULT_PRINT_PREFERENCES);
    });

    it("loads stored preferences", () => {
      const stored = {
        sections: PRINT_SECTION_IDS.map((id) => ({
          id,
          visible: id !== "notes",
        })),
      };
      localStorage.setItem("chaos-forge-print-char-1", JSON.stringify(stored));
      const prefs = loadPrintPreferences("char-1");
      expect(prefs.sections.find((s) => s.id === "notes")?.visible).toBe(false);
    });

    it("appends missing sections with visible: true", () => {
      const stored = {
        sections: [{ id: "personal", visible: true }],
      };
      localStorage.setItem("chaos-forge-print-char-1", JSON.stringify(stored));
      const prefs = loadPrintPreferences("char-1");
      expect(prefs.sections).toHaveLength(PRINT_SECTION_IDS.length);
      expect(prefs.sections[0].id).toBe("personal");
      // Missing sections appended
      expect(prefs.sections.find((s) => s.id === "abilities")?.visible).toBe(true);
    });

    it("drops unknown section IDs", () => {
      const stored = {
        sections: [
          { id: "unknown_section", visible: true },
          ...PRINT_SECTION_IDS.map((id) => ({ id, visible: true })),
        ],
      };
      localStorage.setItem("chaos-forge-print-char-1", JSON.stringify(stored));
      const prefs = loadPrintPreferences("char-1");
      expect(prefs.sections).toHaveLength(PRINT_SECTION_IDS.length);
      expect(prefs.sections.find((s) => s.id === ("unknown_section" as string))).toBeUndefined();
    });

    it("preserves custom order", () => {
      const reversed = [...PRINT_SECTION_IDS].reverse();
      const stored = {
        sections: reversed.map((id) => ({ id, visible: true })),
      };
      localStorage.setItem("chaos-forge-print-char-1", JSON.stringify(stored));
      const prefs = loadPrintPreferences("char-1");
      expect(prefs.sections.map((s) => s.id)).toEqual(reversed);
    });
  });

  describe("savePrintPreferences", () => {
    it("persists to localStorage", () => {
      const prefs = {
        sections: PRINT_SECTION_IDS.map((id) => ({
          id,
          visible: id !== "combat",
        })),
      };
      savePrintPreferences("char-2", prefs);
      const raw = localStorage.getItem("chaos-forge-print-char-2");
      expect(raw).toBeTruthy();
      const loaded = JSON.parse(raw!);
      expect(loaded.sections.find((s: { id: string }) => s.id === "combat").visible).toBe(false);
    });

    it("uses character-specific key", () => {
      savePrintPreferences("char-a", DEFAULT_PRINT_PREFERENCES);
      savePrintPreferences("char-b", DEFAULT_PRINT_PREFERENCES);
      expect(localStorage.getItem("chaos-forge-print-char-a")).toBeTruthy();
      expect(localStorage.getItem("chaos-forge-print-char-b")).toBeTruthy();
    });
  });
});
