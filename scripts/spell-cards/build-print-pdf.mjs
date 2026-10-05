// Baut mehrseitige PDFs (eine Karte pro Seite, exakte physische Kartengröße)
// aus bereits gerenderten PNGs — für den "PDF hochladen"-Weg bei meinspiel.de.
// Nutzung: node build-print-pdf.mjs [profil …]   (ohne Argument: alle meinspiel-Profile)
//   z. B. node build-print-pdf.mjs tarot70
//
// Seitengröße = meinspiels Dokumentgröße inkl. 3 mm Beschnitt:
//   tarot70  70×120 mm Endformat → 76×126 mm Seite (aus 898×1488 px)
//   std      59×91  mm Endformat → 65×97  mm Seite (aus 768×1146 px)
// Umfang und Reihenfolge kommen aus print-manifest.mjs — identisch zu den ZIPs.
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { PACKAGES, SET_TWO } from "./print-manifest.mjs";
import { collectCards, collectSetTwo } from "./build-print-packages.mjs";

// Chromium rundet die Seitengröße auf ganze CSS-Pixel auf — aus 76×126 mm wird
// 76,2×126,32 mm. Druckereien prüfen die Dokumentgröße exakt, deshalb korrigieren
// wir die MediaBox nachträglich auf den Sollwert. Der Ersatz ist längentreu
// (rechts mit Leerzeichen aufgefüllt), damit die Byte-Offsets der xref-Tabelle
// gültig bleiben. Die ~0,2 mm Motiv, die dadurch außerhalb der Seite liegen,
// fallen in den 3-mm-Beschnitt und werden ohnehin weggeschnitten.
function setExactPageSize(pdfPath, { w, h }) {
  const MM_TO_PT = 72 / 25.4;
  const wPt = w * MM_TO_PT, hPt = h * MM_TO_PT;
  const raw = readFileSync(pdfPath).toString("latin1"); // latin1 = byteweise, binärsicher

  let patched = 0;
  const out = raw.replace(/(\/MediaBox\s*\[)([^\]]*)(\])/g, (full, open, inner, close) => {
    let repl = null;
    for (let d = 6; d >= 0 && repl === null; d--) {
      const s = `0 0 ${wPt.toFixed(d)} ${hPt.toFixed(d)}`;
      if (s.length <= inner.length) repl = s.padEnd(inner.length, " ");
    }
    if (repl === null) throw new Error(`${pdfPath}: MediaBox "${inner}" zu kurz für ${w}×${h} mm`);
    patched++;
    return open + repl + close;
  });

  if (!patched) throw new Error(`${pdfPath}: keine MediaBox gefunden`);
  writeFileSync(pdfPath, Buffer.from(out, "latin1"));
  return patched;
}

const PDF_PROFILES = {
  tarot70: { w: 76, h: 126, out: "out/print-ready/meinspiel-pdf-70x120", label: "70×120 mm" },
  std: { w: 65, h: 97, out: "out/print-ready/meinspiel-pdf", label: "59×91 mm" },
};

async function pngToDataUri(path) {
  return `data:image/png;base64,${readFileSync(path).toString("base64")}`;
}

async function renderPagesToPdf(browser, files, outPath, { w, h }) {
  const imgs = await Promise.all(files.map(pngToDataUri));
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: ${w}mm ${h}mm; margin: 0; }
    *{margin:0;padding:0;}
    .page{width:${w}mm;height:${h}mm;page-break-after:always;overflow:hidden;}
    .page:last-child{page-break-after:auto;}
    .page img{width:${w}mm;height:${h}mm;display:block;object-fit:cover;}
  </style></head><body>
  ${imgs.map((src) => `<div class="page"><img src="${src}"></div>`).join("\n")}
  </body></html>`;

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.pdf({
    path: outPath,
    width: `${w}mm`,
    height: `${h}mm`,
    printBackground: true,
    margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
  });
  await page.close();
  setExactPageSize(outPath, { w, h });
}

const wanted = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const profiles = wanted.length ? wanted : Object.keys(PDF_PROFILES);
const browser = await chromium.launch();

for (const key of profiles) {
  const p = PDF_PROFILES[key];
  if (!p) throw new Error(`Unbekanntes PDF-Profil "${key}" (bekannt: ${Object.keys(PDF_PROFILES).join(", ")})`);
  mkdirSync(p.out, { recursive: true });
  // Ein Vorderseiten-PDF und ein Rückseiten-PDF pro Paket.
  for (const pkg of PACKAGES) {
    const { cards, back } = collectCards(pkg, key);
    const stem = pkg.id.replace(/-(zauberdeck|karten)$/, "");
    await renderPagesToPdf(browser, cards.map((c) => c.src), join(p.out, `${pkg.id}-vorderseiten.pdf`), p);
    await renderPagesToPdf(browser, [back], join(p.out, `${stem}-ruckseite.pdf`), p);
    console.log(`✓ ${pkg.label} · ${p.label}: ${cards.length} Seiten + Rückseite`);
  }

  // Zweites Set (Regeln & magische Gegenstände) — gleiche Quelle wie das ZIP,
  // Rückseite ist die neutrale Grimoire-Karte statt einer Helden-Rückseite.
  if (process.argv.includes("--set2")) {
    const cards = collectSetTwo(key === "std" ? "std" : "tarot70");
    const back = join("out", key === "std" ? "card-back.png" : "card-back-tarot70.png");
    await renderPagesToPdf(browser, cards.map((c) => c.src), join(p.out, `${SET_TWO.id}-vorderseiten.pdf`), p);
    await renderPagesToPdf(browser, [back], join(p.out, `${SET_TWO.id}-ruckseite.pdf`), p);
    console.log(`✓ ${SET_TWO.label} · ${p.label}: ${cards.length} Seiten + Rückseite`);
  }
}

await browser.close();
