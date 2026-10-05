// Vorschau-Galerie v2 (App-Palette, Effekt-Bilder, Rückseite).
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const HERE = dirname(fileURLToPath(import.meta.url));
const S = join(HERE, "out", "sample-v2");
const fonts = JSON.parse(readFileSync(join(HERE, "fonts", "fonts.json"), "utf8"));
const index = JSON.parse(readFileSync(join(S, "index.json"), "utf8"));
const b64 = (p) => readFileSync(p).toString("base64");

const ACCENT = { illusion: "#b57bff", alteration: "#3ec7bd", conjuration: "#818cf8", divination: "#38bdf8", enchantment: "#fb7185" };
const face = (fam, key, w, s = "normal") =>
  fonts[key] ? `@font-face{font-family:'${fam}';font-weight:${w};font-style:${s};src:url(data:font/ttf;base64,${fonts[key]}) format('truetype');}` : "";

const card = (img, name, meta, note, accent) => `
  <figure class="card" style="--a:${accent}">
    <img src="data:image/${img.endsWith(".webp") ? "webp" : "png"};base64,${b64(img)}" alt="${name}" loading="lazy" width="768" height="1146"/>
    <figcaption><span class="n">${name}</span><span class="m">${meta}</span><span class="note">${note}</span></figcaption>
  </figure>`;

const cards = index.map((c) => card(join(S, c.file), c.name, `Level ${c.level} · ${c.school}`, `${c.chars} Zeichen`, ACCENT[c.school] || "#e0b24e")).join("\n");
const back = card(join(HERE, "out", "card-back.png"), "Chaos Forge", "Arcane Grimoire · gemeinsame Rückseite", "Rückseite", "#e0b24e");

const html = `<title>Sprocket's Illusionist Deck — v2</title>
<style>
${face("Cinzel", "Cinzel|700|normal", 700)}
${face("EB Garamond", "EB Garamond|400|normal", 400)}
${face("EB Garamond", "EB Garamond|400|italic", 400, "italic")}
:root{--bg:#0f0b17;--panel:#1c1630;--line:#2e2743;--ink:#f1ebe0;--muted:#a99fb8;--gold:#e0b24e;--teal:#3ec7bd;}
*{box-sizing:border-box;}
body{margin:0;background:radial-gradient(90% 55% at 50% -5%,rgba(224,178,78,.09),transparent 60%),var(--bg);
  color:var(--ink);font-family:'EB Garamond',Georgia,serif;line-height:1.55;-webkit-font-smoothing:antialiased;}
.wrap{max-width:1240px;margin:0 auto;padding:64px 24px 96px;}
header{border-bottom:1px solid var(--line);padding-bottom:30px;margin-bottom:44px;}
.eyebrow{font-family:system-ui,sans-serif;font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:var(--gold);margin:0 0 14px;}
h1{font-family:'Cinzel',serif;font-weight:700;font-size:clamp(30px,5vw,52px);line-height:1.05;margin:0 0 16px;text-wrap:balance;}
.lede{max-width:66ch;color:#cdc4d6;font-size:19px;margin:0;}
.facts{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px;}
.fact{border:1px solid var(--line);border-radius:10px;padding:10px 16px;background:var(--panel);}
.fact b{font-family:'Cinzel',serif;color:var(--gold);font-size:19px;display:block;line-height:1;}
.fact span{font-family:system-ui,sans-serif;font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted);}
.note-box{margin:34px 0 8px;padding:16px 20px;border-left:3px solid var(--teal);background:rgba(62,199,189,.06);border-radius:0 10px 10px 0;color:#cdd8df;font-size:16px;}
.note-box b{color:var(--ink);}
h2{font-family:'Cinzel',serif;font-weight:700;font-size:22px;margin:54px 0 22px;padding-bottom:10px;border-bottom:1px solid var(--line);}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:32px;}
.card{margin:0;}
.card img{width:100%;height:auto;display:block;border-radius:16px;border:1px solid color-mix(in srgb,var(--a) 35%,var(--line));
  box-shadow:0 14px 38px rgba(0,0,0,.55);transition:transform .18s,box-shadow .18s;}
.card:hover img{transform:translateY(-4px);box-shadow:0 22px 50px rgba(0,0,0,.65),0 0 24px color-mix(in srgb,var(--a) 30%,transparent);}
figcaption{display:flex;flex-direction:column;gap:3px;margin-top:14px;}
.n{font-family:'Cinzel',serif;font-size:17px;}
.m{font-size:14px;color:var(--a);}
.note{font-family:system-ui,sans-serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);}
footer{margin-top:70px;padding-top:24px;border-top:1px solid var(--line);color:var(--muted);font-size:14px;font-family:system-ui,sans-serif;}
@media (prefers-reduced-motion:reduce){.card:hover img{transform:none;}}
</style>
<div class="wrap">
  <header>
    <p class="eyebrow">Chaos Forge · Haptische Zauberkarten — v2</p>
    <h1>Sprocket's Illusionist Deck</h1>
    <p class="lede">Neues Design in der App-Palette (Deep Purple · Gold · Teal): pro Zauber ein
      KI-generiertes <em>Effekt-Bild</em>, zweckoptimierter Regeltext mit festem Zeichenlimit
      (einheitliche Schriftgröße, keine Wiederholung der Stat-Werte), echtes Chaos-Forge-Logo auf der Rückseite.</p>
    <div class="facts">
      <div class="fact"><b>131</b><span>Karten (Level 1–4)</span></div>
      <div class="fact"><b>Bild</b><span>pro Zauber (Imagen)</span></div>
      <div class="fact"><b>≤300</b><span>Zeichen · fixe Schriftgröße</span></div>
      <div class="fact"><b>Opus 4.8</b><span>Text zweckoptimiert</span></div>
      <div class="fact"><b>768×1146</b><span>px · 300 dpi · meinspiel.de</span></div>
    </div>
  </header>
  <div class="note-box"><b>Was neu ist:</b> Effekt-Illustration pro Zauber · App-Farben statt reines Teal ·
    Regeltext neu geschrieben (Change Self hatte gar keinen Text → aus AD&D-2e-Kanon rekonstruiert) ·
    lange Zauber wie Shadow Monsters stark gekürzt · keine doppelten Stat-Infos im Text · echtes Logo auf der Rückseite.</div>

  <h2>Musterkarten</h2>
  <div class="grid">
${cards}
  </div>

  <h2>Gemeinsame Rückseite</h2>
  <div class="grid">${back}</div>

  <footer>Vorschau v2 · ${index.length} Muster von 131 · Endformat 59×91 mm</footer>
</div>`;

writeFileSync(join(HERE, "out", "preview-v2.html"), html);
console.log("→ out/preview-v2.html");
