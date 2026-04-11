/**
 * Backfill-Generator für den Monster-Bestand aus dem Compendium-Snapshot.
 *
 * Matcht die 176 bestehenden Seed-Monster gegen `translated.json` und:
 * - Bei Match: erzeugt ein UPDATE, das nur die leeren narrative-Spalten
 *   (`intro_text`, `combat_tactics`, `habitat_society`, `ecology`, `no_appearing`)
 *   befüllt. Bestehende deutsche Namen und `description`-Texte bleiben unberührt.
 * - Bei Miss (Monster im Compendium, aber nicht in der DB): erzeugt einen
 *   INSERT für eine neue Monster-Row mit `is_custom = false`.
 *
 * Modi:
 *   npx tsx scripts/backfill-monsters-from-compendium.ts
 *     → Dry-Run: schreibt einen Diff-Report nach
 *       `ressources/compendium-snapshot/backfill-diff.md` und gibt eine
 *       Summary aus. Kein DB-Write, kein SQL-File.
 *
 *   npx tsx scripts/backfill-monsters-from-compendium.ts --emit-sql
 *     → zusätzlich zum Dry-Run: schreibt
 *       `supabase/migrations/00211_backfill_monsters_from_compendium.sql`
 *       mit der kompletten Migration. `supabase db push` spielt sie ein.
 *
 * Custom-Monster (is_custom = true) werden in BEIDEN Modi hart gefiltert
 * und niemals angefasst.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import dotenv from "dotenv";
import type { MonsterRow } from "../src/lib/supabase/types";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

// ─── Types ────────────────────────────────────────────────────────────

import type { ParsedMonster } from "./parse-compendium";

interface TranslatedRecord {
  monster_key: string;
  hash: string;
  name: string;
  intro_text: string | null;
  combat_tactics: string | null;
  habitat_society: string | null;
  ecology: string | null;
}

export interface MergedMonster extends ParsedMonster {
  /** Übersetzte deutsche Felder (fallback: englisches Original). */
  name_de: string;
  intro_text_de: string | null;
  combat_tactics_de: string | null;
  habitat_society_de: string | null;
  ecology_de: string | null;
}

// ─── Manual name overrides ────────────────────────────────────────────
// German seed-monster name → compendium monster_key.
// Curated list of entries where neither normalised nor token-sort matching
// finds the obvious canonical pairing (typically because the compendium uses
// a family-grouped key like "dragcblu" while the DB uses per-age-variant
// German names like "Blauer Drache (Erwachsen)").
export const NAME_OVERRIDES: Record<string, string> = {
  // Chromatic dragons
  "Blauer Drache (Erwachsen)": "dragcblu",
  "Schwarzer Drache (Erwachsen)": "dragcbla",
  "Grüner Drache (Erwachsen)": "dragcgre",
  "Roter Drache (Erwachsen)": "dragcred",
  "Weißer Drache (Erwachsen)": "dragcwhi",
  "Weißer Drache (Jung)": "dragcwhi",

  // Metallic dragons
  "Bronzedrache (Erwachsen)": "dragmbro",
  "Golddrache (Erwachsen)": "dragmgol",
  "Silberdrache (Erwachsen)": "dragmsil",
  "Kupferdrache (Erwachsen)": "dragmcop",
  "Messingdrache (Erwachsen)": "dragmbra",

  // Elementals (the DB stores specific 12-HD variants, compendium has family entries)
  "Erdelemental (12 TW)": "elekeart",
  "Feuerelemental (12 TW)": "elekfire",
  "Luftelemental (12 TW)": "elekair",

  // Dwarven/Elven sub-races
  Derro: "dwarderr",
  Duergar: "dwarduer",
  Drow: "elfdrow",

  // Fiends that are grouped under their family key in the compendium
  Grubenteufel: "baatpitf", // Pit Fiend

  // Lycanthropes
  Werrate: "lycawera", // Wererat

  // Merged seed rows from migration 00212 — re-running the backfill must
  // UPDATE these existing rows rather than re-inserting the Compendium-
  // side duplicate.
  Betrachter: "beholde1", // Beholder and Beholder-kin I
  Ettin: "gianetti", // Giant, Ettin
  Gargoyle: "gargoyl1", // Gargoyle I
  Wildschwein: "boar", // Boar (seed already has "Wild Boar")
  Dschinn: "genie", // Genie umbrella

  // Tanar'ri variants — seed DB has the short names, Compendium uses
  // "Tanar'ri, True, <X>" which neither normalisation nor token-sort catches.
  Balor: "tanatbal",
  Marilith: "tanatmar",
};

