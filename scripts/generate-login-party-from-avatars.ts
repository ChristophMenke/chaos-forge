/**
 * Regenerate the login-screen party art using the actual character avatars
 * from the `avatars` Supabase Storage bucket as reference images.
 *
 * Earlier iterations of `generate-login-party-art.ts` used a text-only
 * description, which made Imagen invent looks for Larry, Nowi, and Sprocket
 * that didn't match the GM's uploaded portraits. This version:
 *
 *   1. Downloads each active character's avatar from Storage.
 *   2. Passes all five avatars plus a scene description to Gemini 2.5 Flash
 *      Image (multi-modal input → image output) as a single generateContent
 *      request, asking it to compose one shared tavern scene that
 *      preserves each character's appearance.
 *
 * Produces `public/images/login/login-party-{portrait,landscape}.webp`.
 *
 * Run: npx tsx scripts/generate-login-party-from-avatars.ts
 */

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const OUT_DIR = path.resolve(__dirname, "..", "public", "images", "login");

/**
 * Four of the five party members have uploaded avatars in the `avatars`
 * Supabase bucket — Gemini will use those as reference images so the
 * generated scene preserves each character's look. The fifth slot (a
 * Half-Elf Druide) is described in text only, because the group image
 * is also used as an atmospheric prop and the druid does not correspond
 * to a real character row in the DB.
 */
const PARTY_ORDER = [
  { name: "Larry", role: "Human male fighter, silver hair, dark cloak over armor" },
  {
    name: "Isolde",
    role: "Tiefling female thief with dark ram horns, dusky red skin, leather armor and daggers",
  },
  {
    name: "Nowi Tarja",
    role: "Elf female mage/thief, slender, blonde hair, pointed ears, holding a leather-bound spellbook",
  },
  {
    name: "Sprocket 'Fixit' Tanglewire",
    role: "Gnome male illusionist, small (waist-height to the others), reddish hair, tinker's goggles, patchwork robe",
  },
];

const HALF_ELF_DRUID_DESCRIPTION = `A FIFTH character who is NOT in the reference images but must also be rendered: a Half-Elf male druid — medium build, subtly pointed ears, short wavy chestnut hair, short neat beard, calm green eyes, earth-brown leather armor under a forest-green hooded cloak with oak-leaf embroidery, holding a gnarled wooden staff with a small carved acorn at the top.`;

