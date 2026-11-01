import { describe, it, expect } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { backupFileName, buildArchive } from "./archive";

const GENERATED_AT = "2026-11-01T12:00:00.000Z";

function unpack(zip: Uint8Array) {
  return unzipSync(zip);
}

describe("buildArchive", () => {
  const zip = buildArchive({
    generatedAt: GENERATED_AT,
    tables: {
      characters: [{ id: "c1", name: "Nowi" }],
      spells: [],
    },
    images: [{ bucket: "avatars", path: "u1/c1.webp", data: new Uint8Array([1, 2, 3]) }],
    failedImages: [{ bucket: "npc-avatars", path: "n1.webp", reason: "HTTP 404" }],
  });
  const files = unpack(zip);

  it("stores each table as data/<table>.json", () => {
    expect(JSON.parse(strFromU8(files["data/characters.json"]))).toEqual([
      { id: "c1", name: "Nowi" },
    ]);
    expect(JSON.parse(strFromU8(files["data/spells.json"]))).toEqual([]);
  });

  it("stores images under images/<bucket>/<path> unchanged", () => {
    expect([...files["images/avatars/u1/c1.webp"]]).toEqual([1, 2, 3]);
  });

  it("writes a manifest with row counts and missing images", () => {
    const manifest = JSON.parse(strFromU8(files["manifest.json"]));
    expect(manifest).toMatchObject({
      app: "Chaos Forge",
      generatedAt: GENERATED_AT,
      rowCounts: { characters: 1, spells: 0 },
      imageCount: 1,
      failedImages: [{ bucket: "npc-avatars", path: "n1.webp", reason: "HTTP 404" }],
    });
  });

  it("explains contents and gaps in LIESMICH.txt", () => {
    const readme = strFromU8(files["LIESMICH.txt"]);
    expect(readme).toContain("characters");
    expect(readme).toMatch(/Monster/);
    expect(readme).toMatch(/auth\.users/);
    expect(readme).toMatch(/keine automatische Wiederherstellung/i);
  });
});

describe("backupFileName", () => {
  it("uses the group's calendar day (Europe/Berlin)", () => {
    expect(backupFileName(new Date("2026-10-31T23:30:00Z"))).toBe(
      "chaos-forge-backup-2026-11-01.zip"
    );
    expect(backupFileName(new Date("2026-10-31T12:00:00Z"))).toBe(
      "chaos-forge-backup-2026-10-31.zip"
    );
  });
});
