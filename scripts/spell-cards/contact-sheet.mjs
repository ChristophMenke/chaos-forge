// Kontaktabzug aller Effekt-Bilder (zur visuellen Prüfung), Seiten à 40.
import { chromium } from "playwright";
import { readFileSync, existsSync, mkdirSync, rmSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { fetchIllusionistDeck, fetchLearnedWizardSpells, fetchCharacters, englishName, slug } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ART = join(HERE, "cache", "art");
const OUT = join(HERE, "out", "audit");

(async () => {
  const spr = await fetchIllusionistDeck({ maxLevel: 4 });
  const chars = await fetchCharacters();
  const nowi = chars.find((c) => c.name.includes("Nowi"));
  const now = await fetchLearnedWizardSpells(nowi.id);
  const byName = new Map();
  for (const s of [...spr, ...now]) byName.set(englishName(s), s); // dedupe nach EN-Name
  const items = [...byName.values()]
    .map((s) => ({ name: englishName(s), level: s.level, path: join(ART, `${slug(englishName(s))}.webp`) }))
    .filter((it) => existsSync(it.path))
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log(`${items.length} Bilder → Kontaktabzug`);
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const PER = 40; // 5×8
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const pages = Math.ceil(items.length / PER);
  for (let p = 0; p < pages; p++) {
    const slice = items.slice(p * PER, p * PER + PER);
    const cells = slice.map((it, i) => {
      const n = p * PER + i + 1;
      const b64 = readFileSync(it.path).toString("base64");
      return `<div class="cell"><div class="num">${n}</div><img src="data:image/webp;base64,${b64}"/><div class="lbl">${it.name} <b>L${it.level}</b></div></div>`;
    }).join("");
    const html = `<!doctype html><meta charset="utf-8"><style>
      *{margin:0;box-sizing:border-box;}body{background:#0f0b17;font-family:system-ui,sans-serif;padding:16px;}
      .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;}
      .cell{position:relative;background:#1c1630;border:1px solid #2e2743;border-radius:8px;overflow:hidden;}
      .cell img{width:100%;height:150px;object-fit:cover;display:block;}
      .num{position:absolute;top:3px;left:5px;color:#e0b24e;font-weight:700;font-size:13px;text-shadow:0 1px 3px #000;}
      .lbl{color:#e7ddcf;font-size:12px;padding:5px 7px;line-height:1.15;}
      .lbl b{color:#b57bff;}
      </style><div class="grid">${cells}</div>`;
    await page.setContent(html, { waitUntil: "networkidle" });
    const el = await page.$(".grid");
    await el.screenshot({ path: join(OUT, `page-${p + 1}.png`) });
    console.log(`  Seite ${p + 1}/${pages} (${slice.length} Bilder)`);
  }
  await browser.close();
  console.log(`→ ${OUT}`);
})();
