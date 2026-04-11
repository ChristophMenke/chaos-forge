/**
 * Monster-Bild-Ingest: überträgt die GIFs aus dem Compendium-Snapshot nach
 * Supabase-Storage und aktualisiert `monsters.image_url`.
 *
 * Für jeden Monster-Eintrag in der DB:
 * 1. Match: finde die passende GIF-Datei im Snapshot via normalisiertem
 *    `name_en` → `monster_key`.
 * 2. Konvertiere GIF → WebP (Quality 85, erstes Frame bei animierten GIFs).
 * 3. Upload als `monster-images/<monster_id>.webp` (upsert).
 * 4. Update `image_url` auf die Public-URL des WebP.
 * 5. Lösche das alte Storage-Objekt (falls das vorherige `image_url` auf einen
 *    anderen Pfad zeigte), damit keine Orphans akkumulieren.
 *
 * Sicherheits-Garantien:
 * - Custom-Monster (`is_custom = true`) werden hart gefiltert und niemals
 *   angefasst.
 * - Vor dem ersten Upload wird ein Backup der aktuellen `image_url`-Spalten
 *   als JSON nach `ressources/compendium-snapshot/pre-ingest-image-urls.json`
 *   geschrieben, damit ein Rollback möglich ist.
 * - Idempotent: ein zweiter Lauf überschreibt dieselben WebP-Bilder ohne
 *   Fehler und löscht keine Objekte, die bereits Teil der neuen image_url-
 *   Werte sind.
 *
 * Run: npx tsx scripts/ingest-monster-images.ts
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import dotenv from "dotenv";
import type { MonsterRow } from "../src/lib/supabase/types";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

// ─── Paths ────────────────────────────────────────────────────────────

const SNAPSHOT_DIR = path.resolve(__dirname, "..", "ressources", "compendium-snapshot");
const GIF_DIR = path.join(SNAPSHOT_DIR, "mm", "img");
const BACKUP_PATH = path.join(SNAPSHOT_DIR, "pre-ingest-image-urls.json");
const REPORT_PATH = path.join(SNAPSHOT_DIR, "image-ingest-report.md");

// ─── Helpers ──────────────────────────────────────────────────────────

function normaliseName(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

/** GIF → WebP via sharp. Animated GIFs are flattened to the first frame. */
export async function gifToWebp(gifBuffer: Buffer): Promise<Buffer> {
  return sharp(gifBuffer, { animated: false }).webp({ quality: 85 }).toBuffer();
}

