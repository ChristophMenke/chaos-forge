// Wendet cache/db-range-fix.json live auf die Supabase-DB an (Service-Role).
// Sichert VORHER die alten Werte nach cache/db-range-backup.json (reversibel).
// Nutzung: node apply-db-fix.mjs [--revert]
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supa } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const MAP = JSON.parse(readFileSync(join(HERE, "cache", "db-range-fix.json"), "utf8"));
const BACKUP = join(HERE, "cache", "db-range-backup.json");
const REVERT = process.argv.includes("--revert");

(async () => {
  const sb = supa();

  if (REVERT) {
    if (!existsSync(BACKUP)) throw new Error("Kein Backup gefunden — nichts zum Zurücksetzen.");
    const bak = JSON.parse(readFileSync(BACKUP, "utf8"));
    let n = 0;
    for (const b of bak) { await sb.from("spells").update({ range: b.oldRange }).eq("id", b.id); n++; }
    console.log(`↩ Zurückgesetzt: ${n} Zauber auf alte Werte.`);
    return;
  }

  // 1. Backup der aktuellen Werte (nur betroffene IDs)
  const ids = MAP.map((m) => m.id);
  const { data: current } = await sb.from("spells").select("id,name_en,name,range").in("id", ids);
  writeFileSync(BACKUP, JSON.stringify(current.map((c) => ({ id: c.id, name: c.name_en || c.name, oldRange: c.range })), null, 2));
  console.log(`Backup: ${current.length} Zauber → cache/db-range-backup.json`);

  // 2. Anwenden
  let ok = 0, fail = 0;
  for (const m of MAP) {
    const { error } = await sb.from("spells").update({ range: m.newRange }).eq("id", m.id);
    if (error) { console.log(`  ✗ ${m.name}: ${error.message}`); fail++; } else ok++;
  }
  console.log(`\nAngewandt: ${ok} | Fehler: ${fail}`);

  // 3. Stichprobe verifizieren
  const sample = ["Charm Person", "Magic Missile", "Fireball", "Hold Person", "Confusion"];
  const { data: check } = await sb.from("spells").select("name_en,range").in("name_en", sample);
  console.log("\nStichprobe (DB nach Fix):");
  for (const c of check) console.log(`  ${c.name_en}: ${c.range}`);
})();
