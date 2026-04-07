import { config } from "dotenv";
config({ path: ".env.local" });

import { generateImage } from "../src/lib/gemini/generate-image";
import { racePrompt } from "../src/lib/gemini/prompts";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const RACES = [
  "human",
  "elf",
  "half_elf",
  "dwarf",
  "gnome",
  "halfling",
  "half_orc",
  "kobold",
  "tiefling",
] as const;

const OUTPUT_DIR = join(process.cwd(), "public/images/races");

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const raceId of RACES) {
    console.log(`Generating image for race: ${raceId}...`);
    try {
      const buffer = await generateImage(racePrompt(raceId), {
        width: 400,
        height: 520,
      });
      const path = join(OUTPUT_DIR, `${raceId}.webp`);
      writeFileSync(path, buffer);
      console.log(`  ✓ Saved: ${path} (${(buffer.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ✗ Failed for ${raceId}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log("\nDone! Generated race images.");
}

main();
