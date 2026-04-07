import { config } from "dotenv";
config({ path: ".env.local" });

import { generateImage } from "../src/lib/gemini/generate-image";
import { schoolPrompt } from "../src/lib/gemini/prompts";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SCHOOLS = [
  "abjuration",
  "alteration",
  "conjuration",
  "divination",
  "enchantment",
  "illusion",
  "invocation",
  "necromancy",
] as const;

const OUTPUT_DIR = join(process.cwd(), "public/images/schools");

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const school of SCHOOLS) {
    console.log(`Generating icon for school: ${school}...`);
    try {
      const buffer = await generateImage(schoolPrompt(school), {
        width: 96,
        height: 96,
      });
      const path = join(OUTPUT_DIR, `${school}.webp`);
      writeFileSync(path, buffer);
      console.log(`  ✓ Saved: ${path} (${(buffer.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ✗ Failed for ${school}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log("\nDone! Generated school icons.");
}

main();
