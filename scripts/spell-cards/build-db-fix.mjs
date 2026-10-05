// Erzeugt eine SQL-Migration, die die RANGE aller PHB-Zauber in der DB korrigiert
// (systematischer Fuß-statt-Yards-Bug). Quelle: echter PHB-OCR (metrisch) →
// zurück in deutsch-imperial (Yard/Fuß), damit die App korrekt umrechnet.
// NUR Range (physikalisch eindeutig). Nur bei echter Abweichung. → migration + Report.
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supa, convertImperialText } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const PHB = readFileSync(join(ROOT, "ressources", "books", "Players Handbook.txt"), "utf8");

// PHB-Range (metrisch) je Zauber-Name.
function phbRange(name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+").replace(/['’‘`´]/g, "['\\u2019\\u2018\\u0060\\u00b4]");
  // Capture auf max. 55 Zeichen begrenzt — ein Range-Wert ist nie länger; verhindert
  // OCR-Leaks, wenn "Components" verstümmelt ist (z. B. "—omponents").
  const re = new RegExp(esc + "\\s*\\((Conjuration|Alteration|Il?lusion|Iusion|Phantasm|Abjuration|Enchantment|Charm|Divination|Invocation|Evocation|Necromancy)[^]*?Range:\\s*([^]{1,55}?)(?=\\s+(?:Reversible|[—\\-]?omponen|Componen|Duration|Casting)[^:;]{0,3}[:;])", "i");
  const m = PHB.match(re);
  if (!m) return null;
  return m[2].replace(/\s+/g, " ").trim();
}

// metrisch "18.3 m/level" → deutsch-imperial "20 Yard/Stufe" (App rechnet zurück).
function toGermanImperial(metric) {
  if (!metric) return null;
  if (/^(0|touch|special|unlimited)$/i.test(metric.trim())) return null; // Sonderfälle nicht anfassen
  let t = metric;
  t = t.replace(/(\d+(?:\.\d+)?)\s*m\b/g, (_, n) => {
    const m = parseFloat(n);
    const yd = m / 0.9144, ft = m / 0.3048;
    if (Math.abs(yd - Math.round(yd)) < 0.06) return `${Math.round(yd)} Yard`;
    if (Math.abs(ft - Math.round(ft)) < 0.06) return `${Math.round(ft)} Fuß`;
    return `${n} m`; // krumm → metrisch lassen
  });
  t = t.replace(/\/\s*level/gi, "/Stufe").replace(/\bmaximum\b/gi, "max").replace(/\s{2,}/g, " ").trim();
  return t;
}

// numerischer Vergleich (metrisch) — differ = Korrektur nötig
const nums = (s) => ((s || "").match(/[\d.]+/g) || []).map(Number).filter((n) => n > 0);
const differ = (a, b) => { const A = nums(a), B = nums(b); if (A.length !== B.length) return true; return A.some((x, i) => Math.abs(x - B[i]) > Math.max(0.5, B[i] * 0.1)); };
const sqlEsc = (s) => s.replace(/'/g, "''");

const SKIP = new Set(["Melf's Acid Arrow", "Detect Evil", "ESP", "Invisibility"]); // OCR-anomal/mehrdeutig
// Zahl-Änderungen (nicht reiner Einheitentausch) NUR anwenden, wenn hier verifiziert.
// Alles andere → Review-Datei, NICHT in Produktivdaten (OCR-Extraktion unzuverlässig).
const VERIFIED_NUM = new Set([
  "Detect Invisibility", "Flame Arrow", "Confusion", "Monster Summoning I",
  "Continual Light", "Dispel Magic", "Hallucinatory Terrain",
  "Affect Normal Fires", "Hypnotism", "Sepia Snake Sigil", "Spectral Hand",
]);
// Gültiger Range-Wert: nur Zahlen + Einheiten/Schlüsselwörter, sonst OCR-Müll.
const validRange = (s) => /^[0-9. ,]*(Yard|Fuß|m)(\/Stufe)?( ?\+ ?[0-9. ,]*(Yard|Fuß|m)(\/Stufe)?)?( ?,? ?max\.? ?[0-9. ]*(Yard|Fuß|m))?$/.test((s || "").trim());
// gleiche Zahlenmenge? (reiner Einheitentausch vs. Zahl geändert)
const sameNums = (a, b) => { const A = (a || "").match(/\d+(?:\.\d+)?/g) || [], B = (b || "").match(/\d+(?:\.\d+)?/g) || []; return A.length === B.length && A.every((x, i) => x === B[i]); };

(async () => {
  const sb = supa();
  const { data: spells } = await sb.from("spells").select("id,name,name_en,range,source_book").eq("source_book", "Players Handbook");
  console.log(`PHB-Zauber in DB: ${spells.length}`);

  const updates = [];
  const jsonMap = []; // {id, name, oldRange, newRange} für Live-Apply + Backup
  const report = [];
  const reviewNums = [];
  let noMatch = 0;
  for (const s of spells) {
    const nm = s.name_en || s.name;
    if (SKIP.has(nm)) continue;
    const pr = phbRange(nm);
    if (!pr) { noMatch++; continue; }
    const prMetric = convertImperialText(pr); // PHB-Range → metrisch (Vergleichsbasis)
    const curMetric = convertImperialText(s.range || "");
    if (!differ(curMetric, prMetric)) continue; // schon korrekt
    const newVal = toGermanImperial(prMetric);
    // Round-Trip: neuer imperialer Wert muss zurück ~PHB-metrisch ergeben; sonst Konversion unsauber → skip
    if (!newVal || differ(convertImperialText(newVal), prMetric)) continue;
    if (!validRange(newVal)) { report.push(`  ⚠ SKIP (OCR-Müll): ${nm} → "${newVal.slice(0, 50)}…"`); continue; }
    const line = `${nm.padEnd(28)} "${s.range}" → "${newVal}"`;
    const isUnitSwap = sameNums(s.range, newVal);
    if (isUnitSwap || VERIFIED_NUM.has(nm)) {
      updates.push(`UPDATE spells SET range = '${sqlEsc(newVal)}' WHERE id = '${s.id}';`);
      jsonMap.push({ id: s.id, name: nm, oldRange: s.range, newRange: newVal });
      (isUnitSwap ? report : reviewNums).push(line + (isUnitSwap ? "" : "   ✓ verifiziert → in Migration"));
    } else {
      reviewNums.push(line + "   ⏸ NICHT angewandt (Review nötig)");
    }
  }

  const migration = `-- Fix systematischer Range-Bug in PHB-Zaubern (Fuß statt Yards gespeichert).\n` +
    `-- Quelle: echter Player's Handbook (metrisch) → zurück in deutsch-imperial.\n` +
    `-- Generiert von scripts/spell-cards/build-db-fix.mjs, verifiziert gegen PHB-OCR.\n` +
    `-- ${updates.length} Range-Korrekturen (${jsonMap.filter(j=>!(( ""+j.oldRange).match(/\\d+(?:\\.\\d+)?/g)||[]).every((x,i)=>x===((""+j.newRange).match(/\\d+(?:\\.\\d+)?/g)||[])[i])).length} mit Zahl-Änderung, handverifiziert).\n\n` +
    updates.join("\n") + "\n";
  writeFileSync(join(HERE, "cache", "db-range-fix.sql"), migration);
  writeFileSync(join(HERE, "cache", "db-range-fix.json"), JSON.stringify(jsonMap, null, 2));
  // Migrations-Datei fürs Repo (versioniert)
  writeFileSync(join(ROOT, "supabase", "migrations", "00222_fix_phb_spell_ranges.sql"), migration);
  console.log(`\nKorrekturen: ${updates.length} | ohne PHB-Match: ${noMatch} | Zahl-Änderungen (Review): ${reviewNums.length}\n`);
  console.log("=== ZAHL AUCH GEÄNDERT (kritisch prüfen) ===");
  console.log(reviewNums.join("\n"));
  console.log(`\n=== reine Einheitentausche: ${report.filter(r=>!r.includes("SKIP")).length} (sicher) ===`);
  console.log(report.filter(r => r.includes("SKIP")).join("\n"));
  console.log(`\n→ SQL: cache/db-range-fix.sql`);
})();
