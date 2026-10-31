import { describe, it, expect } from "vitest";
import { LATEST_RELEASE_ID, RELEASES } from "./releases";

describe("RELEASES", () => {
  it("has at least one release and exposes the newest as LATEST_RELEASE_ID", () => {
    expect(RELEASES.length).toBeGreaterThan(0);
    expect(LATEST_RELEASE_ID).toBe(RELEASES[0].id);
  });

  it("uses date-like ids that sort correctly as strings", () => {
    for (const release of RELEASES) {
      // A single-digit suffix keeps "2026-10-31-2" < "2026-10-31-3" true as strings.
      expect(release.id).toMatch(/^\d{4}-\d{2}-\d{2}(-[2-9])?$/);
      expect(release.date).toBe(release.id.slice(0, 10));
    }
  });

  it("has unique ids, newest first", () => {
    const ids = RELEASES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort().reverse()).toEqual(ids);
  });

  it("has German and English text for every item", () => {
    for (const release of RELEASES) {
      expect(release.items.length).toBeGreaterThan(0);
      for (const item of release.items) {
        for (const text of [item.title, item.text]) {
          expect(text.de.trim()).not.toBe("");
          expect(text.en.trim()).not.toBe("");
        }
      }
    }
  });
});
