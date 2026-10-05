// Karte für einen magischen Gegenstand: Artwork oben, darunter Name, Kategorie
// und die aufbereiteten Effekte aus magic_items.magic_effects.
//
// data: { name, category, artB64, accent, accent2,
//         effects: [{label, value}], notes: [".."], footer }
import { escapeHtml, fontFaceCss } from "./lib.mjs";
const FONT_CSS = fontFaceCss();

export function renderItemCard(data) {
  const F = data.fmt || { W: 768, H: 1146, artH: 470, bodyTop: 456, bodyBottom: 78, fs: 1 };
  const px = (n) => Math.round(n * (F.fs || 1));
  const effects = data.effects
    .map(
      (e) =>
        `<div class="ef"><span class="el">${escapeHtml(e.label)}</span><span class="ev">${escapeHtml(String(e.value))}</span></div>`
    )
    .join("");
  const notes = (data.notes || []).map((n) => `<p>${escapeHtml(n)}</p>`).join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
${FONT_CSS}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${F.W}px;height:${F.H}px;}
body{position:relative;overflow:hidden;font-family:'EB Garamond',Georgia,serif;color:#f1ebe0;
  --gold:#e0b24e;--a:${data.accent || "#e0b24e"};--a2:${data.accent2 || "#a1782f"};}
.bleed{position:absolute;inset:0;background:linear-gradient(165deg,#211a30 0%,#171122 55%,#100b18 100%);}
.art{position:absolute;top:0;left:0;width:${F.W}px;height:${F.artH}px;background:#0f0b16 center/cover no-repeat;
  ${data.artB64 ? `background-image:url(data:image/webp;base64,${data.artB64});` : ""}}
.art::after{content:"";position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(16,11,24,.10) 0%,transparent 34%,transparent 58%,rgba(16,11,24,.94) 88%,#100b18 100%);}
.frame{position:absolute;left:66px;top:66px;right:66px;bottom:66px;border-radius:22px;
  border:2px solid color-mix(in srgb,var(--gold) 60%,#3a3350);
  box-shadow:0 0 0 1px rgba(0,0,0,.5) inset,0 0 46px rgba(0,0,0,.55) inset;pointer-events:none;}
.frame::before{content:"";position:absolute;inset:7px;border-radius:16px;border:1px solid color-mix(in srgb,var(--gold) 30%,transparent);}
.cat{position:absolute;top:${px(96)}px;right:${px(96)}px;z-index:3;
  background:linear-gradient(160deg,var(--a),var(--a2));border-radius:999px;padding:${px(9)}px ${px(20)}px;
  font:600 ${px(17)}px/1 'EB Garamond',serif;letter-spacing:.18em;text-transform:uppercase;color:#fff;
  box-shadow:0 4px 16px rgba(0,0,0,.5);}
.body{position:absolute;left:${px(96)}px;right:${px(96)}px;top:${F.bodyTop}px;bottom:${F.bodyBottom}px;z-index:2;
  display:flex;flex-direction:column;}
.title{font-family:'Cinzel',serif;font-weight:700;font-size:${px(48)}px;line-height:1.04;color:#fbf6ea;
  text-shadow:0 2px 12px rgba(0,0,0,.6);text-wrap:balance;}
.rule{height:2px;margin:${px(16)}px 0 ${px(20)}px;background:linear-gradient(90deg,var(--gold),transparent);}
.effects{display:flex;flex-direction:column;gap:${px(10)}px;}
.ef{display:flex;justify-content:space-between;align-items:baseline;gap:${px(18)}px;
  border-left:2px solid color-mix(in srgb,var(--gold) 50%,transparent);padding-left:${px(14)}px;}
.el{font:600 ${px(16)}px/1.2 'EB Garamond',serif;letter-spacing:.14em;text-transform:uppercase;color:#a396b8;}
.ev{font-size:${px(26)}px;color:#fbf6ea;text-align:right;}
.notes{margin-top:${px(20)}px;}
.notes p{font-size:${px(25)}px;line-height:1.42;color:#e6dfd2;margin-bottom:${px(8)}px;}
.foot{margin-top:auto;padding-top:${px(14)}px;border-top:1px solid rgba(224,178,78,.22);
  display:flex;justify-content:space-between;font:600 ${px(14)}px/1 'EB Garamond',serif;
  letter-spacing:.16em;text-transform:uppercase;color:#8f84a0;}
.foot .cf{color:var(--gold);}
</style></head><body>
<div class="bleed"></div><div class="art"></div><div class="frame"></div>
<div class="cat">${escapeHtml(data.category)}</div>
<div class="body">
  <div class="title">${escapeHtml(data.name)}</div>
  <div class="rule"></div>
  <div class="effects">${effects}</div>
  ${notes ? `<div class="notes">${notes}</div>` : ""}
  <div class="foot"><span>${escapeHtml(data.footer || "")}</span><span class="cf">Chaos Forge</span></div>
</div>
</body></html>`;
}
