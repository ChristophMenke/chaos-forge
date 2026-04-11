/**
 * One-off: hand-crafted Imagen prompts für die 4 Elementare.
 *
 * Der generische buildImagePrompt() in generate-missing-monster-images.ts
 * schafft es bei "Earth/Air Elemental" nicht, den richtigen Monster-Typ zu
 * treffen — Imagen generiert abwechselnd Fotos von Menschen, Drachen oder
 * SVG-Pfad-Code. Für diese vier Rows nutzen wir explizitere visuelle
 * Beschreibungen, die das Ziel unmissverständlich beschreiben.
 *
 * Run: npx tsx scripts/regenerate-elementals.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { generateImage } from "../src/lib/gemini/generate-image";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const STYLE_SUFFIX =
  "Watercolor washes over crisp ink line art, painterly brushwork, muted earthy colors, plain pure white background, three-quarter side view, single creature centered, no humans, no text, no captions, no borders, no frames, no logos, no photographic realism. Aesthetic: Tony DiTerlizzi / Larry Elmore TSR fantasy art.";

const ELEMENTALS: Record<string, string> = {
  "Erdelemental (12 TW)": `A massive humanoid-shaped creature made entirely of living rock, boulders, packed earth and crumbling stone. Rough lumpy body, thick powerful limbs, glowing crystal eyes, dirt falling from its shoulders. A classic D&D Earth Elemental. ${STYLE_SUFFIX}`,
  "Luftelemental (12 TW)": `A massive humanoid-shaped creature made entirely of swirling wind, churning storm clouds and visible air currents. Vaguely human silhouette dissolving into whirling vapor trails, translucent gaseous body, faint glowing eyes hovering in the mist. A classic D&D Air Elemental, NOT a dragon. ${STYLE_SUFFIX}`,
  "Feuerelemental (12 TW)": `A massive humanoid-shaped creature made entirely of living flame and burning embers. Roaring fire body with flickering arms and shoulders of pure flame, red and orange tongues of fire rising upward, glowing molten eyes. A classic D&D Fire Elemental. ${STYLE_SUFFIX}`,
  "Wasserelemental (12 TW)": `A massive humanoid-shaped creature made entirely of churning water and ocean foam. Towering wave-shaped body with aquatic arms of rolling water, cresting whitecaps at the shoulders, glowing blue eyes within the translucent flow. A classic D&D Water Elemental. ${STYLE_SUFFIX}`,
};

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  for (const [name, prompt] of Object.entries(ELEMENTALS)) {
    process.stdout.write(`${name}... `);
    const { data: row } = await supabase
      .from("monsters")
      .select("id")
      .eq("name", name)
      .eq("is_custom", false)
      .single();
    if (!row) {
      console.log("NOT FOUND");
      continue;
    }
    const webp = await generateImage(prompt, { width: 512, height: 640, quality: 85 });
    const storagePath = `${row.id}.webp`;
    const { error: upErr } = await supabase.storage
      .from("monster-images")
      .upload(storagePath, webp, { contentType: "image/webp", upsert: true });
    if (upErr) {
      console.log(`UPLOAD FAIL: ${upErr.message}`);
      continue;
    }
    const { data: urlData } = supabase.storage.from("monster-images").getPublicUrl(storagePath);
    const newUrl = `${urlData.publicUrl}?v=${Date.now()}`;
    await supabase.from("monsters").update({ image_url: newUrl }).eq("id", row.id);
    console.log(`OK (${(webp.length / 1024).toFixed(1)} KB)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
