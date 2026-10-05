// Sonderkarte: ein Zitat auf einem eigenen Artwork statt auf leerem Grund.
// Für die Sprüche, die eine Bühne verdienen.
//
// Nutzung: node build-special-card.mjs [--tarot70|--tarot] [--force]
import { chromium } from "playwright";
import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { escapeHtml, fontFaceCss } from "./lib.mjs";
import { generateImage } from "./generate-image.mjs";
import { checkArt } from "./check-art.mjs";
import { TAROT_REF_FMT, IS_TAROT as TAROT, DIR_SUFFIX } from "./tarot.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const CW = TAROT ? TAROT_REF_FMT.W : 768, CH = TAROT ? TAROT_REF_FMT.H : 1146;
const OUT = join(HERE, "out", `special-cards${TAROT ? DIR_SUFFIX : ""}`);
const ART = join(HERE, "cache", "art-items");
[OUT, ART].forEach((d) => mkdirSync(d, { recursive: true }));
const FONT_CSS = fontFaceCss();

const CARDS = [
  {
    key: "labskaus",
    quote: "East Coast, West Coast, Labskaus",
    // Der Spruch verschraubt die Rapper-Fehde der US-Küsten mit einem
    // norddeutschen Seemannsgericht — das Bild nimmt genau diesen Zusammenprall
    // auf. Menschen sind hier ausdrücklich erwünscht, anders als bei den
    // Gegenstandskarten.
    subject: "a jovial dwarven sailor in a tavern holding a plate of food",
    prompt:
      "A jovial bearded dwarven sailor in a torchlit harbour tavern, striking a confident hip-hop pose with " +
      "crossed arms and heavy gold chains over his weathered seafarer's coat, a steaming tin plate of labskaus " +
      "(mashed potato hash with beetroot, pickled herring and a fried egg on top) held up proudly in one hand. " +
      "Two rival crews of sailors glower at each other in the smoky background, tankards raised. " +
      "Warm amber lantern light against deep indigo shadows, dark fantasy painterly digital illustration, " +
      "humorous and larger than life, richly detailed. No text, no letters, no numbers, no watermark.",
  },
  {
    key: "reverse",
    quote: "Zurück an den Absender",
    // Die Uno-Reverse-Geste als Fantasy-Szene: der Zauber prallt am Schild ab
    // und fliegt dorthin zurück, wo er herkam. Die beiden umlaufenden Pfeile
    // sind das Zitat der Vorlage, ohne sie nachzubauen.
    subject: "a spell being reflected back at a bald bearded sorcerer with glasses, two curved arrows circling",
    // Als Ziel dient der Spielleiter selbst — deshalb sein PIN-Gate-Artwork als
    // Bildvorlage, damit er auf der Karte wiedererkennbar bleibt.
    ref: "public/images/gm-panels/master-pin-portrait.webp",
    prompt:
      "Use the man from the reference image — bald head, full greying beard, dark-rimmed glasses, ornate dark " +
      "robe covered in arcane symbols — as the sorcerer in a new scene. He stands at the right in a torchlit " +
      "dungeon corridor, one hand still outstretched from casting, his face caught in comic open-mouthed " +
      "astonishment as the bolt of sickly green magic he just hurled comes racing straight back at him. " +
      "At the left a small grinning gnome tinkerer in goggles crouches behind a round runed shield that has " +
      "just deflected it. Two large curved golden arrows chase each other in a circle around the middle of the " +
      "scene, forming a glowing ring that marks the reversal. Keep his face clearly recognisable. " +
      "Teal and gold arcane light against deep indigo shadows, dark fantasy painterly digital illustration, " +
      "comedic timing, dynamic motion, richly detailed. No text, no letters, no numbers, no watermark.",
  },
];
async function artB64(CARD) {
  const f = join(ART, `special-${CARD.key}${TAROT ? "-tarot" : ""}.webp`);
  const src = join(ART, `special-${CARD.key}.src.webp`);
  if (!existsSync(f) || process.argv.includes("--force")) {
    let buf;
    if (existsSync(src) && !process.argv.includes("--force")) {
      buf = readFileSync(src);
    } else {
      for (let attempt = 1; attempt <= 4; attempt++) {
        const ref = CARD.ref ? readFileSync(join(ROOT, CARD.ref)) : undefined;
        const candidate = await generateImage(CARD.prompt, { aspectRatio: "3:4", refImage: ref });
        // Nur auf Text prüfen — Menschen gehören hier ins Bild.
        const check = await checkArt(candidate, CARD.subject);
        if (!check.detail?.has_real_text) {
          buf = candidate;
          console.log(`  Bildprüfung ok (Versuch ${attempt}): ${check.detail?.subject_seen ?? ""}`);
          break;
        }
        console.log(`  Versuch ${attempt} verworfen: Text im Bild — ${check.reason}`);
      }
      if (!buf) throw new Error("kein brauchbares Bild nach 4 Versuchen");
      await sharp(buf).webp({ quality: 95 }).toFile(src);
    }
    await sharp(buf).resize(CW, CH, { fit: "cover", position: "attention" }).webp({ quality: 90 }).toFile(f);
  }
  return readFileSync(f).toString("base64");
}

