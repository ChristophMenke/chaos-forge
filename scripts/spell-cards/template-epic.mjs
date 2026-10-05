// Epic-Item-Karte mit flexiblen Body-Blöcken (Layout je Item-Art):
//   {type:'stages', items:[{roman,levels,text}]}          — progressive Waffe
//   {type:'track',  label, pips:[{k,v}]}                  — Werte-je-Stufe (z.B. KON)
//   {type:'text',   heading, text}                        — Sonderregel/Effekt/Schwäche
//   {type:'rows',   items:[{color,name,meta,text}]}       — Set/Mixturen
import { escapeHtml, fontFaceCss } from "./lib.mjs";
const FONT_CSS = fontFaceCss();

function renderBlocks(blocks) {
  return blocks.map((b) => {
    if (b.type === "stages")
      return `<div class="stages">${b.items.map((s) => `<div class="st"><span class="sr">${s.roman}</span><div class="sb"><span class="sl">${escapeHtml(s.levels)}</span><span class="stx">${escapeHtml(s.text)}</span></div></div>`).join("")}</div>`;
    if (b.type === "track")
      return `<div class="trackw"><div class="th">${escapeHtml(b.label)}</div><div class="track">${b.pips.map((p) => `<div class="pip"><span class="pk">${escapeHtml(p.k)}</span><span class="pv">${escapeHtml(p.v)}</span></div>`).join("")}</div></div>`;
    if (b.type === "text")
      return `<div class="tblk"><div class="th">${escapeHtml(b.heading)}</div><div class="tt">${escapeHtml(b.text)}</div></div>`;
    if (b.type === "rows")
      return `<div class="mrows">${b.items.map((m) => `<div class="mrow" style="--c:${m.color}"><div class="mbar"></div><div class="mbody"><div class="mh"><span class="mn">${escapeHtml(m.name)}</span><span class="mm">${escapeHtml(m.meta || "")}</span></div><div class="mt">${escapeHtml(m.text)}</div></div></div>`).join("")}</div>`;
    return "";
  }).join("");
}

