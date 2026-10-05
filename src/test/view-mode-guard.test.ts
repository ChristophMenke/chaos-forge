// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const SRC = path.resolve(__dirname, "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

describe("view mode guards", () => {
  it("applies the stored view mode before the first paint", () => {
    const layout = readFileSync(path.join(SRC, "app/layout.tsx"), "utf8");
    expect(layout).toContain("VIEW_MODE_INIT_SCRIPT");
  });

  // Width checks in JS must go through useBreakpoint, otherwise they ignore
  // the view mode and disagree with the CSS layout.
  // Image `sizes` hints may mention widths; only matchMedia/useMediaQuery calls
  // decide layout.
  const WIDTH_QUERY_CALL = /(matchMedia|useMediaQuery)\(\s*["'`]\((min|max)-width/;

  it("has no width media queries outside the breakpoint hooks", () => {
    const allowed = new Set(["lib/hooks/use-media-query.ts", "lib/hooks/use-breakpoint.ts"]);
    const offenders = sourceFiles(SRC)
      .map((file) => path.relative(SRC, file))
      .filter((file) => !allowed.has(file))
      .filter((file) => WIDTH_QUERY_CALL.test(readFileSync(path.join(SRC, file), "utf8")));

    expect(offenders).toEqual([]);
  });
});
