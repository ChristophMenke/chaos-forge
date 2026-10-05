// Rendert eine Zauberkarte als vollständiges HTML-Dokument (768×1146px = 65×97mm @300dpi).
import {
  convertImperialText,
  schoolInfo,
  localizeSave,
  componentsLong,
  escapeHtml,
  fontFaceCss,
  englishName,
  englishDescription,
  translateField,
} from "./lib.mjs";

const FONT_CSS = fontFaceCss();

// Datenformat 768×1146 (mit 3mm Beschnitt). Schnittkante bei 35px. Sicherer
// Inhaltsbereich: ~84px Innenabstand (entspricht ~4mm ab Schnittkante).
export function renderCardHTML(spell, { preview = false } = {}) {
  const sc = schoolInfo(spell.school);
  const name = englishName(spell);

  const stat = (label, value) => `
    <div class="stat">
      <div class="stat-label">${escapeHtml(label)}</div>
      <div class="stat-value">${escapeHtml(value || "—")}</div>
    </div>`;

  const comps = componentsLong(spell.components);
  const compHtml = comps.length
    ? comps.map((c) => `<span class="comp">${escapeHtml(c)}</span>`).join("")
    : "—";

  const description = escapeHtml(convertImperialText(englishDescription(spell) || ""))
    .split(/\n\s*\n/)
    .map((p) => `<p>${p.replace(/\n/g, " ")}</p>`)
    .join("");

  const trimGuide = preview
    ? `<div class="trim"></div><div class="safe-guide"></div>`
    : "";

  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
${FONT_CSS}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:768px;height:1146px;}
body{
  font-family:'EB Garamond',Georgia,serif;
  color:#eef2f4;
  position:relative;overflow:hidden;
  --accent:${sc.accent};--accent2:${sc.accent2};
}
.bleed{
  position:absolute;inset:0;width:768px;height:1146px;
  background:
    radial-gradient(120% 80% at 50% -10%, color-mix(in srgb, var(--accent) 32%, transparent), transparent 60%),
    radial-gradient(90% 70% at 50% 115%, color-mix(in srgb, var(--accent2) 30%, transparent), transparent 60%),
    linear-gradient(160deg,#0c141b 0%,#0a1017 55%,#070b10 100%);
}
.bleed::after{ /* feine Vignette + Textur */
  content:"";position:absolute;inset:0;
  background:radial-gradient(140% 100% at 50% 40%, transparent 55%, rgba(0,0,0,.55) 100%);
  mix-blend-mode:multiply;
}
.frame{ /* Zierrahmen innerhalb der Schnittkante */
  position:absolute;left:52px;top:52px;right:52px;bottom:52px;
  border:2px solid color-mix(in srgb, var(--accent) 55%, #2a3947);
  border-radius:26px;
  box-shadow:0 0 0 1px rgba(0,0,0,.4) inset, 0 0 40px color-mix(in srgb, var(--accent) 22%, transparent) inset;
}
.frame::before{
  content:"";position:absolute;inset:7px;border-radius:20px;
  border:1px solid color-mix(in srgb, var(--accent) 30%, transparent);
}
.safe{
  position:absolute;left:84px;top:84px;right:84px;bottom:84px;
  display:flex;flex-direction:column;
}
header{display:flex;align-items:center;gap:16px;}
.badge{
  width:70px;height:78px;flex:0 0 auto;
  clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);
  background:linear-gradient(160deg,var(--accent),var(--accent2));
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  box-shadow:0 4px 14px rgba(0,0,0,.45);
}
.badge .lv{font:700 15px/1 'EB Garamond',serif;letter-spacing:.12em;color:rgba(255,255,255,.85);text-transform:uppercase;}
.badge .num{font:700 34px/1 'Cinzel',serif;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.5);}
.head-txt{flex:1;min-width:0;}
.school{
  font:600 15px/1 'EB Garamond',serif;letter-spacing:.32em;text-transform:uppercase;
  color:var(--accent);
}
.type{font:400 13px/1 'EB Garamond',serif;letter-spacing:.18em;text-transform:uppercase;color:#8ea0ad;margin-top:6px;}
.title{
  font-family:'Cinzel',serif;font-weight:700;color:#fbfbf7;
  font-size:46px;line-height:1.02;margin-top:22px;
  text-shadow:0 2px 10px rgba(0,0,0,.5);
}
.en{font-style:italic;color:#9fb0bc;font-size:20px;margin-top:8px;}
.rule{height:2px;margin:18px 0;
  background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--accent) 75%,transparent),transparent);}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:12px 26px;}