export function renderEpicCard(item, { artB64, fmt }) {
  const F = fmt || { W: 768, H: 1146, artH: 462, bodyTop: 448, bodyBottom: 80, fs: 1 };
  const px = (n) => Math.round(n * F.fs);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
${FONT_CSS}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${F.W}px;height:${F.H}px;}
body{position:relative;overflow:hidden;font-family:'EB Garamond',Georgia,serif;color:#f1ebe0;--gold:#e0b24e;--a:${item.accent};--a2:${item.accent2};}
.bleed{position:absolute;inset:0;background:linear-gradient(165deg,#211a30 0%,#171122 55%,#100b18 100%);}
.art{position:absolute;top:0;left:0;width:${F.W}px;height:${F.artH}px;background:#0f0b16 center/cover no-repeat;${artB64 ? `background-image:url(data:image/webp;base64,${artB64});` : ""}}
.art::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(16,11,24,.15) 0%,transparent 22%,transparent 55%,rgba(16,11,24,.88) 90%,#100b18 100%);}
.frame{position:absolute;left:66px;top:66px;right:66px;bottom:66px;border-radius:22px;border:2px solid color-mix(in srgb,var(--gold) 60%,#3a3350);box-shadow:0 0 0 1px rgba(0,0,0,.5) inset,0 0 46px rgba(0,0,0,.55) inset;pointer-events:none;}
.frame::before{content:"";position:absolute;inset:7px;border-radius:16px;border:1px solid color-mix(in srgb,var(--gold) 30%,transparent);}
.badge{position:absolute;top:80px;left:84px;width:76px;height:84px;z-index:3;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:linear-gradient(160deg,var(--a),var(--a2));display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.55);font:700 ${px(20)}px/1 'Cinzel',serif;color:#fff;letter-spacing:.06em;text-shadow:0 1px 3px rgba(0,0,0,.5);}
.tag{position:absolute;top:90px;right:84px;z-index:3;font:600 ${px(15)}px/1 'EB Garamond',serif;letter-spacing:.22em;text-transform:uppercase;color:#fff;padding:8px 16px;border-radius:999px;background:color-mix(in srgb,var(--a2) 55%,rgba(16,11,24,.65));border:1px solid color-mix(in srgb,var(--a) 60%,transparent);}
.body{position:absolute;left:84px;right:84px;top:${F.bodyTop}px;bottom:${F.bodyBottom}px;display:flex;flex-direction:column;z-index:2;}
.title{font-family:'Cinzel',serif;font-weight:700;font-size:${px(42)}px;line-height:1.02;color:#fbf6ea;text-shadow:0 2px 12px rgba(0,0,0,.6);}
.type{font:600 ${px(14)}px/1 'EB Garamond',serif;letter-spacing:.2em;text-transform:uppercase;color:var(--a);margin-top:9px;}
.rule{height:2px;margin:15px 0;background:linear-gradient(90deg,var(--gold),transparent);}
.blocks{display:flex;flex-direction:column;gap:15px;}
/* stages */
.stages{display:flex;flex-direction:column;gap:13px;}
.st{display:flex;gap:15px;align-items:flex-start;}
.sr{flex:0 0 auto;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:700 ${px(17)}px/1 'Cinzel',serif;color:#fff;background:linear-gradient(160deg,var(--a),var(--a2));box-shadow:0 3px 10px rgba(0,0,0,.45);}
.sb{display:flex;flex-direction:column;gap:3px;padding-top:2px;}
.sl{font:600 ${px(12)}px/1 'EB Garamond',serif;letter-spacing:.14em;text-transform:uppercase;color:#9a8fae;}
.stx{font-size:${px(21)}px;line-height:1.26;color:#e7ddcf;}
/* track */
.th{font:600 ${px(12)}px/1 'EB Garamond',serif;letter-spacing:.16em;text-transform:uppercase;color:var(--a);margin-bottom:8px;}
.track{display:flex;gap:6px;}
.pip{flex:1;text-align:center;background:color-mix(in srgb,var(--a) 14%,#1c1630);border:1px solid color-mix(in srgb,var(--a) 35%,transparent);border-radius:8px;padding:7px 2px;}
.pip .pk{display:block;font-size:${px(11)}px;color:#9a8fae;}
.pip .pv{display:block;font:700 ${px(20)}px/1 'Cinzel',serif;color:#efe8dc;margin-top:3px;}
/* text block */
.tblk .tt{font-size:${px(20)}px;line-height:1.3;color:#e7ddcf;}
/* rows (mixtures) */
.mrows{display:flex;flex-direction:column;gap:11px;}
.mrow{display:flex;gap:12px;}
.mbar{flex:0 0 5px;border-radius:3px;background:var(--c);box-shadow:0 0 10px color-mix(in srgb,var(--c) 60%,transparent);}
.mbody{flex:1;}
.mh{display:flex;align-items:baseline;gap:10px;}
.mn{font-family:'Cinzel',serif;font-weight:700;font-size:${px(20)}px;color:#fbf6ea;}
.mm{font-size:${px(13)}px;letter-spacing:.08em;text-transform:uppercase;color:#9a8fae;}
.mt{font-size:${px(18)}px;line-height:1.25;color:#dfe7ec;margin-top:1px;}
.foot{margin-top:auto;padding-top:11px;border-top:1px solid rgba(224,178,78,.22);display:flex;justify-content:space-between;font-size:${px(14)}px;letter-spacing:.13em;text-transform:uppercase;color:#8f84a0;}
.mark{font-family:'Cinzel',serif;font-weight:600;color:var(--gold);letter-spacing:.18em;}
</style></head><body>
<div class="bleed"></div><div class="art"></div><div class="frame"></div>
<div class="badge">EPIC</div><div class="tag">${escapeHtml(item.typeLabel)}</div>
<div class="body">
  <div class="title">${escapeHtml(item.name)}</div>
  <div class="type">Epic Item · attuned to ${escapeHtml(item.bearer)}</div>
  <div class="rule"></div>
  <div class="blocks">${renderBlocks(item.blocks || [])}</div>
  <div class="foot"><span>${escapeHtml(item.footnote || "")}</span><span class="mark">Chaos Forge</span></div>
</div>
</body></html>`;
}
