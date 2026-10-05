// Baut die Online-Galerie für das Kompendium-Set (78 Karten) als eigenständige
// HTML-Seite mit eingebetteten Bildern — der Artifact-Host erlaubt keine
// externen Ressourcen, also müssen Schriften und Karten als data:-URIs mit.
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { supa } from "./lib.mjs";

const HERE = "/Users/christoph.menke/PrivateProjects/Chaos Forge/scripts/spell-cards";
const CARDS = "/Users/christoph.menke/PrivateProjects/Chaos Forge/Kartendruck/meinspiel.de/70x120/kompendium-upload";
const DEST = process.argv[2] || "/private/tmp/kompendium.html";
const PX = 560, Q = 72;

const fonts = JSON.parse(readFileSync(join(HERE, "fonts", "fonts.json"), "utf8"));
const face = (fam, key, weight) =>
  `@font-face{font-family:'${fam}';font-style:normal;font-weight:${weight};font-display:swap;` +
  `src:url(data:font/ttf;base64,${fonts[key]}) format('truetype');}`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Beschnitt abschneiden und Ecken runden — so sieht man die Karte wie gedruckt,
// nicht das Druckdokument mit 3 mm Rand.
async function img(path) {
  const inset = 35, W = 898 - 2 * inset, H = 1488 - 2 * inset, r = 50;
  const trimmed = await sharp(readFileSync(path)).extract({ left: inset, top: inset, width: W, height: H }).toBuffer();
  const mask = Buffer.from(`<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="${r}" ry="${r}"/></svg>`);
  const rounded = await sharp(trimmed).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  return "data:image/webp;base64," + (await sharp(rounded).resize(PX).webp({ quality: Q }).toBuffer()).toString("base64");
}

// Titel und Zusatzzeile je Karte. Für Gegenstände und NPCs holen wir die echten
// Bezeichnungen aus der DB, statt sie aus dem Dateinamen zu rekonstruieren.
const sb = supa();
const { data: items } = await sb.from("magic_items").select("name,name_en,category");
const { data: npcs } = await sb.from("chronicle_npcs").select("name,location");
const slugify = (n) => n.toLowerCase().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const itemBySlug = Object.fromEntries(items.map((i) => [slugify(i.name_en || i.name), i]));
const npcBySlug = Object.fromEntries(npcs.map((n) => [slugify(n.name), n]));

const RULE_TITLES = {
  thac0: ["THAC0", "Trefferwurf-Tabelle"],
  "saves-warrior": ["Saving Throws · Warrior", "Rettungswürfe"],
  "saves-priest": ["Saving Throws · Priest", "Rettungswürfe"],
  "saves-rogue": ["Saving Throws · Rogue", "Rettungswürfe"],
  "saves-wizard": ["Saving Throws · Wizard", "Rettungswürfe"],
  attacks: ["Attacks per Round", "Angriffe & Spezialisierung"],
  str: ["Strength", "Attributstabelle"],
  "str-exceptional": ["Exceptional Strength", "18/xx für Krieger"],
  dex: ["Dexterity", "Attributstabelle"],
  con: ["Constitution", "Attributstabelle"],
  int: ["Intelligence", "Attributstabelle"],
  wis: ["Wisdom", "Attributstabelle"],
  cha: ["Charisma", "Attributstabelle"],
  "thief-base": ["Thief Skills", "Basiswerte & Backstab"],
  "thief-racial": ["Thief Skills · Racial", "Rassenanpassungen"],
  "turn-undead": ["Turning Undead", "PHB-Tabelle 61"],
  encumbrance: ["Encumbrance", "Belastung & Bewegung"],
  "wizard-slots": ["Wizard Spell Slots", "Zauber je Stufe"],
  "spell-points": ["Priest Spell Points", "Hausregel"],
  proficiencies: ["Proficiency Slots", "Waffen & Fertigkeiten"],
  "level-limits": ["Racial Level Limits", "mit Hausregel"],
  "fighting-styles": ["Fighting Styles", "Player's Option"],
  "house-rules": ["House Rules", "Chaos RPG"],
};

