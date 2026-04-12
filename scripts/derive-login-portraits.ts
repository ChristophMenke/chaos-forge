/**
 * Generate portrait (9:16 mobile) versions of the login artwork using the
 * corresponding landscape file as a strict reference. The mobile UI overlays
 * a parchment login card over the lower half, so the portrait variant
 * concentrates all characters in the upper half over a wooden tavern surface.
 *
 * Run: npx tsx scripts/derive-login-portraits.ts
 */

import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const OUT_DIR = path.resolve(__dirname, "..", "public", "images", "login");

const BASE_INSTRUCTIONS = `Using the reference image (a party of 5 heroes in a tavern), recreate the EXACT SAME scene — same five characters with identical faces, hair, skin tones, clothing, props and overall composition — but rearrange it into a TALL VERTICAL PORTRAIT aspect ratio (9:16).

CHARACTER LAYOUT (portrait):
- All 5 characters must be clearly visible and identifiable.
- They occupy the upper two-thirds of the frame, arranged in two staggered rows behind the tavern bar (three in front, two peeking over shoulders). The gnome sits on a stool/crate so his head reaches the same level as the others' shoulders.
- The BOTTOM THIRD of the frame is intentionally empty: only the polished wooden bar top with candles, mugs and scrolls. This space is reserved for a UI card overlay.

STYLE:
- Preserve the late-1990s TSR watercolor-and-ink illustration style, muted earthy palette, soft candlelit tavern lighting.
- No text, no letters, no captions, no borders, no watermarks.

Do NOT change any character's appearance.`;

const NEUTRAL_PROMPT = `${BASE_INSTRUCTIONS}

Expressions: calm, relaxed poses — the team gathered at the bar about to roll out on an adventure. Matches the reference exactly.`;

const GRIMACE_PROMPT = `${BASE_INSTRUCTIONS}

Expressions: the same silly grimaces as in the reference image — exaggerated funny faces. Preserve each character's specific expression from the reference.`;

async function generate(
  genai: GoogleGenAI,
  prompt: string,
  reference: Buffer
): Promise<Buffer> {
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/webp", data: reference.toString("base64") } },
        ],
      },
    ],
    config: { imageConfig: { aspectRatio: "9:16" } },
  });
  for (const c of response.candidates ?? []) {
    for (const p of c.content?.parts ?? []) {
      if (p.inlineData?.data) return Buffer.from(p.inlineData.data, "base64");
    }
  }
  throw new Error("No image returned");
}

async function derive(landscapeName: string, portraitName: string, prompt: string): Promise<void> {
  process.stdout.write(`${portraitName}... `);
  const landscape = readFileSync(path.join(OUT_DIR, landscapeName));
  const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });
  const raw = await generate(genai, prompt, landscape);
  const resized = await sharp(raw)
    .resize({ width: 960, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toBuffer();
  writeFileSync(path.join(OUT_DIR, portraitName), resized);
  const info = await sharp(path.join(OUT_DIR, portraitName)).metadata();
  process.stdout.write(`OK ${info.width}x${info.height}, ${(resized.length / 1024).toFixed(1)} KB\n`);
}

async function main(): Promise<void> {
  if (!process.env.GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY missing");
  await derive("login-party-landscape.webp", "login-party-portrait.webp", NEUTRAL_PROMPT);
  await derive(
    "login-party-grimace-landscape.webp",
    "login-party-grimace-portrait.webp",
    GRIMACE_PROMPT
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
