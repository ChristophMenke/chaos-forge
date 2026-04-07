import { config } from "dotenv";
config({ path: ".env.local" });

import { generateImage } from "../src/lib/gemini/generate-image";
import { classPrompt } from "../src/lib/gemini/prompts";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// Only unique classes — specialist wizards reuse "mage" image
const CLASSES = [
  "fighter",
  "ranger",
  "paladin",
  "mage",
  "cleric",
  "crusader",
  "druid",
  "monk",
  "shaman",
  "thief",
  "bard",
] as const;

const OUTPUT_DIR = join(process.cwd(), "public/images/classes");

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const classId of CLASSES) {
    console.log(`Generating image for class: ${classId}...`);
    try {
      const buffer = await generateImage(classPrompt(classId), {
        width: 400,
        height: 520,
      });
      const path = join(OUTPUT_DIR, `${classId}.webp`);
      writeFileSync(path, buffer);
      console.log(`  ✓ Saved: ${path} (${(buffer.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ✗ Failed for ${classId}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log("\nDone! Generated class images.");
}

main();