const BLOCKS = {
  catrina: { label: "Charakter", note: "Referenzkarte mit den stabilen Werten" },
  sprocket: { label: "Nachzügler", note: "Der Zauber, der beim ersten Set durchfiel" },
  item: { label: "Ausrüstung", note: "Was die aktiven Helden wirklich tragen — mit Besitzer, Effekten aus der Datenbank und geprüftem Artwork" },
  npc: { label: "Chronik-NPCs", note: "Porträt, Ort und Beschreibung aus eurer Chronik — nach Ort sortiert" },
  spielleiter: { label: "Spielleiter", note: "Das Artwork aus dem PIN-Gate des GM-Bereichs" },
  zustand: { label: "Zustände", note: "Zum Auslegen, solange der Zustand läuft — die Regeln stammen aus den Zauberbeschreibungen eurer eigenen Zauber" },
  zitat: { label: "Zitate", note: "Gesammelte Sprüche aus der Chronik — kein Regelwerk speichert so etwas" },
  special: { label: "Special", note: "Die Sprüche, die eine eigene Bühne verdient haben" },
};

function describe(file) {
  const stem = file.replace(/^\d+_/, "").replace(/\.png$/, "");
  const block = stem.split("-")[0];
  const rest = stem.slice(block.length + 1);
  if (block === "catrina") return ["Lady Catrina of Tiamat", "Human Crusader 11 · Lawful Neutral"];
  if (block === "spielleiter") return ["Master of Chaos", "Der Spielleiter"];
  if (block === "zustand") return [rest.replace(/^./, (c) => c.toUpperCase()), "Zustandskarte"];
  if (block === "special") return rest === "reverse"
    ? ["Zurück an den Absender", "Sonderkarte"]
    : ["East Coast, West Coast, Labskaus", "Sonderkarte"];
  if (block === "zitat") return [rest.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()), "Chronik-Zitat"];
  if (block === "sprocket") return ["Hold Person", "Sprocket · Grad 3 · Enchantment/Charm"];
  if (block === "regel") return RULE_TITLES[rest] || [rest, "Regelkarte"];
  if (block === "item") {
    const it = itemBySlug[rest];
    return [it ? it.name_en || it.name : rest, it ? `${it.category} · ${it.name}` : "Magischer Gegenstand"];
  }
  const npc = npcBySlug[rest];
  return [npc ? npc.name : rest, npc ? npc.location : "Chronik"];
}

const files = readdirSync(CARDS).filter((f) => /^\d+_/.test(f)).sort();
const groups = new Map();
for (const f of files) {
  const block = f.replace(/^\d+_/, "").split("-")[0];
  if (!groups.has(block)) groups.set(block, []);
  groups.get(block).push(f);
}

let html = "";
let n = 0;
const index = [];
for (const [block, list] of groups) {
  const b = BLOCKS[block];
  html += `<section class="blk" id="b-${block}">
    <header class="bh">
      <h2>${esc(b.label)}</h2>
      <p class="bn">${esc(b.note)}</p>
      <span class="bc">${list.length} Karten</span>
    </header>
    <div class="grid">`;
  for (const f of list) {
    const [title, meta] = describe(f);
    const src = await img(join(CARDS, f));
    html += `<figure class="card" tabindex="0" role="button" data-i="${n}" aria-label="${esc(title)} vergrößern">
      <img loading="lazy" src="${src}" alt="${esc(title)}">
      <figcaption><span class="ct">${esc(title)}</span><span class="cm">${esc(meta)}</span></figcaption>
    </figure>`;
    index.push({ t: title, m: meta, n: f.match(/^(\d+)_/)[1] });
    n++;
  }
  html += `</div></section>`;
  console.log(`  ${b.label}: ${list.length}`);
}

