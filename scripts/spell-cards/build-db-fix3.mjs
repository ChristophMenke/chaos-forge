// Erzeugt cache/db-fix3.json: korrigiert Flächenangaben in `spells.area_of_effect`,
// bei denen "square feet" beim Übersetzen fälschlich zu "qm" umbenannt statt
// umgerechnet wurde (Werte dadurch ~10,8× zu groß).
// Nutzung: node build-db-fix3.mjs
//
// Prinzip wie bei den Vorgänger-Fixes: Die DB speichert IMPERIAL, die App rechnet
// über convertImperialText() metrisch um. Der Fix ist deshalb ein reiner
// Einheitentausch — die Zahlen bleiben unangetastet, nur "qm" → "Quadratfuß".
// Alle Zahlen wurden gegen den PHB-OCR verifiziert (siehe `phb`-Feld unten).
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supa, convertImperialText } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// PHB-Belegstellen (ressources/books/Players Handbook.txt), von Hand geprüft.
const PHB_EVIDENCE = {
  "Hold Portal": "Area of Effect: 20 square feet/level",
  Knock: "Area of Effect: 10 square feet/level",
  "Wizard Lock": "Area of Effect: 30 square feet/level",
  "Phantasmal Force": "Area of Effect: 400 sq. ft. + 100 sq. ft./level",
  "Wall of Stone": 'Fließtext: "up to 20 square feet per level" (Statblock sagt "Special")',
  "Wall of Iron": "kein Statblock im OCR — Zahl unverändert übernommen, nur Einheit korrigiert",
};

// Web ist KEIN reiner Einheitentausch: Der PHB nennt dort ein Volumen
// ("a maximum area of eight 10' x 10' x 10' cubes"), keine Fläche. "80 qm"
// ist vermutlich aus "eight ... 10'" fehlhergeleitet. Wir setzen den PHB-Wortlaut.
const WEB_FIX = "Acht Würfel à 10 Fuß Kantenlänge";

const sb = supa();
let all = [], from = 0;
for (;;) {
  const { data } = await sb.from("spells").select("id,name,name_en,area_of_effect,source_book").range(from, from + 999);
  all = all.concat(data);
  if (data.length < 1000) break;
  from += 1000;
}

const DE_TO_EN = { Klopfen: "Knock" };
const out = [];
for (const s of all) {
  const aoe = s.area_of_effect;
  if (typeof aoe !== "string" || !/\bqm\b|Quadratmeter/i.test(aoe)) continue;
  const en = DE_TO_EN[s.name] || s.name_en || s.name;

  const patch = { area_of_effect: en === "Web" ? WEB_FIX : aoe.replace(/\bqm\b|Quadratmeter/gi, "Quadratfuß") };
  out.push({
    id: s.id,
    name: en,
    phb: en === "Web" ? 'Fließtext: "eight 10\' x 10\' x 10\' cubes" — Volumen, keine Fläche' : PHB_EVIDENCE[en] || "(unbelegt)",
    old: aoe,
    patch,
    preview: convertImperialText(patch.area_of_effect),
  });
}

out.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(join(HERE, "cache", "db-fix3.json"), JSON.stringify(out, null, 2));

console.log(`${out.length} Zauber zu korrigieren:\n`);
for (const o of out) {
  console.log(`  ${o.name}`);
  console.log(`    alt : "${o.old}"  → App zeigt: "${convertImperialText(o.old)}"`);
  console.log(`    neu : "${o.patch.area_of_effect}"  → App zeigt: "${o.preview}"`);
  console.log(`    PHB : ${o.phb}\n`);
}
console.log("→ cache/db-fix3.json geschrieben (noch NICHT angewandt).");
