// GRÜNDLICHES Pre-Print-Regel-Audit (AD&D 2e) je Karte, gegen die kanonische
// DB-Beschreibung als Ground Truth. Opus 4.8, strukturierte Ausgabe.
// Fokus: Saving-Throw-KATEGORIE, erfundene/fehlende Mechaniken, falsche Würfel/
// Skalierung, falsche Stats, Namensform, Statblock-Doppelung. → cache/audit-v2.json
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  fetchIllusionistDeck, fetchLearnedWizardSpells, fetchCharacters,
  englishName, englishDescription, schoolInfo,
} from "./lib.mjs";
import { getContent } from "./content.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(HERE, "..", "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["name", "save", "rules", "stats", "complete", "dup", "severity", "summary"],
  properties: {
    name: { type: "object", additionalProperties: false, required: ["ok", "note"], properties: {
      ok: { type: "boolean" }, note: { type: "string", description: "empty if ok; else problem + correct canonical AD&D 2e name" } } },
    save: { type: "object", additionalProperties: false, required: ["ok", "note"], properties: {
      ok: { type: "boolean" }, note: { type: "string", description: "empty if ok; else the printed saving-throw value is WRONG — state the correct one. Check BOTH: (a) does the spell allow a save at all? (b) is the CATEGORY right (vs. Spell / vs. Death Magic / vs. Breath / vs. Petrification / vs. Paralyzation / vs. Poison / vs. Rod-Staff-Wand)? '½' means save halves, 'neg.' means save negates." } } },
    rules: { type: "object", additionalProperties: false, required: ["ok", "note"], properties: {
      ok: { type: "boolean" }, note: { type: "string", description: "empty if ok; else any RULES INACCURACY: wrong damage/healing dice, wrong per-level scaling, invented mechanics the spell does not have, wrong numbers, or a save-effect that contradicts canon. Be specific and give the correct value." } } },
    stats: { type: "object", additionalProperties: false, required: ["ok", "note"], properties: {
      ok: { type: "boolean" }, note: { type: "string", description: "empty if ok; else which stat-block field (casting time / range / duration / area / components) is canonically wrong, with the correct value. Values are METRIC (ft→m ×0.3048, yd→m ×0.9144). Allow rounding." } } },
    complete: { type: "object", additionalProperties: false, required: ["ok", "note"], properties: {
      ok: { type: "boolean" }, note: { type: "string", description: "empty if ok; else a genuinely important mechanic missing from the rules text (given the ~480 char cap — flag only real omissions)." } } },
    dup: { type: "object", additionalProperties: false, required: ["ok", "note"], properties: {
      ok: { type: "boolean" }, note: { type: "string", description: "empty if ok; else the rules text redundantly restates a stat-block field (range number, duration, area dims, components V/S/M, or the save value/category). Describing WHAT a save does is fine." } } },
    severity: { type: "string", enum: ["ok", "minor", "major"], description: "'major' = wrong name, wrong saving throw, wrong dice/scaling, invented mechanic, or missing core mechanic that changes play. 'minor' = small wording/stat rounding/omitted edge case. 'ok' = clean." },
    summary: { type: "string", description: "one short sentence: the single most important issue, or 'clean'." },
  },
};

const SYS =
  "You are a meticulous Advanced Dungeons & Dragons 2nd Edition rules expert doing the FINAL pre-print proof of a physical spell-card deck. Once printed, nothing can be fixed, so be thorough and skeptical.\n\n" +
  "For each card you get: the printed NAME, the printed STAT BLOCK (casting time, range, duration, area, saving throw, components — all METRIC), the printed RULES TEXT (hard-capped ~480 chars), and the CANONICAL RULEBOOK DESCRIPTION from the database as ground truth.\n\n" +
  "Judge against BOTH the canonical description AND your own authoritative knowledge of AD&D 2e. The database description may itself contain OCR corruption or errors — if the card is right and the DB text is garbled, do NOT flag the card; if they agree but BOTH contradict real AD&D 2e canon, flag it and say so.\n\n" +
  "Check, in order:\n" +
  "1. NAME — correct canonical English AD&D 2e spell name (right spelling, right roman numerals).\n" +
  "2. SAVING THROW (critical!) — Is the printed saving-throw value correct? Verify the spell actually ALLOWS a save (many wizard spells allow NONE — flag an invented save), and that the CATEGORY is right (most use 'vs. Spell'; death/petrification/breath/paralyzation/poison/rod-staff-wand where canon dictates). Verify the modifier ('½' halves, 'neg.' negates, 'Special').\n" +
  "3. RULES accuracy — correct damage/healing dice, correct per-level scaling, no invented mechanics, correct save-effect, no wrong numbers.\n" +
  "4. STATS — casting time / range / duration / area match canon (metric conversion allowed, rounding allowed).\n" +
  "5. COMPLETENESS — nothing essential to resolve the spell is missing (respect the char cap; flag only real gaps).\n" +
  "6. DUPLICATION — rules text does not restate stat-block fields.\n\n" +
  "Be precise; when you flag something, give the CORRECT value. Do not invent problems — if a check passes, mark ok=true and leave the note empty.";

