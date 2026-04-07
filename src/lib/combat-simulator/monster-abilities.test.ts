import { describe, it, expect } from "vitest";
import { parseSpecialAttacks, parseSpecialDefenses } from "./monster-abilities";

describe("parseSpecialAttacks", () => {
  it("parses regeneration with explicit HP", () => {
    const result = parseSpecialAttacks("Regeneration 3 HP/Runde");
    expect(result).toContainEqual({ type: "regeneration", regenPerRound: 3 });
  });

  it("parses regeneration without number (defaults to 3)", () => {
    const result = parseSpecialAttacks("Regeneration");
    expect(result).toContainEqual({ type: "regeneration", regenPerRound: 3 });
  });

  it("parses poison (German: Gift)", () => {
    const result = parseSpecialAttacks("Gift (20 Schaden bei fehlgeschlagenem Rettungswurf)");
    expect(result).toContainEqual({
      type: "poison",
      poisonDamage: 20,
      poisonSavePenalty: 0,
    });
  });

  it("parses poison (English)", () => {
    const result = parseSpecialAttacks("Poison bite");
    expect(result).toContainEqual(expect.objectContaining({ type: "poison" }));
  });

  it("parses paralysis (German: Lähmung)", () => {
    const result = parseSpecialAttacks("Berührung verursacht Lähmung 6 Runden");
    expect(result).toContainEqual({ type: "paralysis", paralysisDuration: 6 });
  });

  it("parses paralysis without duration (defaults to 4)", () => {
    const result = parseSpecialAttacks("Paralysis touch");
    expect(result).toContainEqual({ type: "paralysis", paralysisDuration: 4 });
  });

  it("parses fear aura", () => {
    const result = parseSpecialAttacks("Furchtaura im Umkreis von 10m");
    expect(result).toContainEqual({ type: "fear" });
  });

  it("parses level drain", () => {
    const result = parseSpecialAttacks("2 Stufen Stufenverlust pro Treffer");
    expect(result).toContainEqual({ type: "level_drain", drainLevels: 2 });
  });

  it("parses level drain without number (defaults to 1)", () => {
    const result = parseSpecialAttacks("Level Drain");
    expect(result).toContainEqual({ type: "level_drain", drainLevels: 1 });
  });

  it("parses multiple abilities", () => {
    const result = parseSpecialAttacks("Gift, Lähmung, Furcht");
    expect(result.length).toBe(3);
    expect(result.map((a) => a.type)).toEqual(
      expect.arrayContaining(["poison", "paralysis", "fear"])
    );
  });

  it("returns empty for no abilities", () => {
    const result = parseSpecialAttacks("Normaler Nahkampfangriff");
    expect(result).toEqual([]);
  });
});

describe("parseSpecialDefenses", () => {
  it("parses fire immunity", () => {
    const result = parseSpecialDefenses("Immun gegen Feuer");
    expect(result).toContainEqual({ type: "immunity", element: "fire" });
  });

  it("parses cold immunity (English)", () => {
    const result = parseSpecialDefenses("Immune to cold");
    expect(result).toContainEqual({ type: "immunity", element: "cold" });
  });

  it("parses magic weapon requirement (+2)", () => {
    const result = parseSpecialDefenses("+2 Waffe oder besser nötig");
    expect(result).toContainEqual({ type: "requires_magic_weapon", weaponBonus: 2 });
  });

  it("parses generic magic weapon requirement", () => {
    const result = parseSpecialDefenses("Nur durch magische Waffe verwundbar");
    expect(result).toContainEqual({ type: "requires_magic_weapon", weaponBonus: 1 });
  });

  it("parses fire resistance", () => {
    const result = parseSpecialDefenses("Feuerresistenz");
    expect(result).toContainEqual({ type: "resistance", element: "fire" });
  });

  it("parses multiple defenses", () => {
    const result = parseSpecialDefenses("Immun gegen Feuer, +1 Waffe nötig, Kälteresistenz");
    expect(result.length).toBe(3);
  });

  it("returns empty for no defenses", () => {
    const result = parseSpecialDefenses("Keine besonderen Verteidigungen");
    expect(result).toEqual([]);
  });
});
