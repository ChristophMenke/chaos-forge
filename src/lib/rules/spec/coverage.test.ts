/**
 * Coverage Meta-Test
 *
 * Verifies that every rule marked as "implemented" has:
 *   1. At least one implementation file that exists
 *   2. At least one test file that exists
 *   3. Every listed implementationFunction is actually called in the test files
 *
 * Rules marked as "missing" appear as it.todo() for visibility.
 * Rules marked as "partial" are tested for existing implementation but flagged.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import {
  CHARACTER_CREATION_RULES,
  getRuleSummary,
  getRulesByChapter,
} from "./character-creation-rules";

const RULES_DIR = resolve(__dirname, "..");

/** Cache for test file contents to avoid repeated reads */
const testFileContentCache = new Map<string, string>();

function getTestFileContent(relativePath: string): string {
  if (testFileContentCache.has(relativePath)) {
    return testFileContentCache.get(relativePath)!;
  }
  const fullPath = resolve(RULES_DIR, relativePath);
  if (!existsSync(fullPath)) return "";
  const content = readFileSync(fullPath, "utf-8");
  testFileContentCache.set(relativePath, content);
  return content;
}

describe("PHB Character Creation Rules — Coverage", () => {
  it("catalogs at least 80 rules", () => {
    expect(CHARACTER_CREATION_RULES.length).toBeGreaterThanOrEqual(80);
  });

  it("summary counts are consistent", () => {
    const summary = getRuleSummary();
    expect(summary.implemented + summary.partial + summary.missing).toBe(summary.total);
  });

  it("every chapter has at least one rule", () => {
    const chapters = getRulesByChapter();
    // 9 distinct PHB chapters: ch1-ch9 (multiclass/thief are part of ch3-classes)
    expect(chapters.size).toBeGreaterThanOrEqual(9);
  });

  it("rule IDs are unique", () => {
    const ids = CHARACTER_CREATION_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe("Implemented rules have implementation + test files", () => {
    const implementedRules = CHARACTER_CREATION_RULES.filter((r) => r.status === "implemented");

    for (const rule of implementedRules) {
      it(`${rule.id}: ${rule.description.slice(0, 60)}`, () => {
        // Must have at least one implementation file
        expect(rule.implementationFiles.length).toBeGreaterThan(0);

        // All listed implementation files must exist
        for (const file of rule.implementationFiles) {
          const filePath = resolve(RULES_DIR, file);
          expect(existsSync(filePath), `Implementation file missing: ${file}`).toBe(true);
        }

        // Must have at least one test file
        expect(rule.testFiles.length).toBeGreaterThan(0);

        // All listed test files must exist
        for (const file of rule.testFiles) {
          const filePath = resolve(RULES_DIR, file);
          expect(existsSync(filePath), `Test file missing: ${file}`).toBe(true);
        }

        // Must have at least one scenario
        expect(rule.scenarios.length).toBeGreaterThan(0);
      });
    }
  });

  describe("Implemented functions are actually tested", () => {
    const implementedRules = CHARACTER_CREATION_RULES.filter(
      (r) => r.status === "implemented" && r.implementationFunctions.length > 0
    );

    for (const rule of implementedRules) {
      for (const fn of rule.implementationFunctions) {
        it(`${rule.id}: function "${fn}" is called in test files`, () => {
          const testContents = rule.testFiles.map((f) => getTestFileContent(f));
          const allTestContent = testContents.join("\n");

          expect(
            allTestContent.includes(fn),
            `Function "${fn}" (rule ${rule.id}) not found in test files: ${rule.testFiles.join(", ")}`
          ).toBe(true);
        });
      }
    }
  });

  describe("Every implemented rule ID is referenced in test files", () => {
    const implementedRules = CHARACTER_CREATION_RULES.filter((r) => r.status === "implemented");

    for (const rule of implementedRules) {
      it(`${rule.id}: referenced in tests`, () => {
        const testContents = rule.testFiles.map((f) => getTestFileContent(f));
        const allTestContent = testContents.join("\n");

        expect(
          allTestContent.includes(rule.id),
          `Rule ID "${rule.id}" not found in test files: ${rule.testFiles.join(", ")}. ` +
            `Add "${rule.id}" to a describe() or it() block in the test file.`
        ).toBe(true);
      });
    }
  });

  describe("Partial rules have some implementation", () => {
    const partialRules = CHARACTER_CREATION_RULES.filter((r) => r.status === "partial");

    if (partialRules.length === 0) {
      it("no partial rules — all fully implemented", () => {
        expect(partialRules).toHaveLength(0);
      });
    } else {
      for (const rule of partialRules) {
        it(`${rule.id} [PARTIAL]: ${rule.description.slice(0, 60)}`, () => {
          // Partial rules should have at least a note explaining the gap
          expect(rule.notes).toBeTruthy();
        });
      }
    }
  });

  describe("Missing rules (TODOs)", () => {
    const missingRules = CHARACTER_CREATION_RULES.filter((r) => r.status === "missing");

    if (missingRules.length === 0) {
      it("no missing rules — all implemented or partial", () => {
        expect(missingRules).toHaveLength(0);
      });
    } else {
      for (const rule of missingRules) {
        it.todo(`${rule.id}: ${rule.description.slice(0, 80)}`);
      }
    }
  });

  describe("Summary", () => {
    it("prints coverage summary", () => {
      const summary = getRuleSummary();
      const pct = Math.round((summary.implemented / summary.total) * 100);

      console.log("\n--- PHB Character Creation Rules Coverage ---");
      console.log(`Total:       ${summary.total}`);
      console.log(`Implemented: ${summary.implemented} (${pct}%)`);
      console.log(`Partial:     ${summary.partial}`);
      console.log(`Missing:     ${summary.missing}`);
      console.log("---------------------------------------------\n");

      expect(summary.total).toBeGreaterThan(0);
    });
  });
});
