// Baut eine lokale Vorschau-Galerie ALLER Tarot-Karten (Spell-Decks + Charakter-
// karten + Rückseiten). Enthält einen 1:1-Umschalter (echte 70×120 mm) zur
// Lesbarkeitsprüfung am Bildschirm. Lokal öffnen (relative Bildpfade).
import { readdirSync, existsSync, writeFileSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, relative } from "path";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");
const GALLERY = join(OUT, "tarot-gallery.html");

const walkPngs = (dir) => {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walkPngs(p));
    else if (n.endsWith(".png")) out.push(p);
  }
  return out.sort();
};
const rel = (p) => relative(OUT, p);
const cap = (s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const titleFromPath = (p) => {
  const parts = p.split("/");
  const base = parts.pop().replace(/\.png$/, "");
  if (base === "card-back") return `${cap(parts.pop())} · Rückseite`; // Ordnername = Charakter
  return cap(base);
};

// ── Kartengruppen sammeln ──
const groups = [];

// Charakterkarten (Referenz + Epic)
const charDir = join(OUT, "char-cards-tarot");
const charPngs = walkPngs(charDir);
const refs = charPngs.filter((p) => p.includes("/reference-"));
const epics = charPngs.filter((p) => p.includes("/epic-"));
if (refs.length) groups.push({ title: "Helden-Referenzkarten", note: "Nur stabile Werte (Attribute + Modifikatoren) — veralten nicht durch Stufenaufstieg.", cards: refs });
if (epics.length) groups.push({ title: "Epische Ausrüstung", note: "Item-Karten mit Fähigkeiten & Stufen-Effekten.", cards: epics });

// Charakter-Rückseiten (alle, in einer Gruppe): decks-tarot/*/card-back.png
const backsDir = join(OUT, "decks-tarot");
if (existsSync(backsDir)) {
  const backs = readdirSync(backsDir)
    .map((d) => join(backsDir, d, "card-back.png"))
    .filter((p) => existsSync(p))
    .sort();
  if (backs.length) groups.push({ title: "Charakter-Rückseiten", note: "Individuelle Portrait-Rückseiten (auch für Nicht-Zauberer).", cards: backs });
}

// Spell-Decks je Charakter (nur Vorderseiten)
for (const deckSlug of ["sprocket", "nowi-tarja"]) {
  const deckDir = join(OUT, "decks-tarot", deckSlug);
  if (!existsSync(deckDir)) continue;
  const spells = walkPngs(deckDir).filter((p) => !p.endsWith("card-back.png"));
  const label = deckSlug === "sprocket" ? "Sprocket · Illusionisten-Deck" : "Nowi Tarja · gelernte Magier-Zauber";
  if (spells.length) groups.push({ title: `${label} (${spells.length} Zauber)`, note: "Vorderseiten, nach Zauberstufe sortiert.", cards: spells });
}

const total = groups.reduce((n, g) => n + g.cards.length, 0);

// Flache, geordnete Liste aller Karten (für Lightbox-Navigation per Pfeil).
const flat = [];
for (const g of groups) for (const p of g.cards) flat.push({ src: rel(p), title: titleFromPath(p), group: g.title });

let idx = -1;
const section = (g) => `
  <section>
    <h2>${g.title} <span class="count">${g.cards.length}</span></h2>
    <p class="note">${g.note}</p>
    <div class="grid">
      ${g.cards.map((p) => { idx++; return `<figure data-i="${idx}"><img loading="lazy" src="${rel(p)}" alt=""><figcaption>${titleFromPath(p)}</figcaption></figure>`; }).join("\n      ")}
    </div>
  </section>`;

const html = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Chaos Forge — Tarot-Karten Vorschau</title>
<style>
  :root{--bg:#0f0b17;--panel:#171122;--gold:#e0b24e;--teal:#3ec7bd;--muted:#8f84a0;--text:#f1ebe0;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:radial-gradient(80% 50% at 50% 0%,#1c1530,transparent),var(--bg);color:var(--text);
    font-family:'Iowan Old Style',Georgia,serif;padding:0 0 120px;}
  header{position:sticky;top:0;z-index:10;background:rgba(15,11,23,.86);backdrop-filter:blur(14px);
    border-bottom:1px solid rgba(224,178,78,.25);padding:20px 32px;display:flex;align-items:center;gap:24px;flex-wrap:wrap;}
  header h1{font-size:24px;font-weight:700;letter-spacing:.02em;}
  header h1 small{display:block;font-size:13px;font-weight:400;color:var(--muted);letter-spacing:.16em;text-transform:uppercase;margin-top:4px;}
  .spacer{flex:1;}
  .toggle{display:flex;gap:8px;align-items:center;}
  .toggle button{cursor:pointer;border:1px solid rgba(224,178,78,.4);background:transparent;color:var(--text);
    font:600 13px/1 system-ui;letter-spacing:.06em;padding:10px 16px;border-radius:999px;transition:.15s;}
  .toggle button.active{background:linear-gradient(160deg,var(--gold),#a1782f);color:#1a1206;border-color:transparent;}
  .hint{font-size:12px;color:var(--muted);max-width:260px;line-height:1.4;}
  main{padding:32px;max-width:1600px;margin:0 auto;}
  section{margin-bottom:56px;}
  h2{font-size:20px;color:var(--gold);border-bottom:1px solid rgba(224,178,78,.2);padding-bottom:10px;margin-bottom:6px;
    display:flex;align-items:center;gap:12px;}
  h2 .count{font:600 12px/1 system-ui;color:var(--muted);background:var(--panel);padding:5px 10px;border-radius:999px;}
  .note{color:var(--muted);font-size:14px;margin-bottom:20px;}
  .grid{display:grid;gap:26px;grid-template-columns:repeat(auto-fill,minmax(var(--cardw,240px),1fr));}
  figure{background:var(--panel);border:1px solid rgba(224,178,78,.14);border-radius:12px;overflow:hidden;
    box-shadow:0 10px 30px rgba(0,0,0,.4);transition:transform .15s,box-shadow .15s;cursor:zoom-in;}
  figure:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,.55);}
  figure img{width:100%;display:block;background:#0b0812;}
  figcaption{font:600 10px/1.3 system-ui,sans-serif;color:var(--muted);text-align:center;padding:8px 6px;
    letter-spacing:.12em;text-transform:uppercase;opacity:.7;}
  /* 1:1 Physik-Modus: echte 70×120 mm Kartengröße */
  body.physical .grid{grid-template-columns:repeat(auto-fill,70mm);gap:32px;justify-content:center;}
  body.physical figure{width:70mm;}
  body.physical figure img{width:70mm;height:120mm;object-fit:cover;}
  body.physical figcaption{display:none;}
  /* Lightbox (Vollbild + Pfeil-Navigation) */
  .lb{position:fixed;inset:0;z-index:100;display:none;background:rgba(8,6,14,.94);backdrop-filter:blur(6px);}
  .lb.open{display:flex;align-items:center;justify-content:center;}
  .lb img{max-width:min(92vw,calc(92vh*0.6));max-height:92vh;border-radius:14px;
    box-shadow:0 30px 90px rgba(0,0,0,.7),0 0 0 1px rgba(224,178,78,.25);}
  .lb .cap{position:fixed;top:22px;left:0;right:0;text-align:center;color:var(--text);
    font:600 14px/1.4 system-ui;letter-spacing:.08em;text-transform:uppercase;pointer-events:none;}
  .lb .cap small{display:block;color:var(--muted);font-size:11px;letter-spacing:.12em;margin-top:4px;}
  .lb .nav{position:fixed;top:50%;transform:translateY(-50%);width:64px;height:64px;border-radius:50%;
    border:1px solid rgba(224,178,78,.4);background:rgba(23,17,34,.85);color:var(--gold);cursor:pointer;
    font-size:30px;line-height:1;display:flex;align-items:center;justify-content:center;transition:.15s;user-select:none;}
  .lb .nav:hover{background:var(--gold);color:#1a1206;}
  .lb .prev{left:28px;} .lb .next{right:28px;}
  .lb .close{position:fixed;top:20px;right:26px;width:46px;height:46px;border-radius:50%;
    border:1px solid rgba(224,178,78,.35);background:rgba(23,17,34,.85);color:var(--text);cursor:pointer;
    font-size:24px;display:flex;align-items:center;justify-content:center;transition:.15s;}
  .lb .close:hover{background:rgba(224,178,78,.25);}
  @media (max-width:640px){.lb .nav{width:52px;height:52px;font-size:26px;}.lb .prev{left:10px;}.lb .next{right:10px;}}
</style></head>
<body>
<header>
  <h1>Chaos Forge — Tarot-Karten<small>70 × 120 mm · meinspiel.de · ${total} Karten</small></h1>
  <div class="spacer"></div>
  <div class="hint" id="hint">Ansicht: Galerie (Karten füllen das Raster).</div>
  <div class="toggle">
    <button id="btnFit" class="active">Galerie</button>
    <button id="btnPhysical">1:1 (echte Größe)</button>
  </div>
</header>
<main>
  ${groups.map(section).join("\n")}
</main>
<div class="lb" id="lb">
  <div class="cap" id="lbCap"></div>
  <button class="close" id="lbClose" title="Schließen (Esc)">✕</button>
  <button class="nav prev" id="lbPrev" title="Zurück (←)">‹</button>
  <img id="lbImg" src="" alt="">
  <button class="nav next" id="lbNext" title="Weiter (→)">›</button>
</div>
<script>
  const body=document.body,hint=document.getElementById('hint');
  const bf=document.getElementById('btnFit'),bp=document.getElementById('btnPhysical');
  bf.onclick=()=>{body.classList.remove('physical');bf.classList.add('active');bp.classList.remove('active');
    hint.textContent='Ansicht: Galerie (Karten füllen das Raster).';};
  bp.onclick=()=>{body.classList.add('physical');bp.classList.add('active');bf.classList.remove('active');
    hint.textContent='Ansicht: 1:1 — jede Karte wird in echter Druckgröße (70×120 mm) angezeigt. Halte ein Lineal an den Bildschirm zur Kontrolle.';};

  // ── Lightbox ──
  const CARDS=${JSON.stringify(flat)};
  const lb=document.getElementById('lb'),lbImg=document.getElementById('lbImg'),lbCap=document.getElementById('lbCap');
  let cur=-1;
  function show(i){
    cur=(i+CARDS.length)%CARDS.length;
    const c=CARDS[cur];
    lbImg.src=c.src;
    lbCap.innerHTML=c.title+' <small>'+c.group+' · '+(cur+1)+' / '+CARDS.length+'</small>';
    // Nächstes Bild vorladen für flüssiges Blättern
    new Image().src=CARDS[(cur+1)%CARDS.length].src;
  }
  function open(i){show(i);lb.classList.add('open');}
  function close(){lb.classList.remove('open');lbImg.src='';}
  document.querySelectorAll('figure[data-i]').forEach(f=>{
    f.addEventListener('click',()=>open(+f.dataset.i));
  });
  document.getElementById('lbPrev').onclick=e=>{e.stopPropagation();show(cur-1);};
  document.getElementById('lbNext').onclick=e=>{e.stopPropagation();show(cur+1);};
  document.getElementById('lbClose').onclick=close;
  lb.addEventListener('click',e=>{if(e.target===lb)close();}); // Klick auf Hintergrund schließt
  document.addEventListener('keydown',e=>{
    if(!lb.classList.contains('open'))return;
    if(e.key==='Escape')close();
    else if(e.key==='ArrowLeft')show(cur-1);
    else if(e.key==='ArrowRight')show(cur+1);
  });
</script>
</body></html>`;

writeFileSync(GALLERY, html);
console.log(`→ ${GALLERY}`);
console.log(`   ${groups.length} Gruppen, ${total} Karten.`);
