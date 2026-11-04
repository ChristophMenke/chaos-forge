import { describe, it, expect, vi } from "vitest";
import { uploadGalleryFiles, type GalleryUploadDeps } from "./upload";

const file = (name: string) => new File(["x"], name, { type: "image/jpeg" });
const variants = { full: new Blob(["f"]), thumb: new Blob(["t"]), width: 10, height: 8 };

function makeDeps(
  overrides: Partial<GalleryUploadDeps<{ images: string[] }>> = {}
): GalleryUploadDeps<{ images: string[] }> {
  return {
    createVariants: vi.fn().mockResolvedValue(variants),
    prepare: vi.fn(async (count: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: `id${i}`,
        imagePath: `id${i}.webp`,
        imageToken: `it${i}`,
        thumbPath: `id${i}-thumb.webp`,
        thumbToken: `tt${i}`,
      }))
    ),
    upload: vi.fn().mockResolvedValue(undefined),
    register: vi.fn(async (items: { id: string }[]) => ({ images: items.map((i) => i.id) })),
    ...overrides,
  };
}

describe("uploadGalleryFiles", () => {
  it("uploads both variants per file and registers all in selection order", async () => {
    const deps = makeDeps();
    const progress = vi.fn();

    const result = await uploadGalleryFiles([file("a.jpg"), file("b.jpg")], deps, progress);

    expect(deps.prepare).toHaveBeenCalledWith(2);
    expect(deps.upload).toHaveBeenCalledWith("id0.webp", "it0", variants.full);
    expect(deps.upload).toHaveBeenCalledWith("id0-thumb.webp", "tt0", variants.thumb);
    expect(deps.register).toHaveBeenCalledTimes(1);
    expect(deps.register).toHaveBeenCalledWith([
      { id: "id0", width: 10, height: 8 },
      { id: "id1", width: 10, height: 8 },
    ]);
    expect(result.failed).toEqual([]);
    expect(progress.mock.calls.map((c) => c[0])).toEqual([
      { done: 0, total: 2, current: "a.jpg" },
      { done: 1, total: 2, current: "b.jpg" },
      { done: 2, total: 2, current: null },
    ]);
  });

  it("keeps going when one file fails to decode or upload", async () => {
    const deps = makeDeps({
      createVariants: vi
        .fn()
        .mockRejectedValueOnce(new Error("decode"))
        .mockResolvedValue(variants),
      upload: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("network"))
        .mockResolvedValue(undefined),
    });

    const result = await uploadGalleryFiles([file("a.heic"), file("b.jpg"), file("c.jpg")], deps);

    expect(result.failed).toEqual(["a.heic", "c.jpg"]);
    expect(deps.register).toHaveBeenCalledWith([{ id: "id1", width: 10, height: 8 }]);
  });

  it("does not register anything when every file fails", async () => {
    const deps = makeDeps({ createVariants: vi.fn().mockRejectedValue(new Error("decode")) });
    const result = await uploadGalleryFiles([file("a.heic")], deps);
    expect(deps.register).not.toHaveBeenCalled();
    expect(result).toEqual({ registered: null, failed: ["a.heic"] });
  });

  it("reports files the server could not find after the upload as failed", async () => {
    const deps = makeDeps({
      register: vi.fn().mockResolvedValue({ images: ["id0"], failedIds: ["id1"] }),
    });
    const result = await uploadGalleryFiles([file("a.jpg"), file("b.jpg")], deps);
    expect(result.failed).toEqual(["b.jpg"]);
  });
});
