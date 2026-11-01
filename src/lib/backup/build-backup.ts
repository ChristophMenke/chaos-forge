import { backupFileName, buildArchive, type ArchiveImage, type FailedImage } from "./archive";
import { collectBackupImages, type BackupImage, type BackupTables } from "./images";

export type BackupPhase = "data" | "images" | "zip";

interface BuildBackupOptions {
  supabaseUrl: string;
  fetchImpl?: typeof fetch;
  onProgress?: (phase: BackupPhase, done: number, total: number) => void;
  now?: Date;
}

export interface BuiltBackup {
  zip: Uint8Array;
  fileName: string;
  imageCount: number;
  failedImages: FailedImage[];
}

const PARALLEL_DOWNLOADS = 6;

/**
 * Builds the admin backup in the browser: group data from /api/admin/backup,
 * uploaded images straight from public storage, zipped with fflate. Missing
 * images are recorded, not fatal.
 */
export async function buildBackup({
  supabaseUrl,
  fetchImpl = fetch,
  onProgress = () => {},
  now = new Date(),
}: BuildBackupOptions): Promise<BuiltBackup> {
  onProgress("data", 0, 0);
  const response = await fetchImpl("/api/admin/backup", { cache: "no-store" });
  if (!response.ok) throw new Error(`Backup-Daten: HTTP ${response.status}`);
  const { generatedAt, tables } = (await response.json()) as {
    generatedAt: string;
    tables: BackupTables;
  };

  const wanted = collectBackupImages(tables, supabaseUrl);
  const images: ArchiveImage[] = [];
  const failedImages: FailedImage[] = [];
  let done = 0;
  onProgress("images", 0, wanted.length);

  async function download(image: BackupImage) {
    try {
      const res = await fetchImpl(image.url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      images.push({ ...image, data: new Uint8Array(await res.arrayBuffer()) });
    } catch (error) {
      failedImages.push({
        bucket: image.bucket,
        path: image.path,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
    onProgress("images", ++done, wanted.length);
  }

  const queue = [...wanted];
  await Promise.all(
    Array.from({ length: Math.min(PARALLEL_DOWNLOADS, queue.length) }, async () => {
      for (let image = queue.shift(); image; image = queue.shift()) await download(image);
    })
  );

  onProgress("zip", 0, 0);
  // Keep the archive order stable regardless of download timing.
  const byPath = (a: { bucket: string; path: string }, b: { bucket: string; path: string }) =>
    `${a.bucket}/${a.path}`.localeCompare(`${b.bucket}/${b.path}`);
  images.sort(byPath);
  failedImages.sort(byPath);

  const zip = buildArchive({ generatedAt, tables, images, failedImages });
  return { zip, fileName: backupFileName(now), imageCount: images.length, failedImages };
}
