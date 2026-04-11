/**
 * Translate parsed Monster-Manual narrative sections from English to German.
 *
 * Input:  ressources/compendium-snapshot/parsed.json  (produced by parse-compendium.ts)
 * Output: ressources/compendium-snapshot/translated.json
 *
 * Uses Claude Sonnet 4 with an AD&D-specific German glossary so that
 * well-known terminology (Trefferwürfel, ETW0, Rettungswurf, Heimtücke,
 * Untote vertreiben, …) is rendered consistently. Enforces metric units
 * throughout as a defence-in-depth layer on top of the parser's conversion.
 *
 * Idempotent: a sha256 hash of the source sections is stored per monster;
 * re-running the script skips entries whose hash is unchanged.
 *
 * Run: npx tsx scripts/translate-monster-narrative.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import type { ParsedMonster } from "./parse-compendium";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

// ─── Glossar ──────────────────────────────────────────────────────────

export const ADND_GLOSSARY: ReadonlyArray<{ en: string; de: string }> = [
  { en: "Hit Dice (HD)", de: "Trefferwürfel (TW)" },
  { en: "Armor Class (AC)", de: "Rüstungsklasse (RK)" },
  { en: "THAC0", de: "ETW0" },
  { en: "Saving Throw", de: "Rettungswurf" },
  { en: "Backstab", de: "Heimtücke" },
  { en: "Turn Undead", de: "Untote vertreiben" },
  { en: "Magic Resistance", de: "Magieresistenz" },
  { en: "Morale", de: "Moral" },
  { en: "Alignment", de: "Gesinnung" },
  { en: "Lawful Good", de: "rechtschaffen gut" },
  { en: "Chaotic Evil", de: "chaotisch böse" },
  { en: "Chaotic Good", de: "chaotisch gut" },
  { en: "Lawful Evil", de: "rechtschaffen böse" },
  { en: "Neutral Good", de: "neutral gut" },
  { en: "Neutral Evil", de: "neutral böse" },
  { en: "True Neutral / Neutral", de: "neutral" },
  { en: "Intelligence", de: "Intelligenz" },
  { en: "Wisdom", de: "Weisheit" },
  { en: "Strength", de: "Stärke" },
  { en: "Dexterity", de: "Geschicklichkeit" },
  { en: "Constitution", de: "Konstitution" },
  { en: "Charisma", de: "Charisma" },
  { en: "Cleric", de: "Priester" },
  { en: "Fighter", de: "Kämpfer" },
  { en: "Mage / Wizard", de: "Magier" },
  { en: "Thief", de: "Dieb" },
  { en: "Ranger", de: "Waldläufer" },
  { en: "Paladin", de: "Paladin" },
  { en: "Druid", de: "Druide" },
  { en: "Bard", de: "Barde" },
  { en: "Monk", de: "Mönch" },
  { en: "level-drain / energy drain", de: "Stufenentzug" },
  { en: "petrification", de: "Versteinerung" },
  { en: "paralysis", de: "Lähmung" },
  { en: "poison", de: "Gift" },
  { en: "spell-like ability", de: "zauberähnliche Fähigkeit" },
  { en: "infravision", de: "Infrasicht" },
  { en: "lawful", de: "rechtschaffen" },
  { en: "chaotic", de: "chaotisch" },
  { en: "treasure hoard", de: "Schatzhort" },
  { en: "encounter", de: "Begegnung" },
  { en: "lair", de: "Bau / Hort" },
  { en: "surprise", de: "Überraschung" },
  { en: "demihuman", de: "Halbmensch (Elf, Zwerg, Halbling, Gnom)" },
  { en: "humanoid", de: "Humanoide(r)" },
  { en: "undead", de: "Untoter" },
  { en: "dragon", de: "Drache" },
  { en: "giant", de: "Riese" },
  { en: "goblinoid", de: "Goblinoide" },
];

export const SYSTEM_PROMPT = `Du bist ein präziser Fachübersetzer für Advanced Dungeons & Dragons 2nd Edition Regelwerks- und Kreaturentexte vom Englischen ins Deutsche.

STRIKTE REGELN:
1. Übersetze NUR, was im Eingabetext steht. Erfinde keine Regeln, Werte oder Details. Kürze nichts weg.
2. Nutze ausschließlich metrische Einheiten (m, km, kg, cm). Wandle imperiale Werte um, falls welche im Text stehen — auch ausgeschriebene Zahlen wie "two feet" → "0,6 m" oder "ten pounds" → "4,5 kg".
3. Fachterminologie folgt diesem Glossar (links Englisch, rechts Deutsch):
${ADND_GLOSSARY.map((g) => `   - ${g.en} → ${g.de}`).join("\n")}
4. Monster-Namen: Etablierte deutsche Entsprechungen verwenden ("White Dragon" → "Weißer Drache", "Goblin" → "Goblin", "Kobold" → "Kobold"). Bei unklaren Namen das englische Original beibehalten.
5. Schreibstil: sachlich, flüssig, keine Ironisierung, keine Abschwächungen. Die düstere AD&D-Atmosphäre beibehalten.
6. Antwortformat strikt einhalten — siehe User-Prompt.
7. Keine Markdown-Formatierung in den Sektionstexten, kein Code, keine Anführungszeichen um den Output.`;

// ─── Types ────────────────────────────────────────────────────────────

interface TranslationRecord {
  monster_key: string;
  /** sha256 (truncated) over the concatenated EN source sections. */
  hash: string;
  name: string;
  intro_text: string | null;
  combat_tactics: string | null;
  habitat_society: string | null;
  ecology: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function hashSections(m: ParsedMonster): string {
  const payload = [
    m.name_en,
    m.intro_text ?? "",
    m.combat_tactics ?? "",
    m.habitat_society ?? "",
    m.ecology ?? "",
  ].join("||");
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

/** Extract a labelled block from a key:VALUE response body. */
function extractSection(text: string, label: string): string | null {
  // Match "LABEL:" at start of line, capture until the next LABEL: or end.
  const re = new RegExp(
    `^${label}:\\s*\\n?([\\s\\S]*?)(?=\\n(?:NAME|INTRO|COMBAT|HABITAT|ECOLOGY):|$)`,
    "m"
  );
  const match = text.match(re);
  if (!match) return null;
  const content = match[1].trim();
  return content.length > 0 ? content : null;
}

function buildUserPrompt(m: ParsedMonster): string {
  const parts = [
    `MONSTER NAME: ${m.name_en}`,
    "",
    "Übersetze die folgenden Sektionen ins Deutsche. Leere Sektionen überspringst du im Output.",
    "",
    "ANTWORTFORMAT — exakt so, mit den Labels in Großbuchstaben gefolgt von Doppelpunkt:",
    "",
    "NAME:",
    "<deutsche Entsprechung des Monster-Namens, oder Original wenn etabliert>",
    "",
    "INTRO:",
    "<Übersetzung oder leer wenn Quelle leer>",
    "",
    "COMBAT:",
    "<Übersetzung oder leer wenn Quelle leer>",
    "",
    "HABITAT:",
    "<Übersetzung oder leer wenn Quelle leer>",
    "",
    "ECOLOGY:",
    "<Übersetzung oder leer wenn Quelle leer>",
    "",
    "────────  QUELLTEXT  ────────",
    "",
    `INTRO (EN):\n${m.intro_text ?? "(leer)"}`,
    "",
    `COMBAT (EN):\n${m.combat_tactics ?? "(leer)"}`,
    "",
    `HABITAT/SOCIETY (EN):\n${m.habitat_society ?? "(leer)"}`,
    "",
    `ECOLOGY (EN):\n${m.ecology ?? "(leer)"}`,
  ];
  return parts.join("\n");
}

async function translateMonster(
  client: Anthropic,
  m: ParsedMonster
): Promise<TranslationRecord | null> {
  // Defence in depth: Promise.race with a wall-clock timeout. The SDK's
  // internal abort/timeout handling has been observed to silently hang on
  // long responses (vampire0, sirine), so we guarantee termination.
  const apiCall = client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(m) }],
  });
  const timeoutError = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("timeout after 120s")), 120_000)
  );
  const response = await Promise.race([apiCall, timeoutError]);

  if (response.stop_reason === "max_tokens") {
    console.warn(`  [WARN] ${m.monster_key}: max_tokens reached, translation may be truncated`);
  }

  const text = response.content[0]?.type === "text" ? response.content[0].text : "";
  if (!text) return null;

  const name = extractSection(text, "NAME") ?? m.name_en;
  const intro_text = m.intro_text ? extractSection(text, "INTRO") : null;
  const combat_tactics = m.combat_tactics ? extractSection(text, "COMBAT") : null;
  const habitat_society = m.habitat_society ? extractSection(text, "HABITAT") : null;
  const ecology = m.ecology ? extractSection(text, "ECOLOGY") : null;

  return {
    monster_key: m.monster_key,
    hash: hashSections(m),
    name,
    intro_text,
    combat_tactics,
    habitat_society,
    ecology,
  };
}

