// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const COMPONENTS = path.resolve(__dirname, "../components");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx$/.test(name) && !/\.test\.tsx$/.test(name) ? [full] : [];
  });
}

describe("modal overlays", () => {
  // `fixed inset-0` only covers the screen when no ancestor has a transform or
  // backdrop-filter. Glass cards have one, so overlays must leave the tree via
  // ModalPortal (shadcn/ui primitives in components/ui portal on their own).
  // Page-level layout pieces, never nested inside a card.
  const allowed = new Set([
    "app-nav.tsx",
    "master/master-dashboard.tsx",
    "tutorial/tutorial-overlay.tsx",
    "modal-portal.tsx",
  ]);

  it("render full-screen overlays through ModalPortal", () => {
    const offenders = sourceFiles(COMPONENTS)
      .map((file) => path.relative(COMPONENTS, file))
      .filter((file) => !file.startsWith(`ui${path.sep}`) && !allowed.has(file))
      .filter((file) => {
        const source = readFileSync(path.join(COMPONENTS, file), "utf8");
        const portaled = source.includes("<ModalPortal>") || source.includes("createPortal(");
        return source.includes("fixed inset-0") && !portaled;
      });

    expect(offenders).toEqual([]);
  });
});
