/**
 * Generate UX/UI polish images via Gemini API (generateContent with image output).
 *
 * Usage: npx tsx scripts/generate-polish-images.ts
 *
 * Generates:
 *  - 36 race/classGroup silhouette avatars (160x160)
 *  - 6 empty-state illustrations (400x300)
 *  - 1 ambient dungeon-stone texture (256x256)
 */

import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import fs from "node:fs";

const ROOT = path.resolve(__dirname, "..");
const AVATARS_DIR = path.join(ROOT, "public/images/avatars");
const EMPTY_DIR = path.join(ROOT, "public/images/empty-states");
const TEXTURES_DIR = path.join(ROOT, "public/images/textures");

const MODEL = "imagen-4.0-generate-001";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateAndSave(
  prompt: string,
  outPath: string,
  opts: { width: number; height: number; aspectRatio?: string },
  retries = 2
) {
  if (fs.existsSync(outPath)) {
    console.log(`  SKIP (exists): ${path.relative(ROOT, outPath)}`);
    return;
  }

  console.log(`  Generating: ${path.relative(ROOT, outPath)} ...`);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateImages({
        model: MODEL,
        prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: opts.aspectRatio ?? "1:1",
        },
      });

      const img = response.generatedImages?.[0];
      if (!img?.image?.imageBytes) {
        const reason = img?.raiFilteredReason ?? "unknown";
        console.warn(`  WARN: No image returned (reason: ${reason})`);
        if (attempt < retries) {
          console.log(`  Retrying (${attempt + 1}/${retries})...`);
          await sleep(3000);
          continue;
        }
        return;
      }

      const rawBuffer = Buffer.from(img.image.imageBytes, "base64");

      // Resize + convert to webp
      await sharp(rawBuffer)
        .resize(opts.width, opts.height, { fit: "cover" })
        .webp({ quality: 85 })
        .toFile(outPath);

      console.log(`  OK: ${path.relative(ROOT, outPath)}`);
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < retries && (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED"))) {
        console.log(`  Rate limited, waiting 15s before retry (${attempt + 1}/${retries})...`);
        await sleep(15000);
        continue;
      }
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Avatar definitions
// ---------------------------------------------------------------------------

const RACES = [
  "human",
  "elf",
  "dwarf",
  "halfling",
  "gnome",
  "half_elf",
  "half_orc",
  "tiefling",
  "kobold",
] as const;

const CLASS_GROUPS = ["warrior", "priest", "rogue", "wizard"] as const;

const RACE_DESCRIPTIONS: Record<string, string> = {
  human: "average-build human",
  elf: "tall slender elf with pointed ears",
  dwarf: "short stocky broad-shouldered dwarf with long beard",
  halfling: "very small halfling, half the height of a human, with curly hair",
  gnome: "small gnome with a large nose and clever expression",
  half_elf: "half-elf with slightly pointed ears and graceful build",
  half_orc: "muscular half-orc with prominent jaw and tusks",
  tiefling: "tiefling with curved horns, tail, and slightly otherworldly features",
  kobold: "tiny reptilian kobold with small horns and a snout",
};

const CLASS_GROUP_DETAILS: Record<string, { emblem: string; glow: string; equipment: string }> = {
  warrior: {
    emblem: "a glowing red sword emblem",
    glow: "red glow aura (#dc2626)",
    equipment: "wearing heavy armor, holding a sword or axe",
  },
  priest: {
    emblem: "a glowing golden holy sun symbol emblem",
    glow: "golden glow aura (#d97706)",
    equipment: "wearing robes and holding a holy symbol or mace",
  },
  rogue: {
    emblem: "a glowing blue dagger emblem",
    glow: "blue glow aura (#2563eb)",
    equipment: "wearing a hooded cloak and holding daggers",
  },
  wizard: {
    emblem: "a glowing teal star/staff emblem",
    glow: "teal glow aura (#0d9488)",
    equipment: "wearing flowing wizard robes and holding a staff or wand",
  },
};

function buildAvatarPrompt(race: string, classGroup: string): string {
  const rd = RACE_DESCRIPTIONS[race];
  const cd = CLASS_GROUP_DETAILS[classGroup];
  return [
    `Dark silhouette portrait of a fantasy ${rd}, ${cd.equipment}.`,
    `Gender-neutral shadowy figure shown from chest up.`,
    `The figure is a solid dark shadow/silhouette against a very dark purple background (hex #1a1025).`,
    `A small ${cd.emblem} subtly glows near the figure's chest or shoulder, casting a faint ${cd.glow} along the silhouette edges.`,
    `Style: dark fantasy, minimalist, icon-like, clean edges, no fine detail inside the silhouette.`,
    `The silhouette shape must clearly communicate the race: ${rd}.`,
    `Dark moody atmosphere, suitable for a 160x160 pixel icon that remains recognizable at 40-80px display size.`,
    `No text, no words, no letters, no watermarks.`,
  ].join(" ");
}

