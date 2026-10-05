// Tarot-Alternativentwurf (70×120 mm = 898×1488 px @300dpi). Separater Ordner,
// überschreibt NICHT das 59×91-Format.
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import sharp from "sharp";
import { fetchIllusionistDeck, fetchLearnedWizardSpells, fetchCharacters, englishName } from "./lib.mjs";
import { getContent } from "./content.mjs";
import { renderCardV2 } from "./template-v2.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out", "tarot");
const fonts = JSON.parse(readFileSync(join(HERE, "fonts", "fonts.json"), "utf8"));
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// Tarot 70×120 mm + 3 mm Beschnitt → Datenformat 76×126 mm
const MM = 11.811;
const W = Math.round(76 * MM), H = Math.round(126 * MM); // 898 × 1488
const FMT = { W, H, artH: 620, bodyTop: 606, bodyBottom: 84, descFont: 26 };
const SAMPLE = ["Fireball", "Confusion", "Color Spray", "Shadow Monsters", "Clairvoyance", "Magic Missile"];

(async () => {
  const spr = await fetchIllusionistDeck({ maxLevel: 4 });
  const chars = await fetchCharacters();
  const nowi = chars.find((c) => c.name.includes("Nowi"));
  const now = await fetchLearnedWizardSpells(nowi.id);
  const byName = new Map();
  for (const s of [...spr, ...now]) byName.set(englishName(s), s);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const picks = [];
  for (const nm of SAMPLE) {
    const s = byName.get(nm);
    if (!s) continue;
    const { rules, artPath, stats } = await getContent(s);
    const artB64 = readFileSync(artPath).toString("base64");
    await page.setContent(renderCardV2(s, { rules, artB64, stats, classLabel: "Illusionist", fmt: FMT }), { waitUntil: "networkidle" });
    const file = `${nm.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    await page.screenshot({ path: join(OUT, file), clip: { x: 0, y: 0, width: W, height: H } });
    picks.push({ file, name: nm });
    console.log("✓", nm);
  }
  await browser.close();

  // Vorschau-Galerie (fertig geschnitten: 70×120 mm, Ecken rund)
  const inset = Math.round(3 * MM), EW = Math.round(70 * MM), EH = Math.round(120 * MM), r = Math.round(5 * MM);
  const face = (fam, key, w) => (fonts[key] ? `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/ttf;base64,${fonts[key]}) format('truetype');}` : "");
  const cells = [];
  for (const p of picks) {
    const trimmed = await sharp(readFileSync(join(OUT, p.file))).extract({ left: inset, top: inset, width: EW, height: EH }).png().toBuffer();
    const mask = Buffer.from(`<svg width="${EW}" height="${EH}"><rect width="${EW}" height="${EH}" rx="${r}" ry="${r}"/></svg>`);
    const roundedFull = await sharp(trimmed).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
    const rounded = await sharp(roundedFull).resize(430).webp({ quality: 80 }).toBuffer();
    cells.push(`<figure class="card"><img src="data:image/webp;base64,${rounded.toString("base64")}"><figcaption>${p.name}</figcaption></figure>`);
  }
  const html = `<title>Chaos Forge — Tarot-Entwurf</title>
<style>${face("Cinzel", "Cinzel|700|normal", 700)}${face("EB Garamond", "EB Garamond|400|normal", 400)}
:root{--bg:#0f0b17;--line:#2e2743;--ink:#f1ebe0;--gold:#e0b24e;--muted:#a99fb8;}*{box-sizing:border-box;}
body{margin:0;background:radial-gradient(90% 55% at 50% -5%,rgba(224,178,78,.09),transparent 60%),var(--bg);color:var(--ink);font-family:'EB Garamond',Georgia,serif;}
.wrap{max-width:1240px;margin:0 auto;padding:60px 24px 90px;}
.eyebrow{font-family:system-ui;font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:var(--gold);margin:0 0 12px;}
h1{font-family:'Cinzel',serif;font-size:clamp(28px,5vw,46px);margin:0 0 14px;}
.lede{max-width:66ch;color:#cdc4d6;font-size:18px;margin:0 0 8px;}.tip{color:var(--muted);font-size:14px;font-family:system-ui;}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:30px;margin-top:34px;}
.card{margin:0;}.card img{width:100%;display:block;filter:drop-shadow(0 10px 26px rgba(0,0,0,.6));}
figcaption{font-family:'Cinzel',serif;font-size:16px;margin-top:12px;}</style>
<div class="wrap"><p class="eyebrow">Chaos Forge · Format-Alternative</p>
<h1>Tarot-Entwurf (70 × 120 mm)</h1>
<p class="lede">Alternatives, größeres Kartenformat — mehr Bildhöhe und größere Schrift. Das bestehende 59×91-mm-Deck bleibt unverändert; dies ist ein separater Musterset zum Vergleich.</p>
<p class="tip">Fertig-geschnittene Ansicht (Beschnitt weg, Ecken rund). Tarot ist schmaler &amp; höher als Poker-Format.</p>
<div class="grid">${cells.join("")}</div></div>`;
  writeFileSync(join(OUT, "tarot-preview.html"), html);
  console.log("\n→ out/tarot/ + tarot-preview.html");
})();
