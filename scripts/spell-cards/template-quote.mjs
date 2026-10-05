// Zitatkarte: ein Spruch aus der Chronik, groß gesetzt, mit Urheber.
// Kein Artwork — die Karte lebt vom Satz, und ein KI-Bild würde die Pointe
// nur zukleistern.
import { escapeHtml, fontFaceCss } from "./lib.mjs";
const FONT_CSS = fontFaceCss();

export function renderQuoteCard(data) {
  const F = data.fmt || { W: 768, H: 1146, fs: 1 };
  const px = (n) => Math.round(n * (F.fs || 1));
  // Lange Sprüche kleiner setzen — die Karte soll immer gefüllt wirken, aber
  // nie überlaufen.
  const len = data.quote.length;
  const size = len < 60 ? 78 : len < 110 ? 64 : len < 180 ? 50 : 40;

  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
${FONT_CSS}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${F.W}px;height:${F.H}px;}
body{position:relative;overflow:hidden;font-family:'EB Garamond',Georgia,serif;color:#f1ebe0;
  --gold:#e0b24e;--a:${data.accent || "#e0b24e"};--a2:${data.accent2 || "#a1782f"};}
.bleed{position:absolute;inset:0;background:linear-gradient(165deg,#241c33 0%,#181223 55%,#100b18 100%);}
.glow{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:980px;height:980px;
  background:radial-gradient(circle at center,color-mix(in srgb,var(--a) 20%,transparent) 0%,transparent 66%);}
.frame{position:absolute;left:66px;top:66px;right:66px;bottom:66px;border-radius:22px;
  border:2px solid color-mix(in srgb,var(--gold) 60%,#3a3350);
  box-shadow:0 0 0 1px rgba(0,0,0,.5) inset,0 0 46px rgba(0,0,0,.55) inset;pointer-events:none;}
.frame::before{content:"";position:absolute;inset:7px;border-radius:16px;border:1px solid color-mix(in srgb,var(--gold) 30%,transparent);}
/* Die Anführungszeichen sind das Ornament der Karte — groß, aber zurückgenommen. */
.mark{position:absolute;left:50%;transform:translateX(-50%);font-family:'Cinzel',serif;font-weight:700;
  font-size:${px(200)}px;line-height:1;color:color-mix(in srgb,var(--gold) 22%,transparent);user-select:none;}
.mark.top{top:${px(104)}px;}
.mark.bot{bottom:${px(40)}px;}
.body{position:absolute;left:${px(104)}px;right:${px(104)}px;top:${px(250)}px;bottom:${px(210)}px;z-index:2;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${px(34)}px;text-align:center;}
.q{font-size:${px(size)}px;line-height:1.28;color:#fbf6ea;text-wrap:balance;white-space:pre-line;}
.by{display:flex;flex-direction:column;align-items:center;gap:${px(8)}px;}
.by .line{width:${px(90)}px;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent);}
.by .who{font-family:'Cinzel',serif;font-size:${px(26)}px;color:var(--a);letter-spacing:.06em;}
.foot{position:absolute;left:${px(110)}px;right:${px(110)}px;bottom:${px(96)}px;z-index:2;
  display:flex;justify-content:space-between;font:600 ${px(14)}px/1 'EB Garamond',serif;
  letter-spacing:.16em;text-transform:uppercase;color:#8f84a0;}
.foot .cf{color:var(--gold);}
</style></head><body>
<div class="bleed"></div><div class="glow"></div><div class="frame"></div>
<div class="mark top">&ldquo;</div>
<div class="body">
  <div class="q">${escapeHtml(data.quote)}</div>
  <div class="by"><span class="line"></span><span class="who">${escapeHtml(data.who)}</span></div>
</div>
<div class="mark bot">&rdquo;</div>
<div class="foot"><span>Chronik des Chaos</span><span class="cf">Chaos Forge</span></div>
</body></html>`;
}
