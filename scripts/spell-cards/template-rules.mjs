// Regel-Referenzkarte: reine Nachschlagekarte ohne Artwork. Alles, was hier
// steht, wird zur Laufzeit aus rules-js/ berechnet — die Karten können also
// nicht gegenüber der App veralten.
//
// data: {
//   title, subtitle, accent, accent2,
//   sections: [{ heading?, table?: { head: [..], rows: [[..]], align?: [..] },
//                notes?: [".."], pairs?: [{label,value}] }],
//   footer: ".."
// }
import { escapeHtml, fontFaceCss } from "./lib.mjs";
const FONT_CSS = fontFaceCss();

function renderTable(t, px) {
  const align = t.align || [];
  const head = t.head
    ? `<thead><tr>${t.head.map((h, i) => `<th class="${align[i] === "r" ? "r" : align[i] === "c" ? "c" : ""}">${escapeHtml(h)}</th>`).join("")}</tr></thead>`
    : "";
  const body = t.rows
    .map(
      (r) =>
        `<tr>${r
          .map((c, i) => `<td class="${align[i] === "r" ? "r" : align[i] === "c" ? "c" : ""}${i === 0 && !t.head ? " k" : ""}">${escapeHtml(String(c))}</td>`)
          .join("")}</tr>`
    )
    .join("");
  return `<table style="font-size:${px}px">${head}<tbody>${body}</tbody></table>`;
}

