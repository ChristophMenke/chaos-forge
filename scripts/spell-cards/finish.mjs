// Ein-Kommando-Resume: füllt fehlende Karten beider Decks (bis Tageslimit).
// Einfach täglich ausführen:  node finish.mjs
// Texte sind gecacht → es kostet nur noch Imagen-Bilder (max. 70/Tag).
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, readFileSync } from "fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DECKS = [
  ["sprocket", "Sprocket"],
  ["Nowi", "Nowi Tarja"],
];

function remaining(slugDir, key) {
  const rep = join(HERE, "out", "decks", slugDir, "_report.json");
  if (!existsSync(rep)) return "?";
  const d = JSON.parse(readFileSync(rep, "utf8"));
  return d.failures?.length ?? "?";
}

let totalLeft = 0;
for (const [key, label] of DECKS) {
  console.log(`\n=== ${label} ===`);
  try {
    execSync(`node "${join(HERE, "generate-deck.mjs")}" ${key}`, { stdio: "inherit" });
  } catch (e) {
    console.log(`(Deck ${label} mit Fehlern beendet — Resume beim nächsten Lauf.)`);
  }
}
// Rückseiten sicherstellen
for (const [key] of DECKS) {
  try { execSync(`node "${join(HERE, "portrait-back.mjs")}" ${key}`, { stdio: "ignore" }); } catch {}
}

console.log("\n──────────── STATUS ────────────");
const sprLeft = remaining("sprocket", "sprocket");
const nowiLeft = remaining("nowi-tarja", "Nowi");
console.log(`Sprocket: noch ${sprLeft} Bilder offen`);
console.log(`Nowi:     noch ${nowiLeft} Bilder offen`);
totalLeft = (Number(sprLeft) || 0) + (Number(nowiLeft) || 0);
if (totalLeft === 0) console.log("\n✅ ALLE KARTEN FERTIG! Ordner out/decks/ zum Hochladen bereit.");
else console.log(`\n⏳ Noch ${totalLeft} Karten. Morgen erneut 'node finish.mjs' ausführen (Imagen-Limit: 70/Tag).`);
