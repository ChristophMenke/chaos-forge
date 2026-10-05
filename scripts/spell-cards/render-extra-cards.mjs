// Rendert Zauberkarten für Zauber, die ein Charakter noch NICHT gelernt hat —
// z. B. Lernvorschläge, die mit ins gedruckte Set sollen. Trägt dasselbe
// Besitzer-Kürzel oben mittig wie die regulären Karten.
// Nutzung: node render-extra-cards.mjs <owner> [--tarot70|--tarot]
//   z. B. node render-extra-cards.mjs FixIt --tarot70
// Welche Zauber, steht in EXTRA_SPELLS unten — oder per --spells="A,B" gezielt
// eine abweichende Auswahl (Komma-getrennt, englische Namen).
import { chromium } from "playwright";
import { mkdirSync, existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supa, slug, englishName } from "./lib.mjs";
import { getContent } from "./content.mjs";
import { renderCardV2 } from "./template-v2.mjs";
import { TAROT_SPELL_FMT, IS_TAROT as TAROT, DIR_SUFFIX } from "./tarot.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CW = TAROT ? TAROT_SPELL_FMT.W : 768, CH = TAROT ? TAROT_SPELL_FMT.H : 1146;

// Lernvorschläge für Sprocket, in zwei Prioritäten:
//  1. Zauber aus Nowis Repertoire, die Sprocket fehlen UND die er als
//     Illusionist lernen darf (Oppositionsschulen Necromancy / Invocation /
//     Abjuration sind ausgeschlossen — deshalb fehlen hier Magic Missile,
//     Fireball, Dispel Magic, Alarm, Stinking Cloud, Lance of Disruption, Dig).
//  2. Auffüller: Zauber, die keiner der beiden hat, die aber eine echte Lücke
//     in Sprockets Repertoire schließen.
const DEFAULT_EXTRA_SPELLS = [
  // Prio 1 — aus Nowis Deck, für Illusionisten erlaubt
  "Burning Hands", "Cantrip", "Change Self", "Charm Person", "Feather Fall",
  "Message", "Mount", "Read Magic", "Sleep",
  "Alter Self", "Detect Invisibility", "Knock",
  "Hold Person", // L3 Enchantment/Charm — Nachtrag, war beim ersten Lauf übersehen
  "Monster Summoning I", "Tongues",
  // Prio 2 — Empfehlung
  "Shadow Monsters", // L4 Illusion: einzige echte Kampfoption, da Invocation gesperrt
  "Rope Trick", // L2 Alteration: sicherer Rastplatz, fehlt der Gruppe komplett
];

// --spells="Hold Person" rendert gezielt nur diese Auswahl (z. B. für Nachzügler,
// die nicht das ganze Set neu bauen sollen).
const spellsArg = process.argv.find((a) => a.startsWith("--spells="))?.slice(9);
const EXTRA_SPELLS = spellsArg
  ? spellsArg.split(",").map((s) => s.trim()).filter(Boolean)
  : DEFAULT_EXTRA_SPELLS;

const owner = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "";
// Zielordner heißt wie das Deck (nicht wie das Besitzer-Kürzel), damit
// build-print-packages.mjs die Extras dem richtigen Helden zuordnen kann.
const deck = process.argv.find((a) => a.startsWith("--deck="))?.slice(7) || slug(owner) || "extra";
const OUT = join(HERE, "out", `extras${TAROT ? DIR_SUFFIX : ""}`, deck);
mkdirSync(OUT, { recursive: true });

const sb = supa();
let all = [], from = 0;
for (;;) {
  const { data } = await sb.from("spells").select("*").range(from, from + 999);
  all = all.concat(data);
  if (data.length < 1000) break;
  from += 1000;
}

// Bei Duplikaten die vollständigste Zeile nehmen (die DB hat einzelne Dubletten).
const score = (s) => ["description", "range", "duration", "area_of_effect", "components"].filter((f) => s[f]).length;
// Über englishName() vergleichen, nicht über das Rohfeld: bei einigen Zaubern ist
// name_en leer oder abweichend (z. B. "Klopfen" → Knock), englishName() korrigiert das.
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const picked = [];
for (const want of EXTRA_SPELLS) {
  const hits = all
    .filter((s) => s.spell_type === "wizard" && [englishName(s), s.name_en, s.name].some((n) => norm(n) === norm(want)))
    .sort((a, b) => score(b) - score(a));
  if (!hits.length) { console.log(`  ⚠ nicht in DB: ${want}`); continue; }
  picked.push(hits[0]);
}
picked.sort((a, b) => a.level - b.level || englishName(a).localeCompare(englishName(b)));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: CW, height: CH }, deviceScaleFactor: 1 });
let n = 0;
for (const s of picked) {
  const file = join(OUT, `L${s.level}_${slug(englishName(s))}.png`);
  if (existsSync(file) && !process.argv.includes("--force")) { n++; continue; }
  const { rules, artPath, stats } = await getContent(s);
  const artB64 = artPath && existsSync(artPath) ? readFileSync(artPath).toString("base64") : "";
  await page.setContent(
    renderCardV2(s, { rules, artB64, stats, classLabel: "Illusionist", owner, fmt: TAROT ? TAROT_SPELL_FMT : undefined }),
    { waitUntil: "networkidle" }
  );
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: CW, height: CH } });
  n++;
  console.log(`  ✓ L${s.level} ${englishName(s)}`);
}
await browser.close();
console.log(`\nFertig: ${n}/${EXTRA_SPELLS.length} Karten → ${OUT}`);
