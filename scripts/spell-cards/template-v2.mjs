// Kartentemplate v2: App-Palette (deep purple / gold / teal), Effekt-Bild oben
// (Bleed), zweckoptimierter Text mit FESTER Schriftgröße (einheitlich).
import { schoolInfo, escapeHtml, fontFaceCss, englishName } from "./lib.mjs";

const FONT_CSS = fontFaceCss();

const BOOK_LABEL = {
  "Players Handbook": "Player's Handbook",
  "Wizards Spell Compendium Volume 1": "Wizard's Spell Compendium I",
  "Wizards Spell Compendium Volume 2": "Wizard's Spell Compendium II",
  "Wizards Spell Compendium Volume 3": "Wizard's Spell Compendium III",
  "Wizards Spell Compendium Volume 4": "Wizard's Spell Compendium IV",
  "Tome of Magic": "Tome of Magic",
  "Players Option: Spells and Magic": "Player's Option: Spells & Magic",
};

export function renderCardV2(spell, { rules, artB64, stats, classLabel = "Illusionist", owner = "", preview = false, fmt }) {
  const F = fmt || { W: 768, H: 1146, artH: 462, bodyTop: 448, bodyBottom: 80, descFont: 24, titleFont: 44, typeFont: 14, statLabel: 11, statVal: 19, compFont: 15 };
  const sc = schoolInfo(spell.school);
  const name = englishName(spell);
  const bookLabel = BOOK_LABEL[spell.source_book] || spell.source_book || "Player's Handbook";
  const comps = stats.components || [];
  const compHtml = comps.length ? comps.map((c) => `<span class="comp">${escapeHtml(c)}</span>`).join("") : "—";

  const stat = (label, value) =>
    `<div class="stat"><span class="sl">${escapeHtml(label)}</span><span class="sv">${escapeHtml(value || "—")}</span></div>`;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
${FONT_CSS}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${F.W}px;height:${F.H}px;}
body{position:relative;overflow:hidden;font-family:'EB Garamond',Georgia,serif;color:#f1ebe0;
  --gold:#e0b24e;--gold2:#b98729;--teal:#3ec7bd;--ink:#f1ebe0;--muted:#ab a0 b8;--muted:#aba0b8;
  --accent:${sc.accent};--accent2:${sc.accent2};}
