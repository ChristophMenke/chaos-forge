// Prüft alle Karten auf Textüberlauf (.desc scrollHeight > clientHeight).
import { chromium } from "playwright";
import { readFileSync } from "fs";
import { fetchIllusionistDeck, fetchLearnedWizardSpells, fetchCharacters, englishName } from "./lib.mjs";
import { getContent } from "./content.mjs";
import { renderCardV2 } from "./template-v2.mjs";

const spr = await fetchIllusionistDeck({ maxLevel: 4 });
const chars = await fetchCharacters();
const nowi = chars.find((c) => c.name.includes("Nowi"));
const now = await fetchLearnedWizardSpells(nowi.id);
const byName = new Map();
for (const s of [...spr, ...now]) byName.set(englishName(s), s);
const deck = [...byName.values()];

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 768, height: 1146 }, deviceScaleFactor: 1 });
const over = [];
let maxLen = 0, maxName = "";
for (const s of deck) {
  const { rules, artPath, stats } = await getContent(s);
  if (rules.length > maxLen) { maxLen = rules.length; maxName = englishName(s); }
  const artB64 = readFileSync(artPath).toString("base64");
  await p.setContent(renderCardV2(s, { rules, artB64, stats, classLabel: "Illusionist" }), { waitUntil: "networkidle" });
  const px = await p.evaluate(() => { const d = document.querySelector(".desc"); return d.scrollHeight - d.clientHeight; });
  if (px > 2) over.push(`${englishName(s)} (${rules.length} Z., +${px}px)`);
}
await b.close();
console.log(`Geprüft: ${deck.length} | längster Text: ${maxName} (${maxLen} Z.)`);
console.log(`Überlauf: ${over.length}`);
over.forEach((o) => console.log("  " + o));
