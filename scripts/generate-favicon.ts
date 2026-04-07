/**
 * Generate a themed favicon for Chaos Forge using Gemini Imagen.
 *
 * Usage: npx tsx scripts/generate-favicon.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getGenAI } from "../src/lib/gemini/client";
import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";
import pngToIco from "png-to-ico";

const PROMPT = `Design a premium mobile app icon for "Chaos Forge", a dark fantasy tabletop RPG character manager for Advanced Dungeons & Dragons 2nd Edition.

The app is used by a small group of friends to manage their D&D characters, track sessions, distribute loot, and cast spells. The visual theme is dark fantasy with glassmorphism UI elements, gold/amber accents on deep dark backgrounds.

Icon requirements:
- Show a stylized golden D20 die (icosahedron) as the central element
- The D20 should have visible triangular facets with subtle golden light reflections
- Behind or around the die: faint arcane energy, magical ember particles, or a subtle forge glow
- Color palette: deep black/dark brown background (#0d0a04 to #1a1408), golden/amber highlights (#d4a030, #f5c542)
- Style: premium, polished, modern app icon quality — like a top-tier iOS game icon
- The icon should have slightly rounded corners suitable for iOS app icons
- ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO WORDS anywhere on the icon
- Clean, bold silhouette that reads well at small sizes (16x16 pixels)
- Square composition, centered subject, slight depth/3D feel
- Dark moody atmosphere with warm golden magical glow`;

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
  console.log("Image generated, converting to all sizes...");

  const root = join(__dirname, "..");

  // Generate PNG sizes
  const sizes = [
    { name: "apple-touch-icon.png", size: 180, dir: "public" },
    { name: "favicon-32x32.png", size: 32, dir: "public" },
    { name: "favicon-16x16.png", size: 16, dir: "public" },
    { name: "icon-192x192.png", size: 192, dir: "public" },
    { name: "icon-512x512.png", size: 512, dir: "public" },
  ];

  for (const { name, size, dir } of sizes) {
    const buf = await sharp(original).resize(size, size, { fit: "cover" }).png().toBuffer();
    writeFileSync(join(root, dir, name), buf);
    console.log(`  ✓ ${dir}/${name} (${size}×${size})`);
  }

  // Also write to ressources/favicon/
  for (const name of ["apple-touch-icon.png", "favicon-32x32.png", "favicon-16x16.png"]) {
    const size = name.includes("apple") ? 180 : name.includes("32") ? 32 : 16;
    const buf = await sharp(original).resize(size, size, { fit: "cover" }).png().toBuffer();
    writeFileSync(join(root, "ressources", "favicon", name), buf);
    console.log(`  ✓ ressources/favicon/${name}`);
  }

  // Generate ICO
  const ico16 = await sharp(original).resize(16, 16, { fit: "cover" }).png().toBuffer();
  const ico32 = await sharp(original).resize(32, 32, { fit: "cover" }).png().toBuffer();
  const icoBuffer = await pngToIco([ico32, ico16]);
  writeFileSync(join(root, "src", "app", "favicon.ico"), icoBuffer);
  writeFileSync(join(root, "ressources", "favicon", "favicon.ico"), icoBuffer);
  console.log("  ✓ favicon.ico");

  // Save the original full-size image for reference
  writeFileSync(join(root, "ressources", "favicon", "original-generated.png"), original);
  console.log("  ✓ ressources/favicon/original-generated.png (original)");

  console.log("\nDone! All icons generated.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
