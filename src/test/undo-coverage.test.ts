/**
 * Guard: every database write under "own characters" records an undo step
 * (or is a documented exception), and every undo label has a translation.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import de from "../../messages/de.json";
import en from "../../messages/en.json";

const ROOT = join(__dirname, "..", "..");
const SCOPE = [
  "src/components/character-sheet",
  "src/components/play-mode",
  "src/components/epic-equipment",
  "src/components/effects",
  "src/lib/effects",
  "src/lib/hooks/use-character-effects.ts",
  "src/lib/level-up",
];

/** Files that write but deliberately record nothing themselves. */
const EXCEPTIONS: Record<string, string> = {
  "src/components/play-mode/send-gold-dialog.tsx": "touches another character + notification",
  "src/components/play-mode/send-item-dialog.tsx": "touches another character + notification",
  "src/components/character-sheet/share-dialog.tsx": "sharing is not undoable",
  "src/lib/effects/effects-api.ts": "I/O layer; useCharacterEffects records",
  "src/lib/level-up/apply-level-up.ts": "I/O layer; sheet and play mode record onApplied",
  "src/lib/hooks/use-debounced-row-write.ts": "callers record in onWritten",
};

function files(path: string): string[] {
  const full = join(ROOT, path);
  if (statSync(full).isFile()) return [full];
  return readdirSync(full).flatMap((name) => files(join(path, name)));
}

const sources = SCOPE.flatMap(files)
  .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
  .map((f) => ({ path: relative(ROOT, f), text: readFileSync(f, "utf8") }));

const WRITE = /\.from\(\s*["'`][a-z_]+["'`]\s*\)\s*\.(insert|update|upsert|delete)\(/;

describe("undo coverage", () => {
  it("records undo steps wherever own character data is written", () => {
    const missing = sources
      .filter(({ text }) => WRITE.test(text.replace(/\s+/g, " ")))
      .filter(({ text }) => !/useUndo\(|record(Changes|Db|Draft|Row)?\(|undo\?\.record/.test(text))
      .map(({ path }) => path)
      .filter((path) => !(path in EXCEPTIONS));
    expect(missing).toEqual([]);
  });

  it("translates every undo label", () => {
    const keys = new Set<string>();
    // Labels as `label: {…}`, as first argument of record…(), or passed on as a
    // positional `{ key: "…", values: … }` object; ternaries may test a property.
    const pattern =
      /(?:label:\s*|record(?:Changes|Db)?\(\s*|(?=\{\s*key:\s*(?:[\w.]+\s*\?\s*)?"\w+"(?:\s*:\s*"\w+")?,\s*values:))\{\s*key:\s*(?:[\w.]+\s*\?\s*)?"(\w+)"(?:\s*:\s*"(\w+)")?/g;
    for (const { text } of [
      ...sources,
      ...files("src/components/undo").map((f) => ({ text: readFileSync(f, "utf8") })),
    ]) {
      for (const m of text.matchAll(pattern)) {
        keys.add(m[1]);
        if (m[2]) keys.add(m[2]);
      }
    }
    expect(keys.size).toBeGreaterThan(20);
    const missing = [...keys].filter((k) => !(k in de.undo.labels) || !(k in en.undo.labels));
    expect(missing).toEqual([]);
  });
});