const SCENE_PROMPT = `Using the four reference portraits provided, compose a single group illustration of an adventuring party gathered inside a candlelit fantasy tavern.

CRITICAL LAYOUT CONSTRAINT — read this first:
The entire LOWER HALF (bottom 50%) of the image must show an EMPTY tavern bar top / wooden table surface with ONLY candles, mugs, and scrolls on it — no characters, no text, no decorative panels, no parchment signs, NOTHING but the empty wooden surface and small tavern props. Do NOT draw any form, banner, sign, parchment note, input field, or UI element in the lower half. Just clean wooden bar with scattered tavern items.

ALL FIVE party members must be rendered ONLY in the UPPER HALF (top 50%) of the image — their bodies are cut off at waist level by the bar top, like a half-body portrait lineup standing behind a bar. NO character's face or body may extend below the horizontal midline of the image.

Sprocket the gnome is only waist-height relative to the other characters, but he still must be in the TOP HALF — render him STANDING ON THE TAVERN BAR so his head reaches the same height zone as the humans' chests/shoulders. He is NEVER on the floor or at ground level.

THE PARTY HAS EXACTLY FIVE MEMBERS. ALL FIVE MUST BE CLEARLY VISIBLE IN THE UPPER ~65% OF THE FINAL IMAGE. If any one of them is missing or blocked, the image is wrong. Count them before you finish: one, two, three, four, five.

The five party members are:

1. Isolde — the Tiefling female thief from reference image #1. MANDATORY: she has prominent dark ram horns curling from her forehead, dusky reddish skin, long black hair, pointed ears, yellow-amber eyes, and wears studded leather armor with daggers. She MUST be visible prominently in the image with her horns clearly shown.

2. Larry — the human male fighter from reference image #2. Silver-white hair, young stern face, dark cloak over armor.

3. Nowi Tarja — the elf female mage/thief from reference image #3. Slender, silver-blonde hair, pointed ears, holding a leather-bound spellbook.

4. Sprocket 'Fixit' Tanglewire — the gnome male illusionist from reference image #4. MANDATORY: small stature (only waist-height to the others), reddish-orange hair, tinker's goggles, patchwork robe. He MUST be in the foreground visible from head to toe, never cropped or hidden behind anyone.

5. The Half-Elf male druid (NOT in the reference images, invent his look from this description and keep it consistent across all output orientations): ${HALF_ELF_DRUID_DESCRIPTION}

COMPOSITION RULES:
- Preserve each reference character's exact face, hair, skin color, clothing, and props from the reference images. Do NOT invent new looks for them.
- ALL FIVE characters are in the TOP HALF of the image, arranged like a bust-portrait lineup behind a bar. Their bodies are cut off at waist/chest level by the edge of the table. Nothing below their waists is visible.
- ALL FIVE FACES must be at the SAME vertical height zone — the upper third of the image. No face below the middle of the image.
- Isolde's horns MUST be visible and unmistakable — do not hide them under a hood.
- Sprocket the gnome is SMALL. To make him clearly visible in the upper third of the image, draw him STANDING ON THE BAR TOP (directly on the wooden bar between Larry and Nowi, not behind it on the floor). His feet are on the bar, his head reaches to the humans' shoulder height or slightly above. His FACE must be clearly positioned in the upper third of the whole image, no lower than 30% from the top. Absolutely do NOT draw him standing on the floor behind the bar where his face would be low.
- Spread all five characters across the horizontal width of the upper band so every one is recognizable; overlapping is fine as long as each face is visible.
- The BOTTOM HALF is empty table surface with mugs, candles, scrolls, and parchment. No character anywhere in the bottom half.

Style: watercolor washes over crisp ink line art, painterly brushwork, muted earthy colors, late-1990s TSR / Wizards of the Coast Dungeons & Dragons illustration aesthetic, soft warm lighting from candles and lanterns, detailed tavern interior with wooden beams, shelves of scrolls, and mugs on a wooden table. NOT a photograph, NOT photorealistic.

Strict prohibitions: no text, no captions, no labels, no letters, no borders, no frames, no logos, no watermarks, no signatures.`;

async function downloadAvatar(url: string): Promise<Buffer> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`avatar fetch failed: ${resp.status}`);
  return Buffer.from(await resp.arrayBuffer());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAnyClient = any;

async function loadPartyAvatars(
  supabase: SupabaseAnyClient
): Promise<{ name: string; bytes: Buffer }[]> {
  const avatars: { name: string; bytes: Buffer }[] = [];
  for (const p of PARTY_ORDER) {
    const { data } = await supabase
      .from("characters")
      .select("avatar_url")
      .eq("name", p.name)
      .single();
    const avatarUrl = (data as { avatar_url?: string | null } | null)?.avatar_url;
    if (!avatarUrl) {
      throw new Error(`${p.name} has no avatar_url`);
    }
    const bytes = await downloadAvatar(avatarUrl);
    avatars.push({ name: p.name, bytes });
  }
  return avatars;
}

async function generateWithGemini(
  genai: GoogleGenAI,
  promptText: string,
  referenceImages: Buffer[],
  aspectRatio: "9:16" | "16:9"
): Promise<Buffer> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: promptText },
  ];
  for (const img of referenceImages) {
    parts.push({
      inlineData: {
        mimeType: "image/webp",
        data: img.toString("base64"),
      },
    });
  }

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts }],
    config: { imageConfig: { aspectRatio } },
  });

  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, "base64");
      }
    }
  }
  throw new Error("No image returned by Gemini");
}

