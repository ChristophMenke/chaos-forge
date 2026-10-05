// DB-Fix Teil 2: area_of_effect + duration + saving_throw für PHB-Zauber, aus
// echtem PHB-OCR. Konvention: turn→"Runde", round→"Kampfrunde" (Nutzer-Vorgabe).
// Area in Fuß (PHB-Areas sind in Fuß). Nur saubere/verifizierte Änderungen → SQL+JSON.
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supa, convertImperialText } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const PHB = readFileSync(join(ROOT, "ressources", "books", "Players Handbook.txt"), "utf8");

function phbFields(name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+").replace(/['’‘`´]/g, "['\\u2019\\u2018\\u0060\\u00b4]");
  const re = new RegExp(esc + "\\s*\\((Conjuration|Alteration|Il?lusion|Iusion|Phantasm|Abjuration|Enchantment|Charm|Divination|Invocation|Evocation|Necromancy)[^]{0,340}?Saving Throw:\\s*(None|Neg\\.?|Special|½|1/2|Half)", "i");
  const m = PHB.match(re);
  if (!m) return null;
  const seg = m[0].replace(/\s+/g, " ");
  const g = (k, stop) => { const mm = seg.match(new RegExp(k + ":\\s*([^]{1,55}?)(?=\\s+(?:" + stop + ")[:;])", "i")); return mm ? mm[1].trim() : ""; };
  return {
    dur: g("Duration", "Casting Time|Area of Effect|Saving Throw|Range|Componen"),
    aoe: g("Area of Effect", "Saving Throw|Range|Componen|Duration|Casting Time"),
    save: m[2].replace(/\.$/, ""),
  };
}

// ── Area: PHB-metrisch → deutsch-imperial (Fuß), englische Wörter → deutsch ──
const AREA_WORD = { radius: "Radius", cube: "Würfel", cone: "Kegel", wedge: "Keil", sphere: "Kugel", diameter: "Durchmesser", path: "Pfad", square: "Quadrat", long: "lang", wide: "breit", high: "hoch" };
function areaToGerman(metric) {
  if (!metric) return null;
  if (/special|caster|touch|creature|object|item|person|weapon|familiar|mount/i.test(metric)) return null; // deskriptiv → nicht anfassen
  let t = metric;
  // "6.1-m" / "6.1 m" → Fuß (metrische Werte sind auf 1 Dezimale gerundet → Toleranz 0.2)
  t = t.replace(/(\d+(?:\.\d+)?)[-\s]*m\b/g, (_, n) => {
    const ft = parseFloat(n) / 0.3048;
    return Math.abs(ft - Math.round(ft)) < 0.2 ? `${Math.round(ft)} Fuß` : `${n} m`;
  });
  for (const [en, de] of Object.entries(AREA_WORD)) t = t.replace(new RegExp("\\b" + en + "\\b", "gi"), de);
  t = t.replace(/\s*[xX*]\s*/g, "x").replace(/\/\s*level/gi, "/Stufe").replace(/\barea\b/gi, "").replace(/\.$/, "").replace(/\s{2,}/g, " ").trim();
  return t;
}
// Sauber: nur Fuß (kein Metrik-Rest), plausible Größe (<= 200 Fuß), deutsche Wörter.
const validArea = (s) => {
  const t = (s || "").trim();
  if (!t || t.length >= 38 || /\bm\b/.test(t)) return false; // Metrik-Rest → unsauber
  if (!/^[0-9. ,x]*Fuß( (Radius|Würfel|Kegel|Keil|Kugel|Durchmesser|Pfad|Quadrat|Bogen|lang|breit|hoch|Kreatur))?(\/Stufe)?$/.test(t)) return false;
  return ((t.match(/\d+/g) || []).map(Number)).every((n) => n <= 200);
};

// ── Duration: englisch → deutsch (turn→Runde, round→Kampfrunde) ──
function durToGerman(en) {
  if (!en) return null;
  let t = en;
  if (/^instantaneous$/i.test(t.trim())) return "Sofort";
  if (/^permanent$/i.test(t.trim())) return "Permanent";
  if (/^special$/i.test(t.trim())) return "Speziell";
  if (/until dispelled/i.test(t)) return "Bis gebannt";
  t = t.replace(/\brounds?\b/gi, (m) => (/s$/i.test(m) ? "Kampfrunden" : "Kampfrunde"));
  t = t.replace(/\bturns?\b/gi, (m) => (/s$/i.test(m) ? "Runden" : "Runde"));
  t = t.replace(/\bhours?\b/gi, (m) => (/s$/i.test(m) ? "Stunden" : "Stunde"));
  t = t.replace(/\bdays?\b/gi, (m) => (/s$/i.test(m) ? "Tage" : "Tag"));
  t = t.replace(/\bweeks?\b/gi, (m) => (/s$/i.test(m) ? "Wochen" : "Woche"));
  t = t.replace(/\bminutes?\b/gi, "Minuten").replace(/\/\s*level/gi, "/Stufe").replace(/\s{2,}/g, " ").trim();
  return t;
}
const validDur = (s) => /^([0-9d+ ./]*(Kampfrunde|Kampfrunden|Runde|Runden|Stunde|Stunden|Tag|Tage|Woche|Wochen|Minuten)(\/Stufe)?[\s+]*)+$|^(Sofort|Permanent|Speziell|Bis gebannt)$/.test((s || "").trim()) && (s || "").length < 45;

// Save PHB → DB-Format (deutsch/gemischt wie Bestand)
const SAVE_MAP = (raw) => { const t = (raw || "").toLowerCase(); if (t.startsWith("neg")) return "Neg."; if (t === "½" || t === "1/2" || t === "half") return "½"; if (t === "special") return "Special"; return "None"; };

const nums = (s) => ((s || "").match(/[\d.]+/g) || []).map(Number).filter((n) => n > 0);
const differ = (a, b) => { const A = nums(a), B = nums(b); if (A.length !== B.length) return true; return A.some((x, i) => Math.abs(x - B[i]) > Math.max(0.5, B[i] * 0.1)); };
const sqlEsc = (s) => s.replace(/'/g, "''");
const SKIP = new Set(["Melf's Acid Arrow", "Detect Evil", "ESP", "Invisibility", "Spectral Force"]);
// Duration-Zahl-Änderungen NUR bei diesen (per PHB verifiziert); sonst reiner Wort-Tausch.
const VERIFIED_DUR = new Set([
  "Alter Self", "Identify", "Change Self", "Change self", "Fly", "Rope Trick", "Polymorph Self",
  "Detect Scrying", "Tenser's Floating Disc", "Darkness, 15' Radius", "Hallucinatory Terrain",
  "Unseen Servant", "Leomund's Tiny Hut", "Leomund's Secure Shelter", "Light",
]);
const sameNums = (a, b) => { const A = (a || "").match(/\d+(?:\.\d+)?/g) || [], B = (b || "").match(/\d+(?:\.\d+)?/g) || []; return A.length === B.length && A.every((x, i) => x === B[i]); };

(async () => {
  const sb = supa();
  const { data: spells } = await sb.from("spells").select("id,name,name_en,area_of_effect,duration,saving_throw").eq("source_book", "Players Handbook");
  const updates = [], jsonMap = [], repArea = [], repDur = [], repSave = [], skipped = [];
  for (const s of spells) {
    const nm = s.name_en || s.name;
    if (SKIP.has(nm)) continue;
    const p = phbFields(nm);
    if (!p) continue;
    const patch = {};

    // AREA (nur numerische Fuß/Yards-Diskrepanz, sauberer Wert)
    const aoeG = areaToGerman(convertImperialText(p.aoe));
    if (aoeG && validArea(aoeG) && differ(convertImperialText(s.area_of_effect), convertImperialText(p.aoe)) && !differ(convertImperialText(aoeG), convertImperialText(p.aoe))) {
      patch.area_of_effect = aoeG; repArea.push(`${nm.padEnd(26)} "${s.area_of_effect}" → "${aoeG}"`);
    }
    // DURATION (turn→Runde, round→Kampfrunde). NUR reiner Wort-Tausch (gleiche Zahlen)
    // ODER verifizierter Zahl-Fix; OCR-Zahl-Ausreißer ausschließen.
    const durG = durToGerman(p.dur);
    if (durG && validDur(durG) && durG !== s.duration) {
      const norm = (x) => (x || "").toLowerCase().replace(/kampfrunden?|runden?|stunden?|tage?|wochen?/g, (w) => w[0]);
      const changed = norm(s.duration) !== norm(durG) || differ(s.duration, durG);
      // Reiner Wort-Tausch NUR bei numerischen Dauern (Runde/Kampfrunde); reine
      // Schlüsselwort-Wechsel (Sofort↔Permanent↔Speziell) sind OCR-Fehler → nur verifiziert.
      const safeSwap = sameNums(s.duration, durG) && /\d/.test(durG) && /\d/.test(s.duration || "");
      if (changed && (safeSwap || VERIFIED_DUR.has(nm))) {
        patch.duration = durG; repDur.push(`${nm.padEnd(26)} "${s.duration}" → "${durG}"`);
      } else if (changed) {
        skipped.push(`dur ${nm}: "${s.duration}" → "${durG}"`);
      }
    }
    // SAVE (nur offensichtlichen Junk fixen: nicht in {None,Neg.,Special,½,Keine})
    if (s.saving_throw && !/^(None|Neg\.?|Special|½|Keine|Keiner)$/i.test(s.saving_throw.trim())) {
      const sv = SAVE_MAP(p.save); patch.saving_throw = sv; repSave.push(`${nm.padEnd(26)} "${s.saving_throw}" → "${sv}"`);
    }

    if (Object.keys(patch).length) {
      jsonMap.push({ id: s.id, name: nm, patch });
      const sets = Object.entries(patch).map(([k, v]) => `${k} = '${sqlEsc(v)}'`).join(", ");
      updates.push(`UPDATE spells SET ${sets} WHERE id = '${s.id}';`);
    }
  }
  const migration = `-- DB-Fix Teil 2: area_of_effect, duration (turn→Runde, round→Kampfrunde), saving_throw.\n-- Quelle: echter PHB-OCR, generiert von build-db-fix2.mjs.\n\n` + updates.join("\n") + "\n";
  writeFileSync(join(HERE, "cache", "db-fix2.sql"), migration);
  writeFileSync(join(HERE, "cache", "db-fix2.json"), JSON.stringify(jsonMap, null, 2));
  writeFileSync(join(ROOT, "supabase", "migrations", "00223_fix_phb_spell_area_duration_saves.sql"), migration);
  console.log(`Betroffene Zauber: ${jsonMap.length} | Area: ${repArea.length} | Duration: ${repDur.length} | Save-Junk: ${repSave.length}\n`);
  console.log("=== SAVE-JUNK ==="); console.log(repSave.join("\n"));
  console.log("\n=== AREA (Auszug) ==="); console.log(repArea.slice(0, 25).join("\n"));
  console.log("\n=== DURATION (Auszug) ==="); console.log(repDur.slice(0, 25).join("\n"));
  console.log(`\n→ cache/db-fix2.json + migration 00223`);
})();
