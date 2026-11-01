/** Columns holding public storage URLs of images uploaded by the group. */
const IMAGE_COLUMNS: Record<string, string> = {
  characters: "avatar_url",
  profiles: "avatar_url",
  chronicle_npcs: "avatar_url",
  sessions: "image_url",
};

const PUBLIC_PREFIX = "/storage/v1/object/public/";

export interface BackupImage {
  bucket: string;
  /** Object path inside the bucket, decoded, without query (cache buster). */
  path: string;
  /** URL to download from — unchanged, so the cache buster still applies. */
  url: string;
}

export type BackupTables = Record<string, Record<string, unknown>[]>;

function toImage(raw: unknown, supabaseUrl: string): BackupImage | null {
  if (typeof raw !== "string" || raw === "") return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.origin !== new URL(supabaseUrl).origin) return null;
  if (!url.pathname.startsWith(PUBLIC_PREFIX)) return null;

  const [bucket, ...rest] = url.pathname.slice(PUBLIC_PREFIX.length).split("/");
  if (!bucket || rest.length === 0) return null;
  return { bucket, path: rest.map(decodeURIComponent).join("/"), url: raw };
}

/** Every uploaded image referenced by the backed-up rows, each file once. */
export function collectBackupImages(tables: BackupTables, supabaseUrl: string): BackupImage[] {
  const seen = new Set<string>();
  const images: BackupImage[] = [];
  for (const [table, column] of Object.entries(IMAGE_COLUMNS)) {
    for (const row of tables[table] ?? []) {
      const image = toImage(row[column], supabaseUrl);
      if (!image) continue;
      const key = `${image.bucket}/${image.path}`;
      if (seen.has(key)) continue;
      seen.add(key);
      images.push(image);
    }
  }
  return images;
}
