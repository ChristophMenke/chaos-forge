import { describe, it, expect } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("allows 20 requests per minute per player, then resets", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 20; i++) expect(checkRateLimit("rl-a", t0 + i)).toBe(true);
    expect(checkRateLimit("rl-a", t0 + 100)).toBe(false);
    expect(checkRateLimit("rl-b", t0 + 100)).toBe(true);
    expect(checkRateLimit("rl-a", t0 + 60_100)).toBe(true);
  });
});
