// Erzeugt aus dem ECHTEN PHB-OCR eine autoritative Stat-Korrektur (cache/phb-
// override.json) für alle PHB-Zauber im Deck: bereinigt OCR-Müll, konvertiert
// verbliebene Imperial-Werte metrisch, mappt Saves auf Kategorie. Schreibt NUR
// Felder, die vom aktuellen Kartenwert abweichen (korrekte Karten bleiben unberührt).
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { fetchIllusionistDeck, fetchLearnedWizardSpells, fetchCharacters, englishName } from "./lib.mjs";
// Override beim Vergleich NICHT anwenden (sonst Feedback-Loop). Dynamischer Import
// NACH Setzen der Env, damit content.mjs den Override leer lädt.
process.env.NO_PHB_OVERRIDE = "1";
const { getContent } = await import("./content.mjs");

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const PHB = readFileSync(join(ROOT, "ressources", "books", "Players Handbook.txt"), "utf8");

function phbStat(name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")
    .replace(/['’‘`´]/g, "['\\u2019\\u2018\\u0060\\u00b4]"); // Apostroph-Varianten (OCR)
  const re = new RegExp(esc + "\\s*\\((Conjuration|Alteration|Illusion|Iusion|Phantasm|Abjuration|Enchantment|Charm|Divination|Invocation|Evocation|Necromancy)[^]*?Saving Throw:\\s*(None|Neg\\.?|Special|½|1/2|Half)", "i");
  const m = PHB.match(re);
  if (!m) return null;
  const seg = m[0].replace(/\s+/g, " ");
  const g = (k) => { const mm = seg.match(new RegExp(k + ":\\s*([^]*?)(?=\\s+(?:Range|Reversible|Componenr?ts?|Components?|Duration|Casting Time|Area of Effect|Saving Throw)[:;]|$)", "i")); return mm ? mm[1].trim() : ""; };
  return { range: g("Range"), dur: g("Duration"), aoe: g("Area of Effect"), save: g("Saving Throw"), ct: g("Casting Time") };
}

const r1 = (n) => Math.round(n * 10) / 10;
// Imperial → metrisch, wo im PHB-OCR noch nicht konvertiert.
function toMetric(s) {
  if (!s) return s;
  let t = s;
  t = t.replace(/(\d+(?:\.\d+)?)\s*(?:square feet|sq\.?\s*ft\.?)/gi, (_, n) => `${r1(+n * 0.0929)} sq m`);
  t = t.replace(/(\d+(?:\.\d+)?)\s*(?:cubic feet|cu\.?\s*ft\.?)/gi, (_, n) => `${r1(+n * 0.0283)} m³`);
  t = t.replace(/(\d+(?:\.\d+)?)\s*(?:foot|feet|ft\.?|['’])/gi, (_, n) => `${r1(+n * 0.3048)} m`);
  t = t.replace(/(\d+(?:\.\d+)?)\s*(?:yards?|yds?\.?)/gi, (_, n) => `${r1(+n * 0.9144)} m`);
  t = t.replace(/\s*[X*]\s*/g, " x ").replace(/\s{2,}/g, " ").replace(/-\s+m/g, " m").trim();
  return t;
}
// Range/CT-Feld: OCR-Müll (angehängte Components etc.) abschneiden, metrisch machen.
function cleanRange(s) {
  if (!s) return s;
  let t = s.replace(/\s*Componenr?ts?[;:].*$/i, "").replace(/\s*Components?[;:].*$/i, "").trim();
  return toMetric(t);
}
function cleanDur(s) {
  if (!s) return s;
  return s.replace(/!\/2|!\s*\/\s*2/g, "1/2").replace(/\s{2,}/g, " ").trim();
}
// PHB-Statblock-Save → Kartenkategorie (Zauberzauber: default "vs. Spell").
function mapSave(raw) {
  const t = (raw || "").toLowerCase().replace(/\.$/, "");
  if (t === "none") return "None";
  if (t.startsWith("neg")) return "vs. Spell (neg.)";
  if (t === "½" || t === "1/2" || t === "half") return "vs. Spell (½)";
  if (t === "special") return "Special";
  return raw;
}

// Manuelle OCR-Fixes (im PHB-Scan verrauscht):
const MANUAL = {
  "Spectral Force": { range: "54.9 m + 9.1 m/level" }, // OCR: "0.9 m/level"
};

// Zauber, deren Auto-Extraktion unzuverlässig ist (Substring-Fehlgriff oder
// mehrdeutiger OCR) — komplett überspringen, per Hand geprüft/belassen:
//  Invisibility → Regex traf "Detect Invisibility" (Karte ist korrekt)
//  Detect Evil / ESP → mehrdeutige/abweichende OCR-Range, Karte belassen
const SKIP = new Set([
  "Invisibility", "Detect Evil", "ESP",
  "Melf's Acid Arrow", // OCR-Range 164.6 m anomal/unbestätigt → belassen, User prüft
]);

// AoE mit verbliebenem Imperial-/OCR-Müll ODER mehrdeutiger "sq m"-Konversion
// (30 sq ft vs. 30-ft-Quadrat nicht unterscheidbar) nicht übernehmen.
const aoeDirty = (s) => /\bft\b|['’]|foot|feet|sq\.?\s*ft|\bsq m\b|\d+-\s*(foot|m)\b|cu\.?\s*ft/i.test(s || "");
// leichte AoE-Textbereinigung
const aoeClean = (s) => (s || "").replace(/\s*volume\/?\s*level of caster/i, "/level").replace(/\s*square area/i, "").replace(/\s{2,}/g, " ").replace(/-\s+m/g, " m").trim();

// Vergleich: numerische Nähe (für "schon korrekt"-Erkennung)
const nums = (s) => ((s || "").match(/[\d.]+/g) || []).map(Number).filter((n) => n > 0);
const close = (a, b) => { const A = nums(a), B = nums(b); if (!A.length && !B.length) return true; if (A.length !== B.length) return false; return A.every((x, i) => Math.abs(x - B[i]) <= Math.max(0.5, B[i] * 0.1)); };
const turnsMatch = (a, b) => /turn/i.test(a || "") === /turn/i.test(b || "");
const saveClass = (s) => { const t = (s || "").toLowerCase(); if (/none|^—/.test(t)) return "none"; if (/special/.test(t)) return "special"; if (/½|1\/2|half/.test(t)) return "half"; return "neg"; };

(async () => {
  const spr = await fetchIllusionistDeck({ maxLevel: 4 });
  const chars = await fetchCharacters();
  const now = await fetchLearnedWizardSpells(chars.find((c) => c.name.includes("Nowi")).id);
  const all = new Map();
  for (const s of [...spr, ...now]) all.set(englishName(s), s);

  const override = {};
  const changes = [];
  for (const [nm, s] of all) {
    if (SKIP.has(nm)) continue;
    const p = phbStat(nm);
    if (!p) continue;
    const man = MANUAL[nm] || {};
    const phbClean = {
      range: man.range || cleanRange(p.range),
      duration: cleanDur(p.dur),
      area_of_effect: toMetric(p.aoe),
      saving_throw: mapSave(p.save),
      casting_time: cleanDur(p.ct),
    };
    const { stats } = await getContent(s);
    const o = {};
    const diff = [];
    // Range
    if (phbClean.range && !/special/i.test(phbClean.range) && !close(stats.range, phbClean.range)) { o.range = phbClean.range; diff.push(`range ${stats.range} → ${phbClean.range}`); }
    // Duration (turns vs rounds ODER Zahl abweichend), nur wenn nicht Special/Permanent/Instant
    if (phbClean.duration && !/special|permanent|instant|until/i.test(phbClean.duration) && (!turnsMatch(stats.duration, phbClean.duration) || !close(stats.duration, phbClean.duration))) { o.duration = phbClean.duration; diff.push(`dur ${stats.duration} → ${phbClean.duration}`); }
    // AoE nur bei numerischer Abweichung, sauberem Metrik-Wert (kein Imperial-/OCR-Müll)
    const aoeVal = aoeClean(phbClean.area_of_effect);
    if (aoeVal && !aoeDirty(aoeVal) && !/special|the caster|touch|1 (item|object|creature|familiar|mount|weapon|page|sigil|fire)/i.test(aoeVal) && nums(aoeVal).length && !close(stats.area_of_effect, aoeVal)) { o.area_of_effect = aoeVal; diff.push(`aoe ${stats.area_of_effect} → ${aoeVal}`); }
    // Saving Throw NICHT aus PHB-Statblock übernehmen — verifizierte Kartenwerte
    // (mit Kategorie) sind aussagekräftiger; echte Save-Fehler separat per Hand.
    if (Object.keys(o).length) { override[s.id] = o; changes.push(`## ${nm} (L${s.level})\n   ` + diff.join("\n   ")); }
  }
  writeFileSync(join(HERE, "cache", "phb-override.json"), JSON.stringify(override, null, 2));
  console.log(`Override für ${Object.keys(override).length} Zauber → cache/phb-override.json\n`);
  console.log(changes.join("\n"));
})();
