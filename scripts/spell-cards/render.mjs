// Rendert Zauberkarten als druckfertige PNGs (768×1146px, RGB, 300dpi).
// Nutzung:
//   node render.mjs --sample            → Musterkarten (representative Auswahl) nach out/sample/
//   node render.mjs --all               → komplettes Deck nach out/deck/level-N/
//   node render.mjs --preview           → mit Schnitt-/Sicherheitslinien (nur Kontrolle)
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { fetchIllusionistDeck, slug, englishName } from "./lib.mjs";
import { renderCardHTML } from "./template.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");
const args = process.argv.slice(2);
const preview = args.includes("--preview");
const mode = args.includes("--all") ? "all" : "sample";

function pickSamples(deck) {
  const bySchool = {};
  for (const s of deck) (bySchool[s.school] ||= []).push(s);
  const byLen = [...deck].sort((a, b) => a.description.length - b.description.length);
  const picks = new Map();
  const add = (s, why) => s && !picks.has(s.id) && picks.set(s.id, { s, why });
  // je Schule ein „mittlerer" Zauber
  for (const [school, list] of Object.entries(bySchool)) {
    const mid = [...list].sort((a, b) => a.description.length - b.description.length)[Math.floor(list.length / 2)];
    add(mid, `${school} (mittel)`);
  }
  add(byLen[0], "kürzeste Beschreibung");
  add(byLen[byLen.length - 1], "längste Beschreibung");
  const named = (re) => deck.find((s) => re.test(englishName(s)));
  add(named(/^Color Spray$/i), "Sprocket / curated EN");
  add(named(/^Shadow Monsters$/i), "OCR-Ende repariert");
  add(named(/^Sleep$/i), "OCR-Seitenzahl bereinigt");
  return [...picks.values()];
}

(async () => {
  const deck = await fetchIllusionistDeck({ maxLevel: 4 });
  console.log(`Deck: ${deck.length} Zauber (Illusionist L1–4, erlaubte Schulen)`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 768, height: 1146 }, deviceScaleFactor: 1 });

  async function renderOne(spell, outPath) {
    await page.setContent(renderCardHTML(spell, { preview }), { waitUntil: "networkidle" });
    await page.waitForFunction("window.__fitted === true", { timeout: 5000 });
    const meta = await page.evaluate(() => {
      const d = document.getElementById("desc");
      return { fitPx: d.dataset.fitPx, overflow: d.dataset.overflow };
    });
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 768, height: 1146 } });
    return meta;
  }

  if (mode === "sample") {
    const dir = join(OUT, "sample");
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const samples = pickSamples(deck);
    const index = [];
    for (const { s, why } of samples) {
      const file = `L${s.level}-${slug(englishName(s))}.png`;
      const meta = await renderOne(s, join(dir, file));
      index.push({ file, name: s.name, level: s.level, school: s.school, why, ...meta, len: s.description.length });
      console.log(`  ✓ ${file}  [${why}]  fit=${meta.fitPx}px overflow=${meta.overflow}`);
    }
    writeFileSync(join(dir, "index.json"), JSON.stringify(index, null, 2));
    console.log(`\nMuster in: ${dir}`);
  } else {
    const overflowed = [];
    for (const s of deck) {
      const dir = join(OUT, "deck", `level-${s.level}`);
      mkdirSync(dir, { recursive: true });
      const meta = await renderOne(s, join(dir, `${slug(englishName(s))}.png`));
      if (meta.overflow === "1") overflowed.push(`L${s.level} ${s.name} (${s.description.length} Z.)`);
    }
    console.log(`\nFertig: ${deck.length} Karten in ${join(OUT, "deck")}`);
    if (overflowed.length) {
      console.log(`\n⚠ ${overflowed.length} Karten mit Textüberlauf (brauchen Kürzung):`);
      overflowed.forEach((o) => console.log("   - " + o));
    }
  }
  await browser.close();
})();
