import { config } from "dotenv";
config({ path: ".env.local" });

import { generateImage } from "../src/lib/gemini/generate-image";
import { spherePrompt } from "../src/lib/gemini/prompts";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SPHERES = [
  "all",
  "animal",
  "astral",
  "charm",
  "combat",
  "creation",
  "divination",
  "elemental",
  "elemental-air",
  "elemental-earth",
  "elemental-fire",
  "elemental-water",
  "elemental-magma",
  "guardian",
  "healing",
  "necromantic",
  "plant",
  "protection",
  "summoning",
  "sun",
  "weather",
  "chaos",
  "cosmos",
  "law",
  "learning",
  "numbers",
  "thought",
  "time",
  "travelers",
  "war",
  "wards",
  "special",
] as const;

const OUTPUT_DIR = join(process.cwd(), "public/images/spheres");

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const sphere of SPHERES) {
    // Convert filename back to prompt key: "elemental-air" → "elemental air"
    const promptKey = sphere.replace(/-/g, " ");
    console.log(`Generating icon for sphere: ${sphere}...`);
    try {
      const buffer = await generateImage(spherePrompt(promptKey), {
        width: 96,
        height: 96,
      });
      const path = join(OUTPUT_DIR, `${sphere}.webp`);
      writeFileSync(path, buffer);
      console.log(`  ✓ Saved: ${path} (${(buffer.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ✗ Failed for ${sphere}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log("\nDone! Generated sphere icons.");
}

main();
