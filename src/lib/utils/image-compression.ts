/**
 * Client-side image compression using Canvas API.
 * Resizes large photos (e.g. iPhone 48MP) to fit within size constraints
 * before upload to avoid hitting API body-size limits.
 */

export interface CompressionOptions {
  /** Maximum width or height in pixels. Default: 1920 */
  maxDimension?: number;
  /** JPEG quality 0-1. Default: 0.85 */
  quality?: number;
  /** Maximum resulting file size in bytes. Default: 8 MB */
  maxSizeBytes?: number;
}

const DEFAULT_MAX_DIMENSION = 1920;
const DEFAULT_QUALITY = 0.85;
const DEFAULT_MAX_SIZE_BYTES = 8 * 1024 * 1024;

/**
 * Compresses an image File/Blob if it exceeds the size limit.
 * Returns the original file unchanged if it's already small enough,
 * or if it's not an image (e.g. PDF).
 */
export async function compressImageIfNeeded(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxDimension = DEFAULT_MAX_DIMENSION,
    quality = DEFAULT_QUALITY,
    maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  } = options;

  // Skip non-image files (e.g. PDFs)
  if (!file.type.startsWith("image/")) return file;

  // Skip if already small enough
  if (file.size <= maxSizeBytes) return file;

  // Load the image
  const img = await loadImage(file);

  // Compute scaled dimensions
  const { width, height } = scaleDimensions(img.width, img.height, maxDimension);

  // Draw to canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // Canvas unavailable — fall back to original
    return file;
  }
  ctx.drawImage(img, 0, 0, width, height);

  // Convert to JPEG blob
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });

  if (!blob) return file;

  // If still too large, retry with lower quality (floor at 0.3)
  // Steps: 0.85 → 0.70 → 0.55 → 0.40 → 0.30, then stop.
  // If still oversized at 0.3, the API's per-file cap will surface a clear error.
  if (blob.size > maxSizeBytes && quality > 0.3) {
    return compressImageIfNeeded(file, {
      ...options,
      quality: Math.max(0.3, quality - 0.15),
    });
  }

  // Return as File (preserve original name, switch extension to .jpg)
  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
}

function scaleDimensions(
  origWidth: number,
  origHeight: number,
  maxDimension: number
): { width: number; height: number } {
  if (origWidth <= maxDimension && origHeight <= maxDimension) {
    return { width: origWidth, height: origHeight };
  }
  const ratio = origWidth / origHeight;
  if (origWidth >= origHeight) {
    return { width: maxDimension, height: Math.round(maxDimension / ratio) };
  }
  return { width: Math.round(maxDimension * ratio), height: maxDimension };
}
