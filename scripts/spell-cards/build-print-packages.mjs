// Schnürt aus den gerenderten PNGs die bestellfertigen Pakete (nummerierte
// Vorderseiten + gemeinsame Rückseite) und zippt sie — für alle Formatprofile.
// Nutzung: node build-print-packages.mjs [profil …]   (ohne Argument: alle)
//   z. B. node build-print-packages.mjs tarot70
//
// Profile und ihre Quellordner (müssen vorher gerendert sein):
//   tarot70  898×1488  out/decks-tarot70/, out/char-cards-tarot70/   meinspiel 70×120 mm
//   tarot    898×1500  out/decks-tarot/,   out/char-cards-tarot/     printerstudio 70×121 mm
//   std      768×1146  out/decks/,         out/char-cards/           meinspiel 59×91 mm
import { readdirSync, existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { crc32 } from "zlib";
import { PACKAGES, SET_TWO } from "./print-manifest.mjs";

// Playwright-Screenshots enthalten keinen pHYs-Chunk, die PNGs tragen also keine
// dpi-Angabe. Upload-Editoren nehmen dann 72 dpi an und platzieren die Karte in
// falscher Größe (sichtbarer weißer Rand statt randlos). Physisch stimmt die
// Auflösung längst — 898 px auf 76 mm sind 300 dpi —, es fehlt nur die Angabe.
// Wir schreiben sie beim Verpacken hinein: 300 dpi = 11811 Pixel pro Meter.
const PPM_300DPI = Math.round(300 / 0.0254); // 11811

function copyWithDpi(src, dest) {
  const buf = readFileSync(src);
  if (buf.length < 8 || buf.readUInt32BE(12) !== 0x49484452 /* "IHDR" */) {
    copyFileSync(src, dest); // kein erwartetes PNG-Layout → unverändert übernehmen
    return false;
  }
  // Vorhandenen pHYs-Chunk suchen (dann ist nichts zu tun).
  let pos = 8;
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("latin1", pos + 4, pos + 8);
    if (type === "pHYs") { copyFileSync(src, dest); return false; }
    if (type === "IDAT" || type === "IEND") break;
    pos += 12 + len;
  }
  // pHYs direkt hinter IHDR einfügen (muss laut Spec vor IDAT stehen).
  const ihdrEnd = 8 + 12 + buf.readUInt32BE(8);
  const body = Buffer.alloc(13);
  body.write("pHYs", 0, "latin1");
  body.writeUInt32BE(PPM_300DPI, 4);
  body.writeUInt32BE(PPM_300DPI, 8);
  body.writeUInt8(1, 12); // Einheit 1 = Meter
  const chunk = Buffer.concat([
    Buffer.from([0, 0, 0, 9]), // Datenlänge (ohne Typ und CRC)
    body,
    (() => { const c = Buffer.alloc(4); c.writeUInt32BE(crc32(body) >>> 0); return c; })(),
  ]);
  writeFileSync(dest, Buffer.concat([buf.subarray(0, ihdrEnd), chunk, buf.subarray(ihdrEnd)]));
  return true;
}

export const PROFILES = {
  tarot70: { charDir: "out/char-cards-tarot70", deckRoot: "out/decks-tarot70", outRoot: "out/print-ready/meinspiel-70x120", suffix: "", label: "meinspiel 70×120" },
  tarot: { charDir: "out/char-cards-tarot", deckRoot: "out/decks-tarot", outRoot: "out/print-ready", suffix: "", label: "printerstudio 70×121" },
  std: { charDir: "out/char-cards", deckRoot: "out/decks", outRoot: "out/print-ready/meinspiel", suffix: "-meinspiel", label: "meinspiel 59×91" },
};

// Sammelt die Kartenpfade eines Pakets in Bestellreihenfolge:
// Referenz → Epics → Zauber (Level 1-9, je alphabetisch).
export function collectCards(pkg, profileKey) {
  const p = PROFILES[profileKey];
  if (!p) throw new Error(`Unbekanntes Profil "${profileKey}" (bekannt: ${Object.keys(PROFILES).join(", ")})`);
  const deckDir = join(p.deckRoot, pkg.deckDir);
  const cards = [{ src: join(p.charDir, `${pkg.reference}.png`), name: "referenz" }];
  for (const e of pkg.epics) cards.push({ src: join(p.charDir, `${e.file}.png`), name: e.name });
  if (pkg.hasSpells) {
    for (let lvl = 1; lvl <= 9; lvl++) {
      const d = join(deckDir, `level-${lvl}`);
      if (!existsSync(d)) continue;
      for (const f of readdirSync(d).filter((f) => f.endsWith(".png")).sort()) {
        cards.push({ src: join(d, f), name: `L${lvl}_${f.replace(/\.png$/, "")}` });
      }
    }
  }
  return { cards, back: join(deckDir, "card-back.png") };
}

function buildPackage(pkg, profileKey) {
  const p = PROFILES[profileKey];
  const outDir = join(p.outRoot, `${pkg.id}${p.suffix}`);
  const { cards, back } = collectCards(pkg, profileKey);

  const missing = [...cards.map((c) => c.src), back].filter((f) => !existsSync(f));
  if (missing.length) throw new Error(`${pkg.id} (${profileKey}): fehlende Quelldateien:\n  ${missing.join("\n  ")}`);

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const pad = String(cards.length).length; // 33 Karten → 2-stellig, 100+ → 3-stellig
  let stamped = 0;
  cards.forEach((c, i) => {
    if (copyWithDpi(c.src, join(outDir, `${String(i + 1).padStart(pad, "0")}_${c.name}.png`))) stamped++;
  });
  if (copyWithDpi(back, join(outDir, "_ruckseite.png"))) stamped++;

  const zip = `${outDir}.zip`;
  rmSync(zip, { force: true });
  execFileSync("zip", ["-qrj", zip, outDir]);
  console.log(`✓ ${pkg.label} · ${p.label}: ${cards.length} Karten + Rückseite (${stamped}× 300-dpi-Angabe ergänzt) → ${zip}`);
}

