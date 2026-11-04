/**
 * Upload flow of the GM gallery: process every file in the browser, upload
 * both variants to signed upload URLs, then register the successful ones in a
 * single server action (which also sends the one bell notification). A failed
 * file never stops the others.
 */
import type { ImageVariants } from "./image-variants";

export interface PreparedUpload {
  id: string;
  imagePath: string;
  imageToken: string;
  thumbPath: string;
  thumbToken: string;
}

export interface RegisterItem {
  id: string;
  width: number;
  height: number;
}

export interface GalleryUploadDeps<R = unknown> {
  createVariants: (file: File) => Promise<ImageVariants>;
  prepare: (count: number) => Promise<PreparedUpload[]>;
  upload: (path: string, token: string, blob: Blob) => Promise<void>;
  register: (items: RegisterItem[]) => Promise<R & { failedIds?: string[] }>;
}

export interface UploadProgress {
  done: number;
  total: number;
  /** File currently being processed, null when finished. */
  current: string | null;
}

export interface GalleryUploadResult<R> {
  registered: R | null;
  /** Names of the files that did not make it. */
  failed: string[];
}

export async function uploadGalleryFiles<R>(
  files: File[],
  deps: GalleryUploadDeps<R>,
  onProgress: (progress: UploadProgress) => void = () => {}
): Promise<GalleryUploadResult<R>> {
  const total = files.length;
  const slots = await deps.prepare(total);
  const done: RegisterItem[] = [];
  const nameById = new Map<string, string>();
  const failed: string[] = [];

  for (const [index, file] of files.entries()) {
    onProgress({ done: index, total, current: file.name });
    const slot = slots[index];
    try {
      const variants = await deps.createVariants(file);
      await deps.upload(slot.imagePath, slot.imageToken, variants.full);
      await deps.upload(slot.thumbPath, slot.thumbToken, variants.thumb);
      done.push({ id: slot.id, width: variants.width, height: variants.height });
      nameById.set(slot.id, file.name);
    } catch (error) {
      console.error("[gallery] upload failed", file.name, error);
      failed.push(file.name);
    }
  }
  onProgress({ done: total, total, current: null });

  if (done.length === 0) return { registered: null, failed };

  const registered = await deps.register(done);
  for (const id of registered.failedIds ?? []) {
    const name = nameById.get(id);
    if (name) failed.push(name);
  }
  return { registered, failed };
}
