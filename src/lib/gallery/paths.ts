/**
 * Storage paths of the „Galerie des Chaos“. Paths are derived from the image id
 * on the server; the client never chooses them.
 */

export const GALLERY_BUCKET = "gallery-images";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const GALLERY_PATH = new RegExp(`^${UUID}(-thumb)?\\.webp$`);

export function galleryPaths(id: string): { image: string; thumb: string } {
  return { image: `${id}.webp`, thumb: `${id}-thumb.webp` };
}

/** Only `<uuid>.webp` / `<uuid>-thumb.webp` directly in the bucket. */
export function isGalleryPath(path: string): boolean {
  return GALLERY_PATH.test(path);
}

export function galleryPublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${GALLERY_BUCKET}/${path}`;
}
