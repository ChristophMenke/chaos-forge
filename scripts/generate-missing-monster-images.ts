/**
 * Gemini-Imagen-Generator für Monster ohne Bild.
 *
 * Für jedes Seed-Monster mit `image_url IS NULL` wird ein neues Bild im
 * Stil der MM-Compendium-Illustrationen (Wasserfarben + Tintenlinie auf
 * weißem Hintergrund) via Imagen 4 generiert und als WebP im
 * `monster-images`-Bucket abgelegt.
 *
 * Scope: nur Monster ohne Bild. Monster die bereits ein .png oder .webp
 * haben, werden übersprungen — die Kosten für eine komplette Neu-
 * Generierung (~130 Bilder) wären zu hoch für den Ertrag.
 *
 * Sicherheits-Garantien:
 * - `is_custom = true` wird hart gefiltert und niemals angefasst.
 * - Idempotent: Monster mit gesetzter `image_url` werden übersprungen.
 * - Pro erfolgreicher Generierung wird direkt ein Report-Eintrag geschrieben,
 *   damit Abbrüche mittendrin keinen Fortschritt verlieren.
 *
 * Run: npx tsx scripts/generate-missing-monster-images.ts
 *      npx tsx scripts/generate-missing-monster-images.ts --limit=5  (Test-Batch)
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import path from "path";
import dotenv from "dotenv";
import { generateImage } from "../src/lib/gemini/generate-image";
import type { MonsterRow } from "../src/lib/supabase/types";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

// ─── Paths ────────────────────────────────────────────────────────────

const SNAPSHOT_DIR = path.resolve(__dirname, "..", "ressources", "compendium-snapshot");
const REPORT_PATH = path.join(SNAPSHOT_DIR, "gemini-generation-report.md");

// ─── Prompt building ──────────────────────────────────────────────────

/**
 * Build an Imagen prompt that matches the visual style of the
 * Monstrous Manual compendium illustrations: watercolor + ink line art
 * on a plain white background, painterly and detailed, classic early-1990s
 * TSR / Wizards of the Coast fantasy art aesthetic.
 *
 * IMPORTANT: Do NOT pass narrative prose to Imagen — long free-text
 * descriptions cause the model to render the sentence literally into
 * the image as captions or labels. Only pass the creature name and a
 * short list of visual attributes if needed.
 *
 * Name-disambiguation: when the English name is a common word that could
 * also be a human name or an everyday object ("Ray", "Spider", "Sprite"),
 * Imagen sometimes generates a photo of a person or an unrelated thing.
 * Including the German name as a second signal and tagging the creature
 * explicitly as a non-human D&D monster steers the model toward the
 * intended subject.
 */
export function buildImagePrompt(monster: MonsterRow): string {
  const englishName = monster.name_en ?? monster.name;
  const germanName = monster.name;
  const creatureLabel =
    germanName && englishName && germanName !== englishName
      ? `${englishName} (German: ${germanName})`
      : englishName;

  return [
    `A single Advanced Dungeons & Dragons fantasy monster, a ${creatureLabel}, depicted in the exact visual style of the 1995 AD&D 2nd Edition Monstrous Manual by TSR.`,
    "Subject is a non-human D&D creature, NOT a person, NOT a photograph, NOT a portrait.",
    "Medium: watercolor washes over ink line art, painterly brushwork, crisp black outlines, muted earthy colors, soft shading.",
    "Composition: three-quarter side view, single creature centred on a plain pure-white background, no environment, no props, no other creatures, no humans.",
    "Strict prohibitions: absolutely no text, no captions, no labels, no letters, no words, no typography, no borders, no frames, no logos, no watermarks, no signatures, no photographic realism.",
    "Aesthetic: Tony DiTerlizzi, Larry Elmore, Jeff Easley, Tony Szczudlo — classic late-1980s / early-1990s TSR fantasy illustration.",
  ].join(" ");
}

// ─── Main ─────────────────────────────────────────────────────────────

