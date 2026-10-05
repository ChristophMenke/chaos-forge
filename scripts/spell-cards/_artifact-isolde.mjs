import { readFileSync, writeFileSync } from "fs";
import sharp from "sharp";
const CARDS = "/Users/christoph.menke/PrivateProjects/Chaos Forge/scripts/spell-cards/out/char-cards";
const FONTS = "/Users/christoph.menke/PrivateProjects/Chaos Forge/scripts/spell-cards/fonts/fonts.json";
const OUT = "/private/tmp/claude-501/-Users-christoph-menke-PrivateProjects-Chaos-Forge/54af248a-253a-4c5a-b096-fc1169d3729c/scratchpad/isolde-cards.html";
const fonts = JSON.parse(readFileSync(FONTS, "utf8"));
const cinzel = fonts["Cinzel|700|normal"];
async function webp(file) {
  const buf = await sharp(readFileSync(`${CARDS}/${file}`)).webp({ quality: 88 }).toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}
const shadow = await webp("epic-shadowdancer.png");
const ring = await webp("epic-ring-of-many-faces.png");
const ref = await webp("reference-isolde.png");
const html = `<style>
@font-face{font-family:'Cinzel';font-weight:700;font-display:swap;src:url(data:font/ttf;base64,${cinzel}) format('truetype');}
:root{--ground:#100b1a;--panel:#191326;--ink:#f1ebe0;--muted:#a99fb8;--line:rgba(224,178,78,.20);--gold:#e0b24e;--rogue:#7d97e8;--glow:rgba(224,178,78,.10);}
@media (prefers-color-scheme: light){:root{--ground:#efeae2;--panel:#fbf8f2;--ink:#251e33;--muted:#6a6076;--line:rgba(120,90,30,.24);--gold:#9a6f1e;--rogue:#3f56b0;--glow:rgba(120,90,30,.08);}}
:root[data-theme="dark"]{--ground:#100b1a;--panel:#191326;--ink:#f1ebe0;--muted:#a99fb8;--line:rgba(224,178,78,.20);--gold:#e0b24e;--rogue:#7d97e8;--glow:rgba(224,178,78,.10);}
:root[data-theme="light"]{--ground:#efeae2;--panel:#fbf8f2;--ink:#251e33;--muted:#6a6076;--line:rgba(120,90,30,.24);--gold:#9a6f1e;--rogue:#3f56b0;--glow:rgba(120,90,30,.08);}
*{box-sizing:border-box;}
body{margin:0;color:var(--ink);background:radial-gradient(120% 70% at 50% -8%,var(--glow),transparent 60%),var(--ground);font-family:Georgia,'Iowan Old Style',serif;line-height:1.55;-webkit-font-smoothing:antialiased;}
.wrap{max-width:1160px;margin:0 auto;padding:clamp(40px,7vw,84px) clamp(20px,4vw,40px) 96px;}
.eyebrow{font-family:system-ui,sans-serif;font-size:12px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold);margin:0 0 16px;}
h1{font-family:'Cinzel',Georgia,serif;font-weight:700;font-size:clamp(40px,8vw,76px);line-height:.98;margin:0;text-wrap:balance;letter-spacing:.01em;}
.sub{font-family:system-ui,sans-serif;font-size:clamp(13px,2vw,15px);letter-spacing:.2em;text-transform:uppercase;color:var(--rogue);margin:14px 0 0;}
.lede{max-width:60ch;color:var(--muted);font-size:clamp(16px,2.2vw,19px);margin:20px 0 0;}
h2{font-family:'Cinzel',Georgia,serif;font-weight:700;font-size:clamp(19px,3vw,24px);letter-spacing:.02em;margin:clamp(52px,7vw,76px) 0 26px;padding-bottom:12px;border-bottom:1px solid var(--line);display:flex;align-items:baseline;gap:14px;}
h2 .cnt{font-family:system-ui,sans-serif;font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);}
.grid{display:grid;gap:clamp(24px,4vw,40px);grid-template-columns:repeat(auto-fit,minmax(280px,1fr));}
.grid.solo{grid-template-columns:minmax(0,420px);justify-content:start;}
figure{margin:0;}
.frame{display:block;border-radius:16px;overflow:hidden;background:var(--panel);border:1px solid var(--line);box-shadow:0 18px 46px rgba(0,0,0,.42);transition:transform .28s ease,box-shadow .28s ease;}
a.frame:focus-visible{outline:2px solid var(--gold);outline-offset:3px;}
a.frame:hover{transform:translateY(-5px);box-shadow:0 26px 60px rgba(0,0,0,.55);}
.frame img{width:100%;height:auto;display:block;}
figcaption{margin-top:16px;}
.cap-n{font-family:'Cinzel',Georgia,serif;font-weight:700;font-size:19px;}
.cap-m{font-family:system-ui,sans-serif;font-size:13px;letter-spacing:.03em;color:var(--muted);margin-top:3px;}
.cap-m b{color:var(--rogue);font-weight:600;}
.foot{margin-top:72px;padding-top:22px;border-top:1px solid var(--line);font-family:system-ui,sans-serif;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;}
.foot .mark{color:var(--gold);}
@media (prefers-reduced-motion: reduce){a.frame{transition:none;}a.frame:hover{transform:none;}}
</style>
<div class="wrap">
  <header>
    <p class="eyebrow">Chaos Forge · Heldin</p>
    <h1>Isolde</h1>
    <p class="sub">Tiefling · Diebin · Neutral Good · Stufe 9</p>
    <p class="lede">Zwei neue epische Gegenstände und ihre Referenzkarte — druckfertig im Chaos-Forge-Look. Klick eine Karte für die volle Auflösung.</p>
  </header>
  <h2>Epische Ausrüstung <span class="cnt">2 neu</span></h2>
  <div class="grid">
    <figure><a class="frame" href="${shadow}" target="_blank" rel="noopener"><img src="${shadow}" alt="Karte: Shadowdancer"></a>
      <figcaption><div class="cap-n">Schattentänzer</div><div class="cap-m"><b>Umhang</b> · Progressive Schatten-Kräfte, Stufe 3–10</div></figcaption></figure>
    <figure><a class="frame" href="${ring}" target="_blank" rel="noopener"><img src="${ring}" alt="Karte: Ring of Many Faces"></a>
      <figcaption><div class="cap-n">Ring der vielen Gesichter</div><div class="cap-m"><b>Ring</b> · Alter Self → Change Self → Polymorph Self</div></figcaption></figure>
  </div>
  <h2>Referenz <span class="cnt">stabile Werte</span></h2>
  <div class="grid solo">
    <figure><a class="frame" href="${ref}" target="_blank" rel="noopener"><img src="${ref}" alt="Referenzkarte: Isolde"></a>
      <figcaption><div class="cap-n">Isolde — Referenz</div><div class="cap-m">Attribute + Modifikatoren, live aus der Datenbank · Spielerin <b>Mascha</b></div></figcaption></figure>
  </div>
  <div class="foot"><span>Lokale Print-Assets · nicht im Repo</span><span class="mark">Chaos Forge</span></div>
</div>`;
writeFileSync(OUT, html);
console.log(`→ ${Math.round(Buffer.byteLength(html)/1024)} KB`);