// ─── CLI runner ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY fehlt in .env.local");
    process.exit(1);
  }

  const snapshotDir = path.resolve(__dirname, "..", "ressources", "compendium-snapshot");
  const parsedPath = path.join(snapshotDir, "parsed.json");
  const outputPath = path.join(snapshotDir, "translated.json");

  const parsed: ParsedMonster[] = JSON.parse(readFileSync(parsedPath, "utf-8"));
  const existing: TranslationRecord[] = existsSync(outputPath)
    ? JSON.parse(readFileSync(outputPath, "utf-8"))
    : [];
  const existingByKey = new Map(existing.map((e) => [e.monster_key, e]));

  const client = new Anthropic({ apiKey });
  const results: TranslationRecord[] = [];
  let translated = 0;
  let cached = 0;
  let failed = 0;

  console.log(`Parser-Input: ${parsed.length} Monster`);
  console.log(`Bestehender Cache: ${existing.length}`);
  console.log("");

  for (let i = 0; i < parsed.length; i++) {
    const m = parsed[i];
    const hash = hashSections(m);
    const prev = existingByKey.get(m.monster_key);

    if (prev && prev.hash === hash) {
      results.push(prev);
      cached++;
      continue;
    }

    const progress = `[${i + 1}/${parsed.length}]`;
    process.stdout.write(`${progress} ${m.monster_key}... `);

    try {
      const record = await translateMonster(client, m);
      if (record) {
        results.push(record);
        translated++;
        process.stdout.write("OK\n");
      } else {
        failed++;
        process.stdout.write("EMPTY RESPONSE\n");
      }
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      process.stdout.write(`FAIL (${msg.slice(0, 80)})\n`);
      // On hard failure keep the previous cached entry if we have one so we
      // don't lose prior work
      if (prev) results.push(prev);
    }

    // Persist every successful translation immediately. Hanging requests
    // and restarts would otherwise lose 1-19 entries per incident.
    writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");

    // Rate-limit: keep well under tier-1 (60 RPM) to avoid 429s
    await new Promise((r) => setTimeout(r, 500));
  }

  writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");

  console.log("");
  console.log(`✓ Translated: ${translated} neu, ${cached} aus Cache, ${failed} fehlgeschlagen`);
  console.log(`✓ Output: ${outputPath}`);
}

const isCli = typeof require !== "undefined" && require.main === module;
if (isCli) {
  main().catch((err) => {
    console.error("Translation fehlgeschlagen:", err);
    process.exit(1);
  });
}
