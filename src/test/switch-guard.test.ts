// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const SRC = path.resolve(__dirname, "..");
const SWITCH = path.join("components", "ui", "switch.tsx");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx$/.test(name) && !/\.test\.tsx$/.test(name) ? [full] : [];
  });
}

describe("on/off switches", () => {
  // A hand-made switch in Settings used bg-muted for the track and
  // bg-background for the knob — on the dark theme both are nearly black, so
  // nobody saw there was a switch. All switches go through <Switch>, whose
  // off state is styled (and tested) to stay visible.
  it("are only built by components/ui/switch.tsx", () => {
    const offenders = sourceFiles(SRC)
      .map((file) => path.relative(SRC, file))
      .filter((file) => file !== SWITCH)
      .filter((file) => /role=["{]+\s*"?switch/.test(readFileSync(path.join(SRC, file), "utf8")));

    expect(offenders).toEqual([]);
  });
});
