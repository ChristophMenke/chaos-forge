/**
 * One-off: Generate the two party-portrait backgrounds used on the login
 * screen (portrait for mobile, landscape for desktop).
 *
 * Shows all currently-active adventurers as a group: a Tiefling thief,
 * a human fighter, an elf mage/thief, a gnome thief/illusionist, and a
 * half-elf druid. Style matches the PIN-gate artwork so both screens
 * feel like they belong to the same illustrated book.
 *
 * Run: npx tsx scripts/generate-login-party-art.ts
 */

import { writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import dotenv from "dotenv";
import { generateImage } from "../src/lib/gemini/generate-image";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const OUT_DIR = path.resolve(__dirname, "..", "public", "images", "login");

const PARTY_DESCRIPTION = `An adventuring party of five heroes in an Advanced Dungeons & Dragons
2nd Edition fantasy tavern setting, rendered as a group illustration in the
late-1990s TSR comic-book style — watercolor washes over crisp black ink line
art, painterly brushwork, muted earthy colors, soft shading, detailed
background of a candlelit fantasy tavern with wooden beams, scrolls, and
flickering lanterns. Five characters posed together:

1. A TIEFLING female thief (medium human-sized, slightly curved ram horns on
   her forehead, pointed ears, dusky reddish skin, long black hair, piercing
   yellow-amber eyes, wearing dark leather armor with a hooded cloak and
   daggers on her belt, sly confident expression).
2. A HUMAN male fighter named LARRY — THE TALLEST character in the group,
   young adult (late 20s), clean-shaven with a striking handsome face and high
   cheekbones. His most distinctive features are messy tousled SILVER-GREY hair
   (shoulder-length, unkempt, windswept) and PIERCING LUMINOUS BRIGHT BLUE EYES
   that appear to glow with inner light. He wears dark weathered leather armor
   with subtle silver chain accents over his shoulders, a high-collared dark
   cloak (hood down, face clearly visible), a longsword at his hip. Serious,
   brooding, mysterious expression. Dark-fantasy warrior aesthetic — NOT
   plate-armor-and-beard "classic knight".
3. An ELF female mage/thief (medium but slender, pointed ears, silver-blonde
   hair, leaf-green eyes, wearing a deep-purple mage robe with embroidered
   arcane runes and a thief's belt of daggers, holding an ornate spellbook).
4. A GNOME male illusionist/thief (small halfling-sized, roughly 1m tall,
   curly reddish beard, round spectacles, tinker's goggles pushed up on his
   forehead, colorful patchwork robe with gears and tools hanging from his
   belt, mischievous grin).
5. A HALF-ELF male druid (medium-sized, slightly pointed ears, short
   chestnut hair, short neat beard, green eyes, wearing earth-brown leather
   under a forest-green hooded cloak with oak-leaf embroidery, a wooden staff
   with a carved acorn top, and a small hawk perched on his shoulder).

All five characters should be clearly visible, arranged in a natural group
pose as if gathered around a tavern table. NOT a photograph, NOT
photorealistic — strictly watercolor-and-ink illustration style. No text,
no captions, no labels, no letters, no borders, no logos, no watermarks.`;

const LANDSCAPE_PROMPT = `${PARTY_DESCRIPTION}

Composition: wide horizontal panorama, all five characters arranged side-by-
side spanning the full width, with the tavern interior stretching behind
them. Cinematic letterbox framing.`;

const PORTRAIT_PROMPT = `${PARTY_DESCRIPTION}

Composition: tall vertical portrait aspect ratio (1:1.75). ALL FIVE
distinct characters must be visible and identifiable — Tiefling, Human
fighter, Elf mage, Gnome, and Half-Elf druid — arranged vertically in
two staggered rows (three characters in front, two behind peeking over
shoulders). Do NOT duplicate any character. Do NOT omit any character.
Tavern rafters with hanging lanterns fill the top quarter. The lower
two thirds of the frame contains the group.`;

async function generate(
  prompt: string,
  width: number,
  height: number,
  outName: string
): Promise<void> {
  process.stdout.write(`${outName}... `);
  const buf = await generateImage(prompt, { width, height, quality: 85 });
  const outPath = path.join(OUT_DIR, outName);
  writeFileSync(outPath, buf);
  const info = await sharp(outPath).metadata();
  process.stdout.write(`OK ${info.width}x${info.height}, ${(buf.length / 1024).toFixed(1)} KB\n`);
}

async function main(): Promise<void> {
  if (!process.env.GOOGLE_API_KEY) {
    console.error("GOOGLE_API_KEY missing");
    process.exit(1);
  }
  await sharp({
    create: { width: 1, height: 1, channels: 3, background: { r: 0, g: 0, b: 0 } },
  }).toBuffer(); // warm sharp
  const portraitOnly = process.argv.includes("--portrait");
  const landscapeOnly = process.argv.includes("--landscape");
  if (!landscapeOnly) await generate(PORTRAIT_PROMPT, 768, 1344, "login-party-portrait.webp");
  if (!portraitOnly) await generate(LANDSCAPE_PROMPT, 1536, 864, "login-party-landscape.webp");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
