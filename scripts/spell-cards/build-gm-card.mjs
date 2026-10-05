// Karte für den Spielleiter. Das Motiv ist das Artwork aus dem PIN-Gate des
// GM-Bereichs (public/images/gm-panels/master-pin-portrait.webp).
//
// Der Ausschnitt sitzt bewusst oben: dort ist das Gesicht, und der Schriftzug
// "Master of Chaos" im aufgeschlagenen Buch am unteren Bildrand fällt weg —
// Text im Kartenbild soll es nicht geben.
//
// Nutzung: node build-gm-card.mjs [--tarot70|--tarot] [--name="..."] [--text="..."]
import { chromium } from "playwright";
import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { renderNpcCard } from "./template-npc.mjs";
import { TAROT_EPIC_FMT, IS_TAROT as TAROT, DIR_SUFFIX } from "./tarot.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const F = TAROT ? TAROT_EPIC_FMT : undefined;
const CW = F?.W ?? 768, CH = F?.H ?? 1146;
const P_W = TAROT ? 898 : 768, P_H = TAROT ? 1010 : 780;
const OUT = join(HERE, "out", `gm-card${TAROT ? DIR_SUFFIX : ""}`);
mkdirSync(OUT, { recursive: true });

const arg = (k, fallback) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? fallback;
const NAME = arg("name", "Master of Chaos");
const TEXT = arg(
  "text",
  "Hinter dem Schirm sitzt der, der die Würfel deutet: Er kennt jede Gasse in Berrybuck, " +
    "jeden Namen in den Finnigans Höhlen und genau den Moment, in dem alles schiefgeht. " +
    "Ohne ihn wäre die Chronik des Chaos ein leeres Buch."
);

const SRC = join(ROOT, "public", "images", "gm-panels", "master-pin-portrait.webp");
// Oberer Bildausschnitt: Gesicht groß, Buchseite mit Schriftzug außerhalb.
const portrait = await sharp(readFileSync(SRC))
  .resize(P_W, P_H, { fit: "cover", position: "top", kernel: "lanczos3" })
  .sharpen({ sigma: 1.0 })
  .webp({ quality: 92 })
  .toBuffer();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: CW, height: CH }, deviceScaleFactor: 1 });
const card = (artH, textFont) =>
  renderNpcCard({
    name: NAME, location: "Spielleiter", text: TEXT,
    portraitB64: portrait.toString("base64"),
    accent: "#e0524e", accent2: "#8f2f2b", textFont,
    fmt: artH ? { ...F, artH, bodyTop: artH - 14 } : F,
  });
const measure = () =>
  page.evaluate(() => {
    const b = document.querySelector(".body");
    return [...b.children].reduce((s, el) => s + el.offsetHeight, 0) + 44;
  });

let textFont = 26, artH = 0;
for (const size of [26, 24, 22, 20]) {
  textFont = size;
  await page.setContent(card(null, size), { waitUntil: "networkidle" });
  artH = Math.max(620, Math.min(1010, CH - (F?.bodyBottom ?? 78) - (await measure()) - 36));
  if (artH > 620) break;
}
await page.setContent(card(artH, textFont), { waitUntil: "networkidle" });
await page.screenshot({ path: join(OUT, "01_spielleiter.png"), clip: { x: 0, y: 0, width: CW, height: CH } });
await browser.close();
console.log(`✓ Spielleiterkarte "${NAME}" → ${OUT}/01_spielleiter.png`);
