// Wendet cache/db-fix3.json (area_of_effect: "qm" → "Quadratfuß") live an.
// Backup der betroffenen Felder → cache/db-fix3-backup.json (reversibel).
// Entspricht inhaltlich supabase/migrations/00227_fix_phb_spell_square_feet.sql.
// Nutzung: node apply-db-fix3.mjs [--revert]
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supa } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const MAP = JSON.parse(readFileSync(join(HERE, "cache", "db-fix3.json"), "utf8"));
const BACKUP = join(HERE, "cache", "db-fix3-backup.json");

const sb = supa();

if (process.argv.includes("--revert")) {
  const bak = JSON.parse(readFileSync(BACKUP, "utf8"));
  for (const b of bak) await sb.from("spells").update({ area_of_effect: b.old }).eq("id", b.id);
  console.log(`↩ Zurückgesetzt: ${bak.length} Zauber.`);
} else {
  const { data: cur } = await sb.from("spells").select("id,area_of_effect").in("id", MAP.map((m) => m.id));
  const byId = Object.fromEntries(cur.map((c) => [c.id, c.area_of_effect]));
  writeFileSync(BACKUP, JSON.stringify(MAP.map((m) => ({ id: m.id, name: m.name, old: byId[m.id] })), null, 2));
  console.log(`Backup: ${MAP.length} Zauber → cache/db-fix3-backup.json\n`);

  let ok = 0, fail = 0;
  for (const m of MAP) {
    const { error } = await sb.from("spells").update(m.patch).eq("id", m.id);
    if (error) { console.log(`  ✗ ${m.name}: ${error.message}`); fail++; } else { console.log(`  ✓ ${m.name}: "${m.patch.area_of_effect}"`); ok++; }
  }
  console.log(`\nAngewandt: ${ok} | Fehler: ${fail}`);

  const { data: check } = await sb.from("spells").select("area_of_effect").ilike("area_of_effect", "%qm%");
  const rest = (check || []).filter((c) => /\yqm\y/i.test(c.area_of_effect) || /\bqm\b/i.test(c.area_of_effect));
  console.log(`Verbleibende "qm"-Werte in der gesamten spells-Tabelle: ${rest.length}`);
}
