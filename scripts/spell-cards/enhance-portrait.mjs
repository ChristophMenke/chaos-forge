// Hebt die Auflösung/Detailschärfe eines Charakter-Portraits per Gemini-Bildmodell
// an (Bild-zu-Bild, behält Gesicht/Farben/Komposition). Überschreibt die Portrait-
// Cache-Dateien, die build-char-cards.mjs & portrait-back.mjs lesen.
// Nutzung: node enhance-portrait.mjs <name-substring>   (z. B. "Sprocket")
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supa, slug } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const PORT = join(HERE, "cache", "portraits");
const env = Object.fromEntries(readFileSync(join(ROOT, ".env.local"), "utf8").split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const KEYS = Object.keys(env).filter((k) => /^GOOGLE_API_KEY(_\d+)?$/.test(k) && env[k]).sort().map((k) => env[k]);

// Kandidaten-Modelle (nano-banana Bildbearbeitung), erstes verfügbares gewinnt.
const MODELS = ["gemini-2.5-flash-image", "gemini-2.5-flash-image-preview", "gemini-2.0-flash-preview-image-generation"];

const PROMPT =
  "Redraw this exact fantasy character portrait at the HIGHEST possible resolution and sharpness — a crisp, razor-sharp, ultra-detailed 4K illustration. " +
  "Keep the EXACT same character, face, expression, hairstyle, hair color, brass goggles, beard, clothing and armor, pose and composition — do not change the design or framing at all. " +
  "Completely remove all blur, softness, pixelation and compression artifacts. Render every strand of hair, skin pore, freckle, the goggle lenses and brass fittings, and armor rivets in crisp fine detail with clean sharp edges. " +
  "Sharp focus throughout, no soft focus, no blur, no haze. Preserve the painterly dark-fantasy art style but at professional high-resolution quality. Output only the enhanced portrait, no text.";

async function enhance(buf, mime) {
  const b64 = buf.toString("base64");
  let lastErr;
  for (const apiKey of KEYS) {
    const ai = new GoogleGenAI({ apiKey });
    for (const model of MODELS) {
      try {
        const r = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: mime, data: b64 } }, { text: PROMPT }] }],
          config: { responseModalities: ["Image"] },
        });
        const parts = r.candidates?.[0]?.content?.parts || [];
        const img = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
        if (img) { console.log(`  ✓ ${model}`); return Buffer.from(img, "base64"); }
        lastErr = new Error(`${model}: keine Bilddaten`);
      } catch (e) { lastErr = e; console.log(`  · ${model}: ${e.message?.slice(0, 80)}`); }
    }
  }
  throw lastErr || new Error("kein Modell verfügbar");
}

(async () => {
  const key = process.argv[2] || "Sprocket";
  const sb = supa();
  const { data: chars } = await sb.from("characters").select("*");
  const c = chars.find((x) => x.name.toLowerCase().includes(key.toLowerCase()));
  if (!c) throw new Error("Charakter nicht gefunden: " + key);
  if (!c.avatar_url) throw new Error(c.name + " hat kein Avatar-Bild");
  console.log(`Enhance: ${c.name}`);
  const src = Buffer.from(await (await fetch(c.avatar_url)).arrayBuffer());
  const meta = await sharp(src).metadata();
  console.log(`  Quelle: ${meta.width}×${meta.height} ${meta.format}`);
  const hi = await enhance(src, `image/${meta.format === "jpeg" ? "jpeg" : meta.format || "png"}`);
  const hiMeta = await sharp(hi).metadata();
  console.log(`  Enhanced: ${hiMeta.width}×${hiMeta.height}`);

  const s = slug(c.name);
  // Original-Enhanced sichern + beide Portrait-Cache-Auflösungen schreiben.
  await sharp(hi).webp({ quality: 95 }).toFile(join(PORT, `${s}.src.webp`));
  await sharp(hi).resize(768, 780, { fit: "cover", position: "top", kernel: "lanczos3" }).sharpen({ sigma: 1.0 }).webp({ quality: 96 }).toFile(join(PORT, `${s}.webp`));
  await sharp(hi).resize(898, 960, { fit: "cover", position: "top", kernel: "lanczos3" }).sharpen({ sigma: 1.0 }).webp({ quality: 96 }).toFile(join(PORT, `${s}-tarot.webp`));
  console.log(`  → ${s}.webp + ${s}-tarot.webp aktualisiert`);
})();