// Ein einziges Set mit den Karten ALLER Helden, nach Held gruppiert, plus der
// charakterunabhängigen Grimoire-Rückseite. Für Anbieter/Konfigurationen, die pro
// Set nur EINE Rückseite zulassen — die individuellen Portrait-Rückseiten sind
// dann nicht nutzbar. Die neutrale Rückseite kommt aus `node back.mjs --tarot70`.
function buildCombined(profileKey) {
  const p = PROFILES[profileKey];
  const backFile = { tarot70: "card-back-tarot70.png", tarot: "card-back-tarot.png", std: "card-back.png" }[profileKey];
  const back = join("out", backFile);
  if (!existsSync(back)) throw new Error(`Neutrale Rückseite fehlt: ${back} — vorher "node back.mjs${profileKey === "std" ? "" : ` --${profileKey}`}" laufen lassen`);

  const cards = [];
  for (const pkg of PACKAGES) {
    const held = pkg.id.replace(/-(zauberdeck|karten)$/, "");
    for (const c of collectCards(pkg, profileKey).cards) cards.push({ src: c.src, name: `${held}-${c.name}` });
    // Lernvorschläge direkt hinter die eigenen Karten des Helden einsortieren
    // (erzeugt via render-extra-cards.mjs), erkennbar am Namensteil "neu".
    const extras = join("out", `extras${profileKey === "std" ? "" : `-${profileKey}`}`, held);
    if (existsSync(extras)) {
      for (const f of readdirSync(extras).filter((f) => f.endsWith(".png")).sort()) {
        cards.push({ src: join(extras, f), name: `${held}-neu-${f.replace(/\.png$/, "")}` });
      }
    }
  }

  const outDir = join(p.outRoot, "alle-helden");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const pad = String(cards.length).length;
  cards.forEach((c, i) => copyWithDpi(c.src, join(outDir, `${String(i + 1).padStart(pad, "0")}_${c.name}.png`)));
  copyWithDpi(back, join(outDir, "_ruckseite.png"));

  const zip = `${outDir}.zip`;
  rmSync(zip, { force: true });
  execFileSync("zip", ["-qrj", zip, outDir]);
  console.log(`✓ Alle Helden · ${p.label}: ${cards.length} Karten + neutrale Rückseite → ${zip}`);
}

// Kartenliste des zweiten Sets (Catrina, Nachzügler-Zauber, Regel- und
// Item-Karten). Die Quellordner tragen je Profil ein Suffix — bei "std" keins.
export function collectSetTwo(profileKey) {
  const sfx = profileKey === "std" ? "" : `-${profileKey}`;
  const cards = [];
  for (const s of SET_TWO.sources) {
    const dir = s.sub ? join(`${s.dir}${sfx}`, s.sub) : `${s.dir}${sfx}`;
    if (!existsSync(dir)) throw new Error(`${SET_TWO.id} (${profileKey}): Quellordner fehlt: ${dir}`);
    const files = s.only ?? readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
    for (const f of files) {
      const src = join(dir, f);
      if (!existsSync(src)) throw new Error(`${SET_TWO.id}: Datei fehlt: ${src}`);
      // Führende Nummern der Quellordner entfernen — die Nummerierung des
      // Pakets vergibt buildSetTwo neu und fortlaufend über alle Blöcke.
      cards.push({ src, name: `${s.prefix}-${f.replace(/^\d+_/, "").replace(/\.png$/, "")}` });
    }
  }
  return cards;
}

function buildSetTwo(profileKey) {
  const p = PROFILES[profileKey];
  const backFile = { tarot70: "card-back-tarot70.png", tarot: "card-back-tarot.png", std: "card-back.png" }[profileKey];
  const back = join("out", backFile);
  if (!existsSync(back)) throw new Error(`Neutrale Rückseite fehlt: ${back} — vorher "node back.mjs --${profileKey}" laufen lassen`);

  const cards = collectSetTwo(profileKey);
  const outDir = join(p.outRoot, SET_TWO.id);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const pad = String(cards.length).length;
  let stamped = 0;
  cards.forEach((c, i) => {
    if (copyWithDpi(c.src, join(outDir, `${String(i + 1).padStart(pad, "0")}_${c.name}.png`))) stamped++;
  });
  if (copyWithDpi(back, join(outDir, "_ruckseite.png"))) stamped++;

  const zip = `${outDir}.zip`;
  rmSync(zip, { force: true });
  execFileSync("zip", ["-qrj", zip, outDir]);
  console.log(`✓ ${SET_TWO.label} · ${p.label}: ${cards.length} Karten + neutrale Rückseite (${stamped}× 300-dpi-Angabe ergänzt) → ${zip}`);
}

// Nur bauen, wenn direkt aufgerufen — build-print-pdf.mjs importiert collectCards().
if (process.argv[1]?.endsWith("build-print-packages.mjs")) {
  const wanted = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const profiles = wanted.length ? wanted : Object.keys(PROFILES);
  for (const key of profiles) {
    for (const pkg of PACKAGES) buildPackage(pkg, key);
    if (process.argv.includes("--combined")) buildCombined(key);
    if (process.argv.includes("--set2")) buildSetTwo(key);
  }
}