/**
 * Compendium keys that must be skipped entirely — not matched, not inserted.
 * Used when a Compendium entry has no useful data for the game and was
 * already removed from the DB by a cleanup migration.
 */
export const BLOCKED_KEYS: ReadonlySet<string> = new Set<string>([
  "beholde2", // Beholder and Beholder-kin II — deleted in migration 00212
]);

// ─── Paths ────────────────────────────────────────────────────────────

const SNAPSHOT_DIR = path.resolve(__dirname, "..", "ressources", "compendium-snapshot");
const PARSED_PATH = path.join(SNAPSHOT_DIR, "parsed.json");
const TRANSLATED_PATH = path.join(SNAPSHOT_DIR, "translated.json");
const DIFF_REPORT_PATH = path.join(SNAPSHOT_DIR, "backfill-diff.md");
/**
 * Re-running the backfill emits to a NEW migration file rather than
 * overwriting the already-applied 00211. Supabase tracks migrations by
 * filename, so overwriting an applied migration is a silent no-op on the
 * remote DB. The CLI flag `--migration-name=<name>` can override this.
 */
const DEFAULT_MIGRATION_NAME = "00214_backfill_monsters_expanded.sql";
const MIGRATION_NAME_ARG = process.argv.find((a) => a.startsWith("--migration-name="));
const MIGRATION_FILENAME = MIGRATION_NAME_ARG
  ? MIGRATION_NAME_ARG.split("=")[1]
  : DEFAULT_MIGRATION_NAME;
const MIGRATION_PATH = path.resolve(__dirname, "..", "supabase", "migrations", MIGRATION_FILENAME);

// ─── Helpers ──────────────────────────────────────────────────────────

function loadSnapshot(): MergedMonster[] {
  const parsed: ParsedMonster[] = JSON.parse(readFileSync(PARSED_PATH, "utf-8"));
  const translated: TranslatedRecord[] = JSON.parse(readFileSync(TRANSLATED_PATH, "utf-8"));
  const byKey = new Map(translated.map((t) => [t.monster_key, t]));

  return parsed.map((p) => {
    const t = byKey.get(p.monster_key);
    return {
      ...p,
      name_de: t?.name ?? p.name_en,
      intro_text_de: t?.intro_text ?? null,
      combat_tactics_de: t?.combat_tactics ?? null,
      habitat_society_de: t?.habitat_society ?? null,
      ecology_de: t?.ecology ?? null,
    };
  });
}

async function loadExistingMonsters(): Promise<MonsterRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  }
  const supabase = createClient(url, key);
  const { data, error } = await supabase.from("monsters").select("*").eq("is_custom", false);
  if (error) throw new Error(`DB fetch failed: ${error.message}`);
  return (data as MonsterRow[]) ?? [];
}

/** Normalise a name for matching: lowercase, expand ß, strip punctuation + whitespace. */
function normaliseName(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/ß/g, "ss") // NFD does not decompose ß — expand it explicitly
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "");
}

/** Tokenise a name into sorted alphanumeric chunks for order-insensitive matching. */
function tokenSortName(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .sort()
    .join("");
}

/** Multi-character tokens (≥3 chars) for fuzzy duplicate detection on INSERT. */
function tokens(s: string | null | undefined): string[] {
  if (!s) return [];
  return s
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
}

/**
 * Defensive duplicate check: the shorter name's tokens must be a full subset
 * of the longer name's tokens, AND the shorter name must have ≥2 tokens.
 *
 * This catches "Blue Dragon" ⊆ "Dragon, Chromatic, Blue" (real duplicate)
 * but NOT "Frost Giant" vs "Giant, Fog" (different creatures, just sharing
 * the family token) or "Spider" vs "Phase Spider" (shorter has only 1 token
 * so we err on the side of inserting).
 */
function looksLikeDuplicate(a: string | null | undefined, b: string | null | undefined): boolean {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0 || tb.length === 0) return false;

  const [shorter, longer] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  if (shorter.length < 2) return false;

  return shorter.every((t) => longer.includes(t));
}

export interface MatchResult {
  kind: "update" | "insert" | "skip-duplicate" | "skip-blocked";
  snapshot: MergedMonster;
  existing?: MonsterRow;
  /** How we found the match — useful for the diff report. */
  matchedBy?: "name_en" | "name" | "override" | "token_sort";
  /** When kind = "skip-duplicate": the existing row that looks like a dup. */
  duplicateOf?: MonsterRow;
}

