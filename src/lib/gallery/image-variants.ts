/**
 * Browser-side image processing for the gallery: every photo becomes a WebP
 * full image (longest side 2560 px) and a WebP thumbnail (640 px). Supabase's
 * free tier has no image transformations, and next/image would eat into the
 * Vercel Hobby quota — so the thumbnails are files of their own.
 */

export const GALLERY_FULL_MAX = 2560;
export const GALLERY_THUMB_MAX = 640;
const FULL_QUALITY = 0.82;
const THUMB_QUALITY = 0.75;

export interface ImageVariants {
  full: Blob;
  thumb: Blob;
  /** Size of the full image. */
  width: number;
  height: number;
}

/** Scales down to fit `max` on the longest side; never upscales. */
export function fitWithin(
  width: number,
  height: number,
  max: number
): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function renderWebp(
  bitmap: ImageBitmap,
  size: { width: number; height: number },
  quality: number
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, size.width, size.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

export async function createImageVariants(file: File): Promise<ImageVariants> {
  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the EXIF orientation of phone photos.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`Bild konnte nicht gelesen werden: ${file.name}`);
  }

  try {
    const fullSize = fitWithin(bitmap.width, bitmap.height, GALLERY_FULL_MAX);
    const full = await renderWebp(bitmap, fullSize, FULL_QUALITY);
    const thumb = await renderWebp(
      bitmap,
      fitWithin(bitmap.width, bitmap.height, GALLERY_THUMB_MAX),
      THUMB_QUALITY
    );
    // Browsers without a WebP encoder silently fall back to PNG.
    if (full?.type !== "image/webp" || thumb?.type !== "image/webp") {
      throw new Error(`WebP wird von diesem Browser nicht unterstützt: ${file.name}`);
    }
    return { full, thumb, ...fullSize };
  } finally {
    bitmap.close();
  }
}