.stat{border-left:2px solid color-mix(in srgb,var(--accent) 60%,transparent);padding-left:12px;}
.stat-label{font:600 12px/1 'EB Garamond',serif;letter-spacing:.16em;text-transform:uppercase;color:#8ea0ad;}
.stat-value{font-size:20px;line-height:1.15;color:#eef2f4;margin-top:4px;}
.comp{display:inline-block;background:color-mix(in srgb,var(--accent) 22%,#12202a);
  border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);
  border-radius:6px;padding:1px 8px;margin-right:5px;font-size:16px;}
.desc{flex:1;min-height:0;overflow:hidden;margin-top:4px;font-size:18px;line-height:1.34;
  color:#dfe7ec;text-align:justify;text-align-last:left;}
.desc p{margin-bottom:8px;}
.desc p:last-child{margin-bottom:0;}
footer{display:flex;justify-content:space-between;align-items:center;margin-top:14px;
  padding-top:12px;border-top:1px solid rgba(255,255,255,.1);
  font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#7f929f;}
.mark{font-family:'Cinzel',serif;font-weight:600;color:var(--accent);letter-spacing:.2em;}
${preview ? `.trim{position:absolute;left:35px;top:35px;right:35px;bottom:35px;outline:1px dashed rgba(255,80,80,.6);pointer-events:none;}
.safe-guide{position:absolute;left:84px;top:84px;right:84px;bottom:84px;outline:1px dashed rgba(80,200,120,.5);pointer-events:none;}` : ""}
</style></head><body>
<div class="bleed"></div>
<div class="frame"></div>
<div class="safe">
  <header>
    <div class="badge"><span class="lv">Level</span><span class="num">${spell.level}</span></div>
    <div class="head-txt">
      <div class="school">${escapeHtml(sc.en)}</div>
      <div class="type">Wizard Spell · Illusionist</div>
    </div>
  </header>
  <div class="title">${escapeHtml(name)}</div>
  <div class="rule"></div>
  <div class="stats">
    ${stat("Casting Time", translateField(convertImperialText(spell.casting_time)))}
    ${stat("Saving Throw", localizeSave(spell.saving_throw))}
    ${stat("Range", translateField(convertImperialText(spell.range)))}
    ${stat("Area of Effect", translateField(convertImperialText(spell.area_of_effect)))}
    ${stat("Duration", translateField(convertImperialText(spell.duration)))}
    <div class="stat"><div class="stat-label">Components</div><div class="stat-value">${compHtml}</div></div>
  </div>
  <div class="rule"></div>
  <div class="desc" id="desc">${description}</div>
  <footer><span>Player's Handbook · Level ${spell.level}</span><span class="mark">Chaos Forge</span></footer>
</div>
${trimGuide}
<script>
// Auto-Fit: Beschreibungsschrift so groß wie möglich, ohne Überlauf.
(function(){
  var el=document.getElementById('desc');
  var lo=8.5, hi=19, best=8.5;
  for(var i=0;i<26;i++){
    var mid=(lo+hi)/2;
    el.style.fontSize=mid+'px';
    if(el.scrollHeight<=el.clientHeight){best=mid;lo=mid;}else{hi=mid;}
  }
  el.style.fontSize=best+'px';
  el.dataset.fitPx=best.toFixed(1);
  el.dataset.overflow=(el.scrollHeight>el.clientHeight+1)?'1':'0';
  window.__fitted=true;
})();
</script>
</body></html>`;
}