export function buildMatchPlan(snapshot: MergedMonster[], existing: MonsterRow[]): MatchResult[] {
  // Build lookup indices over the existing DB
  const byNameEn = new Map<string, MonsterRow>();
  const byName = new Map<string, MonsterRow>();
  const byTokenSortEn = new Map<string, MonsterRow>();
  const byTokenSortName = new Map<string, MonsterRow>();
  for (const m of existing) {
    if (m.name_en) {
      byNameEn.set(normaliseName(m.name_en), m);
      byTokenSortEn.set(tokenSortName(m.name_en), m);
    }
    byName.set(normaliseName(m.name), m);
    byTokenSortName.set(tokenSortName(m.name), m);
  }

  const results: MatchResult[] = [];
  for (const snap of snapshot) {
    // (0) hard-blocked compendium keys — entries that were already removed
    // from the DB by a cleanup migration and must not come back.
    if (BLOCKED_KEYS.has(snap.monster_key)) {
      results.push({ kind: "skip-blocked", snapshot: snap });
      continue;
    }

    // (a) explicit override map — keyed by German name
    const overrideKey = Object.entries(NAME_OVERRIDES).find(([, k]) => k === snap.monster_key)?.[0];
    if (overrideKey) {
      const hit = byName.get(normaliseName(overrideKey));
      if (hit) {
        results.push({ kind: "update", snapshot: snap, existing: hit, matchedBy: "override" });
        continue;
      }
    }

    // (b) monster_key matches a normalised name_en
    const keyNorm = normaliseName(snap.monster_key);
    const nameEnNorm = normaliseName(snap.name_en);
    const byKeyHit = byNameEn.get(keyNorm) ?? byNameEn.get(nameEnNorm);
    if (byKeyHit) {
      results.push({ kind: "update", snapshot: snap, existing: byKeyHit, matchedBy: "name_en" });
      continue;
    }

    // (c) fallback: normalised English name matches a German name too
    //     (some seed monsters only have `name` filled, no `name_en`)
    const byNameHit = byName.get(nameEnNorm) ?? byName.get(keyNorm);
    if (byNameHit) {
      results.push({ kind: "update", snapshot: snap, existing: byNameHit, matchedBy: "name" });
      continue;
    }

    // (d) token-sort match — handles different word orders like
    //     "Blue Dragon" ↔ "Dragon, Blue" (still exact match, just
    //     order-insensitive — not fuzzy).
    const tokenSortEn = tokenSortName(snap.name_en);
    const tokenSortHit = byTokenSortEn.get(tokenSortEn) ?? byTokenSortName.get(tokenSortEn);
    if (tokenSortHit) {
      results.push({
        kind: "update",
        snapshot: snap,
        existing: tokenSortHit,
        matchedBy: "token_sort",
      });
      continue;
    }

    // (e) Hard-deduplicate: if an existing row's name is a strict token
    //     subset of this compendium entry (or vice versa) with ≥2 shared
    //     tokens, skip the INSERT. Prevents duplicates like "Blue Dragon"
    //     ⊆ "Dragon, Chromatic, Blue" while leaving legit new rows like
    //     "Giant, Fog" vs "Frost Giant" alone.
    const dupMatch = existing.find(
      (e) => looksLikeDuplicate(snap.name_en, e.name_en) || looksLikeDuplicate(snap.name_en, e.name)
    );
    if (dupMatch) {
      results.push({
        kind: "skip-duplicate",
        snapshot: snap,
        duplicateOf: dupMatch,
      });
      continue;
    }

    // No match → insert a new row
    results.push({ kind: "insert", snapshot: snap });
  }
  return results;
}

// ─── SQL generation ───────────────────────────────────────────────────

function escapeSql(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  // PostgreSQL: escape single quotes by doubling them. Dollar-quoting would
  // be safer for large texts, but the snapshot texts contain no `$`, so
  // standard escaping is fine.
  return `'${value.replace(/'/g, "''")}'`;
}

export function buildUpdateSql(m: MatchResult & { kind: "update" }): string {
  const snap = m.snapshot;
  const existing = m.existing!;
  // COALESCE(existing, new) means: only fill empty columns, never overwrite.
  return `UPDATE monsters SET
  intro_text      = COALESCE(intro_text, ${escapeSql(snap.intro_text_de)}),
  combat_tactics  = COALESCE(combat_tactics, ${escapeSql(snap.combat_tactics_de)}),
  habitat_society = COALESCE(habitat_society, ${escapeSql(snap.habitat_society_de)}),
  ecology         = COALESCE(ecology, ${escapeSql(snap.ecology_de)}),
  no_appearing    = COALESCE(no_appearing, ${escapeSql(snap.no_appearing)})
WHERE id = ${escapeSql(existing.id)} AND is_custom = FALSE;`;
}

