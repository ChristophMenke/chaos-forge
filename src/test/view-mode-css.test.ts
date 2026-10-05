// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { compile } from "@tailwindcss/node";

const cssPath = path.resolve(__dirname, "../app/globals.css");

async function buildUtilities(candidates: string[]): Promise<string> {
  const source = readFileSync(cssPath, "utf8");
  const compiler = await compile(source, {
    base: path.dirname(cssPath),
    from: cssPath,
    onDependency: () => {},
  });
  return compiler.build(candidates);
}

/** All rules for one utility class, in stylesheet order. */
function rulesFor(css: string, selector: string): string[] {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}[^{]*\\{`, "g")) ?? [];
}

describe("view mode breakpoint variants", () => {
  it("keeps sm width-based outside mobile mode and forces it on in desktop mode", async () => {
    const css = await buildUtilities(["sm:flex"]);
    const rules = rulesFor(css, ".sm\\:flex");

    expect(rules.some((r) => r.includes(":where(:root:not(.view-mobile) *)"))).toBe(true);
    expect(rules.some((r) => r.includes(":where(:root.view-desktop *)"))).toBe(true);
    expect(css).toMatch(/@media \(width >= 40rem\)/);
  });

  it("switches md, lg, xl and 2xl off in mobile mode without forcing them in desktop mode", async () => {
    const css = await buildUtilities(["md:grid", "lg:block", "xl:flex", "2xl:hidden"]);

    for (const selector of [".md\\:grid", ".lg\\:block", ".xl\\:flex", ".\\32 xl\\:hidden"]) {
      const rules = rulesFor(css, selector);
      expect(rules.length, selector).toBeGreaterThan(0);
      expect(
        rules.every((r) => r.includes(":where(:root:not(.view-mobile) *)")),
        selector
      ).toBe(true);
      expect(
        rules.some((r) => r.includes("view-desktop")),
        selector
      ).toBe(false);
    }
  });

  it("keeps the default breakpoint order so larger breakpoints still win", async () => {
    const css = await buildUtilities([
      "2xl:grid-cols-5",
      "lg:grid-cols-3",
      "sm:grid-cols-1",
      "xl:grid-cols-4",
      "md:grid-cols-2",
    ]);
    const order = ["sm", "md", "lg", "xl", "\\32 xl"].map((bp) =>
      css.indexOf(`.${bp}\\:grid-cols-`)
    );

    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});
