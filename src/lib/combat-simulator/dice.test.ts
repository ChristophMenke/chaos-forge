import { describe, it, expect } from "vitest";
import { createSeededRng } from "./dice";

describe("createSeededRng", () => {
  it("produces deterministic sequences with same seed", () => {
    const rng1 = createSeededRng(42);
    const rng2 = createSeededRng(42);
    const seq1 = Array.from({ length: 10 }, () => rng1.random());
    const seq2 = Array.from({ length: 10 }, () => rng2.random());
    expect(seq1).toEqual(seq2);
  });

  it("produces different sequences with different seeds", () => {
    const rng1 = createSeededRng(42);
    const rng2 = createSeededRng(99);
    const seq1 = Array.from({ length: 10 }, () => rng1.random());
    const seq2 = Array.from({ length: 10 }, () => rng2.random());
    expect(seq1).not.toEqual(seq2);
  });

  it("random() returns values in [0, 1)", () => {
    const rng = createSeededRng(123);
    for (let i = 0; i < 1000; i++) {
      const v = rng.random();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("d20() returns values in [1, 20]", () => {
    const rng = createSeededRng(456);
    const values = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const v = rng.d20();
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(20);
      values.add(v);
    }
    // Should hit most values in 1000 tries
    expect(values.size).toBeGreaterThanOrEqual(18);
  });

  it("d6() returns values in [1, 6]", () => {
    const rng = createSeededRng(789);
    for (let i = 0; i < 100; i++) {
      const v = rng.d6();
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    }
  });

  it("roll(2, 6, 3) returns values in [5, 15]", () => {
    const rng = createSeededRng(101);
    for (let i = 0; i < 100; i++) {
      const v = rng.roll(2, 6, 3);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(15);
    }
  });

  it("roll(0, 6, 5) returns bonus only", () => {
    const rng = createSeededRng(202);
    expect(rng.roll(0, 6, 5)).toBe(5);
  });
});
