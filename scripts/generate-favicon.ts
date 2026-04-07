/**
 * Generate a themed favicon for Chaos Forge using Gemini Imagen.
 *
 * Usage: npx tsx scripts/generate-favicon.ts
 *
 * Generates:
 *   - public/favicon-16x16.png
 *   - public/favicon-32x32.png
 *   - public/apple-touch-icon.png
 *   - src/app/favicon.ico
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getGenAI } from "../src/lib/gemini/client";
import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";
import pngToIco from "png-to-ico";

const PROMPT =
  "A favicon/app icon for a dark fantasy tabletop RPG character manager called 'Chaos Forge'. " +
  "Show a stylized anvil with magical arcane energy and flames around it, " +
  "dark moody background with deep purple and gold accents. " +
  "The anvil should have glowing runes carved into it. " +
  "Minimalist icon design, clean edges, works well at very small sizes (16x16 to 192x192 pixels). " +
  "No text, no letters, no words. Square composition, centered subject. " +
  "Dark fantasy style, jewel tones, magical glow effects.";

async function main() {
  console.log("Generating favicon with Gemini Imagen...");

  const genai = getGenAI();
  const response = await genai.models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt: PROMPT,
    config: { numberOfImages: 1 },
  });

  const base64 = response.generatedImages?.[0]?.image?.imageBytes;
  if (!base64) throw new Error("No image generated");

  const original = Buffer.from(base64, "base64");
  console.log("Image generated, converting to favicon formats...");

  const root = join(__dirname, "..");

  // Generate PNG sizes
  const sizes = [
    { name: "apple-touch-icon.png", size: 180, dir: "public" },
    { name: "favicon-32x32.png", size: 32, dir: "public" },
    { name: "favicon-16x16.png", size: 16, dir: "public" },
  ];

  for (const { name, size, dir } of sizes) {
    const buf = await sharp(original).resize(size, size, { fit: "cover" }).png().toBuffer();
    const path = join(root, dir, name);
    writeFileSync(path, buf);
    console.log(`  Written: ${dir}/${name} (${size}x${size})`);
  }

  // Generate ICO (contains 16x16 and 32x32)
  const ico16 = await sharp(original).resize(16, 16, { fit: "cover" }).png().toBuffer();
  const ico32 = await sharp(original).resize(32, 32, { fit: "cover" }).png().toBuffer();
  const icoBuffer = await pngToIco([ico32, ico16]);
  const icoPath = join(root, "src", "app", "favicon.ico");
  writeFileSync(icoPath, icoBuffer);
  console.log("  Written: src/app/favicon.ico");

  // Also generate a 192x192 for PWA manifest
  const pwa192 = await sharp(original).resize(192, 192, { fit: "cover" }).png().toBuffer();
  writeFileSync(join(root, "public", "icon-192x192.png"), pwa192);
  console.log("  Written: public/icon-192x192.png (192x192)");

  const pwa512 = await sharp(original).resize(512, 512, { fit: "cover" }).png().toBuffer();
  writeFileSync(join(root, "public", "icon-512x512.png"), pwa512);
  console.log("  Written: public/icon-512x512.png (512x512)");

  console.log("\nDone! Favicon files have been generated.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
