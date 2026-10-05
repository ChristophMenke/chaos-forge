// Gemeinsame Tarot-Formatdefinition, in zwei Profilen — beide 70 mm breit,
// 3 mm Beschnitt, 300 dpi, identische Schriftgrößen und Ränder in mm.
// Unterschied ist allein die Höhe (12 px), weil die Anbieter minimal abweichen:
//
//   --tarot     PrinterStudio.de "Tarot Format" → 70×121 mm, 898×1500 px
//               (deren Mindestdateigröße ist 897×1497 px)
//   --tarot70   meinspiel.de "70×120 mm"        → 70×120 mm, 898×1488 px
//               (deren Dokumentgröße ist 76×126 mm, gestaltbar 62×112 mm)
//
// Die Profile schreiben in getrennte Ausgabeordner (-tarot bzw. -tarot70), damit
// beide Anbieter-Varianten nebeneinander bestehen bleiben.
const MM = 11.811;

const IS_70 = process.argv.includes("--tarot70");
/** True für beide Tarot-Profile — die Renderer schalten daran ihr Layout um. */
export const IS_TAROT = IS_70 || process.argv.includes("--tarot");
/** Ordner-Suffix des aktiven Profils, z. B. "out/decks" + SUFFIX. */
export const DIR_SUFFIX = IS_70 ? "-tarot70" : "-tarot";

const DOC_H_MM = IS_70 ? 126 : 127; // Datenformat-Höhe inkl. 3 mm Beschnitt
const END_H_MM = IS_70 ? 120 : 121; // Endformat-Höhe nach Schnitt

export const TAROT = {
  W: Math.round(76 * MM), // 898  (Datenformat inkl. Beschnitt)
  H: Math.round(DOC_H_MM * MM), // 1500 bzw. 1488
  endW: Math.round(70 * MM), // 827 (Endformat nach Schnitt)
  endH: Math.round(END_H_MM * MM), // 1429 bzw. 1417
  inset: Math.round(3 * MM), // 35  (Beschnitt)
  radius: Math.round(5 * MM), // 59  (Eckenradius)
  MM,
};

// Spell-Karten: größere Schrift (34px Regeltext) für Lesbarkeit bei Tarot-Größe.
export const TAROT_SPELL_FMT = {
  W: TAROT.W, H: TAROT.H, artH: 600, bodyTop: 586, bodyBottom: 84,
  descFont: 34, titleFont: 52, typeFont: 17, statLabel: 13, statVal: 24, compFont: 18,
};

// Helden-Referenzkarte: großes Portrait (mehr Bild), Fonts ×1.28 skaliert.
export const TAROT_REF_FMT = {
  W: TAROT.W, H: TAROT.H, portraitH: 940, bodyTop: 918, bodyBottom: 84, fs: 1.28,
};

// Epic-Item-Karte: Art oben, Body unten, Fonts ×1.28 skaliert.
export const TAROT_EPIC_FMT = {
  W: TAROT.W, H: TAROT.H, artH: 600, bodyTop: 586, bodyBottom: 84, fs: 1.28,
};

// Kartenrückseite (Portrait + Runensiegel): symmetrisch skaliert (H-Verhältnis 1488/1146).
export const TAROT_BACK_FMT = { W: TAROT.W, H: TAROT.H, fs: 1.3 };

// Regel-Referenzkarte: kein Artwork, dafür maximale Tabellenfläche. Die Karte
// wird im Spiel gelesen, nicht bewundert — Schrift daher etwas kleiner als auf
// den Zauberkarten, um ganze Tabellen unterzubringen.
export const TAROT_RULES_FMT = {
  W: TAROT.W, H: TAROT.H, bodyTop: 150, bodyBottom: 84,
  titleFont: 46, subFont: 17, headFont: 19, cellFont: 23, noteFont: 20,
};
