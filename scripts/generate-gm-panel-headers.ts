import { config } from "dotenv";
config({ path: ".env.local" });

import { generateImage } from "../src/lib/gemini/generate-image";
import { STYLE_LANDSCAPE } from "../src/lib/gemini/prompts";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const OUTPUT_DIR = join(process.cwd(), "public/images/gm-panels");

interface HeaderSpec {
  filename: string;
  prompt: string;
  width: number;
  height: number;
}

const HEADERS: HeaderSpec[] = [
  {
    filename: "treasury-banner.webp",
    prompt:
      `${STYLE_LANDSCAPE}. Ancient royal treasury vault interior, ` +
      `piles of glinting gold coins, stacks of platinum bars, ` +
      `ornate medieval chests overflowing with silver, copper, and gemstones, ` +
      `warm candlelight reflecting off precious metals, ` +
      `heavy stone columns with gold filigree, ` +
      `mystical golden glow from magical coins, ` +
      `atmospheric dust motes in shafts of warm light, ` +
      `cinematic wide banner composition, no people, no text, ` +
      `focal point on glowing gold pile, muted background`,
    width: 1600,
    height: 400,
  },
  {
    filename: "council-banner.webp",
    prompt:
      `${STYLE_LANDSCAPE}. Medieval war council chamber interior, ` +
      `ornate round table with aged map of a fantasy world, ` +
      `banners and heraldic shields hanging on stone walls, ` +
      `crossed weapons and coat of arms, ` +
      `flickering torches casting dramatic shadows, ` +
      `empty chairs awaiting heroes, ` +
      `rich tapestries with mythical creatures, ` +
      `warm amber and red light, ` +
      `cinematic wide banner composition, no people visible, no text, ` +
      `heroic atmosphere, ancient stone architecture`,
    width: 1600,
    height: 400,
  },
];

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const spec of HEADERS) {
    console.log(`Generating ${spec.filename}...`);
    try {
      const buffer = await generateImage(spec.prompt, {
        width: spec.width,
        height: spec.height,
      });
      const path = join(OUTPUT_DIR, spec.filename);
      writeFileSync(path, buffer);
      console.log(`✓ Saved: ${path} (${(buffer.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(
        `✗ Failed to generate ${spec.filename}:`,
        err instanceof Error ? err.message : err
      );
    }
  }
}

main();
