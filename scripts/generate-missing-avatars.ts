/**
 * One-off: generate square avatar portraits for characters that don't
 * have one yet (currently Isolde and Faelorn) and upload them to the
 * `avatars` Supabase Storage bucket.
 *
 * Avatar paths follow the existing convention `{user_id}/{character_id}.webp`
 * and the DB's `characters.avatar_url` column is updated with a cache-
 * busting query string.
 *
 * Run: npx tsx scripts/generate-missing-avatars.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import sharp from "sharp";
import { generateImage } from "../src/lib/gemini/generate-image";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const STYLE_SUFFIX =
  "Portrait head-and-shoulders close-up on a plain moody background. Fantasy character art in the style of Magic: The Gathering or Dungeons & Dragons book illustrations. Watercolor washes over ink line art, painterly brushwork, crisp black outlines, muted earthy colors, dramatic lighting. Subject is a non-human fantasy character, NOT a photograph, NOT photorealistic. No text, no borders, no frames.";

const AVATAR_PROMPTS: Record<string, string> = {
  Isolde: `A Tiefling female rogue character portrait, AD&D 2nd Edition fantasy style. Close-up head-and-shoulders view. Distinctive features: dusky red skin, slightly curved dark ram horns on her forehead, pointed ears, long straight black hair, piercing yellow-amber eyes with vertical slit pupils, wearing dark hooded leather armor with bronze buckles. Confident, sly, slightly dangerous expression. Young adult female. ${STYLE_SUFFIX}`,

  Faelorn: `A Half-Elf male druid character portrait, AD&D 2nd Edition fantasy style. Close-up head-and-shoulders view. Distinctive features: medium build, subtly pointed ears, short wavy chestnut hair, short neat beard, calm green eyes, wearing earth-brown and forest-green hooded robes with oak-leaf embroidery and a small bone amulet around his neck. Wise, peaceful, nature-connected expression. Adult male. ${STYLE_SUFFIX}`,
};

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  for (const [charName, prompt] of Object.entries(AVATAR_PROMPTS)) {
    process.stdout.write(`${charName}... `);

    const { data: char } = await supabase
      .from("characters")
      .select("id, user_id, avatar_url")
      .eq("name", charName)
      .single();
    if (!char) {
      console.log("NOT FOUND");
      continue;
    }

    // Imagen 4 generates square-ish images; resize to exact 512x512.
    const buf = await generateImage(prompt, { width: 512, height: 512, quality: 85 });
    const square = await sharp(buf)
      .resize(512, 512, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();

    const storagePath = `${char.user_id}/${char.id}.webp`;

    // Remove old object (if any) and upload fresh.
    await supabase.storage.from("avatars").remove([storagePath]);
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(storagePath, square, { contentType: "image/webp", upsert: true });
    if (upErr) {
      console.log(`UPLOAD FAIL: ${upErr.message}`);
      continue;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(storagePath);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("characters").update({ avatar_url: avatarUrl }).eq("id", char.id);

    console.log(`OK (${(square.length / 1024).toFixed(1)} KB)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
