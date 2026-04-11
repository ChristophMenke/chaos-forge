/**
 * Compendium-Snapshot-Extraktor
 *
 * Klont einmalig `decheine/complete-compendium` nach /tmp, filtert aus dem
 * Harvester-Verzeichnis alle Monster-HTML-Dateien, deren <p class="tsr">-Tag
 * auf das Monstrous Manual (2140) oder eines der Vorgänger-Compendia
 * MC1 Volume I (2102) / MC2 Volume II (2103) verweist, und kopiert sie samt
 * zugehöriger GIF-Illustrationen und der TSR-Lookup-Datei nach
 * `ressources/compendium-snapshot/`.
 *
 * Das Ergebnis wird committed und dient als stabile Quelle für:
 * - `scripts/parse-compendium.ts`           (strukturierte Extraktion)
 * - `scripts/translate-monster-narrative.ts` (DE-Übersetzung)
 * - `scripts/backfill-monsters-from-compendium.ts` (DB-Backfill-Migration)
 * - `scripts/ingest-monster-images.ts`      (GIF → WebP → Storage)
 *
 * Rechtsprofil: Die Quelle ist ein öffentliches Fan-Projekt ohne explizite
 * Lizenz, dessen Daten auf TSR/WotC-Material zurückgehen. Die Nutzung in
 * Chaos Forge erfolgt ausschließlich im Rahmen der privaten, nicht-kommerziellen
 * Spielgruppe (≤ 10 Nutzer). Siehe Research-Bericht für Details.
 *
 * Run: npx tsx scripts/extract-compendium-snapshot.ts
 */

import { execSync } from "child_process";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  existsSync,
  rmSync,
  statSync,
} from "fs";
import path from "path";

const UPSTREAM_REPO = "https://github.com/decheine/complete-compendium.git";

/**
 * TSR-Produkt-IDs, die den Import-Scope definieren:
 * - 2140 = Monstrous Manual (1995, Tim Beach) — die kanonische Compilation
 * - 2102 = Monstrous Compendium Volume I (1989) — Vorgänger-Loseblatt-Sammlung
 * - 2103 = Monstrous Compendium Volume II (1989) — Vorgänger-Loseblatt-Sammlung
 *
 * Ein HTML-Eintrag wird importiert, sobald mindestens eine dieser IDs in seinem
 * <p class="tsr">-Tag auftaucht. Damit werden auch MC1/MC2-Exklusivmonster
 * erfasst, die nicht ins MM übernommen wurden.
 */
const SOURCE_PRODUCT_IDS = ["2140", "2102", "2103"] as const;
const TMP_CLONE_DIR = "/tmp/chaos-forge-compendium-clone";
const SNAPSHOT_DIR = path.resolve(__dirname, "..", "ressources", "compendium-snapshot");
const SNAPSHOT_MM_DIR = path.join(SNAPSHOT_DIR, "mm");
const SNAPSHOT_IMG_DIR = path.join(SNAPSHOT_MM_DIR, "img");

