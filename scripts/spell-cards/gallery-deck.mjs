// Vorschau der FERTIGEN Deck-Karten (Sample, heruntergerechnet für kleines Artifact).
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const SPR = join(HERE, "out", "decks", "sprocket");
const fonts = JSON.parse(readFileSync(join(HERE, "fonts", "fonts.json"), "utf8"));
const face = (fam, key, w, s = "normal") =>
  fonts[key] ? `@font-face{font-family:'${fam}';font-weight:${w};font-style:${s};src:url(data:font/ttf;base64,${fonts[key]}) format('truetype');}` : "";

async function thumb(p) {
  const buf = await sharp(readFileSync(p)).resize(520).webp({ quality: 80 }).toBuffer();
  return buf.toString("base64");
}

// Sample: bis zu 3 Fronts je Level 1–4
function sampleFronts() {
  const picks = [];
  for (const lvl of [1, 2, 3, 4]) {
    const dir = join(SPR, `level-${lvl}`);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter((f) => f.endsWith(".png"));
    for (const f of files.slice(0, 3)) picks.push({ path: join(dir, f), level: lvl, name: f.replace(/-/g, " ").replace(".png", "") });
  }
  return picks;
}

(async () => {
  const fronts = sampleFronts();
  const cards = [];
  for (const fr of fronts) cards.push({ b64: await thumb(fr.path), title: fr.name.replace(/\b\w/g, (c) => c.toUpperCase()), meta: `Level ${fr.level}`, note: "Vorderseite" });

  const backs = [];
  const sprBack = join(SPR, "card-back.png");
  const nowiBack = join(HERE, "out", "decks", "nowi-tarja", "card-back.png");
  if (existsSync(sprBack)) backs.push({ b64: await thumb(sprBack), title: "Sprocket", meta: "Portrait-Rückseite", note: "Rückseite" });
  if (existsSync(nowiBack)) backs.push({ b64: await thumb(nowiBack), title: "Nowi Tarja", meta: "Portrait-Rückseite", note: "Rückseite" });

  const cardHtml = (c, accent) => `<figure class="card" style="--a:${accent}">
    <img src="data:image/webp;base64,${c.b64}" alt="${c.title}" loading="lazy"/>
    <figcaption><span class="n">${c.title}</span><span class="m">${c.meta}</span><span class="note">${c.note}</span></figcaption></figure>`;

  const html = `<title>Chaos Forge — Deck (fertige Karten)</title>
<style>
${face("Cinzel", "Cinzel|700|normal", 700)}
${face("EB Garamond", "EB Garamond|400|normal", 400)}
:root{--bg:#0f0b17;--panel:#1c1630;--line:#2e2743;--ink:#f1ebe0;--muted:#a99fb8;--gold:#e0b24e;--teal:#3ec7bd;}
*{box-sizing:border-box;}
body{margin:0;background:radial-gradient(90% 55% at 50% -5%,rgba(224,178,78,.09),transparent 60%),var(--bg);color:var(--ink);font-family:'EB Garamond',Georgia,serif;line-height:1.55;}
.wrap{max-width:1240px;margin:0 auto;padding:60px 24px 90px;}
header{border-bottom:1px solid var(--line);padding-bottom:28px;margin-bottom:40px;}
.eyebrow{font-family:system-ui,sans-serif;font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:var(--gold);margin:0 0 12px;}
h1{font-family:'Cinzel',serif;font-weight:700;font-size:clamp(28px,5vw,48px);margin:0 0 14px;}
.lede{max-width:66ch;color:#cdc4d6;font-size:18px;margin:0;}
.facts{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px;}
.fact{border:1px solid var(--line);border-radius:10px;padding:9px 15px;background:var(--panel);}
.fact b{font-family:'Cinzel',serif;color:var(--gold);font-size:18px;display:block;line-height:1;}
.fact span{font-family:system-ui,sans-serif;font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted);}
.note-box{margin:30px 0 8px;padding:15px 18px;border-left:3px solid var(--teal);background:rgba(62,199,189,.06);border-radius:0 10px 10px 0;color:#cdd8df;font-size:15px;}
h2{font-family:'Cinzel',serif;font-weight:700;font-size:21px;margin:48px 0 20px;padding-bottom:9px;border-bottom:1px solid var(--line);}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:26px;}
.card{margin:0;}
.card img{width:100%;height:auto;display:block;border-radius:13px;border:1px solid color-mix(in srgb,var(--a) 35%,var(--line));box-shadow:0 12px 30px rgba(0,0,0,.5);}
figcaption{display:flex;flex-direction:column;gap:2px;margin-top:11px;}
.n{font-family:'Cinzel',serif;font-size:15px;}
.m{font-size:13px;color:var(--a);}
.note{font-family:system-ui,sans-serif;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);}
footer{margin-top:60px;padding-top:22px;border-top:1px solid var(--line);color:var(--muted);font-size:13px;font-family:system-ui,sans-serif;}
</style>
<div class="wrap"><header>
  <p class="eyebrow">Chaos Forge · Fertige Deck-Karten</p>
  <h1>Sprocket's Illusionist Deck</h1>
  <p class="lede">Erste 70 fertig produzierte Karten (Text + KI-Effektbild) plus die individuellen Portrait-Rückseiten. Auswahl heruntergerechnet für schnelle Vorschau.</p>
  <div class="facts">
    <div class="fact"><b>70 / 131</b><span>Sprocket-Fronts fertig</span></div>
    <div class="fact"><b>131</b><span>Texte gecacht</span></div>
    <div class="fact"><b>70 / Tag</b><span>Imagen-Bildlimit</span></div>
    <div class="fact"><b>+30</b><span>Nowi (folgt)</span></div>
  </div>
  <div class="note-box"><b>Hinweis:</b> Google Imagen erlaubt nur 70 Bilder/Tag. Die restlichen 61 Sprocket- + 30 Nowi-Karten werden in den nächsten Tagen automatisch nachgezogen (Texte sind bereits fertig).</div>
</header>
  <h2>Portrait-Rückseiten</h2>
  <div class="grid">${backs.map((b) => cardHtml(b, "#e0b24e")).join("")}</div>
  <h2>Vorderseiten (Auswahl aus den 70 fertigen)</h2>
  <div class="grid">${cards.map((c) => cardHtml(c, "#b57bff")).join("")}</div>
  <footer>Fertige Karten · 768×1146 px · 300 dpi · meinspiel.de 59×91 mm</footer>
</div>`;
  writeFileSync(join(HERE, "out", "deck-preview.html"), html);
  console.log("→ out/deck-preview.html (", cards.length, "Fronts +", backs.length, "Rückseiten )");
})();
