// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

vi.mock("server-only", () => ({}));

const { PLAY_DESKTOP_GRID_CLASS } = await import("./play-mode");

const gridColumns = (className: string) =>
  className.split(/\s+/).filter((c) => /grid-cols-/.test(c));

describe("play mode desktop grid", () => {
  // Regression: `1fr` means minmax(auto, 1fr) — a wide panel stretched its
  // column past the viewport, so an 800px tablet had to zoom out. Percent
  // columns plus the gap overflowed as well.
  it("lets both columns shrink below their content width", () => {
    const columns = gridColumns(PLAY_DESKTOP_GRID_CLASS);

    expect(columns.length).toBeGreaterThan(0);
    for (const column of columns) {
      const tracks = column.match(/\[(.*)\]/)?.[1].split("_") ?? [];
      expect(tracks.length, column).toBe(2);
      expect(
        tracks.every((track) => track.startsWith("minmax(0,")),
        column
      ).toBe(true);
      expect(column).not.toMatch(/%/);
    }
  });

  it("keeps the phone layout below the sm breakpoint", () => {
    expect(PLAY_DESKTOP_GRID_CLASS.split(/\s+/)).toEqual(
      expect.arrayContaining(["hidden", "sm:grid"])
    );
  });

  // Inside the half-width grid column these panels must not assume the full
  // width at `sm` — six 18/00 values don't fit into ~340px.
  it.each([
    ["play-checks-panel.tsx", "sm:grid-cols-6"],
    ["play-combat-panel.tsx", "sm:grid-cols-4"],
  ])("%s widens its inner grid only from lg on", (file, smClass) => {
    const source = readFileSync(path.join(__dirname, file), "utf8");
    expect(source).not.toContain(smClass);
    expect(source).toContain(smClass.replace("sm:", "lg:"));
  });
});
