import { describe, it, expect } from "vitest";
import { collectBackupImages } from "./images";

const BASE = "https://proj.supabase.co";
const pub = (bucket: string, path: string) => `${BASE}/storage/v1/object/public/${bucket}/${path}`;

describe("collectBackupImages", () => {
  it("collects avatars and session images from all four image columns", () => {
    const images = collectBackupImages(
      {
        characters: [{ avatar_url: pub("avatars", "user-1/char-1.webp?t=123") }],
        profiles: [{ avatar_url: pub("profile-avatars", "user-1/profile.webp?t=9") }],
        chronicle_npcs: [{ avatar_url: pub("npc-avatars", "npc-1.webp") }],
        sessions: [{ image_url: pub("session-images", "s-1.webp") }],
      },
      BASE
    );

    expect(images).toEqual([
      {
        bucket: "avatars",
        path: "user-1/char-1.webp",
        url: pub("avatars", "user-1/char-1.webp?t=123"),
      },
      {
        bucket: "profile-avatars",
        path: "user-1/profile.webp",
        url: pub("profile-avatars", "user-1/profile.webp?t=9"),
      },
      { bucket: "npc-avatars", path: "npc-1.webp", url: pub("npc-avatars", "npc-1.webp") },
      { bucket: "session-images", path: "s-1.webp", url: pub("session-images", "s-1.webp") },
    ]);
  });

  it("decodes encoded path segments for the archive path", () => {
    const [image] = collectBackupImages(
      { chronicle_npcs: [{ avatar_url: pub("npc-avatars", "Gro%C3%9Fer%20Ork.webp") }] },
      BASE
    );
    expect(image.path).toBe("Großer Ork.webp");
  });

  it("skips empty, foreign, broken and non-storage URLs", () => {
    expect(
      collectBackupImages(
        {
          characters: [
            { avatar_url: null },
            { avatar_url: "" },
            { avatar_url: "https://example.com/storage/v1/object/public/avatars/x.webp" },
            { avatar_url: "not a url" },
            { avatar_url: "/images/avatars/elf-wizard.webp" },
            { avatar_url: `${BASE}/rest/v1/characters` },
          ],
        },
        BASE
      )
    ).toEqual([]);
  });

  it("lists the same file only once", () => {
    const url = pub("avatars", "user-1/char-1.webp");
    expect(
      collectBackupImages({ characters: [{ avatar_url: url }, { avatar_url: `${url}?t=2` }] }, BASE)
    ).toHaveLength(1);
  });

  it("copes with tables missing from the backup", () => {
    expect(collectBackupImages({}, BASE)).toEqual([]);
  });
});
