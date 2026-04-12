/**
 * Variant of `generate-login-party-from-avatars.ts` that produces the "code
 * entry" step backgrounds: the same five characters in the same tavern, but
 * pulling silly faces / grimaces — to lighten the mood while the player
 * waits for the magic-link code to arrive.
 *
 * The normal party images are used as additional reference inputs so the
 * scene geometry, clothing, and composition stay consistent with the email
 * step. Only the facial expressions change.
 *
 * Run: npx tsx scripts/generate-login-party-grimaces.ts
 */

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const OUT_DIR = path.resolve(__dirname, "..", "public", "images", "login");
const BASE_PORTRAIT = path.join(OUT_DIR, "login-party-portrait.webp");
const BASE_LANDSCAPE = path.join(OUT_DIR, "login-party-landscape.webp");

const PARTY_ORDER = [
  {
    name: "Larry",
    role: "Human male fighter, THE TALLEST of the group, young adult, clean-shaven, messy tousled silver-grey shoulder-length hair, piercing bright blue eyes, dark leather armor with silver chain accents, high-collared dark cloak (hood down)",
  },
  {
    name: "Isolde",
    role: "Tiefling female thief with dark ram horns, dusky red skin, leather armor",
  },
  {
    name: "Nowi Tarja",
    role: "Elf female mage/thief, slender, blonde hair, pointed ears, spellbook",
  },
  {
    name: "Sprocket 'Fixit' Tanglewire",
    role: "Gnome male illusionist, small, reddish hair, tinker's goggles, patchwork robe",
  },
];

const HALF_ELF_DRUID_DESCRIPTION = `A Half-Elf male druid — medium build, subtly pointed ears, short wavy chestnut hair, short neat beard, earth-brown leather under a forest-green hooded cloak with oak-leaf embroidery, holding a gnarled wooden staff with a small carved acorn at the top.`;

const BASE_SCENE_PROMPT = `Using the four reference portraits plus the final reference image (which shows the exact same tavern scene with the same characters in neutral poses), create a NEW version of the scene where ALL FIVE party members are pulling SILLY, FUNNY GRIMACES and goofy facial expressions — while everything else (composition, clothing, tavern background, bar top, candles, scrolls, mugs, character positions) stays EXACTLY THE SAME as the reference scene.

CRITICAL LAYOUT CONSTRAINT:
This illustration is a background for a login screen. A rectangular parchment-colored UI panel with a text input field and a button will be overlaid on the CENTER-LOWER area of the final image. The entire LOWER HALF (bottom 50%) must be completely empty of characters — only a wooden tavern table surface with candles, mugs, and scrolls.

ALL FIVE characters must stay in the UPPER HALF of the image behind the bar, in the same positions and poses as the reference scene. Only their FACES change to silly expressions.

EXPRESSIONS — each character gets a different funny grimace:

1. Isolde (Tiefling with horns and red skin): sticking her tongue out sideways, one eye scrunched closed, the other eye wide open, tiny mischievous smirk.

2. Larry (human fighter with silver hair): puffing out his cheeks comically like a blowfish, eyes crossed looking at his own nose.

3. Nowi Tarja (blonde elf mage): eyes rolled dramatically skyward, mouth stretched wide in an exaggerated "oh nooo" shape, still holding her spellbook.

4. Sprocket (gnome with goggles): goggles pushed up on forehead, tongue sticking straight out, one finger in his ear, wild grin.

5. ${HALF_ELF_DRUID_DESCRIPTION} — His expression: waggling his eyebrows, lips pressed into a fish-mouth pout, one eyebrow raised higher than the other.

REQUIREMENTS:
- Preserve each reference character's hair, skin color, clothing, and props exactly. Do NOT change their outfits.
- Isolde's horns MUST be visible (do not hide them under a hood).
- Sprocket MUST be in the UPPER HALF of the image with his head at the SAME height as the tall characters' heads. Place him on top of a TALL bar stool or a stack of crates so his face is at shoulder-to-head level of Larry and the Druid. He is NEVER below the other characters' chests — his FACE must be at the same vertical zone as theirs, clearly above any UI overlay area.
- The tavern interior and bar top must match the reference image.
- ONLY the facial expressions are changed — everything else stays.

Style: watercolor washes over crisp ink line art, painterly brushwork, muted earthy colors, late-1990s TSR / Wizards of the Coast Dungeons & Dragons illustration aesthetic.

Strict prohibitions: no text, no captions, no labels, no letters, no borders, no frames, no logos, no watermarks, no signatures.`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAnyClient = any;

async function downloadAvatar(url: string): Promise<Buffer> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`avatar fetch failed: ${resp.status}`);
  return Buffer.from(await resp.arrayBuffer());
}

async function loadPartyAvatars(
  supabase: SupabaseAnyClient
): Promise<{ name: string; bytes: Buffer }[]> {
  const avatars: { name: string; bytes: Buffer }[] = [];
  for (const p of PARTY_ORDER) {
    const { data } = await supabase
      .from("characters")
      .select("avatar_url")
      .eq("name", p.name)
      .maybeSingle();
    const avatarUrl = (data as { avatar_url?: string | null } | null)?.avatar_url;
    if (!avatarUrl) {
      console.warn(`  (skip ${p.name}: no avatar_url)`);
      continue;
    }
    avatars.push({ name: p.name, bytes: await downloadAvatar(avatarUrl) });
  }
  return avatars;
}

async function generateWithGemini(
  genai: GoogleGenAI,
  prompt: string,
  refs: Buffer[],
  aspectRatio: "9:16" | "16:9"
): Promise<Buffer> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];
  for (const r of refs) {
    parts.push({ inlineData: { mimeType: "image/webp", data: r.toString("base64") } });
  }
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts }],
    config: { imageConfig: { aspectRatio } },
  });
  for (const c of response.candidates ?? []) {
    for (const p of c.content?.parts ?? []) {
      if (p.inlineData?.data) return Buffer.from(p.inlineData.data, "base64");
    }
  }
  throw new Error("No image returned by Gemini");
}

async function main(): Promise<void> {
  if (!process.env.GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY missing");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

  console.log("Lade 4 Charakter-Avatare...");
  const avatars = await loadPartyAvatars(supabase);

  console.log("Lade neutrale Base-Szenen als Referenz...");
  const basePortrait = readFileSync(BASE_PORTRAIT);
  const baseLandscape = readFileSync(BASE_LANDSCAPE);

  process.stdout.write("Generiere Grimassen-Portrait (9:16)... ");
  const portraitRaw = await generateWithGemini(
    genai,
    BASE_SCENE_PROMPT,
    [...avatars.map((a) => a.bytes), basePortrait],
    "9:16"
  );
  const portraitWebp = await sharp(portraitRaw)
    .resize({ width: 960, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  writeFileSync(path.join(OUT_DIR, "login-party-grimace-portrait.webp"), portraitWebp);
  console.log(`OK ${(portraitWebp.length / 1024).toFixed(1)} KB`);

  process.stdout.write("Generiere Grimassen-Landscape (16:9)... ");
  const landscapeRaw = await generateWithGemini(
    genai,
    BASE_SCENE_PROMPT +
      "\n\nLANDSCAPE COMPOSITION: fill the ENTIRE width from far left to far right, no empty space.",
    [...avatars.map((a) => a.bytes), baseLandscape, portraitRaw],
    "16:9"
  );
  const landscapeWebp = await sharp(landscapeRaw)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  writeFileSync(path.join(OUT_DIR, "login-party-grimace-landscape.webp"), landscapeWebp);
  console.log(`OK ${(landscapeWebp.length / 1024).toFixed(1)} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
