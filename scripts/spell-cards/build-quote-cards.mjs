// Baut Zitatkarten aus chronicle_quotes. Kein Bild, kein KI-Aufruf — die Karten
// entstehen in Sekunden und kosten nichts.
//
// Nutzung: node build-quote-cards.mjs [--tarot70|--tarot] [--limit=5]
import { chromium } from "playwright";
import { mkdirSync, rmSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supa, slug } from "./lib.mjs";
import { renderQuoteCard } from "./template-quote.mjs";
import { TAROT_REF_FMT, IS_TAROT as TAROT, DIR_SUFFIX } from "./tarot.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const F = TAROT ? { W: TAROT_REF_FMT.W, H: TAROT_REF_FMT.H, fs: 1.28 } : undefined;
const CW = F?.W ?? 768, CH = F?.H ?? 1146;
const OUT = join(HERE, "out", `quote-cards${TAROT ? DIR_SUFFIX : ""}`);
mkdirSync(OUT, { recursive: true });

// Sprecher → Akzentfarbe: die Helden in ihrer Klassenfarbe, der Rest in Gold.
const VOICE = {
  larry: ["#e0524e", "#8f2f2b"],
  gor: ["#e0524e", "#8f2f2b"],
  nowi: ["#5b8def", "#2f4fa0"],
  sprocket: ["#3ec7bd", "#0d7d75"],
  isolde: ["#b57bff", "#7c3aed"],
};
const accentFor = (who) => {
  const key = Object.keys(VOICE).find((k) => (who || "").toLowerCase().includes(k));
  return key ? VOICE[key] : ["#e0b24e", "#a1782f"];
};

const sb = supa();
const { data: quotes } = await sb.from("chronicle_quotes").select("content,attributed_to").order("created_at");
const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] || 0);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: CW, height: CH }, deviceScaleFactor: 1 });
let n = 0;
for (const q of quotes) {
  if (limit && n >= limit) break;
  // Doppelte Anführungszeichen aus dem Eingabefeld entfernen — die Karte setzt
  // ihre eigenen, sonst stehen zwei Paare übereinander.
  const text = q.content.trim().replace(/^["„»]+|["“«]+$/g, "").trim();
  const who = (q.attributed_to || "").trim() || "Überliefert";
  const [a, a2] = accentFor(who);
  await page.setContent(renderQuoteCard({ quote: text, who, accent: a, accent2: a2, fmt: F }), { waitUntil: "networkidle" });
  const over = await page.evaluate(() => {
    const b = document.querySelector(".body");
    return b.scrollHeight - b.clientHeight;
  });
  await page.screenshot({ path: join(OUT, `${String(++n).padStart(2, "0")}_${slug(text).slice(0, 40)}.png`), clip: { x: 0, y: 0, width: CW, height: CH } });
  console.log(`  ✓ ${who.padEnd(14)} ${text.replace(/\n/g, " ").slice(0, 52)}${over > 4 ? `   ⚠ ${over}px Überlauf` : ""}`);
}
await browser.close();
console.log(`\nFertig: ${n} Zitatkarten → ${OUT}`);
