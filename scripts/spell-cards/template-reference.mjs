// Helden-Referenzkarte: Portrait + STABILE Attribute/Modifikatoren (nichts
// Stufen-Abhängiges wie ETW0/RK/TP/Rettungswürfe).
import { escapeHtml, fontFaceCss } from "./lib.mjs";
const FONT_CSS = fontFaceCss();

// data: { name, subtitle, badge, accent, accent2, portraitB64,
//         abilities:[{abbr,score,sub,lines:[..]}], footer:[{label,value}] }
export function renderReferenceCard(data) {
  const F = data.fmt || { W: 768, H: 1146, portraitH: 700, bodyTop: 678, bodyBottom: 78, fs: 1 };
  const px = (n) => Math.round(n * F.fs);
  const cells = data.abilities
    .map((a) => `<div class="ab">
      <div class="abh"><span class="abn">${a.abbr}</span><span class="abs">${a.score}</span>${a.sub ? `<span class="absub">${escapeHtml(a.sub)}</span>` : ""}</div>
      <div class="abl">${a.lines.map((l) => `<span>${escapeHtml(l)}</span>`).join("")}</div>
    </div>`).join("");
  const foot = data.footer.map((f) => `<div class="ft"><span class="fl">${escapeHtml(f.label)}</span><span class="fv">${escapeHtml(f.value)}</span></div>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
${FONT_CSS}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${F.W}px;height:${F.H}px;}
body{position:relative;overflow:hidden;font-family:'EB Garamond',Georgia,serif;color:#f1ebe0;--gold:#e0b24e;--a:${data.accent};--a2:${data.accent2};}
.bleed{position:absolute;inset:0;background:linear-gradient(165deg,#211a30 0%,#171122 55%,#100b18 100%);}
.portrait{position:absolute;top:0;left:0;width:${F.W}px;height:${F.portraitH}px;background:#0f0b16 center 18%/cover no-repeat;${data.portraitB64 ? `background-image:url(data:image/webp;base64,${data.portraitB64});` : ""}}
.portrait::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(16,11,24,.08) 0%,transparent 32%,transparent 62%,rgba(16,11,24,.92) 90%,#100b18 100%);}
.frame{position:absolute;left:66px;top:66px;right:66px;bottom:66px;border-radius:22px;border:2px solid color-mix(in srgb,var(--gold) 60%,#3a3350);box-shadow:0 0 0 1px rgba(0,0,0,.5) inset,0 0 46px rgba(0,0,0,.55) inset;pointer-events:none;}
.frame::before{content:"";position:absolute;inset:7px;border-radius:16px;border:1px solid color-mix(in srgb,var(--gold) 30%,transparent);}
.badge{position:absolute;top:80px;left:84px;width:76px;height:84px;z-index:3;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);
  background:linear-gradient(160deg,var(--a),var(--a2));display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.55);}
.badge .l{font:600 11px/1 'EB Garamond',serif;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.85);}
.badge .n{font:700 34px/1 'Cinzel',serif;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.55);}
/* Titel + Untertitel von UNTEN verankert: ein langer Name wächst nach oben ins
   Portrait, statt das Werte-Grid darunter zu verschieben/stauchen. */
.head{position:absolute;left:84px;right:84px;bottom:${F.H - (F.bodyTop + px(78))}px;z-index:2;}
.stats{position:absolute;left:84px;right:84px;top:${F.bodyTop + px(78)}px;bottom:${F.bodyBottom}px;display:flex;flex-direction:column;z-index:2;}
.title{font-family:'Cinzel',serif;font-weight:700;font-size:${px(46)}px;line-height:1.02;color:#fbf6ea;text-shadow:0 2px 12px rgba(0,0,0,.6);text-wrap:balance;}
.sub{font:600 ${px(15)}px/1 'EB Garamond',serif;letter-spacing:.18em;text-transform:uppercase;color:var(--a);margin-top:8px;}
.rule{height:2px;margin:0 0 16px;background:linear-gradient(90deg,var(--gold),transparent);}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 26px;}
.ab{border-left:2px solid color-mix(in srgb,var(--gold) 55%,transparent);padding-left:12px;}
.abh{display:flex;align-items:baseline;gap:8px;}
.abn{font:600 ${px(13)}px/1 'EB Garamond',serif;letter-spacing:.16em;text-transform:uppercase;color:#9a8fae;}
.abs{font-family:'Cinzel',serif;font-weight:700;font-size:${px(28)}px;color:#fbf6ea;line-height:1;}
.absub{font-size:${px(13)}px;color:var(--a);font-style:italic;}
.abl{display:flex;flex-wrap:wrap;gap:2px 14px;margin-top:4px;}
.abl span{font-size:${px(17)}px;color:#dfe7ec;}
.foot{margin-top:auto;padding-top:12px;border-top:1px solid rgba(224,178,78,.22);display:flex;flex-wrap:wrap;gap:6px 26px;}
.ft{display:flex;flex-direction:column;}
.fl{font:600 ${px(11)}px/1 'EB Garamond',serif;letter-spacing:.14em;text-transform:uppercase;color:#8f84a0;}
.fv{font-size:${px(18)}px;color:#efe8dc;margin-top:2px;}
</style></head><body>
<div class="bleed"></div><div class="portrait"></div><div class="frame"></div>
<div class="head">
  <div class="title">${escapeHtml(data.name)}</div>
  <div class="sub">${escapeHtml(data.subtitle)}</div>
</div>
<div class="stats">
  <div class="rule"></div>
  <div class="grid">${cells}</div>
  <div class="foot">${foot}</div>
</div>
</body></html>`;
}
