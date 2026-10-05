// Baut eine Vorschau-Galerie (out/preview.html) mit base64-eingebetteten Karten.
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const HERE = dirname(fileURLToPath(import.meta.url));
const SAMPLE = join(HERE, "out", "sample");
const fonts = JSON.parse(readFileSync(join(HERE, "fonts", "fonts.json"), "utf8"));

const index = JSON.parse(readFileSync(join(SAMPLE, "index.json"), "utf8"));
const b64 = (f) => readFileSync(join(SAMPLE, f)).toString("base64");
const backB64 = readFileSync(join(HERE, "out", "card-back.png")).toString("base64");

const SCHOOL_EN = {
  illusion: "Illusion",
  alteration: "Alteration",
  conjuration: "Conjuration",
  divination: "Divination",
  enchantment: "Enchantment",
};
const SCHOOL_ACCENT = {
  illusion: "#b57bff",
  alteration: "#2dd4bf",
  conjuration: "#818cf8",
  divination: "#38bdf8",
  enchantment: "#fb7185",
};

const face = (fam, key, w, s = "normal") =>
  fonts[key]
    ? `@font-face{font-family:'${fam}';font-weight:${w};font-style:${s};font-display:swap;src:url(data:font/ttf;base64,${fonts[key]}) format('truetype');}`
    : "";

const cards = index
  .map((c) => {
    const accent = SCHOOL_ACCENT[c.school] || "#d4b483";
    const school = SCHOOL_EN[c.school] || "Universal";
    return `
    <figure class="card" style="--a:${accent}">
      <img src="data:image/png;base64,${b64(c.file)}" alt="${c.name}" loading="lazy" width="768" height="1146" />
      <figcaption>
        <span class="cap-name">${c.name}</span>
        <span class="cap-meta">Level ${c.level} · ${school}</span>
        <span class="cap-note">${c.why}</span>
      </figcaption>
    </figure>`;
  })
  .join("\n");

const html = `<title>Sprocket's Illusionist Deck — Vorschau</title>
<style>
${face("Cinzel", "Cinzel|700|normal", 700)}
${face("EB Garamond", "EB Garamond|400|normal", 400)}
${face("EB Garamond", "EB Garamond|400|italic", 400, "italic")}
:root{
  --bg:#080d12; --panel:#0e161d; --line:#1e2b36;
  --ink:#eef2f4; --muted:#8ea0ad; --teal:#2dd4bf;
}
*{box-sizing:border-box;}
body{margin:0;background:
    radial-gradient(90% 60% at 50% -5%, rgba(45,212,191,.10), transparent 60%),
    var(--bg);
  color:var(--ink);font-family:'EB Garamond',Georgia,serif;
  -webkit-font-smoothing:antialiased;line-height:1.55;}
.wrap{max-width:1200px;margin:0 auto;padding:64px 24px 96px;}
header{border-bottom:1px solid var(--line);padding-bottom:32px;margin-bottom:48px;}
.eyebrow{font-family:system-ui,sans-serif;font-size:12px;letter-spacing:.32em;
  text-transform:uppercase;color:var(--teal);margin:0 0 14px;}
h1{font-family:'Cinzel',serif;font-weight:700;font-size:clamp(30px,5vw,52px);
  line-height:1.05;margin:0 0 16px;text-wrap:balance;}
.lede{max-width:64ch;color:#c4d0d8;font-size:19px;margin:0;}
.facts{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px;}
.fact{border:1px solid var(--line);border-radius:10px;padding:10px 16px;background:var(--panel);}
.fact b{font-family:'Cinzel',serif;color:var(--teal);font-size:20px;display:block;line-height:1;}
.fact span{font-family:system-ui,sans-serif;font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted);}
.note{margin:36px 0 8px;padding:16px 20px;border-left:3px solid var(--teal);
  background:rgba(45,212,191,.06);border-radius:0 10px 10px 0;color:#cdd8df;font-size:16px;}
.note b{color:var(--ink);}
h2{font-family:'Cinzel',serif;font-weight:700;font-size:22px;margin:56px 0 22px;
  padding-bottom:10px;border-bottom:1px solid var(--line);}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:32px;}
.card{margin:0;}
.card img{width:100%;height:auto;display:block;border-radius:14px;
  border:1px solid color-mix(in srgb, var(--a) 40%, var(--line));
  box-shadow:0 12px 34px rgba(0,0,0,.5), 0 0 0 1px rgba(0,0,0,.4);
  transition:transform .18s ease, box-shadow .18s ease;}
.card:hover img{transform:translateY(-4px);
  box-shadow:0 20px 46px rgba(0,0,0,.6), 0 0 22px color-mix(in srgb,var(--a) 30%,transparent);}
figcaption{display:flex;flex-direction:column;gap:3px;margin-top:14px;padding-left:2px;}
.cap-name{font-family:'Cinzel',serif;font-size:17px;color:var(--ink);}
.cap-meta{font-size:14px;color:var(--a);}
.cap-note{font-family:system-ui,sans-serif;font-size:11px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted);}
footer{margin-top:72px;padding-top:24px;border-top:1px solid var(--line);
  color:var(--muted);font-size:14px;font-family:system-ui,sans-serif;}
@media (prefers-reduced-motion:reduce){.card:hover img{transform:none;}}
</style>
<div class="wrap">
  <header>
    <p class="eyebrow">Chaos Forge · Haptische Zauberkarten</p>
    <h1>Sprocket's Illusionist Deck</h1>
    <p class="lede">Druckfertige Zauberkarten für <em>Sprocket „Fixit" Tanglewire</em> — alles, was ein
      Illusionist der Stufe 8 lernen &amp; wirken kann. Einheitlich englisch, AD&amp;D-2e-Terminologie,
      metrische Werte, im Chaos-Forge-Look (Akzentfarbe je Zauberschule).</p>
    <div class="facts">
      <div class="fact"><b>131</b><span>Karten (Level 1–4)</span></div>
      <div class="fact"><b>5</b><span>Schulen</span></div>
      <div class="fact"><b>768×1146</b><span>px · 300 dpi · 65×97 mm</span></div>
      <div class="fact"><b>meinspiel.de</b><span>59×91 mm · RGB PNG</span></div>
    </div>
  </header>

  <div class="note"><b>Datenqualität:</b> Von 131 Karten waren nur 2 tief OCR-korrupt
    (Shadow Monsters, Sleep) — beide aus der Original-PHB rekonstruiert. Silbentrennung,
    eingestreute Seitenzahlen und deutsche Restbegriffe sind automatisch bereinigt.</div>

  <h2>Gemeinsame Rückseite</h2>
  <div class="grid">
    <figure class="card" style="--a:#2dd4bf">
      <img src="data:image/png;base64,${backB64}" alt="Kartenrückseite" loading="lazy" width="768" height="1146" />
      <figcaption>
        <span class="cap-name">Chaos Forge</span>
        <span class="cap-meta">Arcane Grimoire · für alle Karten identisch</span>
        <span class="cap-note">Rückseite</span>
      </figcaption>
    </figure>
  </div>

  <h2>Musterkarten — je eine pro Zauberschule + Sonderfälle</h2>
  <div class="grid">
${cards}
  </div>

  <footer>Vorschau · ${index.length} von 131 Karten · Endformat 59×91 mm (abgerundete Ecken werden beim Druck gestanzt)</footer>
</div>`;

writeFileSync(join(HERE, "out", "preview.html"), html);
console.log("→ out/preview.html geschrieben (", index.length, "Karten eingebettet )");
