import { describe, it, expect } from "vitest";
import { estimateTokens, resolveBook, trimText, chunkText, BOOK_MAPPING } from "./chunking";

describe("Rulebook Chunking", () => {
  describe("estimateTokens", () => {
    it("estimates ~1 token per 4 characters", () => {
      expect(estimateTokens("abcd")).toBe(1);
      expect(estimateTokens("abcde")).toBe(2);
      expect(estimateTokens("")).toBe(0);
    });

    it("handles longer text", () => {
      const text = "a".repeat(6000);
      expect(estimateTokens(text)).toBe(1500);
    });
  });

  describe("resolveBook", () => {
    it("resolves Players Handbook", () => {
      const result = resolveBook("Players Handbook.txt");
      expect(result).toEqual({ slug: "phb", title: "Players Handbook" });
    });

    it("resolves Complete Fighter's Handbook from full filename", () => {
      const result = resolveBook(
        "TSR Inc - AD&D 2nd Edition - PHBR01 - The Complete Fighter's Handbook_djvu.txt"
      );
      expect(result).toEqual({
        slug: "phbr01",
        title: "Complete Fighter's Handbook",
      });
    });

    it("resolves Wizard's Spell Compendium Volume 3", () => {
      const result = resolveBook(
        "TSR Inc - AD&D 2nd Edition - Wizards Spell Compendium Volume 3_djvu.txt"
      );
      expect(result).toEqual({
        slug: "wsc3",
        title: "Wizard's Spell Compendium Vol. 3",
      });
    });

    it("resolves Book of Artifacts", () => {
      const result = resolveBook("TSR Inc - AD&D 2nd Edition - Book of Artifacts_djvu.txt");
      expect(result).toEqual({ slug: "boa", title: "Book of Artifacts" });
    });

    it("returns null for unknown file", () => {
      expect(resolveBook("unknown_file.txt")).toBeNull();
    });

    it("covers all 29 books", () => {
      expect(Object.keys(BOOK_MAPPING)).toHaveLength(29);
    });
  });

  describe("trimText", () => {
    it("removes leading content before Chapter heading", () => {
      const text = [
        "TSR, Inc.",
        "Copyright 1989",
        "Special Thanks to everyone",
        "",
        "Chapter 1: Ability Scores",
        "Strength measures...",
      ].join("\n");
      const trimmed = trimText(text);
      expect(trimmed).toContain("Chapter 1: Ability Scores");
      expect(trimmed).not.toContain("Special Thanks");
    });

    it("removes leading content before Introduction", () => {
      const text = [
        "Published by TSR Inc",
        "Credits and foreword",
        "",
        "Introduction",
        "Welcome to the handbook.",
      ].join("\n");
      const trimmed = trimText(text);
      expect(trimmed).toContain("Introduction");
      expect(trimmed).not.toContain("Published by TSR");
    });

    it("removes trailing index", () => {
      const text = [
        "Chapter 1: Rules",
        "Some rules content here.",
        "",
        "Index",
        "Abilities 14",
        "Armor 23",
        "Backstab 45",
        "Combat 67",
      ].join("\n");
      const trimmed = trimText(text);
      expect(trimmed).toContain("Some rules content");
      expect(trimmed).not.toContain("Index");
      expect(trimmed).not.toContain("Backstab 45");
    });

    it("removes copyright blocks", () => {
      const text = [
        "Chapter 1: Rules",
        "Some content.",
        "TSR, Inc. All rights reserved. trademark of TSR",
        "More rules content.",
      ].join("\n");
      const trimmed = trimText(text);
      expect(trimmed).toContain("More rules content");
      expect(trimmed).not.toContain("TSR, Inc. All rights reserved");
    });

    it("preserves rules content", () => {
      const text = [
        "Chapter 1: Ability Scores",
        "Strength (STR) measures muscle power.",
        "",
        "Table 1: Strength Modifiers",
        "STR  Hit  Dmg",
        "3    -3   -1",
        "18   +1   +2",
      ].join("\n");
      const trimmed = trimText(text);
      expect(trimmed).toContain("Strength (STR)");
      expect(trimmed).toContain("Table 1:");
      expect(trimmed).toContain("18   +1   +2");
    });
  });

  describe("chunkText", () => {
    it("creates chunks within target size", () => {
      // Create text with multiple paragraphs totaling ~3000 tokens
      const paragraphs = Array.from(
        { length: 20 },
        (_, i) => `Paragraph ${i}: ${"word ".repeat(300)}`
      );
      const text = paragraphs.join("\n\n");

      const chunks = chunkText(text, "test", "Test Book");
      for (const chunk of chunks) {
        // Allow some overshoot (up to 2x target) for single-paragraph chunks
        expect(chunk.tokenCount).toBeLessThan(3000 * 1.5);
      }
      expect(chunks.length).toBeGreaterThan(1);
    });

    it("sets correct metadata on chunks", () => {
      const text = "Paragraph one content.\n\nParagraph two content.";
      const chunks = chunkText(text, "phb", "Players Handbook");

      expect(chunks[0].bookSlug).toBe("phb");
      expect(chunks[0].bookTitle).toBe("Players Handbook");
      expect(chunks[0].chunkIndex).toBe(0);
      expect(chunks[0].tokenCount).toBeGreaterThan(0);
    });

    it("assigns sequential chunk indices", () => {
      const paragraphs = Array.from(
        { length: 30 },
        (_, i) => `Section ${i}: ${"word ".repeat(200)}`
      );
      const text = paragraphs.join("\n\n");
      const chunks = chunkText(text, "phb", "Players Handbook");

      for (let i = 0; i < chunks.length; i++) {
        expect(chunks[i].chunkIndex).toBe(i);
      }
    });

    it("creates overlap between consecutive chunks", () => {
      // Create enough paragraphs to get multiple chunks
      const paragraphs = Array.from(
        { length: 30 },
        (_, i) => `Unique paragraph ${i}: ${"text ".repeat(150)}`
      );
      const text = paragraphs.join("\n\n");
      const chunks = chunkText(text, "phb", "Players Handbook");

      if (chunks.length >= 2) {
        // The end of chunk N should overlap with the start of chunk N+1
        const chunk0Lines = chunks[0].content.split("\n\n");
        const chunk1Lines = chunks[1].content.split("\n\n");
        const lastOfChunk0 = chunk0Lines[chunk0Lines.length - 1];
        // The overlap means the last paragraph(s) of chunk 0 appear at the start of chunk 1
        expect(chunk1Lines[0].trim()).toBe(lastOfChunk0.trim());
      }
    });

    it("handles empty text", () => {
      const chunks = chunkText("", "phb", "Test");
      expect(chunks).toHaveLength(0);
    });

    it("handles single short paragraph", () => {
      const chunks = chunkText("Short content.", "phb", "Test");
      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe("Short content.");
    });
  });
});