export function buildInsertSql(m: MatchResult & { kind: "insert" }): string {
  const s = m.snapshot;
  return `INSERT INTO monsters (
  name, name_en, source_book, is_custom,
  climate_terrain, frequency, organization, activity_cycle, diet,
  intelligence, treasure, alignment, no_appearing,
  ac, movement, hit_dice, hit_dice_value, thac0, attacks_per_round, damage,
  special_attacks, special_defenses, magic_resistance, size, morale, morale_value, xp_value,
  intro_text, combat_tactics, habitat_society, ecology
) VALUES (
  ${escapeSql(s.name_de)},
  ${escapeSql(s.name_en)},
  ${escapeSql(s.source_book)},
  FALSE,
  ${escapeSql(s.climate_terrain)},
  ${escapeSql(s.frequency ?? "common")},
  ${escapeSql(s.organization)},
  ${escapeSql(s.activity_cycle)},
  ${escapeSql(s.diet)},
  ${escapeSql(s.intelligence)},
  ${escapeSql(s.treasure)},
  ${escapeSql(s.alignment)},
  ${escapeSql(s.no_appearing)},
  ${escapeSql(s.ac)},
  ${escapeSql(s.movement ?? "")},
  ${escapeSql(s.hit_dice)},
  ${escapeSql(s.hit_dice_value)},
  ${escapeSql(s.thac0)},
  ${escapeSql(s.attacks_per_round)},
  ${escapeSql(s.damage)},
  ${escapeSql(s.special_attacks)},
  ${escapeSql(s.special_defenses)},
  ${escapeSql(s.magic_resistance)},
  ${escapeSql(s.size)},
  ${escapeSql(s.morale ?? "")},
  ${escapeSql(s.morale_value)},
  ${escapeSql(s.xp_value)},
  ${escapeSql(s.intro_text_de)},
  ${escapeSql(s.combat_tactics_de)},
  ${escapeSql(s.habitat_society_de)},
  ${escapeSql(s.ecology_de)}
);`;
}

function emitMigration(plan: MatchResult[]): string {
  const updates = plan.filter((p): p is MatchResult & { kind: "update" } => p.kind === "update");
  const inserts = plan.filter((p): p is MatchResult & { kind: "insert" } => p.kind === "insert");
  const skipped = plan.filter(
    (p): p is MatchResult & { kind: "skip-duplicate" } => p.kind === "skip-duplicate"
  );
  const blocked = plan.filter(
    (p): p is MatchResult & { kind: "skip-blocked" } => p.kind === "skip-blocked"
  );

  const header = `-- Backfill monsters from compendium snapshot
--
-- Generated by scripts/backfill-monsters-from-compendium.ts
-- Source: ressources/compendium-snapshot/translated.json
-- Scope: MM + MC1 + MC2 monsters (TSR product IDs 2140, 2102, 2103)
-- Match strategy: normalised name + token-sort + manual override map
--
-- ${updates.length} UPDATEs (only fills empty narrative columns via COALESCE)
-- ${inserts.length} INSERTs (new monster rows with is_custom = FALSE)
-- ${skipped.length} SKIPPED inserts (defensive duplicate check — see diff report)
-- ${blocked.length} BLOCKED keys (hard-deleted in prior cleanup migration)
--
-- Custom monsters (is_custom = TRUE) are hard-filtered and never touched.
-- See companion plan: docs/agents/plans/2026-04-10-monster-data-completeness.md

BEGIN;

-- ─── UPDATEs (enrich existing seed monsters) ────────────────────────`;

  const updateBlock = updates
    .map((u) => `\n-- ${u.snapshot.name_en} (matched by ${u.matchedBy})\n${buildUpdateSql(u)}`)
    .join("\n");

  const insertHeader = `
-- ─── INSERTs (new monsters not previously seeded) ───────────────────`;

  const insertBlock = inserts
    .map((i) => `\n-- ${i.snapshot.name_en} (new)\n${buildInsertSql(i)}`)
    .join("\n");

  return `${header}\n${updateBlock}\n${insertHeader}\n${insertBlock}\n\nCOMMIT;\n`;
}

// ─── Dry-run report ───────────────────────────────────────────────────

