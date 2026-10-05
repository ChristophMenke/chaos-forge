// Zentrale Definition, welche Karten in welches Bestellpaket gehören und in
// welcher Reihenfolge. Wird von build-print-packages.mjs (ZIPs/Ordner) und
// build-print-pdf.mjs (meinspiel-PDFs) gemeinsam genutzt, damit beide Wege
// garantiert dieselbe Reihenfolge und denselben Umfang liefern.
//
// Reihenfolge pro Paket: Referenzkarte → Epic Items → Zauberkarten (Level 1-9).
// Dateinamen der Epic Items folgen den deutschen Item-Namen aus der DB, passend
// zu den bereits bestehenden Larry-/Isolde-Paketen.

// Zweites Bestellset: Nachzügler + Nachschlagewerk. Anders als die Helden-Decks
// besteht es nicht aus Deck-Ordnern, sondern sammelt ganze Ausgabeverzeichnisse
// in fester Reihenfolge ein. Rückseite ist die neutrale Grimoire-Karte, weil das
// Set nicht zu einem einzelnen Helden gehört.
export const SET_TWO = {
  id: "kompendium",
  label: "Kompendium — Ausrüstung, Zustände, Leute & Zitate",
  sources: [
    // Verzeichnisse ohne Profil-Suffix — das ergänzen die Build-Skripte.
    { dir: "out/char-cards", only: ["reference-lady-catrina-of-tiamat.png"], prefix: "catrina" },
    { dir: "out/gm-card", prefix: "spielleiter" },
    // sub = Unterordner UNTERHALB des profilspezifischen Verzeichnisses
    // (out/extras-tarot70/sprocket-nachtrag), das Suffix sitzt also am dir.
    { dir: "out/extras", sub: "sprocket-nachtrag", prefix: "sprocket" },
    { dir: "out/item-cards", prefix: "item" },
    { dir: "out/condition-cards", prefix: "zustand" },
    { dir: "out/npc-cards", prefix: "npc" },
    { dir: "out/quote-cards", prefix: "zitat" },
    { dir: "out/special-cards", prefix: "special" },
  ],
};

export const PACKAGES = [
  {
    id: "nowi-zauberdeck",
    label: "Nowi Tarja",
    deckDir: "nowi-tarja", // out/decks[-tarot]/<deckDir>
    reference: "reference-nowi-tarja",
    epics: [
      { file: "epic-tricksters-choice", name: "tricksters-choice" },
      { file: "epic-netherese-blooded", name: "netherese-blooded" },
    ],
    hasSpells: true,
  },
  {
    id: "sprocket-zauberdeck",
    label: "Sprocket 'Fixit' Tanglewire",
    deckDir: "sprocket",
    reference: "reference-sprocket-fixit-tanglewire",
    epics: [
      { file: "epic-constitution-condenser", name: "konstitutions-kondensator" },
      { file: "epic-sharpvision-goggles", name: "scharfsicht-brille" },
      { file: "epic-mix-and-match-blades", name: "mix-and-match-klingen" },
    ],
    hasSpells: true,
  },
  {
    id: "larry-karten",
    label: "Larry",
    deckDir: "larry",
    reference: "reference-larry",
    epics: [{ file: "epic-blade-of-water", name: "klinge-des-wassers" }],
    hasSpells: false,
  },
  {
    id: "isolde-karten",
    label: "Isolde",
    deckDir: "isolde",
    reference: "reference-isolde",
    epics: [
      { file: "epic-shadowdancer", name: "schattentaenzer" },
      { file: "epic-ring-of-many-faces", name: "ring-der-vielen-gesichter" },
    ],
    hasSpells: false,
  },
];