async function auditOne(card) {
  const res = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1400,
    system: SYS,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content:
      `PRINTED NAME: ${card.name}\nDB name_en: ${card.name_en || "(none)"} | DB name: ${card.name_de || "(none)"}\n` +
      `School: ${card.school} | Level: ${card.level} | Source: ${card.source_book}\n` +
      `STAT BLOCK — Casting Time: ${card.stats.casting_time} | Range: ${card.stats.range} | Duration: ${card.stats.duration} | Area: ${card.stats.area_of_effect} | Saving Throw: ${card.stats.saving_throw} | Components: ${(card.stats.components || []).join(", ")}\n\n` +
      `PRINTED RULES TEXT:\n${card.rules}\n\n` +
      `CANONICAL RULEBOOK DESCRIPTION (ground truth, may have OCR noise):\n${card.desc || "(none in DB)"}` }],
  });
  return JSON.parse(res.content.find((b) => b.type === "text").text);
}

async function pool(items, size, fn) {
  const q = [...items.entries()];
  await Promise.all(Array.from({ length: size }, async () => {
    while (q.length) { const [i, it] = q.shift(); await fn(it, i); }
  }));
}

(async () => {
  const spr = await fetchIllusionistDeck({ maxLevel: 4 });
  const chars = await fetchCharacters();
  const now = await fetchLearnedWizardSpells(chars.find((c) => c.name.includes("Nowi")).id);
  const byName = new Map();
  for (const s of [...spr, ...now]) byName.set(englishName(s), s);
  const deck = [...byName.values()].sort((a, b) => a.level - b.level || englishName(a).localeCompare(englishName(b)));

  const results = new Array(deck.length);
  let done = 0;
  await pool(deck, 6, async (s, idx) => {
    const { rules, stats } = await getContent(s);
    const card = {
      name: englishName(s), name_en: s.name_en, name_de: s.name, school: schoolInfo(s.school).en,
      level: s.level, source_book: s.source_book, stats, rules,
      desc: (englishDescription(s) || "").replace(/\s+/g, " ").slice(0, 1400),
    };
    try {
      const a = await auditOne(card);
      results[idx] = { name: card.name, level: card.level, school: card.school, chars: rules.length, save_printed: stats.saving_throw, ...a };
    } catch (e) {
      results[idx] = { name: card.name, level: card.level, error: e.message.slice(0, 100) };
    }
    if (++done % 15 === 0 || done === deck.length) console.log(`  ${done}/${deck.length}`);
  });

  writeFileSync(join(HERE, "cache", "audit-v2.json"), JSON.stringify(results, null, 2));
  const flagged = results.filter((r) => r.severity && r.severity !== "ok");
  const major = results.filter((r) => r.severity === "major");
  const errs = results.filter((r) => r.error);
  console.log(`\nFertig: ${results.length} geprüft | ${flagged.length} mit Anmerkung | ${major.length} MAJOR | ${errs.length} Aufruf-Fehler`);
  console.log("\n=== MAJOR ===");
  for (const r of major) {
    const parts = ["name", "save", "rules", "stats", "complete", "dup"].filter((k) => r[k] && !r[k].ok).map((k) => `${k}: ${r[k].note}`);
    console.log(`\n• ${r.name} (L${r.level}) [save printed: ${r.save_printed}]\n  ${r.summary}\n  ${parts.join("\n  ")}`);
  }
})();
