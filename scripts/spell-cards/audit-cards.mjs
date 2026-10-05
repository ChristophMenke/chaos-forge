// Experten-Audit (AD&D 2e) je Karte: Name, Vollständigkeit, Stat-Doppelung.
// Opus 4.8, strukturierte Ausgabe. Ergebnis → cache/audit.json
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  fetchIllusionistDeck, fetchLearnedWizardSpells, fetchCharacters, englishName, schoolInfo,
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
  required: ["name_ok", "name_note", "complete_ok", "complete_note", "dup_ok", "dup_note", "severity"],
  properties: {
    name_ok: { type: "boolean" },
    name_note: { type: "string", description: "empty if ok, else the naming problem + correct name" },
    complete_ok: { type: "boolean" },
    complete_note: { type: "string", description: "empty if ok, else what essential mechanic is missing" },
    dup_ok: { type: "boolean" },
    dup_note: { type: "string", description: "empty if ok, else which stat-block field the text redundantly restates" },
    severity: { type: "string", enum: ["ok", "minor", "major"] },
  },
};

const SYS =
  "You are an Advanced Dungeons & Dragons 2nd Edition rules expert AND the product lead for a physical spell-card deck. " +
  "You review one printed spell card at a time and judge it strictly but fairly. The card prints a stat block " +
  "(casting time, range, duration, area of effect, saving throw, components) plus a rules text (hard-capped ~480 characters).\n\n" +
  "Judge exactly three things:\n" +
  "1. NAME — Is the printed name the correct canonical AD&D 2e spell name (PHB / official handbooks)? Flag misspellings, wrong roman numerals, non-English names, or an outright wrong name. If correct, name_ok=true.\n" +
  "2. COMPLETENESS — Does the rules text contain everything a player needs to RESOLVE the spell at the table: core effect, all damage/healing dice, per-level scaling, what a successful/failed save does, key conditions and their durations, and important limits? Because of the ~480-char cap, minor edge cases may be omitted — flag ONLY genuinely important missing mechanics. If good, complete_ok=true.\n" +
  "3. DUPLICATION — Does the rules text REDUNDANTLY restate a field already printed in the stat block (casting time, range, duration, area of effect, the components list V/S/M, or the saving-throw value)? Describing WHAT a save does is fine and expected; restating the components, the numeric range, the overall duration, or the area is duplication. If clean, dup_ok=true.\n\n" +
  "severity: 'ok' if all three pass; 'minor' for small issues; 'major' for a wrong name or a genuinely missing core mechanic. Keep notes short and specific. Empty string for a note when that check is ok.";

async function auditOne(card) {
  const res = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 900,
    system: SYS,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content:
      `PRINTED NAME: ${card.name}\nDB name_en: ${card.name_en || "(none)"}\nSchool: ${card.school} | Level: ${card.level} | Source: ${card.source_book}\n` +
      `STAT BLOCK — Casting Time: ${card.stats.casting_time} | Range: ${card.stats.range} | Duration: ${card.stats.duration} | Area: ${card.stats.area_of_effect} | Saving Throw: ${card.stats.saving_throw} | Components: ${(card.stats.components || []).join(", ")}\n` +
      `RULES TEXT: ${card.rules}` }],
  });
  return JSON.parse(res.content.find((b) => b.type === "text").text);
}

(async () => {
  const spr = await fetchIllusionistDeck({ maxLevel: 4 });
  const chars = await fetchCharacters();
  const nowi = chars.find((c) => c.name.includes("Nowi"));
  const now = await fetchLearnedWizardSpells(nowi.id);
  const byName = new Map();
  for (const s of [...spr, ...now]) byName.set(englishName(s), s);
  const deck = [...byName.values()].sort((a, b) => a.level - b.level || englishName(a).localeCompare(englishName(b)));

  const results = [];
  let i = 0;
  for (const s of deck) {
    const { rules, stats } = await getContent(s);
    const card = { name: englishName(s), name_en: s.name_en, school: schoolInfo(s.school).en, level: s.level, source_book: s.source_book, stats, rules };
    try {
      const a = await auditOne(card);
      results.push({ name: card.name, level: card.level, school: card.school, chars: rules.length, ...a });
    } catch (e) {
      results.push({ name: card.name, level: card.level, error: e.message.slice(0, 80) });
    }
    if (++i % 20 === 0) console.log(`  ${i}/${deck.length}`);
  }
  writeFileSync(join(HERE, "cache", "audit.json"), JSON.stringify(results, null, 2));
  const issues = results.filter((r) => r.severity && r.severity !== "ok");
  console.log(`\nFertig: ${results.length} geprüft, ${issues.length} mit Anmerkungen (${results.filter(r=>r.severity==='major').length} major).`);
})();