function emitDiffReport(plan: MatchResult[]): string {
  const updates = plan.filter((p) => p.kind === "update");
  const inserts = plan.filter((p) => p.kind === "insert");
  const skipped = plan.filter((p) => p.kind === "skip-duplicate");
  const blocked = plan.filter((p) => p.kind === "skip-blocked");

  const lines = [
    `# Backfill Diff Report`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `## Summary`,
    ``,
    `- **${updates.length} UPDATEs** — existing seed monsters enriched with narrative sections`,
    `- **${inserts.length} INSERTs** — new monsters added to the DB`,
    `- **${skipped.length} SKIPPED inserts** — defensive duplicate check (token overlap ≥50% with an existing row)`,
    `- **${blocked.length} BLOCKED keys** — hard-skipped compendium entries (deleted in a prior cleanup migration)`,
    `- **0 Custom monsters touched** (hard filter: \`is_custom = false\`)`,
    ``,
    `## UPDATEs`,
    ``,
    `| Monster (EN) | Matched existing row | Matched by |`,
    `|---|---|---|`,
    ...updates.map(
      (u) =>
        `| ${u.snapshot.name_en} | ${u.existing?.name} (\`${u.existing?.id}\`) | ${u.matchedBy} |`
    ),
    ``,
    `## INSERTs`,
    ``,
    `| Monster (EN) | Source book | Size | HD |`,
    `|---|---|---|---|`,
    ...inserts.map(
      (i) =>
        `| ${i.snapshot.name_en} | ${i.snapshot.source_book} | ${i.snapshot.size} | ${i.snapshot.hit_dice} |`
    ),
    ``,
    `## SKIPPED (defensive duplicate check)`,
    ``,
    `These compendium entries look like they might already exist in the DB under a different name (e.g. German translation). They are NOT inserted to prevent duplicates. If any of these should actually become new rows, add a curated entry to \`NAME_OVERRIDES\`.`,
    ``,
    `| Compendium (EN) | Existing row it looks like | Existing name_en |`,
    `|---|---|---|`,
    ...skipped.map(
      (s) =>
        `| ${s.snapshot.name_en} | ${s.duplicateOf?.name} (\`${s.duplicateOf?.id}\`) | ${s.duplicateOf?.name_en ?? "—"} |`
    ),
    ``,
    `## BLOCKED (hard-skipped)`,
    ``,
    `These compendium keys are in \`BLOCKED_KEYS\` — their DB rows were already removed by a cleanup migration and the backfill must not re-create them.`,
    ``,
    `| Compendium key | Compendium name (EN) |`,
    `|---|---|`,
    ...blocked.map((b) => `| \`${b.snapshot.monster_key}\` | ${b.snapshot.name_en} |`),
    ``,
  ];
  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const emitSql = args.includes("--emit-sql");

  console.log("Lade Snapshot...");
  const snapshot = loadSnapshot();
  console.log(`  ${snapshot.length} Monster aus parsed.json + translated.json`);

  console.log("Lade existing Seed-Monster aus DB...");
  const existing = await loadExistingMonsters();
  console.log(`  ${existing.length} existing Monster (is_custom = false)`);

  console.log("Erzeuge Match-Plan...");
  const plan = buildMatchPlan(snapshot, existing);
  const updates = plan.filter((p) => p.kind === "update").length;
  const inserts = plan.filter((p) => p.kind === "insert").length;
  const skipped = plan.filter((p) => p.kind === "skip-duplicate").length;
  const blocked = plan.filter((p) => p.kind === "skip-blocked").length;
  console.log(
    `  ${updates} UPDATEs, ${inserts} INSERTs, ${skipped} SKIPPED (duplicate), ${blocked} BLOCKED`
  );

  // Always write the diff report
  writeFileSync(DIFF_REPORT_PATH, emitDiffReport(plan), "utf-8");
  console.log(`✓ Diff-Report: ${DIFF_REPORT_PATH}`);

  if (emitSql) {
    writeFileSync(MIGRATION_PATH, emitMigration(plan), "utf-8");
    console.log(`✓ SQL-Migration: ${MIGRATION_PATH}`);
    console.log(``);
    console.log(`Next: Review the migration and run 'supabase db push'.`);
  } else {
    console.log(``);
    console.log(`Dry-Run abgeschlossen. Für die SQL-Migration: --emit-sql`);
  }
}

const isCli = typeof require !== "undefined" && require.main === module;
if (isCli) {
  main().catch((err) => {
    console.error("Backfill fehlgeschlagen:", err);
    process.exit(1);
  });
}
