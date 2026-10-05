// Generiert ein komplettes Deck (Vorderseiten) für einen Charakter.
// Nutzung: node generate-deck.mjs <deckKey> [--force]
//   deckKey: "sprocket" | "<character name substring>"
// Resume-fähig: bereits vorhandene PNGs werden übersprungen (außer --force).
import { chromium } from "playwright";
import { mkdirSync, existsSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  fetchLearnedWizardSpells, fetchCharacters,
  slug, englishName,
} from "./lib.mjs";
import { getContent } from "./content.mjs";
import { renderCardV2 } from "./template-v2.mjs";
import { TAROT_SPELL_FMT, IS_TAROT as TAROT, DIR_SUFFIX } from "./tarot.mjs";
const CW = TAROT ? TAROT_SPELL_FMT.W : 768, CH = TAROT ? TAROT_SPELL_FMT.H : 1146;
import { readFileSync } from "fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out", TAROT ? `decks${DIR_SUFFIX}` : "decks");

const CLASS_LABEL = { illusionist: "Illusionist", mage: "Mage", thief: "Mage" };

// Kurzname, der oben mittig auf jeder Zauberkarte steht — nötig, sobald Karten
// mehrerer Helden in einem Set mit gemeinsamer Rückseite liegen. Fallback ist
// der Vorname; die Rufnamen der beiden Zauberwirker stehen hier explizit.
const OWNER_LABEL = {
  "Nowi Tarja": "Nowi",
  "Sprocket 'Fixit' Tanglewire": "FixIt",
};

// Vergrößert die Schrift von .desc, bis der Text den verfügbaren Platz nahezu
// ausfüllt (kurze Zauber → größere Schrift). Deckelt bei baseFont + 14 px, damit
// es einheitlich bleibt. Passt zusätzlich line-height leicht an, wenn noch Platz ist.
async function fitDesc(page, baseFont) {
  await page.evaluate(({ base }) => {
    const el = document.querySelector(".desc");
    if (!el) return;
    const max = base + 14;
    const fits = (px) => { el.style.fontSize = px + "px"; return el.scrollHeight <= el.clientHeight; };
    let best = base;
    for (let px = base; px <= max; px++) { if (fits(px)) best = px; else break; }
    el.style.fontSize = best + "px";
    // Wenn selbst bei Maximalschrift noch spürbar Platz frei ist, Zeilenabstand öffnen.
    if (best === max) {
      for (let lh = 136; lh <= 175; lh += 3) {
        el.style.lineHeight = lh / 100;
        if (el.scrollHeight > el.clientHeight) { el.style.lineHeight = (lh - 3) / 100; break; }
      }
    }
  }, { base: baseFont });
}

async function resolveDeck(key) {
  const chars = await fetchCharacters();
  const c = chars.find((x) => x.name.toLowerCase().includes(key.toLowerCase()));
  if (!c) throw new Error(`Kein Charakter für "${key}"`);
  // Sprockets Deck zeigt nur seine tatsächlich aktiven (vorbereiteten) Zauber,
  // nicht das komplette Illusionisten-Kompendium — slug bleibt "sprocket" (kurz,
  // wie bisher), damit bestehende Ausgabepfade/Referenzen unverändert bleiben.
  const isSprocket = key.toLowerCase() === "sprocket";
  return {
    name: c.name, slug: isSprocket ? "sprocket" : slug(c.name), classLabel: CLASS_LABEL[c.class_id] || "Mage",
    owner: OWNER_LABEL[c.name] || c.name.split(" ")[0],
    spells: await fetchLearnedWizardSpells(c.id, { preparedOnly: isSprocket }), char: c,
  };
}

(async () => {
  const key = process.argv[2];
  const force = process.argv.includes("--force");
  const regenText = process.argv.includes("--regen-text"); // Text via Opus neu (Bilder bleiben)
  if (!key) throw new Error("deckKey fehlt");
  const deck = await resolveDeck(key);
  const deckDir = join(OUT, deck.slug);
  console.log(`Deck "${deck.name}" (${deck.classLabel}) — ${deck.spells.length} Zauber → ${deckDir}`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: CW, height: CH }, deviceScaleFactor: 1 });

  const failures = [];
  let done = 0;
  for (const s of deck.spells) {
    const dir = join(deckDir, `level-${s.level}`);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${slug(englishName(s))}.png`);
    if (existsSync(file) && !force) { done++; continue; }
    try {
      const { rules, artPath, stats } = await getContent(s, { regenText });
      const artB64 = readFileSync(artPath).toString("base64");
      const baseFont = TAROT ? TAROT_SPELL_FMT.descFont : 24;
      await page.setContent(renderCardV2(s, { rules, artB64, stats, classLabel: deck.classLabel, owner: deck.owner, fmt: TAROT ? TAROT_SPELL_FMT : undefined }), { waitUntil: "networkidle" });
      await fitDesc(page, baseFont); // Beschreibungstext vergrößern, bis der Platz gefüllt ist
      await page.screenshot({ path: file, clip: { x: 0, y: 0, width: CW, height: CH } });
      done++;
      if (done % 10 === 0 || done === deck.spells.length) console.log(`  ${done}/${deck.spells.length}`);
    } catch (e) {
      console.log(`  ⚠ ${englishName(s)} (L${s.level}): ${e.message}`);
      failures.push({ name: englishName(s), level: s.level, error: e.message });
    }
  }
  await browser.close();
  writeFileSync(join(deckDir, "_report.json"), JSON.stringify({ deck: deck.name, total: deck.spells.length, done, failures }, null, 2));
  console.log(`\nFertig: ${done}/${deck.spells.length} Karten. Fehler: ${failures.length}`);
  if (failures.length) console.log("  Erneut ausführen füllt fehlende Karten (Resume).");
})();
