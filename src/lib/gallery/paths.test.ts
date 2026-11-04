import { describe, it, expect, vi, afterEach } from "vitest";
import { galleryPaths, galleryPublicUrl, isGalleryPath, GALLERY_BUCKET } from "./paths";

const ID = "3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b";

describe("galleryPaths", () => {
  it("derives image and thumb path from the id", () => {
    expect(galleryPaths(ID)).toEqual({ image: `${ID}.webp`, thumb: `${ID}-thumb.webp` });
  });
});

describe("isGalleryPath", () => {
  it.each([`${ID}.webp`, `${ID}-thumb.webp`])("accepts %s", (path) => {
    expect(isGalleryPath(path)).toBe(true);
  });

  it.each(["../secret.webp", `x/${ID}.webp`, `${ID}.png`, "not-a-uuid.webp", `${ID}.webp/..`, ""])(
    "rejects %s",
    (path) => {
      expect(isGalleryPath(path)).toBe(false);
    }
  );
});

describe("galleryPublicUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("builds the public storage URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    expect(GALLERY_BUCKET).toBe("gallery-images");
    expect(galleryPublicUrl(`${ID}.webp`)).toBe(
      `https://abc.supabase.co/storage/v1/object/public/gallery-images/${ID}.webp`
    );
  });
});
