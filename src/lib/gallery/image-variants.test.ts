import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createImageVariants,
  fitWithin,
  GALLERY_FULL_MAX,
  GALLERY_THUMB_MAX,
} from "./image-variants";

describe("fitWithin", () => {
  it("scales a landscape image by its width", () => {
    expect(fitWithin(4032, 3024, 2560)).toEqual({ width: 2560, height: 1920 });
  });

  it("scales a portrait image by its height", () => {
    expect(fitWithin(3024, 4032, 640)).toEqual({ width: 480, height: 640 });
  });

  it("never upscales", () => {
    expect(fitWithin(800, 600, 2560)).toEqual({ width: 800, height: 600 });
  });
});

describe("createImageVariants", () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubCanvas(blobType = "image/webp") {
    const sizes: { width: number; height: number; type?: string; quality?: number }[] = [];
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: vi.fn(), imageSmoothingQuality: "low" }),
      toBlob(cb: (b: Blob | null) => void, type?: string, quality?: number) {
        sizes.push({ width: this.width, height: this.height, type, quality });
        cb(new Blob(["x"], { type: blobType }));
      },
    };
    vi.spyOn(document, "createElement").mockImplementation(() => canvas as never);
    return sizes;
  }

  it("renders a 2560 px full image and a 640 px thumb as WebP", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 4032, height: 3024, close: vi.fn() })
    );
    const sizes = stubCanvas();

    const variants = await createImageVariants(
      new File(["x"], "szene.jpg", { type: "image/jpeg" })
    );

    expect(GALLERY_FULL_MAX).toBe(2560);
    expect(GALLERY_THUMB_MAX).toBe(640);
    expect(variants.width).toBe(2560);
    expect(variants.height).toBe(1920);
    expect(variants.full.type).toBe("image/webp");
    expect(variants.thumb.type).toBe("image/webp");
    expect(sizes.map((s) => [s.width, s.height, s.type])).toEqual([
      [2560, 1920, "image/webp"],
      [640, 480, "image/webp"],
    ]);
    vi.restoreAllMocks();
  });

  it("fails with the file name when the browser cannot decode the image", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("decode")));
    await expect(
      createImageVariants(new File(["x"], "szene.heic", { type: "image/heic" }))
    ).rejects.toThrow("szene.heic");
  });

  it("fails when the browser cannot encode WebP", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 100, height: 100, close: vi.fn() })
    );
    stubCanvas("image/png"); // Safari < 14 falls back to PNG
    await expect(
      createImageVariants(new File(["x"], "alt.png", { type: "image/png" }))
    ).rejects.toThrow("alt.png");
    vi.restoreAllMocks();
  });
});
