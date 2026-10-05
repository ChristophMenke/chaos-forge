// Baut Karten für die NPCs aus der Chronik: Portrait, Ort und Beschreibung.
// Die Porträts liegen bereits als Avatare im Supabase-Storage — es wird also
// kein Bild generiert, nur geladen, zugeschnitten und gecacht.
//
// Nutzung: node build-npc-cards.mjs [--tarot70|--tarot] [--only=saria] [--force]
import { chromium } from "playwright";
import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync, rmSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supa, slug } from "./lib.mjs";
import { renderNpcCard } from "./template-npc.mjs";
import { TAROT_EPIC_FMT, IS_TAROT as TAROT, DIR_SUFFIX } from "./tarot.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const F = TAROT ? TAROT_EPIC_FMT : undefined;
const CW = F?.W ?? 768, CH = F?.H ?? 1146;
const P_W = TAROT ? 898 : 768, P_H = TAROT ? 1010 : 780;
const SUF = TAROT ? "-tarot" : "";
const OUT = join(HERE, "out", `npc-cards${TAROT ? DIR_SUFFIX : ""}`);
const PORT = join(HERE, "cache", "portraits");
[OUT, PORT].forEach((d) => mkdirSync(d, { recursive: true }));

// Ort → Akzentfarbe, damit sich die Karten am Tisch nach Region sortieren
// lassen. Unbekannte Orte bekommen Gold.
const PLACE = {
  Berrybuck: ["#e0b24e", "#a1782f"],
  "Berrybuck Castle": ["#e0524e", "#8f2f2b"],
  "Finnigans Höhlen": ["#3ec7bd", "#0d7d75"],
  Greifen: ["#5b8def", "#2f4fa0"],
  Archenbridge: ["#b57bff", "#7c3aed"],
  Archendale: ["#b57bff", "#7c3aed"],
  Sembia: ["#2dd4bf", "#0d9488"],
  Faerûn: ["#e0b24e", "#a1782f"],
};

async function portraitB64(npc) {
  const f = join(PORT, `npc-${slug(npc.name)}${SUF}.webp`);
  if (!existsSync(f) || process.argv.includes("--force")) {
    const src = Buffer.from(await (await fetch(npc.avatar_url)).arrayBuffer());
    await sharp(src)
      .resize(P_W, P_H, { fit: "cover", position: "top", kernel: "lanczos3" })
      .sharpen({ sigma: 1.1 })
      .webp({ quality: 92 })
      .toFile(f);
  }
  return readFileSync(f).toString("base64");
}

const sb = supa();
const { data: npcs } = await sb
  .from("chronicle_npcs")
  .select("name,location,description,avatar_url")
  .order("location")
  .order("name");

const ONLY = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1]?.toLowerCase();
if (!ONLY) { rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true }); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: CW, height: CH }, deviceScaleFactor: 1 });
let n = 0;
for (const npc of npcs) {
  if (!npc.avatar_url) { console.log(`  – ohne Portrait übersprungen: ${npc.name}`); continue; }
  if (ONLY && !npc.name.toLowerCase().includes(ONLY)) continue;
  const [a, a2] = PLACE[npc.location] || PLACE["Faerûn"];
  const b64 = await portraitB64(npc);
  const card = (artH, textFont) =>
    renderNpcCard({
      name: npc.name, location: npc.location || "Unbekannt", text: (npc.description || "").trim(),
      portraitB64: b64, accent: a, accent2: a2, textFont,
      fmt: artH ? { ...F, artH, bodyTop: artH - 14 } : F,
    });
  const measure = async () =>
    page.evaluate(() => {
      const b = document.querySelector(".body");
      return [...b.children].reduce((sum, el) => sum + el.offsetHeight, 0) + 44;
    });

  // Textbedarf messen, Portrait füllt den Rest. Die Beschreibungen reichen von
  // 80 bis 550 Zeichen — eine feste Bildhöhe würde die kurzen Karten halb leer
  // lassen und die langen zum Textblock mit Briefmarke machen.
  //
  // Deshalb ein ZIEL statt einer Untergrenze: Das Porträt soll gut die Hälfte
  // der Karte tragen. Die Schrift rückt so lange enger, bis das erreicht ist —
  // reicht selbst die kleinste Stufe nicht, gewinnt der Text, damit nichts
  // abgeschnitten wird.
  const TARGET_ART = Math.round(CH * 0.56);
  let textFont = 26, artH = 0;
  for (const size of [26, 24, 22, 21, 20, 19, 18]) {
    textFont = size;
    await page.setContent(card(null, size), { waitUntil: "networkidle" });
    artH = Math.min(1010, CH - (F?.bodyBottom ?? 78) - (await measure()) - 36);
    if (artH >= TARGET_ART) break;
  }
  artH = Math.max(460, artH); // Notnagel für extrem lange Texte
  await page.setContent(card(artH, textFont), { waitUntil: "networkidle" });
  await page.screenshot({ path: join(OUT, `${String(++n).padStart(2, "0")}_${slug(npc.name)}.png`), clip: { x: 0, y: 0, width: CW, height: CH } });
  const over = await page.evaluate(() => {
    const b = document.querySelector(".body");
    return b.scrollHeight - b.clientHeight;
  });
  console.log(`  ✓ ${npc.name} · ${npc.location}${over > 4 ? `   ⚠ ${over}px Überlauf` : ""}`);
}
await browser.close();
console.log(`\nFertig: ${n} NPC-Karten → ${OUT}`);
