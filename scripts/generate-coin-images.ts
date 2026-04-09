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
      "A single ancient platinum coin photographed perfectly straight-on from directly above, face side up, the coin is centered and fills the entire square image edge to edge. Cool silver-blue metallic surface with a faint blue iridescence, deeply engraved geometric diamond pattern on the face, slightly worn raised rim. Pure macro photography, dramatic cool overhead lighting with subtle rim glow. Very dark near-black background. No people, no human figures, no faces, no silhouettes, no text, no letters, no words, no watermarks.",
  },
  {
    name: "gp",
    prompt:
      "A single ancient gold coin photographed perfectly straight-on from directly above, face side up, the coin is centered and fills the entire square image edge to edge. Rich warm golden metallic surface, deeply engraved sun or dragon crest on the face, slightly worn raised rim with aged patina. Pure macro photography, dramatic warm overhead lighting with golden rim glow. Very dark near-black background. No people, no human figures, no faces, no silhouettes, no text, no letters, no words, no watermarks.",
  },
  {
    name: "sp",
    prompt:
      "A single ancient silver coin photographed perfectly straight-on from directly above, face side up, the coin is centered and fills the entire square image edge to edge. Matte cool silver metallic surface, deeply engraved crescent moon or star on the face, slightly worn raised rim. Pure macro photography, dramatic cool silver overhead lighting with subtle highlight. Very dark near-black background. No people, no human figures, no faces, no silhouettes, no text, no letters, no words, no watermarks.",
  },
  {
    name: "cp",
    prompt:
      "A single ancient copper coin photographed perfectly straight-on from directly above, face side up, the coin is centered and fills the entire square image edge to edge. Reddish-brown copper surface with green verdigris patina in the crevices, deeply engraved shield or hammer on the face, heavily worn raised rim. Pure macro photography, dramatic warm reddish overhead lighting. Very dark near-black background. No people, no human figures, no faces, no silhouettes, no text, no letters, no words, no watermarks.",
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
