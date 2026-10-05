// NPC-Karte aus der Chronik: Portrait, Ort und Beschreibungstext.
// Anders als die übrigen Karten ist diese DEUTSCH — der Text stammt wörtlich
// aus eurer Chronik und wird nicht übersetzt.
//
// data: { name, location, text, portraitB64, accent, accent2, fmt }
import { escapeHtml, fontFaceCss } from "./lib.mjs";
const FONT_CSS = fontFaceCss();

export function renderNpcCard(data) {
  const F = data.fmt || { W: 768, H: 1146, artH: 620, bodyTop: 606, bodyBottom: 78, fs: 1 };
  const px = (n) => Math.round(n * (F.fs || 1));

  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
${FONT_CSS}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${F.W}px;height:${F.H}px;}
body{position:relative;overflow:hidden;font-family:'EB Garamond',Georgia,serif;color:#f1ebe0;
  --gold:#e0b24e;--a:${data.accent || "#e0b24e"};--a2:${data.accent2 || "#a1782f"};}
.bleed{position:absolute;inset:0;background:linear-gradient(165deg,#211a30 0%,#171122 55%,#100b18 100%);}
/* Porträts von oben ausrichten: Gesichter sitzen im oberen Bilddrittel. */
.portrait{position:absolute;top:0;left:0;width:${F.W}px;height:${F.artH}px;background:#0f0b16 center top/cover no-repeat;
  ${data.portraitB64 ? `background-image:url(data:image/webp;base64,${data.portraitB64});` : ""}}
.portrait::after{content:"";position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(16,11,24,.06) 0%,transparent 30%,transparent 60%,rgba(16,11,24,.94) 89%,#100b18 100%);}
.frame{position:absolute;left:66px;top:66px;right:66px;bottom:66px;border-radius:22px;
  border:2px solid color-mix(in srgb,var(--gold) 60%,#3a3350);
  box-shadow:0 0 0 1px rgba(0,0,0,.5) inset,0 0 46px rgba(0,0,0,.55) inset;pointer-events:none;}
.frame::before{content:"";position:absolute;inset:7px;border-radius:16px;border:1px solid color-mix(in srgb,var(--gold) 30%,transparent);}
.loc{position:absolute;top:${px(96)}px;right:${px(96)}px;z-index:3;
  background:linear-gradient(160deg,var(--a),var(--a2));border-radius:999px;padding:${px(9)}px ${px(20)}px;
  font:600 ${px(17)}px/1 'EB Garamond',serif;letter-spacing:.16em;text-transform:uppercase;color:#fff;
  box-shadow:0 4px 16px rgba(0,0,0,.5);max-width:${px(400)}px;text-align:center;}
.body{position:absolute;left:${px(96)}px;right:${px(96)}px;top:${F.bodyTop}px;bottom:${F.bodyBottom}px;z-index:2;
  display:flex;flex-direction:column;}
.title{font-family:'Cinzel',serif;font-weight:700;font-size:${px(48)}px;line-height:1.04;color:#fbf6ea;
  text-shadow:0 2px 12px rgba(0,0,0,.6);text-wrap:balance;}
.rule{height:2px;margin:${px(16)}px 0 ${px(20)}px;background:linear-gradient(90deg,var(--gold),transparent);}
.text{font-size:${px(data.textFont || 26)}px;line-height:1.42;color:#e9e2d6;hyphens:auto;}
.foot{margin-top:auto;padding-top:${px(14)}px;border-top:1px solid rgba(224,178,78,.22);
  display:flex;justify-content:space-between;font:600 ${px(14)}px/1 'EB Garamond',serif;
  letter-spacing:.16em;text-transform:uppercase;color:#8f84a0;}
.foot .cf{color:var(--gold);}
</style></head><body>
<div class="bleed"></div><div class="portrait"></div><div class="frame"></div>
<div class="loc">${escapeHtml(data.location)}</div>
<div class="body">
  <div class="title">${escapeHtml(data.name)}</div>
  <div class="rule"></div>
  <div class="text">${escapeHtml(data.text)}</div>
  <div class="foot"><span>Chronik des Chaos</span><span class="cf">Chaos Forge</span></div>
</div>
</body></html>`;
}