export function renderRulesCard(data) {
  const F = data.fmt || { W: 768, H: 1146, bodyTop: 120, bodyBottom: 70, titleFont: 38, subFont: 14, headFont: 15, cellFont: 18, noteFont: 16 };
  const sections = data.sections
    .map((s) => {
      const parts = [];
      if (s.heading) parts.push(`<div class="sh">${escapeHtml(s.heading)}</div>`);
      if (s.table) parts.push(renderTable(s.table, s.font || F.cellFont));
      if (s.pairs) {
        parts.push(
          `<div class="pairs">${s.pairs
            .map((p) => `<div class="pr"><span class="pl">${escapeHtml(p.label)}</span><span class="pv">${escapeHtml(String(p.value))}</span></div>`)
            .join("")}</div>`
        );
      }
      if (s.notes) parts.push(`<div class="notes">${s.notes.map((n) => `<p>${escapeHtml(n)}</p>`).join("")}</div>`);
      // Nur mehrzeilige Tabellen dürfen sich dehnen — eine Ein-Zeilen-Tabelle
      // würde sonst über die halbe Karte auseinandergezogen.
      const grow = s.table && s.table.rows.length >= 5;
      return `<div class="sec${grow ? " grow" : ""}">${parts.join("")}</div>`;
    })
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
${FONT_CSS}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${F.W}px;height:${F.H}px;}
body{position:relative;overflow:hidden;font-family:'EB Garamond',Georgia,serif;color:#f1ebe0;
  --gold:#e0b24e;--a:${data.accent || "#e0b24e"};--a2:${data.accent2 || "#a1782f"};}
.bleed{position:absolute;inset:0;background:linear-gradient(165deg,#211a30 0%,#171122 55%,#100b18 100%);}
/* Dezenter Lichtschein oben, damit die Karte nicht wie ein Formular wirkt */
.glow{position:absolute;top:-180px;left:50%;transform:translateX(-50%);width:900px;height:460px;
  background:radial-gradient(ellipse at center,color-mix(in srgb,var(--a) 22%,transparent) 0%,transparent 68%);}
.frame{position:absolute;left:66px;top:66px;right:66px;bottom:66px;border-radius:22px;
  border:2px solid color-mix(in srgb,var(--gold) 60%,#3a3350);
  box-shadow:0 0 0 1px rgba(0,0,0,.5) inset,0 0 46px rgba(0,0,0,.55) inset;pointer-events:none;}
.frame::before{content:"";position:absolute;inset:7px;border-radius:16px;border:1px solid color-mix(in srgb,var(--gold) 30%,transparent);}
/* Kopf und Körper teilen sich einen Flex-Container statt absolut übereinander
   zu liegen — sonst schiebt sich ein zweizeiliger Titel in die erste Tabelle. */
.page{position:absolute;left:100px;right:100px;top:96px;bottom:${F.bodyBottom}px;z-index:2;
  display:flex;flex-direction:column;}
.head{text-align:center;flex:none;}
.title{font-family:'Cinzel',serif;font-weight:700;font-size:${F.titleFont}px;line-height:1.03;color:#fbf6ea;text-wrap:balance;}
.sub{font:600 ${F.subFont}px/1.2 'EB Garamond',serif;letter-spacing:.2em;text-transform:uppercase;color:var(--a);margin-top:10px;}
.rule{height:2px;margin:14px auto 0;width:62%;background:linear-gradient(90deg,transparent,var(--gold),transparent);}
.body{flex:1;min-height:0;padding-top:26px;display:flex;flex-direction:column;gap:22px;}
.sec{display:flex;flex-direction:column;gap:8px;}
/* Tabellen dehnen sich über die freie Höhe: eine Nachschlagekarte soll die
   Fläche nutzen, nicht mit einem Block oben kleben und unten leer bleiben. */
.sec.grow{flex:1 1 auto;min-height:0;}
.sec.grow table{height:100%;}
.sh{font:600 ${F.headFont}px/1 'EB Garamond',serif;letter-spacing:.16em;text-transform:uppercase;color:var(--a);
  border-bottom:1px solid color-mix(in srgb,var(--gold) 28%,transparent);padding-bottom:6px;}
table{width:100%;border-collapse:collapse;}
th{font:600 ${F.headFont}px/1 'EB Garamond',serif;letter-spacing:.1em;text-transform:uppercase;color:#9a8fae;
  text-align:left;padding:0 8px 6px 0;border-bottom:1px solid rgba(224,178,78,.22);white-space:nowrap;}
td{padding:5px 8px 5px 0;color:#e9e2d6;border-bottom:1px solid rgba(255,255,255,.05);white-space:nowrap;}
td.k{color:#bdb2cc;}
th.r,td.r{text-align:right;padding-right:0;}
th.c,td.c{text-align:center;}
/* Ohne diesen Abstand stoßen eine rechtsbündige und die folgende linksbündige
   Spalte direkt aneinander und lesen sich als eine einzige Zahl. */
th+th,td+td{padding-left:18px;}
tr:last-child td{border-bottom:none;}
.pairs{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;}
.pr{display:flex;justify-content:space-between;gap:10px;border-left:2px solid color-mix(in srgb,var(--gold) 45%,transparent);padding-left:10px;}
.pl{font-size:${F.noteFont}px;color:#bdb2cc;}
.pv{font-size:${F.noteFont}px;color:#fbf6ea;font-weight:600;}
.notes p{font-size:${F.noteFont}px;line-height:1.4;color:#ded6ea;margin-bottom:6px;}
.notes p:last-child{margin-bottom:0;}
.foot{position:absolute;left:100px;right:100px;bottom:${Math.round(F.bodyBottom * 0.52)}px;z-index:2;
  display:flex;justify-content:space-between;font:600 13px/1 'EB Garamond',serif;letter-spacing:.16em;
  text-transform:uppercase;color:#8f84a0;}
.foot .cf{color:var(--gold);}
</style></head><body>
<div class="bleed"></div><div class="glow"></div><div class="frame"></div>
<div class="page">
  <div class="head">
    <div class="title">${escapeHtml(data.title)}</div>
    ${data.subtitle ? `<div class="sub">${escapeHtml(data.subtitle)}</div>` : ""}
    <div class="rule"></div>
  </div>
  <div class="body">${sections}</div>
</div>
<div class="foot"><span>${escapeHtml(data.footer || "AD&D 2nd Edition")}</span><span class="cf">Chaos Forge</span></div>
</body></html>`;
}