async function generatePortrait(
  genai: GoogleGenAI,
  avatars: { name: string; bytes: Buffer }[]
): Promise<Buffer> {
  return generateWithGemini(
    genai,
    SCENE_PROMPT,
    avatars.map((a) => a.bytes),
    "9:16"
  );
}

/**
 * Generate the landscape variant by passing the already-generated portrait
 * as an extra reference image. That way the druid who exists only via text
 * description stays visually identical across both orientations, instead of
 * Gemini inventing a new face for him on each call.
 */
async function generateLandscape(
  genai: GoogleGenAI,
  avatars: { name: string; bytes: Buffer }[],
  portraitPng: Buffer
): Promise<Buffer> {
  const prompt = `${SCENE_PROMPT}

ADDITIONAL REFERENCE: The final image in the reference list is the portrait version of this exact same scene. Use it to preserve the Half-Elf druid's exact face, hair, beard, clothing and staff — the druid must look identical to how he appears in that reference. Use that portrait as the authoritative source for the druid's look; for the other four characters, still use their individual portrait references.

LANDSCAPE COMPOSITION: The party must span the ENTIRE WIDTH of the image from the left edge to the right edge. The tavern bar top must stretch fully across the bottom half of the frame. There must be NO empty white space or unfilled areas anywhere in the image — every pixel should contain tavern content (bar, shelves, characters, candles, mugs, wooden beams). Spread the five characters horizontally so they are distributed from the far left to the far right, filling the whole frame.

CRITICAL COUNTING RULE: There is EXACTLY ONE Half-Elf Druide in this scene. Draw him ONCE, not twice. The landscape image must contain exactly 5 characters total: 1 Tiefling thief + 1 Human fighter + 1 Gnome illusionist + 1 Elf mage/thief + 1 Half-Elf druid = 5. DO NOT duplicate the druid or any other character. If you are tempted to draw a second druid to fill the right edge, draw extra tavern background instead (shelves, barrels, mugs, candles, wall decorations).`;
  return generateWithGemini(genai, prompt, [...avatars.map((a) => a.bytes), portraitPng], "16:9");
}

async function main(): Promise<void> {
  if (!process.env.GOOGLE_API_KEY) {
    console.error("GOOGLE_API_KEY missing");
    process.exit(1);
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

  console.log("Lade 4 Charakter-Avatare aus dem Storage...");
  const avatars = await loadPartyAvatars(supabase);
  console.log(
    `  ${avatars.length} Avatare geladen (Halbelf-Druide kommt per Text-Description dazu)`
  );

  process.stdout.write("Generiere Portrait (9:16)... ");
  const portraitRaw = await generatePortrait(genai, avatars);
  const portraitWebp = await sharp(portraitRaw)
    .resize({ width: 960, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  const portraitPath = path.join(OUT_DIR, "login-party-portrait.webp");
  writeFileSync(portraitPath, portraitWebp);
  const portraitMeta = await sharp(portraitPath).metadata();
  console.log(
    `OK ${portraitMeta.width}x${portraitMeta.height}, ${(portraitWebp.length / 1024).toFixed(1)} KB`
  );

  process.stdout.write("Generiere Landscape (16:9) mit Portrait als Referenz... ");
  const landscapeRaw = await generateLandscape(genai, avatars, portraitRaw);
  const landscapeWebp = await sharp(landscapeRaw)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  const landscapePath = path.join(OUT_DIR, "login-party-landscape.webp");
  writeFileSync(landscapePath, landscapeWebp);
  const landscapeMeta = await sharp(landscapePath).metadata();
  console.log(
    `OK ${landscapeMeta.width}x${landscapeMeta.height}, ${(landscapeWebp.length / 1024).toFixed(1)} KB`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
