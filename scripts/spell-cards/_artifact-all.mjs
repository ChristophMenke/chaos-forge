import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import sharp from "sharp";
const HERE = "/Users/christoph.menke/PrivateProjects/Chaos Forge/scripts/spell-cards";
const OUT = join(HERE, "out");
const DEST = "/private/tmp/claude-501/-Users-christoph-menke-PrivateProjects-Chaos-Forge/54af248a-253a-4c5a-b096-fc1169d3729c/scratchpad/all-cards.html";
const fonts = JSON.parse(readFileSync(join(HERE, "fonts", "fonts.json"), "utf8"));
const cinzel = fonts["Cinzel|700|normal"];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const SPELL_PX = 430, SPELL_Q = 66, BIG_PX = 600, BIG_Q = 80;
async function img(path, size, q) {
  const inset = 35, W = 697, H = 1075, r = 50;
  const trimmed = await sharp(readFileSync(path)).extract({ left: inset, top: inset, width: W, height: H }).toBuffer();
  const mask = Buffer.from(`<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="${r}" ry="${r}"/></svg>`);
  const rounded = await sharp(trimmed).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  return "data:image/webp;base64," + (await sharp(rounded).resize(size).webp({ quality: q }).toBuffer()).toString("base64");
}
const deslug = (f) => f.replace(/\.png$/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
let I = 0;
async function tile(path, size, q, name, meta) {
  const src = await img(path, size, q);
  const title = name || deslug(path.split("/").pop());
  const cap = name ? `<figcaption><span class="tn">${esc(name)}</span>${meta ? `<span class="tm">${esc(meta)}</span>` : ""}</figcaption>` : "";
  return `<button class="t" data-i="${I++}" data-t="${esc(title)}" data-m="${esc(meta || "")}"><img loading="lazy" src="${src}" alt="${esc(title)}">${cap}</button>`;
}
// Rückseiten haben abweichende Maße (Tarot 898×1488) → nicht zuschneiden, nur skalieren (Ecken via CSS).
async function imgFull(path, size, q) {
  return "data:image/webp;base64," + (await sharp(readFileSync(path)).resize(size).webp({ quality: q }).toBuffer()).toString("base64");
}
async function backTile(path, size, q, name, meta) {
  const src = await imgFull(path, size, q);
  return `<button class="t" data-i="${I++}" data-t="${esc(name)}" data-m="${esc(meta || "")}"><img loading="lazy" src="${src}" alt="${esc(name)}"><figcaption><span class="tn">${esc(name)}</span><span class="tm">${esc(meta)}</span></figcaption></button>`;
}
const REF = [["reference-larry.png","Larry","Mensch · Krieger"],["reference-sprocket-fixit-tanglewire.png","Sprocket","Gnom · Illusionist"],["reference-nowi-tarja.png","Nowi Tarja","Elf · Dieb/Magier"],["reference-isolde.png","Isolde","Tiefling · Diebin"]];
const EPIC = [["epic-blade-of-water.png","Blade of Water","Larry · Waffe"],["epic-shadowdancer.png","Shadowdancer","Isolde · Umhang"],["epic-ring-of-many-faces.png","Ring of Many Faces","Isolde · Ring"],["epic-constitution-condenser.png","Constitution Condenser","Sprocket · Gerät"],["epic-mix-and-match-blades.png","Mix-and-Match Blades","Sprocket · Klingen"],["epic-sharpvision-goggles.png","Sharpvision Goggles","Sprocket · Brille"]];
const SPELLCHARS = [{ key:"nowi-tarja", name:"Nowi Tarja", note:"Elf · Dieb/Magier" },{ key:"sprocket", name:"Sprocket", note:"Gnom · Illusionist" }];
const BACKS = [
  ["decks-tarot/larry/card-back.png","Larry","Rückseite · Krieger"],
  ["decks-tarot/sprocket/card-back.png","Sprocket","Rückseite · Illusionist"],
  ["decks-tarot/nowi-tarja/card-back.png","Nowi Tarja","Rückseite · Arcane Trickster"],
  ["decks-tarot/isolde/card-back.png","Isolde","Rückseite · Diebin"],
  ["card-back.png","Arcane Grimoire","Standard-Rückseite"],
];
(async () => {
  const refTiles = [];
  for (const [f,n,m] of REF) if (existsSync(join(OUT,"char-cards",f))) refTiles.push(await tile(join(OUT,"char-cards",f), BIG_PX, BIG_Q, n, m));
  const epicTiles = [];
  for (const [f,n,m] of EPIC) if (existsSync(join(OUT,"char-cards",f))) epicTiles.push(await tile(join(OUT,"char-cards",f), BIG_PX, BIG_Q, n, m));
  const backTiles = [];
  for (const [f,n,m] of BACKS) if (existsSync(join(OUT,f))) backTiles.push(await backTile(join(OUT,f), BIG_PX, BIG_Q, n, m));
  let spellHtml = "", spellTotal = 0;
  for (const c of SPELLCHARS) {
    const base = join(OUT,"decks",c.key);
    if (!existsSync(base)) continue;
    const levels = readdirSync(base).filter((d) => d.startsWith("level-")).sort();
    let charCount = 0, levelBlocks = "";
    for (const lv of levels) {
      const dir = join(base, lv);
      const files = readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
      if (!files.length) continue;
      const tiles = [];
      for (const f of files) { tiles.push(await tile(join(dir,f), SPELL_PX, SPELL_Q, deslug(f), `${c.name} · Stufe ${lv.replace("level-","")}`)); charCount++; spellTotal++; }
      levelBlocks += `<div class="lvl"><div class="lvlh"><span class="chip">Stufe ${lv.replace("level-","")}</span><span class="lvlc">${files.length} Zauber</span></div><div class="grid spells">${tiles.join("")}</div></div>`;
    }
    spellHtml += `<h3>${c.name} <span class="h3note">${c.note} · ${charCount}</span></h3>${levelBlocks}`;
  }
  const total = refTiles.length + epicTiles.length + backTiles.length + spellTotal;
  const html = `<style>
@font-face{font-family:'Cinzel';font-weight:700;font-display:swap;src:url(data:font/ttf;base64,${cinzel}) format('truetype');}
:root{--ground:#100b1a;--panel:#191326;--ink:#f1ebe0;--muted:#a99fb8;--line:rgba(224,178,78,.20);--gold:#e0b24e;--rogue:#7d97e8;--glow:rgba(224,178,78,.10);}
@media (prefers-color-scheme:light){:root{--ground:#efeae2;--panel:#fbf8f2;--ink:#251e33;--muted:#6a6076;--line:rgba(120,90,30,.24);--gold:#9a6f1e;--rogue:#3f56b0;--glow:rgba(120,90,30,.08);}}
:root[data-theme="dark"]{--ground:#100b1a;--panel:#191326;--ink:#f1ebe0;--muted:#a99fb8;--line:rgba(224,178,78,.20);--gold:#e0b24e;--rogue:#7d97e8;--glow:rgba(224,178,78,.10);}
:root[data-theme="light"]{--ground:#efeae2;--panel:#fbf8f2;--ink:#251e33;--muted:#6a6076;--line:rgba(120,90,30,.24);--gold:#9a6f1e;--rogue:#3f56b0;--glow:rgba(120,90,30,.08);}
*{box-sizing:border-box;}
body{margin:0;color:var(--ink);background:radial-gradient(120% 60% at 50% -6%,var(--glow),transparent 60%),var(--ground);font-family:Georgia,'Iowan Old Style',serif;line-height:1.5;-webkit-font-smoothing:antialiased;}
.wrap{max-width:1280px;margin:0 auto;padding:clamp(40px,6vw,80px) clamp(18px,4vw,40px) 100px;}
.eyebrow{font-family:system-ui,sans-serif;font-size:12px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold);margin:0 0 14px;}
h1{font-family:'Cinzel',Georgia,serif;font-weight:700;font-size:clamp(38px,7vw,72px);line-height:1;margin:0;text-wrap:balance;}
.lede{max-width:62ch;color:var(--muted);font-size:clamp(16px,2vw,19px);margin:18px 0 0;}
.hint{font-family:system-ui,sans-serif;font-size:13px;color:var(--muted);margin:14px 0 0;display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;}
.hint kbd{font-family:ui-monospace,monospace;font-size:11px;border:1px solid var(--line);border-radius:5px;padding:2px 6px;color:var(--ink);}
h2{font-family:'Cinzel',Georgia,serif;font-weight:700;font-size:clamp(20px,3vw,26px);margin:clamp(52px,7vw,78px) 0 24px;padding-bottom:12px;border-bottom:1px solid var(--line);display:flex;align-items:baseline;gap:14px;}
h2 .cnt{font-family:system-ui,sans-serif;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);}
h3{font-family:'Cinzel',Georgia,serif;font-weight:700;font-size:clamp(17px,2.4vw,21px);margin:38px 0 18px;display:flex;align-items:baseline;gap:12px;}
h3 .h3note{font-family:system-ui,sans-serif;font-size:12.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--rogue);}
.grid{display:grid;gap:clamp(16px,2.4vw,28px);}
.grid.big{grid-template-columns:repeat(auto-fill,minmax(180px,1fr));}
.grid.spells{grid-template-columns:repeat(auto-fill,minmax(122px,1fr));gap:14px;}
.lvl{margin:0 0 26px;}
.lvlh{display:flex;align-items:center;gap:12px;margin:0 0 14px;}
.chip{font-family:system-ui,sans-serif;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);border:1px solid var(--line);border-radius:999px;padding:5px 13px;}
.lvlc{font-family:system-ui,sans-serif;font-size:12.5px;color:var(--muted);}
.t{margin:0;padding:0;border:0;background:none;cursor:pointer;display:block;text-align:left;width:100%;font:inherit;color:inherit;}
.t img{width:100%;height:auto;display:block;border-radius:11px;filter:drop-shadow(0 8px 20px rgba(0,0,0,.42));transition:transform .22s ease;}
.t:hover img{transform:translateY(-4px) scale(1.02);}
.t:focus-visible{outline:2px solid var(--gold);outline-offset:4px;border-radius:13px;}
figcaption{margin-top:11px;display:flex;flex-direction:column;gap:2px;}
.tn{font-family:'Cinzel',Georgia,serif;font-weight:700;font-size:15.5px;}
.tm{font-family:system-ui,sans-serif;font-size:12.5px;color:var(--muted);}
.foot{margin-top:74px;padding-top:22px;border-top:1px solid var(--line);font-family:system-ui,sans-serif;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;}
.foot .mark{color:var(--gold);}
.lb{position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;background:rgba(7,5,12,.95);backdrop-filter:blur(7px);}
.lb.on{display:flex;}
.lb img{height:min(86vh,760px);width:auto;max-width:94vw;object-fit:contain;border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.7);}
.lbcap{position:fixed;left:0;right:0;bottom:22px;text-align:center;font-family:system-ui,sans-serif;font-size:14px;color:#e9e2d6;display:flex;gap:12px;justify-content:center;align-items:baseline;flex-wrap:wrap;padding:0 16px;}
.lbcap b{font-family:'Cinzel',Georgia,serif;font-weight:700;font-size:16px;color:#fff;}
.lbcap .pos{font-variant-numeric:tabular-nums;color:var(--gold);letter-spacing:.12em;}
.nav{position:fixed;top:50%;transform:translateY(-50%);width:56px;height:56px;border-radius:50%;border:1px solid rgba(224,178,78,.35);background:rgba(20,15,32,.72);color:#f1ebe0;font-size:26px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .18s,border-color .18s,transform .18s;}
.nav:hover{background:rgba(224,178,78,.18);border-color:var(--gold);}
.nav:active{transform:translateY(-50%) scale(.93);}
#lbPrev{left:max(16px,3vw);}#lbNext{right:max(16px,3vw);}
#lbClose{position:fixed;top:max(16px,2.5vw);right:max(16px,3vw);width:46px;height:46px;border-radius:50%;border:1px solid rgba(224,178,78,.35);background:rgba(20,15,32,.72);color:#f1ebe0;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
#lbClose:hover{background:rgba(224,178,78,.18);border-color:var(--gold);}
.nav:focus-visible,#lbClose:focus-visible{outline:2px solid var(--gold);outline-offset:3px;}
@media (max-width:640px){.nav{width:46px;height:46px;font-size:22px;}}
@media (prefers-reduced-motion:reduce){.t img,.nav{transition:none;}.t:hover img{transform:none;}}
</style>
<div class="wrap">
<p class="eyebrow">Chaos Forge · Kartenarchiv</p>
<h1>Alle Karten</h1>
<p class="lede">Das komplette Deck der Runde — ${total} Karten: Helden-Referenzen, epische Ausrüstung und die Zaubersammlungen von Nowi Tarja und Sprocket, nach Stufe geordnet.</p>
<p class="hint">Karte anklicken für Vollbild · <kbd>←</kbd> <kbd>→</kbd> blättern · <kbd>Esc</kbd> schließen</p>
<h2>Helden-Referenz <span class="cnt">${refTiles.length}</span></h2><div class="grid big">${refTiles.join("")}</div>
<h2>Epische Ausrüstung <span class="cnt">${epicTiles.length}</span></h2><div class="grid big">${epicTiles.join("")}</div>
<h2>Kartenrückseiten <span class="cnt">${backTiles.length}</span></h2><div class="grid big">${backTiles.join("")}</div>
<h2>Zauber <span class="cnt">${spellTotal}</span></h2>
${spellHtml}
<div class="foot"><span>Lokale Print-Assets · ${total} Karten</span><span class="mark">Chaos Forge</span></div>
</div>
<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Kartenansicht" tabindex="-1">
  <button class="nav" id="lbPrev" aria-label="Vorherige Karte">‹</button>
  <img id="lbImg" alt="">
  <button class="nav" id="lbNext" aria-label="Nächste Karte">›</button>
  <button id="lbClose" aria-label="Schließen">✕</button>
  <div class="lbcap" id="lbCap"></div>
</div>
<script>
(function(){
  var tiles=[].slice.call(document.querySelectorAll('.t'));
  var lb=document.getElementById('lb'),img=document.getElementById('lbImg'),cap=document.getElementById('lbCap'),idx=0;
  function render(){var el=tiles[idx];img.src=el.querySelector('img').src;var t=el.dataset.t||'',m=el.dataset.m||'';
    cap.innerHTML=(t?'<b>'+t+'</b>':'')+(m?'<span>'+m+'</span>':'')+'<span class="pos">'+(idx+1)+' / '+tiles.length+'</span>';}
  function open(i){idx=i;render();lb.classList.add('on');document.body.style.overflow='hidden';lb.focus();}
  function close(){lb.classList.remove('on');document.body.style.overflow='';}
  function nav(d){idx=(idx+d+tiles.length)%tiles.length;render();}
  tiles.forEach(function(el,i){el.addEventListener('click',function(){open(i);});});
  document.getElementById('lbPrev').addEventListener('click',function(e){e.stopPropagation();nav(-1);});
  document.getElementById('lbNext').addEventListener('click',function(e){e.stopPropagation();nav(1);});
  document.getElementById('lbClose').addEventListener('click',close);
  lb.addEventListener('click',function(e){if(e.target===lb)close();});
  document.addEventListener('keydown',function(e){if(!lb.classList.contains('on'))return;
    if(e.key==='Escape')close();else if(e.key==='ArrowLeft')nav(-1);else if(e.key==='ArrowRight')nav(1);});
  var x0=null;
  lb.addEventListener('touchstart',function(e){x0=e.touches[0].clientX;},{passive:true});
  lb.addEventListener('touchend',function(e){if(x0==null)return;var dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>45)nav(dx<0?1:-1);x0=null;});
})();
</script>`;
  writeFileSync(DEST, html);
  console.log(`→ ${total} Karten · ${Math.round(Buffer.byteLength(html)/1024/1024*10)/10} MB`);
})();
