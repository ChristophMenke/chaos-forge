// Wendet cache/db-fix2.json (area_of_effect/duration/saving_throw) live an.
// Backup der betroffenen Felder → cache/db-fix2-backup.json (reversibel).
// Nutzung: node apply-db-fix2.mjs [--revert]
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supa } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const MAP = JSON.parse(readFileSync(join(HERE, "cache", "db-fix2.json"), "utf8"));
const BACKUP = join(HERE, "cache", "db-fix2-backup.json");

(async () => {
  const sb = supa();
  if (process.argv.includes("--revert")) {
    const bak = JSON.parse(readFileSync(BACKUP, "utf8"));
    for (const b of bak) await sb.from("spells").update(b.old).eq("id", b.id);
    console.log(`↩ Zurückgesetzt: ${bak.length} Zauber.`);
    return;
  }
  // Backup (nur die Felder, die wir ändern)
  const ids = MAP.map((m) => m.id);
  const { data: cur } = await sb.from("spells").select("id,area_of_effect,duration,saving_throw").in("id", ids);
  const byId = Object.fromEntries(cur.map((c) => [c.id, c]));
  writeFileSync(BACKUP, JSON.stringify(MAP.map((m) => ({
    id: m.id, name: m.name,
    old: Object.fromEntries(Object.keys(m.patch).map((k) => [k, byId[m.id]?.[k]])),
  })), null, 2));
  console.log(`Backup: ${MAP.length} Zauber → cache/db-fix2-backup.json`);

  let ok = 0, fail = 0;
  for (const m of MAP) {
    const { error } = await sb.from("spells").update(m.patch).eq("id", m.id);
    if (error) { console.log(`  ✗ ${m.name}: ${error.message}`); fail++; } else ok++;
  }
  console.log(`\nAngewandt: ${ok} | Fehler: ${fail}`);
  const { data: check } = await sb.from("spells").select("name_en,area_of_effect,duration,saving_throw").in("name_en", ["Fireball", "Taunt", "Levitate", "Detect Magic"]);
  console.log("\nStichprobe:");
  for (const c of check) console.log(`  ${c.name_en}: aoe="${c.area_of_effect}" dur="${c.duration}" save="${c.saving_throw}"`);
})();