// ---------------------------------------------------------------------------
// Empty state definitions
// ---------------------------------------------------------------------------

interface EmptyStateDef {
  name: string;
  prompt: string;
}

const EMPTY_STATES: EmptyStateDef[] = [
  {
    name: "forge",
    prompt:
      "An empty medieval blacksmith forge with a cold, extinguished furnace and a dusty anvil, no weapons or tools present. Dark fantasy atmospheric style, muted purple and gold color palette, moody lighting with faint embers. Oil painting style. No text, no words, no letters, no watermarks.",
  },
  {
    name: "chronicle",
    prompt:
      "An empty open book or chronicle on a wooden desk, pages completely blank, with an inkwell and quill nearby. Dark fantasy atmospheric style, muted purple and gold color palette, candlelight illumination. Oil painting style. No text, no words, no letters, no watermarks.",
  },
  {
    name: "arcane-pedestal",
    prompt:
      "An empty arcane stone pedestal in a dark chamber with a faint magical glow emanating from runes on the pedestal surface but nothing placed on it. Dark fantasy atmospheric style, muted purple and teal color palette, mysterious dim lighting. Oil painting style. No text, no words, no letters, no watermarks.",
  },
  {
    name: "treasure-chest",
    prompt:
      "An open empty treasure chest in a dungeon, the inside is bare, cobwebs around the hinges. Dark fantasy atmospheric style, muted purple and gold color palette, torchlight. Oil painting style. No text, no words, no letters, no watermarks.",
  },
  {
    name: "spellbook",
    prompt:
      "An open empty spellbook with blank aged parchment pages, arcane symbols faintly glowing on the book cover, no text or spells written inside. Dark fantasy atmospheric style, muted purple and teal color palette, candlelight. Oil painting style. No text, no words, no letters, no watermarks.",
  },
  {
    name: "throne",
    prompt:
      "An empty ornate stone throne in a dark medieval hall, no person sitting, dusty and imposing. Dark fantasy atmospheric style, muted purple and gold color palette, dim ambient light from high windows. Oil painting style. No text, no words, no letters, no watermarks.",
  },
];

// ---------------------------------------------------------------------------
// Texture definition
// ---------------------------------------------------------------------------

const TEXTURE_PROMPT =
  "Seamless tileable dungeon stone wall texture, very subtle and understated, dark gray and very dark purple tones. Meant to be used at 5-8% opacity as a background overlay. Minimalist, low contrast, clean edges between stones. Tile that repeats seamlessly in all directions. No text, no words, no letters, no watermarks.";

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Generating UX/UI Polish Images ===\n");

  // Ensure dirs
  for (const dir of [AVATARS_DIR, EMPTY_DIR, TEXTURES_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  // --- 1) Race/ClassGroup Avatars ---
  console.log("--- Race/ClassGroup Silhouette Avatars (36) ---");
  for (const race of RACES) {
    for (const cg of CLASS_GROUPS) {
      const filename = `${race}-${cg}.webp`;
      const outPath = path.join(AVATARS_DIR, filename);
      if (fs.existsSync(outPath)) {
        console.log(`  SKIP (exists): ${filename}`);
        skipped++;
        continue;
      }
      const prompt = buildAvatarPrompt(race, cg);
      try {
        await generateAndSave(prompt, outPath, { width: 160, height: 160 });
        generated++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ERROR (${filename}): ${msg}`);
        errors++;
      }
      // Rate limit buffer
      await sleep(2000);
    }
  }

  // --- 2) Empty State Illustrations ---
  console.log("\n--- Empty State Illustrations (6) ---");
  for (const es of EMPTY_STATES) {
    const outPath = path.join(EMPTY_DIR, `${es.name}.webp`);
    if (fs.existsSync(outPath)) {
      console.log(`  SKIP (exists): ${es.name}.webp`);
      skipped++;
      continue;
    }
    try {
      await generateAndSave(es.prompt, outPath, {
        width: 400,
        height: 300,
        aspectRatio: "4:3",
      });
      generated++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR (${es.name}): ${msg}`);
      errors++;
    }
    await sleep(2000);
  }

  // --- 3) Ambient Texture ---
  console.log("\n--- Ambient Texture (1) ---");
  {
    const outPath = path.join(TEXTURES_DIR, "dungeon-stone.webp");
    if (fs.existsSync(outPath)) {
      console.log(`  SKIP (exists): dungeon-stone.webp`);
      skipped++;
    } else {
      try {
        await generateAndSave(TEXTURE_PROMPT, outPath, {
          width: 256,
          height: 256,
        });
        generated++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ERROR (dungeon-stone): ${msg}`);
        errors++;
      }
    }
  }

  console.log(`\n=== Done === (generated: ${generated}, skipped: ${skipped}, errors: ${errors})`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
