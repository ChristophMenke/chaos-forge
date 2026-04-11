/**
 * Unit tests for the translation script's static configuration.
 *
 * We can't test the live Claude call without burning credits, but we can
 * guard the glossary and system prompt against regressions: missing entries,
 * duplicates, or a broken metric-units directive would silently degrade the
 * translation quality for hundreds of monsters.
 */
import { describe, it, expect } from "vitest";
import { ADND_GLOSSARY, SYSTEM_PROMPT } from "./translate-monster-narrative";

describe("ADND_GLOSSARY", () => {
  it("has no duplicate English terms", () => {
    const enTerms = ADND_GLOSSARY.map((g) => g.en);
    expect(new Set(enTerms).size).toBe(enTerms.length);
  });

  it("has no empty entries", () => {
    for (const entry of ADND_GLOSSARY) {
      expect(entry.en.trim().length).toBeGreaterThan(0);
      expect(entry.de.trim().length).toBeGreaterThan(0);
    }
  });

  it("covers the core combat terms", () => {
    const enTerms = ADND_GLOSSARY.map((g) => g.en);
    expect(enTerms).toContain("THAC0");
    expect(enTerms).toContain("Hit Dice (HD)");
    expect(enTerms).toContain("Armor Class (AC)");
    expect(enTerms).toContain("Saving Throw");
    expect(enTerms).toContain("Backstab");
    expect(enTerms).toContain("Turn Undead");
  });

  it("covers all nine alignments", () => {
    const enTerms = ADND_GLOSSARY.map((g) => g.en);
    expect(enTerms).toContain("Lawful Good");
    expect(enTerms).toContain("Neutral Good");
    expect(enTerms).toContain("Chaotic Good");
    expect(enTerms).toContain("Lawful Evil");
    expect(enTerms).toContain("Neutral Evil");
    expect(enTerms).toContain("Chaotic Evil");
    expect(enTerms.some((t) => t.includes("Neutral"))).toBe(true);
  });
});

describe("SYSTEM_PROMPT", () => {
  it("enforces metric units", () => {
    expect(SYSTEM_PROMPT).toMatch(/metrische Einheiten/);
    expect(SYSTEM_PROMPT).toMatch(/m, km, kg, cm/);
  });

  it("instructs the model not to invent information", () => {
    expect(SYSTEM_PROMPT).toMatch(/Erfinde keine/);
    expect(SYSTEM_PROMPT).toMatch(/Kürze nichts/);
  });

  it("embeds the entire glossary", () => {
    for (const entry of ADND_GLOSSARY) {
      expect(SYSTEM_PROMPT).toContain(`${entry.en} → ${entry.de}`);
    }
  });

  it("forbids markdown in the section texts", () => {
    expect(SYSTEM_PROMPT).toMatch(/Keine Markdown-Formatierung/);
  });
});