const page = `<title>Kompendium · 81 Karten für die Chaos-RPG-Runde</title>
<style>
${face("Cinzel", "Cinzel|700|normal", 700)}
${face("EB Garamond", "EB Garamond|400|normal", 400)}

/* Die Galerie borgt sich Schrift und Farbe von den Karten selbst: Cinzel und
   EB Garamond stehen auf jeder Karte, das Gold ist der Rahmenton. Die Fläche
   bleibt ruhiger als die Karten, damit die Artworks die Aufmerksamkeit tragen. */
:root{
  --ground:#15101f; --ground-2:#1c1629; --edge:#2e2740;
  --ink:#f0e9db; --ink-dim:#a99fb8; --gold:#e0b24e; --gold-dim:#8d6f31;
  --shadow:rgba(0,0,0,.55);
}
@media (prefers-color-scheme: light){
  :root{
    --ground:#efe9dd; --ground-2:#e5dccc; --edge:#cfc3ac;
    --ink:#241d16; --ink-dim:#6b5f4e; --gold:#8a6512; --gold-dim:#b9974a;
    --shadow:rgba(60,45,20,.22);
  }
}
:root[data-theme="light"]{
  --ground:#efe9dd; --ground-2:#e5dccc; --edge:#cfc3ac;
  --ink:#241d16; --ink-dim:#6b5f4e; --gold:#8a6512; --gold-dim:#b9974a;
  --shadow:rgba(60,45,20,.22);
}
:root[data-theme="dark"]{
  --ground:#15101f; --ground-2:#1c1629; --edge:#2e2740;
  --ink:#f0e9db; --ink-dim:#a99fb8; --gold:#e0b24e; --gold-dim:#8d6f31;
  --shadow:rgba(0,0,0,.55);
}

body{margin:0;background:var(--ground);color:var(--ink);
  font-family:'EB Garamond',Georgia,serif;font-size:18px;line-height:1.5;
  -webkit-font-smoothing:antialiased;}
.wrap{max-width:1240px;margin:0 auto;padding:0 24px 96px;}

header.top{padding:72px 0 44px;border-bottom:1px solid var(--edge);margin-bottom:56px;
  display:flex;flex-direction:column;gap:18px;}
h1{font-family:'Cinzel',serif;font-weight:700;font-size:clamp(34px,5.2vw,58px);line-height:1.04;
  margin:0;text-wrap:balance;}
.lede{max-width:62ch;color:var(--ink-dim);margin:0;font-size:20px;}
.facts{display:flex;flex-wrap:wrap;gap:10px 28px;margin-top:6px;
  font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-dim);}
.facts b{color:var(--gold);font-weight:500;font-variant-numeric:tabular-nums;}

nav.jump{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;}
nav.jump a{font-size:14px;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;
  color:var(--ink-dim);border:1px solid var(--edge);border-radius:999px;padding:7px 15px;
  transition:color .18s,border-color .18s;}
nav.jump a:hover,nav.jump a:focus-visible{color:var(--gold);border-color:var(--gold-dim);}

.blk{margin-bottom:72px;scroll-margin-top:24px;}
.bh{display:grid;grid-template-columns:1fr auto;gap:4px 20px;align-items:baseline;
  padding-bottom:14px;margin-bottom:26px;border-bottom:1px solid var(--edge);}
.bh h2{font-family:'Cinzel',serif;font-weight:700;font-size:26px;margin:0;letter-spacing:.02em;}
.bn{grid-column:1;margin:0;color:var(--ink-dim);max-width:64ch;font-size:17px;}
.bc{grid-row:1;grid-column:2;font-size:14px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--gold);font-variant-numeric:tabular-nums;white-space:nowrap;}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:30px 22px;}
.card{margin:0;cursor:zoom-in;display:flex;flex-direction:column;gap:10px;
  content-visibility:auto;contain-intrinsic-size:auto 340px;
  border:0;background:none;padding:0;border-radius:12px;}
.card img{width:100%;display:block;border-radius:9px;box-shadow:0 8px 22px var(--shadow);
  transition:transform .22s ease,box-shadow .22s ease;}
.card:hover img,.card:focus-visible img{transform:translateY(-4px);box-shadow:0 16px 34px var(--shadow);}
.card:focus-visible{outline:2px solid var(--gold);outline-offset:6px;}
figcaption{display:flex;flex-direction:column;gap:1px;}
.ct{font-size:17px;line-height:1.25;}
.cm{font-size:14px;color:var(--ink-dim);letter-spacing:.03em;}

/* Vollbild: die Regelkarten sind Tabellen, die will man lesen können. */
dialog.lb{border:0;padding:0;background:transparent;max-width:100vw;max-height:100vh;
  width:100%;height:100%;overflow:hidden;}
dialog.lb::backdrop{background:rgba(8,5,14,.93);}
.lbin{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:10px;padding:12px;box-sizing:border-box;}
.lbin img{max-width:min(96vw,640px);max-height:88vh;border-radius:14px;
  box-shadow:0 24px 60px rgba(0,0,0,.6);}
.lbcap{color:#f0e9db;text-align:center;display:flex;flex-direction:column;gap:2px;}
.lbcap .t{font-family:'Cinzel',serif;font-size:21px;}
.lbcap .m{font-size:15px;color:#a99fb8;}
.lbnav{display:flex;gap:10px;align-items:center;}
.lbnav button{font-family:'EB Garamond',serif;font-size:15px;letter-spacing:.12em;
  text-transform:uppercase;color:#f0e9db;background:rgba(255,255,255,.07);
  border:1px solid rgba(224,178,78,.4);border-radius:999px;padding:9px 20px;cursor:pointer;}
.lbnav button:hover{border-color:var(--gold);color:var(--gold);}
.lbnav button:focus-visible{outline:2px solid var(--gold);outline-offset:3px;}

footer{margin-top:20px;padding-top:26px;border-top:1px solid var(--edge);
  color:var(--ink-dim);font-size:15px;display:flex;flex-wrap:wrap;gap:6px 22px;}

@media (prefers-reduced-motion: reduce){*{transition:none!important;}}
@media (max-width:560px){
  .grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:22px 16px;}
  header.top{padding:48px 0 32px;}
}
</style>

<div class="wrap">
<header class="top">
  <h1>Kompendium</h1>
  <p class="lede">Das zweite Kartenset für die Chaos-RPG-Runde: die magische Ausrüstung der Helden, Zustandskarten zum Auslegen, das Personenverzeichnis der Chronik und die gesammelten Sprüche — 81 Karten im Tarotformat 70 × 120 mm.</p>
  <div class="facts">
    <span><b>81</b> Karten</span>
    <span><b>898 × 1488</b> px bei 300 dpi</span>
    <span><b>3 mm</b> Beschnitt</span>
    <span>Rückseite: <b>Grimoire</b>, neutral</span>
  </div>
  <nav class="jump">
    <a href="#b-catrina">Charakter</a>
    <a href="#b-sprocket">Nachzügler</a>
    <a href="#b-item">Ausrüstung</a>
    <a href="#b-zustand">Zustände</a>
    <a href="#b-npc">NPCs</a>
    <a href="#b-zitat">Zitate</a>
    <a href="#b-special">Special</a>
  </nav>
</header>

${html}

<footer>
  <span>Erzeugt aus der Chaos-Forge-Datenbank und der Regel-Engine.</span>
  <span>Jedes Artwork wurde vor der Übernahme automatisch geprüft: kein Text, keine Menschen, richtiges Motiv.</span>
</footer>
</div>

<dialog class="lb" aria-label="Karte in voller Größe">
  <div class="lbin">
    <img alt="">
    <div class="lbcap"><span class="t"></span><span class="m"></span></div>
    <div class="lbnav">
      <button type="button" data-a="prev">← Zurück</button>
      <button type="button" data-a="close">Schließen</button>
      <button type="button" data-a="next">Weiter →</button>
    </div>
  </div>
</dialog>

<script>
const cards = [...document.querySelectorAll(".card")];
const lb = document.querySelector("dialog.lb");
const lbImg = lb.querySelector("img");
const lbT = lb.querySelector(".lbcap .t");
const lbM = lb.querySelector(".lbcap .m");
let cur = 0;

function show(i){
  cur = (i + cards.length) % cards.length;
  const c = cards[cur];
  lbImg.src = c.querySelector("img").src;
  lbImg.alt = c.querySelector("img").alt;
  lbT.textContent = c.querySelector(".ct").textContent;
  lbM.textContent = c.querySelector(".cm").textContent;
  if (!lb.open) lb.showModal();
}
cards.forEach((c, i) => {
  c.addEventListener("click", () => show(i));
  c.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(i); }
  });
});
lb.addEventListener("click", (e) => {
  const a = e.target.dataset.a;
  if (a === "next") show(cur + 1);
  else if (a === "prev") show(cur - 1);
  else if (a === "close" || e.target === lb) lb.close();
});
document.addEventListener("keydown", (e) => {
  if (!lb.open) return;
  if (e.key === "ArrowRight") show(cur + 1);
  if (e.key === "ArrowLeft") show(cur - 1);
});
</script>`;

writeFileSync(DEST, page);
console.log(`\n→ ${n} Karten · ${Math.round((Buffer.byteLength(page) / 1024 / 1024) * 10) / 10} MB → ${DEST}`);
