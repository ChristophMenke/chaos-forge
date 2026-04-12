/**
 * Replace ONLY Larry's appearance in the existing login party artwork —
 * keeps the composition, palette, style and every other character intact.
 *
 * Passes the existing image(s) to Gemini as the primary reference and asks it
 * to modify only the human fighter character (Larry). Saves back over the same
 * files.
 *
 * Run: npx tsx scripts/fix-larry-in-login-art.ts
 */

import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const OUT_DIR = path.resolve(__dirname, "..", "public", "images", "login");

const LARRY_EDIT_PROMPT = `Take the reference image (an adventuring party of 5 heroes in a tavern). Create a NEW version where EVERYTHING — composition, style, palette, tavern background, every other character (the tiefling woman, the elf, the gnome, the half-elf druid) — stays EXACTLY the same.

ONLY CHANGE the human male fighter character (Larry). Replace his current appearance with:

- Young adult (late 20s), clean-shaven — NOT bearded, NOT old
- Tall and confident stance (he is the tallest in the group)
- Messy tousled SILVER-GREY shoulder-length hair (windswept, unkempt) — NOT black, NOT blonde, NOT chestnut
- PIERCING LUMINOUS BRIGHT BLUE EYES that appear to glow softly — the most distinctive feature
- Handsome sharply defined face with high cheekbones
- Dark fantasy aesthetic: dark weathered leather armor with subtle silver chain accents on shoulders, a high-collared dark cloak (hood down, face fully visible)
- A longsword at his hip
- Serious, brooding, mysterious expression

PRESERVE EVERYTHING ELSE EXACTLY — do not alter the tiefling, elf, gnome, or half-elf druid. Do not change the tavern background, lighting, lanterns, props, or overall style. Keep the same late-1990s TSR watercolor-and-ink illustration aesthetic.

No text, no captions, no letters, no borders, no watermarks.`;

async function editLarry(
  genai: GoogleGenAI,
  baseImage: Buffer,
  aspectRatio: "9:16" | "16:9"
): Promise<Buffer> {
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [
      {
        role: "user",
        parts: [
          { text: LARRY_EDIT_PROMPT },
          { inlineData: { mimeType: "image/webp", data: baseImage.toString("base64") } },
        ],
      },
    ],
    config: { imageConfig: { aspectRatio } },
  });
  for (const c of response.candidates ?? []) {
    for (const p of c.content?.parts ?? []) {
      if (p.inlineData?.data) return Buffer.from(p.inlineData.data, "base64");
    }
  }
  throw new Error("No image returned by Gemini");
}

async function processImage(inName: string, aspectRatio: "9:16" | "16:9"): Promise<void> {
  const inPath = path.join(OUT_DIR, inName);
  process.stdout.write(`${inName}... `);
  const base = readFileSync(inPath);
  const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });
  const raw = await editLarry(genai, base, aspectRatio);
  const resized = await sharp(raw)
    .resize({ width: aspectRatio === "9:16" ? 960 : 1536, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  writeFileSync(inPath, resized);
  const info = await sharp(inPath).metadata();
  process.stdout.write(
    `OK ${info.width}x${info.height}, ${(resized.length / 1024).toFixed(1)} KB\n`
  );
}

async function main(): Promise<void> {
  if (!process.env.GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY missing");
  const only = process.argv[2];
  const targets: Array<[string, "9:16" | "16:9"]> = [
    ["login-party-portrait.webp", "9:16"],
    ["login-party-landscape.webp", "16:9"],
    ["login-party-grimace-portrait.webp", "9:16"],
    ["login-party-grimace-landscape.webp", "16:9"],
  ];
  const filtered = only ? targets.filter(([n]) => n.includes(only)) : targets;
  for (const [name, ratio] of filtered) await processImage(name, ratio);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