const fs = TAROT ? 1.28 : 1;
const px = (n) => Math.round(n * fs);

const cardHtml = (CARD, b64) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
${FONT_CSS}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${CW}px;height:${CH}px;}
body{position:relative;overflow:hidden;font-family:'EB Garamond',Georgia,serif;color:#f6f0e4;--gold:#e0b24e;}
.art{position:absolute;inset:0;background:#100b18 center/cover no-repeat;
  background-image:url(data:image/webp;base64,${b64});}
/* Der Verlauf verdunkelt nur das untere Fünftel — dort steht die Schrift. Die
   Bildmitte bleibt frei, damit die Pointe des Motivs sichtbar ist. */
.art::after{content:"";position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(16,11,24,.35) 0%,transparent 22%,transparent 62%,rgba(16,11,24,.72) 80%,rgba(16,11,24,.96) 92%,#100b18 100%);}
.frame{position:absolute;left:66px;top:66px;right:66px;bottom:66px;border-radius:22px;
  border:2px solid color-mix(in srgb,var(--gold) 70%,#3a3350);
  box-shadow:0 0 0 1px rgba(0,0,0,.55) inset,0 0 60px rgba(0,0,0,.6) inset;pointer-events:none;z-index:3;}
.frame::before{content:"";position:absolute;inset:7px;border-radius:16px;border:1px solid color-mix(in srgb,var(--gold) 38%,transparent);}
.body{position:absolute;left:${px(84)}px;right:${px(84)}px;bottom:${px(104)}px;z-index:3;
  display:flex;flex-direction:column;align-items:center;gap:${px(26)}px;text-align:center;}
.q{font-family:'Cinzel',serif;font-weight:700;font-size:${px(58)}px;line-height:1.14;color:#fdf8ec;
  text-wrap:balance;text-shadow:0 3px 18px rgba(0,0,0,.85),0 1px 3px rgba(0,0,0,.9);}
</style></head><body>
<div class="art"></div><div class="frame"></div>
<div class="body"><div class="q">${escapeHtml(CARD.quote)}</div></div>
</body></html>`;

const ONLY = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: CW, height: CH }, deviceScaleFactor: 1 });
let n = 0;
for (const CARD of CARDS) {
  if (ONLY && CARD.key !== ONLY) { n++; continue; } // Nummerierung stabil halten
  console.log(`→ ${CARD.quote}`);
  const b64 = await artB64(CARD);
  await page.setContent(cardHtml(CARD, b64), { waitUntil: "networkidle" });
  await page.screenshot({ path: join(OUT, `${String(++n).padStart(2, "0")}_${CARD.key}.png`), clip: { x: 0, y: 0, width: CW, height: CH } });
  console.log(`  ✓ fertig`);
}
await browser.close();
console.log(`\nFertig: ${CARDS.length} Sonderkarten → ${OUT}`);
