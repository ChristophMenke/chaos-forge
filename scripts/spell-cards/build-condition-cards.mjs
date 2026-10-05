// Zustandskarten zum Auslegen: Wer bezaubert, geblendet oder gehalten ist, legt
// die Karte vor sich — das erinnert den Tisch an den Zustand und sagt zugleich,
// was er bewirkt.
//
// Bewusst kein Artwork: Die Karte wird im Kampf gelesen, nicht bewundert, und
// muss quer über den Tisch erkennbar sein.
//
// Alle Regelangaben stammen wörtlich aus den Zauberbeschreibungen in der
// Datenbank (spells.description) — nichts davon ist hinzugedichtet.
//
// Nutzung: node build-condition-cards.mjs [--tarot70|--tarot]
import { chromium } from "playwright";
import { mkdirSync, rmSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { escapeHtml, fontFaceCss, slug } from "./lib.mjs";
import { TAROT_RULES_FMT, IS_TAROT as TAROT, DIR_SUFFIX } from "./tarot.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const F = TAROT ? TAROT_RULES_FMT : undefined;
const CW = F?.W ?? 768, CH = F?.H ?? 1146;
const OUT = join(HERE, "out", `condition-cards${TAROT ? DIR_SUFFIX : ""}`);
mkdirSync(OUT, { recursive: true });
const FONT_CSS = fontFaceCss();

// Die acht Zustände, die eure eigenen Zauber auslösen — Nowi wirkt Charm
// Person, Sleep und Hold Person, Sprocket Blindness, Fear, Invisibility und
// Haste. Slow gehört als Gegenstück zu Haste dazu.
const CONDITIONS = [
  {
    key: "bezaubert", name: "Bezaubert", kind: "bad", source: "Charm Person · Magier 1",
    duration: "Je nach INT des Ziels: 3 Monate (INT ≤ 3) bis 1 Tag (INT 19+) zwischen neuen Rettungswürfen",
    save: "Rettungswurf gegen Zauber (mit WEI-Modifikator) negiert",
    effects: [
      "Du hältst den Zaubernden für einen vertrauenswürdigen Freund und Verbündeten.",
      "Jedes seiner Worte und Taten legst du im günstigsten Licht aus.",
      "Er hat keine automatische Kontrolle über dich — er muss bitten.",
      "Du erinnerst dich hinterher an alles.",
    ],
    ends: "Schaden durch den Zaubernden oder Magie Bannen beendet es sofort.",
  },
  {
    key: "schlafend", name: "Schlafend", kind: "bad", source: "Sleep · Magier 1",
    duration: "5 Runden je Stufe des Zaubernden",
    save: "Kein Rettungswurf",
    effects: [
      "Du bist hilflos und kannst mit einem einzigen Angriff getötet werden.",
      "Normaler Lärm weckt dich nicht.",
      "Wirkt nicht gegen Untote oder Kreaturen über 4+3 Trefferwürfel.",
    ],
    ends: "Schlagen oder Verwunden weckt dich.",
  },
  {
    key: "gehalten", name: "Gehalten", kind: "bad", source: "Hold Person · Magier 3",
    duration: "2 Kampfrunden je Stufe des Zaubernden",
    save: "Rettungswurf gegen Zauber negiert",
    effects: [
      "Du bist vollständig gelähmt: kein Sprechen, keine Bewegung, kein Zaubern.",
      "Denken, Wahrnehmen und Atmen funktionieren weiter.",
      "Trifft 1 bis 4 Personen bis Ogergröße.",
    ],
    ends: "Magie Bannen oder Freie Aktion hebt es auf.",
  },
  {
    key: "geblendet", name: "Geblendet", kind: "bad", source: "Blindness · Magier 2",
    duration: "Dauerhaft, bis sie geheilt wird",
    save: "Rettungswurf gegen Zauber negiert",
    effects: [
      "−4 auf deine Trefferwürfe.",
      "+4 auf deine eigene Rüstungsklasse — also schlechter.",
      "Alle Geschicklichkeitsboni auf die RK entfallen.",
    ],
    ends: "Blindheit/Taubheit Heilen (Priester 3), Heilung oder Magie Bannen.",
  },
  {
    key: "veraengstigt", name: "Verängstigt", kind: "bad", source: "Fear · Magier 4",
    duration: "So viele Runden, wie der Zaubernde Stufen hat",
    save: "Rettungswurf gegen Zauber negiert",
    effects: [
      "Du fliehst in Panik vom Ursprung des Schreckens fort.",
      "Kreaturen ab 6 Trefferwürfeln oder Stufen wehren sich leichter.",
    ],
    ends: "Wenn die Dauer abläuft oder Magie Bannen wirkt.",
  },
  {
    key: "unsichtbar", name: "Unsichtbar", kind: "good", source: "Invisibility · Magier 2",
    duration: "Speziell — bis zum Angriff",
    save: "Kein Rettungswurf",
    effects: [
      "Du bist nicht zu sehen; getragene Ausrüstung verschwindet mit.",
      "Später aufgenommene Gegenstände bleiben sichtbar.",
    ],
    ends: "Sobald du angreifst, endet die Unsichtbarkeit sofort.",
  },
  {
    key: "beschleunigt", name: "Beschleunigt", kind: "good", source: "Haste · Magier 3",
    duration: "3 Kampfrunden + 1 je Stufe",
    save: "Kein Rettungswurf",
    effects: [
      "Doppelte Bewegungsrate und doppelt so viele Angriffe pro Runde.",
      "+2 auf Initiative.",
      "Du alterst um 1 Jahr.",
    ],
    ends: "Hebt Verlangsamt auf und lässt sich nicht stapeln.",
  },
  {
    key: "verlangsamt", name: "Verlangsamt", kind: "bad", source: "Slow · Magier 3",
    duration: "3 Kampfrunden + 1 je Stufe",
    save: "Rettungswurf gegen Zauber negiert",
    effects: [
      "Halbe Bewegungsrate und halb so viele Angriffe pro Runde.",
      "−4 auf Initiative.",
    ],
    ends: "Hast hebt es auf — beide zusammen löschen sich gegenseitig.",
  },
];

const TONE = {
  bad: { a: "#e0524e", a2: "#8f2f2b", label: "Zustand" },
  good: { a: "#3ec7bd", a2: "#0d7d75", label: "Wirkung" },
};

function render(c) {
  const t = TONE[c.kind];
  // Weniger Text = größere Schrift. So füllt jede Karte ihre Fläche, ohne die
  // Stichpunkte über die halbe Karte auseinanderzuziehen.
  const chars = c.effects.join(" ").length;
  const effFont = chars < 130 ? 42 : chars < 200 ? 38 : chars < 270 ? 34 : 30;
  const px = (n) => Math.round(n * 1.0);
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
${FONT_CSS}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${CW}px;height:${CH}px;}
body{position:relative;overflow:hidden;font-family:'EB Garamond',Georgia,serif;color:#f1ebe0;
  --gold:#e0b24e;--a:${t.a};--a2:${t.a2};}
.bleed{position:absolute;inset:0;background:linear-gradient(165deg,#211a30 0%,#171122 55%,#100b18 100%);}
.glow{position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:1000px;height:560px;
  background:radial-gradient(ellipse at center,color-mix(in srgb,var(--a) 30%,transparent) 0%,transparent 68%);}
.frame{position:absolute;left:66px;top:66px;right:66px;bottom:66px;border-radius:22px;
  border:2px solid color-mix(in srgb,var(--gold) 60%,#3a3350);
  box-shadow:0 0 0 1px rgba(0,0,0,.5) inset,0 0 46px rgba(0,0,0,.55) inset;pointer-events:none;}
.frame::before{content:"";position:absolute;inset:7px;border-radius:16px;border:1px solid color-mix(in srgb,var(--gold) 30%,transparent);}
/* Farbiger Balken oben: quer über den Tisch erkennbar, ob es schadet oder hilft. */
.bar{position:absolute;left:104px;right:104px;top:104px;height:8px;border-radius:4px;
  background:linear-gradient(90deg,var(--a),var(--a2));z-index:2;}
.page{position:absolute;left:104px;right:104px;top:150px;bottom:${F?.bodyBottom ?? 78}px;z-index:2;
  display:flex;flex-direction:column;}
.kind{font:600 19px/1 'EB Garamond',serif;letter-spacing:.22em;text-transform:uppercase;color:var(--a);}
.title{font-family:'Cinzel',serif;font-weight:700;font-size:84px;line-height:1.02;color:#fbf6ea;
  margin-top:10px;text-wrap:balance;}
.meta{margin-top:22px;display:flex;flex-direction:column;gap:10px;}
.mrow{display:flex;flex-direction:column;gap:2px;border-left:2px solid color-mix(in srgb,var(--gold) 50%,transparent);padding-left:14px;}
.ml{font:600 15px/1 'EB Garamond',serif;letter-spacing:.16em;text-transform:uppercase;color:#a396b8;}
.mv{font-size:25px;color:#efe8dc;line-height:1.3;}
/* Die Liste trägt die Karte: sie dehnt sich über die freie Höhe, statt
   oben zu kleben und den Rest leer zu lassen. */
.eff{margin-top:26px;flex:1;min-height:0;display:flex;flex-direction:column;
  justify-content:center;gap:32px;}
.eff li{list-style:none;position:relative;padding-left:30px;font-size:${effFont}px;line-height:1.34;color:#e9e2d6;}
.eff li::before{content:"";position:absolute;left:4px;top:15px;width:11px;height:11px;border-radius:50%;
  background:var(--a);}
.ends{padding-top:18px;border-top:1px solid rgba(224,178,78,.22);
  font-size:22px;line-height:1.35;color:#cfc4dd;}
.foot{position:absolute;left:104px;right:104px;bottom:${Math.round((F?.bodyBottom ?? 78) * 0.5)}px;z-index:2;
  display:flex;justify-content:space-between;font:600 14px/1 'EB Garamond',serif;
  letter-spacing:.16em;text-transform:uppercase;color:#8f84a0;}
.foot .cf{color:var(--gold);}
</style></head><body>
<div class="bleed"></div><div class="glow"></div><div class="frame"></div><div class="bar"></div>
<div class="page">
  <div class="kind">${escapeHtml(t.label)}</div>
  <div class="title">${escapeHtml(c.name)}</div>
  <div class="meta">
    <div class="mrow"><span class="ml">Dauer</span><span class="mv">${escapeHtml(c.duration)}</span></div>
    <div class="mrow"><span class="ml">Rettungswurf</span><span class="mv">${escapeHtml(c.save)}</span></div>
  </div>
  <ul class="eff">${c.effects.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>
  <div class="ends">${escapeHtml(c.ends)}</div>
</div>
<div class="foot"><span>${escapeHtml(c.source)}</span><span class="cf">Chaos Forge</span></div>
</body></html>`;
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: CW, height: CH }, deviceScaleFactor: 1 });
let n = 0;
for (const c of CONDITIONS) {
  await page.setContent(render(c), { waitUntil: "networkidle" });
  const over = await page.evaluate(() => {
    const b = document.querySelector(".page");
    return b.scrollHeight - b.clientHeight;
  });
  await page.screenshot({ path: join(OUT, `${String(++n).padStart(2, "0")}_${slug(c.key)}.png`), clip: { x: 0, y: 0, width: CW, height: CH } });
  console.log(`  ✓ ${c.name}${over > 4 ? `   ⚠ ${over}px Überlauf` : ""}`);
}
await browser.close();
console.log(`\nFertig: ${n} Zustandskarten → ${OUT}`);
