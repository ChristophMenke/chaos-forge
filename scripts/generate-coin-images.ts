/**
 * Generate coin images for the party gold UI via Gemini Imagen API.
 *
 * Usage: npx tsx scripts/generate-coin-images.ts
 *
 * Generates 4 coin images (64x64 webp) under public/images/coins/
 */

import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import fs from "node:fs";

const ROOT = path.resolve(__dirname, "..");
const COINS_DIR = path.join(ROOT, "public/images/coins");

const MODEL = "imagen-4.0-generate-001";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateAndSave(
  prompt: string,
  outPath: string,
  opts: { width: number; height: number; aspectRatio?: string },
  retries = 2
) {
  if (fs.existsSync(outPath)) {
    console.log(`  SKIP (exists): ${path.relative(ROOT, outPath)}`);
    return;
  }

  console.log(`  Generating: ${path.relative(ROOT, outPath)} ...`);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateImages({
        model: MODEL,
        prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: opts.aspectRatio ?? "1:1",
        },
      });

      const img = response.generatedImages?.[0];
      if (!img?.image?.imageBytes) {
        const reason = img?.raiFilteredReason ?? "unknown";
        console.warn(`  WARN: No image returned (reason: ${reason})`);
        if (attempt < retries) {
          console.log(`  Retrying (${attempt + 1}/${retries})...`);
          await sleep(3000);
          continue;
        }
        return;
      }

      const rawBuffer = Buffer.from(img.image.imageBytes, "base64");

      // Resize + convert to webp
      await sharp(rawBuffer)
        .resize(opts.width, opts.height, { fit: "cover" })
        .webp({ quality: 90 })
        .toFile(outPath);

      console.log(`  OK: ${path.relative(ROOT, outPath)}`);
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < retries && (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED"))) {
        console.log(`  Rate limited, waiting 15s before retry (${attempt + 1}/${retries})...`);
        await sleep(15000);
        continue;
      }
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Coin definitions
// ---------------------------------------------------------------------------

interface CoinDef {
  name: string;
  prompt: string;
}

const COINS: CoinDef[] = [
  {
    name: "pp",
    prompt:
      "A single platinum coin seen from slightly above at an angle, silver-bluish metallic sheen, engraved crown or diamond symbol on the face, slightly worn edges showing age, dark fantasy style. Coin rests on a very dark background (nearly black with subtle purple tint). Photorealistic rendering, dramatic lighting with a cool bluish highlight. Sharp detail suitable for a 64x64 pixel icon. No text, no words, no letters, no watermarks.",
  },
  {
    name: "gp",
    prompt:
      "A single gold coin seen from slightly above at an angle, warm rich golden tone, engraved sun or dragon symbol on the face, slightly worn edges showing age, dark fantasy style. Coin rests on a very dark background (nearly black with subtle purple tint). Photorealistic rendering, dramatic lighting with a warm golden highlight. Sharp detail suitable for a 64x64 pixel icon. No text, no words, no letters, no watermarks.",
  },
  {
    name: "sp",
    prompt:
      "A single silver coin seen from slightly above at an angle, matte silver sheen, engraved crescent moon or star symbol on the face, slightly worn edges showing age, dark fantasy style. Coin rests on a very dark background (nearly black with subtle purple tint). Photorealistic rendering, dramatic lighting with a cool silver highlight. Sharp detail suitable for a 64x64 pixel icon. No text, no words, no letters, no watermarks.",
  },
  {
    name: "cp",
    prompt:
      "A single copper coin seen from slightly above at an angle, reddish-brown copper tone with green patina spots, engraved shield or hammer symbol on the face, noticeably worn and aged with patina, dark fantasy style. Coin rests on a very dark background (nearly black with subtle purple tint). Photorealistic rendering, dramatic lighting with a warm reddish highlight. Sharp detail suitable for a 64x64 pixel icon. No text, no words, no letters, no watermarks.",
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Generating Coin Images ===\n");

  fs.mkdirSync(COINS_DIR, { recursive: true });

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const coin of COINS) {
    const outPath = path.join(COINS_DIR, `${coin.name}.webp`);
    if (fs.existsSync(outPath)) {
      console.log(`  SKIP (exists): ${coin.name}.webp`);
      skipped++;
      continue;
    }
    try {
      await generateAndSave(coin.prompt, outPath, {
        width: 64,
        height: 64,
      });
      generated++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR (${coin.name}): ${msg}`);
      errors++;
    }
    // Rate limit buffer between requests
    await sleep(2000);
  }

  console.log(`\n=== Done === (generated: ${generated}, skipped: ${skipped}, errors: ${errors})`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
