// Vollständige Review-Galerie: ALLE fertigen Karten beider Decks, nach Deck &
// Stufe gruppiert, heruntergerechnet für ein handhabbares Artifact.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const DECKS = join(HERE, "out", "decks");
const fonts = JSON.parse(readFileSync(join(HERE, "fonts", "fonts.json"), "utf8"));
const face = (fam, key, w) =>
  fonts[key] ? `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/ttf;base64,${fonts[key]}) format('truetype');}` : "";

const SCHOOL_ACCENT = { illusion: "#b57bff", alteration: "#3ec7bd", conjuration: "#818cf8", divination: "#38bdf8", enchantment: "#fb7185" };
const titleCase = (s) => s.replace(/-/g, " ").replace(/\.png$/, "").replace(/\b\w/g, (c) => c.toUpperCase());

// Vorschau = fertige Karte: Beschnitt (3 mm) wegschneiden + Ecken (5 mm) rund &
// transparent, damit man exakt den Druck sieht. (Die Deliverable-PNGs bleiben voll.)
const MM = 11.811; // px pro mm @ 300 dpi
async function thumb(p, w = 470) {
  const inset = Math.round(3 * MM), W = Math.round(59 * MM), H = Math.round(91 * MM), r = Math.round(5 * MM);
  // 1) Beschnitt wegschneiden, 2) runde Ecken (composite auf voller Größe!), 3) verkleinern.
  const trimmed = await sharp(readFileSync(p)).extract({ left: inset, top: inset, width: W, height: H }).png().toBuffer();
  const mask = Buffer.from(`<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="${r}" ry="${r}"/></svg>`);
  const rounded = await sharp(trimmed).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  const out = await sharp(rounded).resize(w).webp({ quality: 78, alphaQuality: 92 }).toBuffer();
  return out.toString("base64");
}

async function cardHtml(p, title, meta, accent = "#e0b24e") {
  const b64 = await thumb(p);
  return `<figure class="card" style="--a:${accent}"><img src="data:image/webp;base64,${b64}" alt="${title}" loading="lazy"/>
    <figcaption><span class="n">${title}</span><span class="m">${meta}</span></figcaption></figure>`;
}

const DECK_META = [
  { slug: "sprocket", title: "Sprocket 'Fixit' Tanglewire", sub: "Illusionist · lernbare Zauber (Grad 1–4)" },
  { slug: "nowi-tarja", title: "Nowi Tarja", sub: "gelernte Magierzauber" },
];

(async () => {
  let sections = "";
  let totalCards = 0;
  for (const dm of DECK_META) {
    const deckDir = join(DECKS, dm.slug);
    if (!existsSync(deckDir)) continue;
    let deckHtml = "";
    let deckCount = 0;
    // Rückseite zuerst
    const back = join(deckDir, "card-back.png");
    if (existsSync(back)) deckHtml += `<h3>Rückseite</h3><div class="grid">${await cardHtml(back, dm.title, "Portrait-Rückseite")}</div>`;
    for (const lvl of [1, 2, 3, 4, 5, 6]) {
      const dir = join(deckDir, `level-${lvl}`);
      if (!existsSync(dir)) continue;
      const files = readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
      if (!files.length) continue;
      let cards = "";
      for (const f of files) { cards += await cardHtml(join(dir, f), titleCase(f), `Grad ${lvl}`, "#b57bff"); deckCount++; }
      deckHtml += `<h3>Grad ${lvl} <span class="cnt">${files.length}</span></h3><div class="grid">${cards}</div>`;
    }
    totalCards += deckCount;
    sections += `<section><div class="deckhead"><h2>${dm.title}</h2><p>${dm.sub} · <b>${deckCount}</b> Karten</p></div>${deckHtml}</section>`;
  }

  const html = `<title>Chaos Forge — Karten-Review</title>
<style>
${face("Cinzel", "Cinzel|700|normal", 700)}
${face("EB Garamond", "EB Garamond|400|normal", 400)}
:root{--bg:#0f0b17;--panel:#1c1630;--line:#2e2743;--ink:#f1ebe0;--muted:#a99fb8;--gold:#e0b24e;--teal:#3ec7bd;}
*{box-sizing:border-box;}
body{margin:0;background:radial-gradient(90% 50% at 50% -5%,rgba(224,178,78,.08),transparent 60%),var(--bg);color:var(--ink);font-family:'EB Garamond',Georgia,serif;}
.wrap{max-width:1320px;margin:0 auto;padding:56px 22px 90px;}
header h1{font-family:'Cinzel',serif;font-weight:700;font-size:clamp(26px,5vw,44px);margin:0 0 10px;}
.eyebrow{font-family:system-ui,sans-serif;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:var(--gold);margin:0 0 12px;}
header p{color:#cdc4d6;font-size:17px;margin:0 0 8px;max-width:70ch;}
.tip{font-family:system-ui,sans-serif;font-size:13px;color:var(--muted);}
section{margin-top:52px;}
.deckhead{border-bottom:2px solid var(--gold);padding-bottom:12px;margin-bottom:8px;}
.deckhead h2{font-family:'Cinzel',serif;font-size:26px;margin:0;}
.deckhead p{font-family:system-ui,sans-serif;font-size:13px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin:6px 0 0;}
h3{font-family:'Cinzel',serif;font-weight:700;font-size:17px;margin:34px 0 16px;color:#d9cbe6;display:flex;align-items:center;gap:10px;}
.cnt{font-family:system-ui,sans-serif;font-size:11px;color:var(--muted);border:1px solid var(--line);border-radius:20px;padding:2px 9px;}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:22px;}
.card{margin:0;}
/* Bild hat bereits runde, transparente Ecken (echte Kartenform) → drop-shadow folgt dem Alpha */
.card img{width:100%;height:auto;display:block;filter:drop-shadow(0 8px 20px rgba(0,0,0,.6));}
figcaption{display:flex;flex-direction:column;gap:2px;margin-top:9px;}
.n{font-family:'Cinzel',serif;font-size:14px;line-height:1.2;}
.m{font-size:12px;color:var(--a);}
footer{margin-top:60px;padding-top:20px;border-top:1px solid var(--line);color:var(--muted);font-size:13px;font-family:system-ui,sans-serif;}
</style>
<div class="wrap">
<header>
  <p class="eyebrow">Chaos Forge · Karten-Review</p>
  <h1>Alle fertigen Zauberkarten</h1>
  <p>Vollständige Übersicht zum Durchsehen — nach Charakter-Deck und Zaubergrad sortiert, inkl. Portrait-Rückseiten.</p>
  <p class="tip">So sieht die <b>fertig geschnittene Karte</b> aus: Beschnitt entfernt, Ecken gerundet (5&nbsp;mm) und transparent — genau das hältst du in der Hand. Gedruckt in voller 300-dpi-Auflösung. Fällt dir etwas auf (Bild, Text, Wert), sag mir Karte + Deck.</p>
</header>
${sections}
<footer>${totalCards} Karten insgesamt · Review-Ansicht</footer>
</div>`;
  writeFileSync(join(HERE, "out", "review.html"), html);
  console.log(`→ out/review.html (${totalCards} Karten)`);
})();