interface GenerationReportEntry {
  id: string;
  name: string;
  outcome: "generated" | "skipped" | "error";
  reason?: string;
  old_image_url?: string | null;
  new_image_url?: string;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const parsedLimit = limitArg ? parseInt(limitArg.split("=")[1], 10) : NaN;
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : Number.POSITIVE_INFINITY;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
    process.exit(1);
  }
  if (!process.env.GOOGLE_API_KEY) {
    console.error("GOOGLE_API_KEY missing in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // Fetch every seed monster that has no image at all. Monsters with any
  // existing image (WebP from the compendium ingest or legacy PNG from an
  // earlier seed) are left alone — regenerating them would cost too much
  // for the benefit.
  console.log("Lade Zielmonster aus DB (image_url IS NULL)...");
  const { data: allSeed, error } = await supabase
    .from("monsters")
    .select("*")
    .eq("is_custom", false)
    .is("image_url", null);
  if (error) {
    console.error("DB fetch failed:", error.message);
    process.exit(1);
  }
  const targets = (allSeed as MonsterRow[]) ?? [];
  const work = targets.slice(0, Math.min(targets.length, limit));
  console.log(`  ${targets.length} Monster ohne Bild (Limit: ${work.length})`);

  const report: GenerationReportEntry[] = [];

  for (let i = 0; i < work.length; i++) {
    const monster = work[i];
    const progress = `[${i + 1}/${work.length}]`;
    process.stdout.write(`${progress} ${monster.name}... `);

    try {
      const prompt = buildImagePrompt(monster);
      const webpBuffer = await generateImage(prompt, { width: 512, height: 640, quality: 85 });

      const storagePath = `${monster.id}.webp`;
      const { error: uploadErr } = await supabase.storage
        .from("monster-images")
        .upload(storagePath, webpBuffer, { contentType: "image/webp", upsert: true });
      if (uploadErr) throw new Error(`upload failed: ${uploadErr.message}`);

      const { data: urlData } = supabase.storage.from("monster-images").getPublicUrl(storagePath);
      // Cache-buster so CDN + <Image> pick up the fresh bytes.
      const newUrl = `${urlData.publicUrl}?v=${Date.now()}`;

      const oldImageUrl = monster.image_url;

      const { error: updateErr } = await supabase
        .from("monsters")
        .update({ image_url: newUrl })
        .eq("id", monster.id);
      if (updateErr) throw new Error(`db update failed: ${updateErr.message}`);

      // Clean up old storage objects if the old image_url pointed at a
      // different path (e.g. a legacy *.png file).
      if (oldImageUrl && !oldImageUrl.includes(storagePath)) {
        const match = oldImageUrl.match(/\/monster-images\/([^?]+)/);
        if (match) {
          const oldPath = match[1];
          if (oldPath !== storagePath) {
            await supabase.storage.from("monster-images").remove([oldPath]);
          }
        }
      }

      report.push({
        id: monster.id,
        name: monster.name,
        outcome: "generated",
        old_image_url: oldImageUrl,
        new_image_url: newUrl,
      });
      process.stdout.write(`OK (${(webpBuffer.length / 1024).toFixed(1)} KB)\n`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      report.push({ id: monster.id, name: monster.name, outcome: "error", reason: msg });
      process.stdout.write(`ERROR: ${msg.slice(0, 120)}\n`);
    }

    // Persist the report after every iteration so a crash doesn't
    // lose progress. Rate-limit a bit so we don't hammer Imagen.
    writeReport(report);
    await new Promise((r) => setTimeout(r, 300));
  }

  const ok = report.filter((r) => r.outcome === "generated").length;
  const failed = report.filter((r) => r.outcome === "error").length;
  console.log("");
  console.log(`✓ ${ok} neu generiert, ${failed} Fehler`);
  console.log(`✓ Report: ${REPORT_PATH}`);
}

function writeReport(report: GenerationReportEntry[]): void {
  const ok = report.filter((r) => r.outcome === "generated");
  const errs = report.filter((r) => r.outcome === "error");
  const lines = [
    `# Monster Image Generation Report (Gemini Imagen 4)`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `## Summary`,
    ``,
    `- **${ok.length}** Monster mit neuem Imagen-WebP`,
    `- **${errs.length}** Fehler`,
    ``,
    `## Erfolgreich generiert`,
    ``,
    ...ok.map((r) => `- ${r.name} (\`${r.id}\`)`),
    ``,
  ];
  if (errs.length > 0) {
    lines.push("## Fehler", "");
    errs.forEach((e) => lines.push(`- ${e.name}: ${e.reason}`));
  }
  writeFileSync(REPORT_PATH, lines.join("\n"), "utf-8");
}

const isCli = typeof require !== "undefined" && require.main === module;
if (isCli) {
  main().catch((err) => {
    console.error("Generation fehlgeschlagen:", err);
    process.exit(1);
  });
}