export function findMatchingGif(monster: MonsterRow, gifKeys: Set<string>): string | null {
  const keyNorm = normaliseName(monster.name_en);
  if (keyNorm && gifKeys.has(keyNorm)) return keyNorm;
  const nameNorm = normaliseName(monster.name);
  if (nameNorm && gifKeys.has(nameNorm)) return nameNorm;
  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────

interface IngestReport {
  total: number;
  withNewImage: number;
  withoutMatch: number;
  skippedCustom: number;
  errors: Array<{ monster: string; error: string }>;
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
    process.exit(1);
  }

  if (!existsSync(GIF_DIR)) {
    console.error(`GIF directory not found: ${GIF_DIR}`);
    console.error("Run scripts/extract-compendium-snapshot.ts first.");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // 1. Load all non-custom monsters from DB
  console.log("Lade Monster aus DB...");
  const { data: monstersRaw, error: fetchErr } = await supabase
    .from("monsters")
    .select("*")
    .eq("is_custom", false);
  if (fetchErr) {
    console.error("DB fetch failed:", fetchErr.message);
    process.exit(1);
  }
  const monsters = (monstersRaw as MonsterRow[]) ?? [];
  console.log(`  ${monsters.length} Seed-Monster (is_custom = false)`);

  // 2. Pre-ingest backup of current image_url values
  const backup = monsters.map((m) => ({
    id: m.id,
    name: m.name,
    image_url_before: m.image_url,
  }));
  writeFileSync(BACKUP_PATH, JSON.stringify(backup, null, 2), "utf-8");
  console.log(`  Pre-Ingest-Backup: ${BACKUP_PATH}`);

  // 3. Index all available GIFs in the snapshot by normalised key
  const gifFiles = readdirSync(GIF_DIR).filter((f) => f.endsWith(".gif"));
  const gifKeys = new Set<string>();
  const gifKeyToFile = new Map<string, string>();
  for (const file of gifFiles) {
    const key = file.replace(/\.gif$/, "");
    gifKeys.add(key.toLowerCase());
    gifKeyToFile.set(key.toLowerCase(), file);
  }
  console.log(`  ${gifKeys.size} Compendium-GIFs verfügbar`);

  // 4. Process each monster
  const report: IngestReport = {
    total: monsters.length,
    withNewImage: 0,
    withoutMatch: 0,
    skippedCustom: 0,
    errors: [],
  };

  const processedRows: Array<{
    id: string;
    name: string;
    outcome: "new-webp" | "no-match" | "error";
    detail?: string;
  }> = [];

  for (let i = 0; i < monsters.length; i++) {
    const monster = monsters[i];
    const progress = `[${i + 1}/${monsters.length}]`;

    const matchedKey = findMatchingGif(monster, gifKeys);
    if (!matchedKey) {
      report.withoutMatch++;
      processedRows.push({ id: monster.id, name: monster.name, outcome: "no-match" });
      continue;
    }

    const gifFile = gifKeyToFile.get(matchedKey)!;
    const gifPath = path.join(GIF_DIR, gifFile);

    try {
      process.stdout.write(`${progress} ${monster.name}... `);
      const gifBuffer = readFileSync(gifPath);
      const webpBuffer = await gifToWebp(gifBuffer);

      // Upload to Supabase Storage (upsert: overwrites if already there)
      const storagePath = `${monster.id}.webp`;
      const { error: uploadErr } = await supabase.storage
        .from("monster-images")
        .upload(storagePath, webpBuffer, {
          contentType: "image/webp",
          upsert: true,
        });
      if (uploadErr) throw new Error(`upload failed: ${uploadErr.message}`);

      // Get the public URL and update the DB row
      const { data: urlData } = supabase.storage.from("monster-images").getPublicUrl(storagePath);
      const newUrl = urlData.publicUrl;

      const { error: updateErr } = await supabase
        .from("monsters")
        .update({ image_url: newUrl })
        .eq("id", monster.id);
      if (updateErr) throw new Error(`db update failed: ${updateErr.message}`);

      // Clean up old storage objects if the old image_url pointed at a
      // different path (e.g. *.png or *.svg from the legacy seed scripts)
      if (monster.image_url && !monster.image_url.includes(storagePath)) {
        // Extract the old path from the URL (`.../monster-images/<path>`)
        const oldMatch = monster.image_url.match(/\/monster-images\/([^?]+)/);
        if (oldMatch) {
          const oldPath = oldMatch[1];
          if (oldPath !== storagePath) {
            await supabase.storage.from("monster-images").remove([oldPath]);
          }
        }
      }

      report.withNewImage++;
      processedRows.push({ id: monster.id, name: monster.name, outcome: "new-webp" });
      process.stdout.write(`OK (${(webpBuffer.length / 1024).toFixed(1)} KB)\n`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      report.errors.push({ monster: monster.name, error: msg });
      processedRows.push({ id: monster.id, name: monster.name, outcome: "error", detail: msg });
      process.stdout.write(`ERROR: ${msg}\n`);
    }
  }

  // 5. Write the report
  const reportLines = [
    `# Monster Image Ingest Report`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `## Summary`,
    ``,
    `- **${report.withNewImage}** Monster mit neuem WebP-Bild`,
    `- **${report.withoutMatch}** Monster ohne passendes GIF im Snapshot (React-Fallback)`,
    `- **${report.errors.length}** Fehler`,
    `- **${monsters.length}** Seed-Monster insgesamt verarbeitet`,
    ``,
    `## Monster mit neuem Bild`,
    ``,
    ...processedRows
      .filter((r) => r.outcome === "new-webp")
      .map((r) => `- ${r.name} (\`${r.id}\`)`),
    ``,
    `## Monster ohne Compendium-Match`,
    ``,
    `Diese Monster nutzen den React-SVG-Fallback statt eines echten Bildes.`,
    ``,
    ...processedRows.filter((r) => r.outcome === "no-match").map((r) => `- ${r.name}`),
    ``,
  ];
  if (report.errors.length > 0) {
    reportLines.push("## Fehler", "", ...report.errors.map((e) => `- ${e.monster}: ${e.error}`));
  }
  writeFileSync(REPORT_PATH, reportLines.join("\n"), "utf-8");

  console.log(``);
  console.log(
    `✓ ${report.withNewImage} neue WebPs, ${report.withoutMatch} ohne Match, ${report.errors.length} Fehler`
  );
  console.log(`✓ Report: ${REPORT_PATH}`);
}

// Only run when invoked as a script, not when imported (e.g. by tests).
const isCli = typeof require !== "undefined" && require.main === module;
if (isCli) {
  main().catch((err) => {
    console.error("Ingest fehlgeschlagen:", err);
    process.exit(1);
  });
}
