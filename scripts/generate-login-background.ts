import { config } from "dotenv";
config({ path: ".env.local" });

import { generateImage } from "../src/lib/gemini/generate-image";
import { STYLE_LANDSCAPE } from "../src/lib/gemini/prompts";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const OUTPUT_DIR = join(process.cwd(), "public/images");

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("Generating login background...");
  try {
    const buffer = await generateImage(
      `${STYLE_LANDSCAPE}. Dark medieval tavern interior, warm firelight, wooden beams, mysterious shadows, adventurers gear on walls, no people visible, atmospheric and inviting, wide angle`,
      { width: 1920, height: 1080 }
    );
    const path = join(OUTPUT_DIR, "login-bg.webp");
    writeFileSync(path, buffer);
    console.log(`✓ Saved: ${path} (${(buffer.length / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error("✗ Failed:", err instanceof Error ? err.message : err);
  }
}

main();
