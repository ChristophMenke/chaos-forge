// Wartet auf den Imagen-Tagesreset (Pacific-Mitternacht) und generiert dann die
// 8 beanstandeten Bilder neu, rendert beide Decks + Galerie.
import { execSync } from "child_process";
import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const HERE = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(HERE, "..", "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const genai = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });
const WRONG = ["Clairaudience", "Darkness, 15' Radius", "Fly", "Magic Mouth", "Ray of Enfeeblement", "Summon Swarm", "Water Breathing", "Armor"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function quotaBack() {
  try {
    const r = await genai.models.generateImages({ model: "imagen-4.0-generate-001", prompt: "arcane rune", config: { numberOfImages: 1 } });
    return !!r.generatedImages?.[0]?.image?.imageBytes;
  } catch (e) { return false; }
}

(async () => {
  // bis zu ~90 Min auf den Reset warten (alle 2 Min prüfen)
  let ok = false;
  for (let i = 0; i < 45; i++) {
    if (await quotaBack()) { ok = true; break; }
    console.log(`[${new Date().toISOString().slice(11, 16)}] Kontingent noch leer, warte 2 Min …`);
    await sleep(120000);
  }
  if (!ok) { console.log("Kontingent auch nach Wartezeit nicht verfügbar — später erneut versuchen."); return; }

  console.log("Kontingent da → 8 Bilder neu:");
  execSync(`node "${join(HERE, "regen-art.mjs")}" ${WRONG.map((n) => `"${n}"`).join(" ")}`, { stdio: "inherit" });
  console.log("\nRe-Render + Galerie:");
  execSync(`node "${join(HERE, "generate-deck.mjs")}" sprocket --force`, { stdio: "inherit" });
  execSync(`node "${join(HERE, "generate-deck.mjs")}" Nowi --force`, { stdio: "inherit" });
  execSync(`node "${join(HERE, "review-gallery.mjs")}"`, { stdio: "inherit" });
  console.log("\nBILDER FERTIG");
})();