.bleed{position:absolute;inset:0;width:${F.W}px;height:${F.H}px;
  background:linear-gradient(165deg,#211a30 0%,#171122 55%,#100b18 100%);}
.art{position:absolute;top:0;left:0;width:${F.W}px;height:${F.artH}px;
  background:#0f0b16 center/cover no-repeat;${artB64 ? `background-image:url(data:image/webp;base64,${artB64});` : ""}}
.art::after{content:"";position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(16,11,24,.15) 0%,transparent 22%,transparent 58%,rgba(16,11,24,.85) 90%,#100b18 100%);}
.frame{position:absolute;left:66px;top:66px;right:66px;bottom:66px;border-radius:22px;
  border:2px solid color-mix(in srgb,var(--gold) 60%,#3a3350);
  box-shadow:0 0 0 1px rgba(0,0,0,.5) inset,0 0 46px rgba(0,0,0,.55) inset;pointer-events:none;}
.frame::before{content:"";position:absolute;inset:7px;border-radius:18px;border:1px solid color-mix(in srgb,var(--gold) 30%,transparent);}
.badge{position:absolute;top:78px;left:84px;width:76px;height:84px;z-index:3;
  clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);
  background:linear-gradient(160deg,var(--accent),var(--accent2));
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  box-shadow:0 4px 16px rgba(0,0,0,.55);}
.badge .lv{font:600 12px/1 'EB Garamond',serif;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.85);}
.badge .num{font:700 38px/1 'Cinzel',serif;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.55);}
.school-tag{position:absolute;top:88px;right:84px;z-index:3;
  font:600 15px/1 'EB Garamond',serif;letter-spacing:.24em;text-transform:uppercase;
  color:#fff;padding:8px 16px;border-radius:999px;
  background:color-mix(in srgb,var(--accent2) 55%,rgba(16,11,24,.65));
  border:1px solid color-mix(in srgb,var(--accent) 60%,transparent);
  box-shadow:0 3px 12px rgba(0,0,0,.5);backdrop-filter:blur(2px);}
/* Besitzer-Kürzel oben mittig — macht im gemischten Deck (gemeinsame Rückseite)
   auf einen Blick erkennbar, wem der Zauber gehört. Sitzt zwischen Level-Badge
   (links) und Schul-Tag (rechts), vertikal auf deren Höhe. */
.owner{position:absolute;top:92px;left:180px;right:180px;text-align:center;z-index:3;
  font:700 22px/1 'Cinzel',serif;letter-spacing:.22em;text-transform:uppercase;
  color:var(--gold);text-shadow:0 2px 10px rgba(0,0,0,.85),0 0 20px rgba(0,0,0,.6);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.body{position:absolute;left:84px;right:84px;top:${F.bodyTop}px;bottom:${F.bodyBottom}px;display:flex;flex-direction:column;z-index:2;}
.title{font-family:'Cinzel',serif;font-weight:700;font-size:${F.titleFont}px;line-height:1.02;
  color:#fbf6ea;text-shadow:0 2px 12px rgba(0,0,0,.6);}
.type{font:600 ${F.typeFont}px/1 'EB Garamond',serif;letter-spacing:.2em;text-transform:uppercase;
  color:var(--accent);margin-top:10px;}
.rule{height:2px;margin:16px 0;background:linear-gradient(90deg,var(--gold),transparent);}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:9px 26px;}
.stat{display:flex;flex-direction:column;gap:2px;border-left:2px solid color-mix(in srgb,var(--gold) 55%,transparent);padding-left:11px;}
.sl{font:600 ${F.statLabel}px/1 'EB Garamond',serif;letter-spacing:.15em;text-transform:uppercase;color:#9a8fae;}
.sv{font-size:${F.statVal}px;line-height:1.1;color:#efe8dc;}
.comp{display:inline-block;background:color-mix(in srgb,var(--gold) 20%,#241d33);
  border:1px solid color-mix(in srgb,var(--gold) 40%,transparent);border-radius:5px;
  padding:0 7px;margin-right:4px;font-size:${F.compFont}px;}
.desc{flex:1;min-height:0;margin-top:14px;font-size:${F.descFont}px;line-height:1.36;color:#e7ddcf;
  text-align:justify;text-align-last:left;overflow:hidden;}
footer{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:11px;
  border-top:1px solid rgba(224,178,78,.22);font-size:13px;letter-spacing:.13em;
  text-transform:uppercase;color:#8f84a0;}
.mark{font-family:'Cinzel',serif;font-weight:600;color:var(--gold);letter-spacing:.18em;}
${preview ? ".trim{position:absolute;left:35px;top:35px;right:35px;bottom:35px;outline:2px dashed rgba(255,70,70,.9);z-index:9;}.safe-guide{position:absolute;left:83px;top:83px;right:83px;bottom:83px;outline:2px dashed rgba(90,230,140,.85);z-index:9;}" : ""}
</style></head><body>
<div class="bleed"></div>
<div class="art"></div>
<div class="frame"></div>
<div class="badge"><span class="lv">Level</span><span class="num">${spell.level}</span></div>
${owner ? `<div class="owner">${escapeHtml(owner)}</div>` : ""}
<div class="school-tag">${escapeHtml(sc.en)}</div>
<div class="body">
  <div class="title">${escapeHtml(name)}</div>
  <div class="type">Wizard Spell · ${escapeHtml(classLabel)}</div>
  <div class="rule"></div>
  <div class="stats">
    ${stat("Casting Time", stats.casting_time)}
    ${stat("Saving Throw", stats.saving_throw)}
    ${stat("Range", stats.range)}
    ${stat("Area of Effect", stats.area_of_effect)}
    ${stat("Duration", stats.duration)}
    <div class="stat"><span class="sl">Components</span><span class="sv">${compHtml}</span></div>
  </div>
  <div class="rule"></div>
  <div class="desc">${escapeHtml(rules)}</div>
  <footer><span>${escapeHtml(bookLabel)} · Level ${spell.level}</span><span class="mark">Chaos Forge</span></footer>
</div>
${preview ? '<div class="trim"></div><div class="safe-guide"></div>' : ""}
</body></html>`;
}
