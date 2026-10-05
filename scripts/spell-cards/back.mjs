// Rendert die gemeinsame, CHARAKTERUNABHÄNGIGE Karten-Rückseite (App-Palette +
// echtes Chaos-Forge-Logo) — für Sets, die Karten mehrerer Helden mischen und
// deshalb nicht die individuellen Portrait-Rückseiten nutzen können.
// Nutzung: node back.mjs [--tarot70|--tarot] [--sub="…"] [--foot="…"] [--out=datei.png]
//   --tarot70  898×1488 px (meinspiel 70×120 mm)
//   --tarot    898×1500 px (printerstudio 70×121 mm)
//   ohne Flag  768×1146 px (meinspiel 59×91 mm)
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mkdirSync, readFileSync } from "fs";
import { fontFaceCss } from "./lib.mjs";
import { IS_TAROT, TAROT_BACK_FMT, DIR_SUFFIX } from "./tarot.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const OUT = join(HERE, "out");
const FONT_CSS = fontFaceCss();
const LOGO_B64 = readFileSync(join(ROOT, "public", "header-logo.webp")).toString("base64");

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? fallback : hit.slice(name.length + 3).replace(/^["']|["']$/g, "");
};

// Basisdesign ist auf 768×1146 gezeichnet; für Tarot proportional hochskalieren.
const W = IS_TAROT ? TAROT_BACK_FMT.W : 768;
const H = IS_TAROT ? TAROT_BACK_FMT.H : 1146;
const S = H / 1146; // Skalierungsfaktor (1 bzw. ~1.3)
const px = (n) => Math.round(n * S);

// Texte: Defaults sind bewusst neutral (kein Klassen-/Charakterbezug).
const SUB = arg("sub", "Arcane Grimoire");
const FOOT = arg("foot", "Chaos RPG");
const OUT_NAME = arg("out", IS_TAROT ? `card-back${DIR_SUFFIX}.png` : "card-back.png");

// Dezentes arkanes Runensiegel als Hintergrund-Ornament (Gold/Teal auf Purple).
function sealSVG() {
  const cx = 300, cy = 300;
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    const r1 = 250, r2 = i % 3 === 0 ? 275 : 264;
    return `<line x1="${cx + Math.cos(a) * r1}" y1="${cy + Math.sin(a) * r1}" x2="${cx + Math.cos(a) * r2}" y2="${cy + Math.sin(a) * r2}" stroke="url(#g)" stroke-width="${i % 3 === 0 ? 3 : 1.2}"/>`;
  }).join("");
  const runes = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = 220;
    const glyph = "ᚠᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛗ"[i];
    return `<text x="${cx + Math.cos(a) * r}" y="${cy + Math.sin(a) * r + 9}" text-anchor="middle" font-size="28" fill="#e0b24e" opacity=".5" font-family="serif">${glyph}</text>`;
  }).join("");
  return `<svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e6c667"/><stop offset=".55" stop-color="#3ec7bd"/><stop offset="1" stop-color="#b98729"/>
    </linearGradient></defs>
    <circle cx="${cx}" cy="${cy}" r="280" fill="none" stroke="url(#g)" stroke-width="2" opacity=".45"/>
    <circle cx="${cx}" cy="${cy}" r="250" fill="none" stroke="url(#g)" stroke-width="1" opacity=".4"/>
    ${ticks}
    <circle cx="${cx}" cy="${cy}" r="192" fill="none" stroke="url(#g)" stroke-width="1" opacity=".35"/>
    ${runes}
    <circle cx="${cx}" cy="${cy}" r="150" fill="none" stroke="url(#g)" stroke-width="1.5" opacity=".3"/>
  </svg>`;
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${FONT_CSS}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${W}px;height:${H}px;}
body{position:relative;overflow:hidden;font-family:'Cinzel',serif;color:#f1ebe0;--gold:#e0b24e;--teal:#3ec7bd;}
.bleed{position:absolute;inset:0;background:
    radial-gradient(70% 45% at 50% 34%, rgba(224,178,78,.14), transparent 62%),
    radial-gradient(80% 55% at 50% 84%, rgba(62,199,189,.12), transparent 60%),
    linear-gradient(165deg,#221a30 0%,#171122 55%,#0f0b17 100%);}
.bleed::after{content:"";position:absolute;inset:0;background:radial-gradient(150% 100% at 50% 50%,transparent 52%,rgba(0,0,0,.6));mix-blend-mode:multiply;}
.frame{position:absolute;left:${px(50)}px;top:${px(50)}px;right:${px(50)}px;bottom:${px(50)}px;border-radius:${px(24)}px;
  border:2px solid color-mix(in srgb,var(--gold) 60%,#3a3350);
  box-shadow:0 0 46px rgba(224,178,78,.12) inset,0 0 0 1px rgba(0,0,0,.5) inset;}
.frame::before{content:"";position:absolute;inset:${px(7)}px;border-radius:${px(18)}px;border:1px solid rgba(224,178,78,.28);}
.seal{position:absolute;top:50%;left:50%;transform:translate(-50%,-54%) scale(${S.toFixed(3)});opacity:.9;
  filter:drop-shadow(0 0 30px rgba(224,178,78,.2));}
.stack{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${px(30)}px;}
.logo{width:${px(520)}px;filter:drop-shadow(0 8px 30px rgba(0,0,0,.6));}
.rule{width:${px(210)}px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);}
.sub{font-family:'EB Garamond',serif;font-size:${px(22)}px;letter-spacing:.4em;text-transform:uppercase;color:#c9a85a;}
.foot{position:absolute;bottom:${px(98)}px;left:0;right:0;text-align:center;font-family:'EB Garamond',serif;
  font-size:${px(15)}px;letter-spacing:.34em;text-transform:uppercase;color:#6b5f7e;}
</style></head><body>
<div class="bleed"></div>
<div class="seal">${sealSVG()}</div>
<div class="frame"></div>
<div class="stack">
  <img class="logo" src="data:image/webp;base64,${LOGO_B64}" alt="Chaos Forge" />
  <div class="rule"></div>
  ${SUB ? `<div class="sub">${SUB}</div>` : ""}
</div>
${FOOT ? `<div class="foot">${FOOT}</div>` : ""}
</body></html>`;

(async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(OUT, OUT_NAME), clip: { x: 0, y: 0, width: W, height: H } });
  await browser.close();
  console.log(`→ out/${OUT_NAME} (${W}×${H}px, sub="${SUB}", foot="${FOOT}")`);
})();