/** Extract the comma-separated TSR product-ID list from a monster HTML file. */
function extractTsrCodes(html: string): string[] {
  const match = html.match(/<p class="tsr">([^<]*)<\/p>/);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Whether the HTML references any of the configured source books. */
function matchesSourceBook(html: string): boolean {
  const codes = extractTsrCodes(html);
  return codes.some((c) => (SOURCE_PRODUCT_IDS as readonly string[]).includes(c));
}

/** Remove and recreate a directory. */
function resetDir(dir: string): void {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

function cloneUpstream(): string {
  if (existsSync(TMP_CLONE_DIR)) {
    console.log(`Entferne alten Clone in ${TMP_CLONE_DIR}...`);
    rmSync(TMP_CLONE_DIR, { recursive: true, force: true });
  }
  console.log(`Shallow-Clone von ${UPSTREAM_REPO} nach ${TMP_CLONE_DIR}...`);
  execSync(`git clone --depth 1 --single-branch ${UPSTREAM_REPO} ${TMP_CLONE_DIR}`, {
    stdio: "inherit",
  });
  const commit = execSync(`git -C ${TMP_CLONE_DIR} rev-parse HEAD`).toString().trim();
  console.log(`Upstream-Commit: ${commit}`);
  return commit;
}

function extractMonsters(): { htmlCount: number; gifCount: number; missingGifs: string[] } {
  const harvesterDir = path.join(TMP_CLONE_DIR, "harvester", "cmm");
  const imagesDir = path.join(TMP_CLONE_DIR, "static", "images", "monsters", "img");

  if (!existsSync(harvesterDir)) {
    throw new Error(`Expected harvester dir not found: ${harvesterDir}`);
  }

  resetDir(SNAPSHOT_MM_DIR);
  mkdirSync(SNAPSHOT_IMG_DIR, { recursive: true });

  const allFiles = readdirSync(harvesterDir).filter((f) => f.endsWith(".html"));
  console.log(
    `Scanne ${allFiles.length} HTML-Dateien auf Quell-Zugehörigkeit (${SOURCE_PRODUCT_IDS.join(", ")})...`
  );

  let htmlCount = 0;
  let gifCount = 0;
  const missingGifs: string[] = [];

  for (const file of allFiles) {
    const srcPath = path.join(harvesterDir, file);
    const html = readFileSync(srcPath, "utf-8");
    if (!matchesSourceBook(html)) continue;

    // Copy HTML
    copyFileSync(srcPath, path.join(SNAPSHOT_MM_DIR, file));
    htmlCount++;

    // Copy matching GIF if present
    const monsterKey = file.replace(/\.html$/, "");
    const gifSrc = path.join(imagesDir, `${monsterKey}.gif`);
    if (existsSync(gifSrc)) {
      copyFileSync(gifSrc, path.join(SNAPSHOT_IMG_DIR, `${monsterKey}.gif`));
      gifCount++;
    } else {
      missingGifs.push(monsterKey);
    }
  }

  return { htmlCount, gifCount, missingGifs };
}

function copyLookupData(): void {
  const src = path.join(TMP_CLONE_DIR, "data", "all_tsr.json");
  const dst = path.join(SNAPSHOT_DIR, "all_tsr.json");
  copyFileSync(src, dst);
  console.log(`Kopiert: all_tsr.json (${statSync(dst).size} Bytes)`);
}

function writeReadme(upstreamCommit: string, htmlCount: number, gifCount: number): void {
  const today = new Date().toISOString().slice(0, 10);
  const content = `# Compendium-Snapshot (Monstrous Manual + Monstrous Compendium I/II)

Dieser Snapshot wurde einmalig extrahiert aus:

- **Upstream**: https://github.com/decheine/complete-compendium
- **Datum**: ${today}
- **Upstream-Commit**: ${upstreamCommit}
- **Extraktions-Filter**: TSR-Produkt-IDs ${SOURCE_PRODUCT_IDS.join(", ")}
  - \`2140\` — Monstrous Manual (1995)
  - \`2102\` — Monstrous Compendium Volume I (1989)
  - \`2103\` — Monstrous Compendium Volume II (1989)

Enthält die HTML-Stat-Block-Dateien und die dazugehörigen GIF-Illustrationen
für Monster aus dem Monstrous Manual und seinen Vorgänger-Compendia
(© Wizards of the Coast, vormals TSR) plus die Buch-Lookup-Daten
(\`all_tsr.json\`). Die Vorgänger-Compendia liefern Monster, die nicht ins
MM übernommen wurden und sonst fehlen würden.

## Verwendungszweck

Einmaliger Backfill-Import für die private Spielgruppe "Chaos RPG"
(≤ 10 Nutzer, nicht-kommerziell). Das Rechtsprofil entspricht der bereits
vorhandenen Nutzung von \`ressources/monsters/Monstrous Manual.pdf\`.

## Inhalt

- \`all_tsr.json\` — TSR-Produkt-ID → Buchtitel-Lookup (vom Upstream übernommen)
- \`mm/*.html\` — ${htmlCount} Monstrous-Manual-Monster-HTMLs
- \`mm/img/*.gif\` — ${gifCount} Monster-Illustrationen (einige Monster haben upstream kein Bild)
- \`parsed.json\` — Wird von \`scripts/parse-compendium.ts\` generiert (strukturiertes JSON)
- \`translated.json\` — Wird von \`scripts/translate-monster-narrative.ts\` generiert (DE-Übersetzung)

## Verwandte Dokumente

- Research: \`docs/agents/research/2026-04-10-monster-data-completeness.md\`
- Plan: \`docs/agents/plans/2026-04-10-monster-data-completeness.md\`

## Erneuerung

Der Snapshot kann via \`npx tsx scripts/extract-compendium-snapshot.ts\` neu
erstellt werden. Der alte Inhalt von \`mm/\` wird dabei ersetzt.
`;
  writeFileSync(path.join(SNAPSHOT_DIR, "README.md"), content, "utf-8");
}

async function main(): Promise<void> {
  mkdirSync(SNAPSHOT_DIR, { recursive: true });

  const upstreamCommit = cloneUpstream();
  const { htmlCount, gifCount, missingGifs } = extractMonsters();
  copyLookupData();
  writeReadme(upstreamCommit, htmlCount, gifCount);

  console.log("");
  console.log(`✓ Extrahiert ${htmlCount} Monster-HTMLs (Filter: ${SOURCE_PRODUCT_IDS.join(", ")})`);
  console.log(`✓ Extrahiert ${gifCount} Monster-GIFs (${missingGifs.length} Monster ohne Bild)`);
  console.log(`✓ Snapshot liegt unter: ${SNAPSHOT_DIR}`);
  if (missingGifs.length > 0 && missingGifs.length <= 30) {
    console.log(`  Monster ohne GIF: ${missingGifs.join(", ")}`);
  } else if (missingGifs.length > 30) {
    console.log(`  Monster ohne GIF (erste 10): ${missingGifs.slice(0, 10).join(", ")}, …`);
  }

  // Aufräumen: Clone entfernen
  console.log(`Entferne temporären Clone in ${TMP_CLONE_DIR}...`);
  rmSync(TMP_CLONE_DIR, { recursive: true, force: true });
  console.log("Fertig.");
}

main().catch((err) => {
  console.error("Extraktion fehlgeschlagen:", err);
  process.exit(1);
});
