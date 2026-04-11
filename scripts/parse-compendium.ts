/**
 * Compendium HTML → structured JSON parser.
 *
 * Reads monster stat-block HTML files extracted from the complete-compendium
 * project (see scripts/extract-compendium-snapshot.ts) and produces a
 * deterministic JSON representation suitable for the Chaos Forge `monsters`
 * table schema.
 *
 * Key behaviours:
 * - Stat-block fields come from the <table><tr><th>Label:</th><td>Value</td></tr>
 *   rows in the HTML.
 * - Narrative sections (intro, Combat, Habitat/Society, Ecology) are extracted
 *   from <p class="f"><b>SectionName:</b> …</p> paragraphs plus any following
 *   <p> elements without a new section header.
 * - Cross-reference <a> links are flattened to their text content.
 * - All narrative text is piped through `convertImperialText()` so the final
 *   DB representation is fully metric (honours the project-wide "metrisch
 *   überall" rule).
 * - `magic_resistance` is cast to an integer percentage (Nil → 0).
 * - `source_book` resolves the first matching TSR product ID via `all_tsr.json`;
 *   Monstrous Manual (2140) takes precedence over the older compendia.
 *
 * Run:  npx tsx scripts/parse-compendium.ts
 * Test: npm test -- parse-compendium
 */

import { JSDOM } from "jsdom";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { convertImperialText } from "../src/lib/utils/units";
import { parseHitDiceValue } from "../src/lib/utils/hit-dice";

// ─── Types ────────────────────────────────────────────────────────────

export interface ParsedMonster {
  monster_key: string;
  name: string; // placeholder = name_en until translation phase
  name_en: string;

  // Fluff
  climate_terrain: string | null;
  frequency: string | null;
  organization: string | null;
  activity_cycle: string | null;
  diet: string | null;
  intelligence: string | null;
  treasure: string | null;
  alignment: string | null;
  no_appearing: string | null;

  // Combat
  ac: number;
  movement: string;
  hit_dice: string;
  hit_dice_value: number;
  thac0: number;
  attacks_per_round: string;
  damage: string;
  special_attacks: string | null;
  special_defenses: string | null;
  magic_resistance: number;
  size: "T" | "S" | "M" | "L" | "H" | "G";
  morale: string;
  morale_value: number;
  xp_value: number;

  // Narrative
  intro_text: string | null;
  combat_tactics: string | null;
  habitat_society: string | null;
  ecology: string | null;

  // Metadata
  source_book: string;
  tsr_codes: string[];
}

interface TsrLookupEntry {
  title: string;
  year?: string;
  author?: string;
  setting?: string;
}
type TsrLookup = Record<string, TsrLookupEntry>;

// ─── Helpers ──────────────────────────────────────────────────────────

const VALID_SIZES = new Set(["T", "S", "M", "L", "H", "G"]);

/** Minimal HTML-entity decoder for the handful that appear in the compendium. */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/** Strip all HTML tags from a string and decode basic entities. Lightweight —
 *  used inside the per-row loop instead of spinning up one JSDOM per cell. */
function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

/** Replace <a> links with their text, drop <b> tags, collapse whitespace. */
function stripTags(el: Element): string {
  const clone = el.cloneNode(true) as Element;
  clone.querySelectorAll("a").forEach((a) => {
    const text = a.textContent ?? "";
    a.replaceWith(text);
  });
  // Remove section-header bold labels (e.g. "<b>Combat:</b>")
  clone.querySelectorAll("b").forEach((b) => b.remove());
  return (clone.textContent ?? "").replace(/\s+/g, " ").trim();
}

function firstInteger(text: string): number {
  const match = text.match(/-?\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function parseMagicResistance(raw: string): number {
  if (!raw) return 0;
  if (/nil/i.test(raw)) return 0;
  const match = raw.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function parseSizeCategory(raw: string): "T" | "S" | "M" | "L" | "H" | "G" {
  // Accept "M", "M (5-7' tall)", "medium" etc. Take the first capital letter
  // that is a valid size code.
  for (const ch of raw) {
    if (VALID_SIZES.has(ch)) return ch as "T" | "S" | "M" | "L" | "H" | "G";
  }
  // Fallback based on prose
  const lower = raw.toLowerCase();
  if (lower.startsWith("tiny")) return "T";
  if (lower.startsWith("small")) return "S";
  if (lower.startsWith("medium")) return "M";
  if (lower.startsWith("large")) return "L";
  if (lower.startsWith("huge")) return "H";
  if (lower.startsWith("gargant")) return "G";
  return "M";
}

/** Lowercase normalised label → canonical key. */
const STAT_FIELD_MAP: Record<string, string> = {
  "climate/terrain": "climate_terrain",
  frequency: "frequency",
  organization: "organization",
  "activity cycle": "activity_cycle",
  diet: "diet",
  intelligence: "intelligence",
  treasure: "treasure",
  alignment: "alignment",
  "no. appearing": "no_appearing",
  "armor class": "armor_class",
  movement: "movement",
  "hit dice": "hit_dice",
  thac0: "thac0",
  "no. of attacks": "attacks_per_round",
  "damage/attack": "damage",
  "special attacks": "special_attacks",
  "special defenses": "special_defenses",
  "magic resistance": "magic_resistance",
  size: "size",
  morale: "morale",
  "xp value": "xp_value",
};

// ─── Core parse ────────────────────────────────────────────────────────

export function parseMonsterHtml(html: string, monsterKey: string): ParsedMonster {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // 1. Name
  const name_en = doc.querySelector("h1")?.textContent?.trim() ?? monsterKey;

  // 2. TSR codes
  const tsrP = doc.querySelector("p.tsr");
  const tsr_codes = tsrP
    ? (tsrP.textContent ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // 3. Stat-block table
  const rawStats: Record<string, string> = {};
  const rawSizeCell: { value: string } = { value: "" };
  doc.querySelectorAll("table tr").forEach((row) => {
    const th = row.querySelector("th");
    const td = row.querySelector("td");
    if (!th || !td) return;
    const label = (th.textContent ?? "").replace(/:$/, "").trim().toLowerCase();
    const key = STAT_FIELD_MAP[label];
    if (!key) return;
    // Keep first-line value for multi-row cells ("2 HD: 19<br>3-4 HD: 17")
    // via innerHTML + <br> split. Use lightweight regex stripping — creating
    // a new JSDOM per cell would balloon memory on the full 235-monster run.
    const firstLine = td.innerHTML.split(/<br\s*\/?\s*>/i)[0] ?? "";
    const plain = stripHtml(firstLine);
    rawStats[key] = plain;
    if (key === "size") rawSizeCell.value = (td.textContent ?? "").trim();
  });

  const hit_dice = rawStats["hit_dice"] ?? "1";
  const sizeCategory = parseSizeCategory(rawStats["size"] ?? "M");

  // 4. Narrative sections
  const sections = {
    intro: [] as string[],
    combat: [] as string[],
    habitat: [] as string[],
    ecology: [] as string[],
  };
  let currentSection: keyof typeof sections = "intro";

  // Only paragraphs inside <body> that are NOT `p.nav` or `p.tsr`.
  // `body p` already covers all descendants — `body > p` is redundant.
  const paragraphs = Array.from(doc.querySelectorAll("body p")).filter(
    (p) => !p.classList.contains("nav") && !p.classList.contains("tsr")
  );

  for (const p of paragraphs) {
    const bold = p.querySelector("b");
    const boldText = bold?.textContent?.trim().replace(/:$/, "").toLowerCase() ?? "";

    if (boldText.startsWith("combat")) {
      currentSection = "combat";
    } else if (boldText.startsWith("habitat")) {
      currentSection = "habitat";
    } else if (boldText.startsWith("ecology")) {
      currentSection = "ecology";
    }

    const text = stripTags(p);
    if (text) sections[currentSection].push(text);
  }

  // 5. Append size-cell detail (e.g. "M (5-7' tall)") to the intro so the
  //    height/weight information survives the size → category extraction.
  const sizeDetail = rawSizeCell.value.replace(/^.\s*/, "").trim(); // strip the lead category char
  if (sizeDetail) {
    sections.intro.push(sizeDetail);
  }

  const intro_text = sections.intro.length
    ? convertImperialText(sections.intro.join("\n\n"))
    : null;
  const combat_tactics = sections.combat.length
    ? convertImperialText(sections.combat.join("\n\n"))
    : null;
  const habitat_society = sections.habitat.length
    ? convertImperialText(sections.habitat.join("\n\n"))
    : null;
  const ecology = sections.ecology.length
    ? convertImperialText(sections.ecology.join("\n\n"))
    : null;

  return {
    monster_key: monsterKey,
    name: name_en, // placeholder before translation
    name_en,
    climate_terrain: rawStats["climate_terrain"] || null,
    frequency: rawStats["frequency"] || null,
    organization: rawStats["organization"] || null,
    activity_cycle: rawStats["activity_cycle"] || null,
    diet: rawStats["diet"] || null,
    intelligence: rawStats["intelligence"] || null,
    treasure: rawStats["treasure"] || null,
    alignment: rawStats["alignment"] || null,
    no_appearing: rawStats["no_appearing"] || null,
    // `armor_class` may be absent (reference articles). Only fall back to 10
    // when the field is missing — AC 0 and negative values are valid in AD&D
    // and must not be coerced to 10 by the `|| 10` falsy-check.
    ac: rawStats["armor_class"] !== undefined ? firstInteger(rawStats["armor_class"]) : 10,
    movement: rawStats["movement"] || "",
    hit_dice,
    hit_dice_value: parseHitDiceValue(hit_dice),
    thac0: firstInteger(rawStats["thac0"] ?? "20") || 20,
    attacks_per_round: rawStats["attacks_per_round"] || "1",
    damage: rawStats["damage"] || "",
    special_attacks: rawStats["special_attacks"] || null,
    special_defenses: rawStats["special_defenses"] || null,
    magic_resistance: parseMagicResistance(rawStats["magic_resistance"] ?? ""),
    size: sizeCategory,
    morale: rawStats["morale"] || "",
    morale_value: firstInteger(rawStats["morale"] ?? "10") || 10,
    xp_value: firstInteger(rawStats["xp_value"] ?? "0"),
    intro_text,
    combat_tactics,
    habitat_society,
    ecology,
    source_book: "Unknown", // resolved later in the CLI runner
    tsr_codes,
  };
}

// ─── Source book resolver ──────────────────────────────────────────────

export function resolveSourceBook(tsrCodes: string[], lookup: TsrLookup): string {
  // Monstrous Manual takes precedence — it's the canonical compilation.
  if (tsrCodes.includes("2140")) return "Monstrous Manual";
  for (const code of tsrCodes) {
    if (lookup[code]) return lookup[code].title;
  }
  return "Unknown";
}

// ─── CLI runner ────────────────────────────────────────────────────────

function runCli(): void {
  const snapshotDir = path.resolve(__dirname, "..", "ressources", "compendium-snapshot");
  const mmDir = path.join(snapshotDir, "mm");
  const lookupPath = path.join(snapshotDir, "all_tsr.json");
  const outputPath = path.join(snapshotDir, "parsed.json");

  const lookup: TsrLookup = JSON.parse(readFileSync(lookupPath, "utf-8"));
  const files = readdirSync(mmDir).filter((f) => f.endsWith(".html"));

  console.log(`Parsing ${files.length} monster HTML files...`);

  const monsters: ParsedMonster[] = [];
  const failures: string[] = [];

  for (const file of files) {
    const key = file.replace(/\.html$/, "");
    try {
      const html = readFileSync(path.join(mmDir, file), "utf-8");
      const parsed = parseMonsterHtml(html, key);
      parsed.source_book = resolveSourceBook(parsed.tsr_codes, lookup);
      monsters.push(parsed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [FAIL] ${file}: ${msg}`);
      failures.push(key);
    }
  }

  writeFileSync(outputPath, JSON.stringify(monsters, null, 2), "utf-8");
  console.log(`\n✓ Parsed ${monsters.length} monsters → ${outputPath}`);
  if (failures.length) {
    console.log(`✗ ${failures.length} failures: ${failures.slice(0, 10).join(", ")}`);
  }

  // Sanity summary
  const withIntro = monsters.filter((m) => m.intro_text).length;
  const withCombat = monsters.filter((m) => m.combat_tactics).length;
  const withHabitat = monsters.filter((m) => m.habitat_society).length;
  const withEcology = monsters.filter((m) => m.ecology).length;
  console.log(
    `  Narrative coverage: intro=${withIntro}, combat=${withCombat}, habitat=${withHabitat}, ecology=${withEcology}`
  );
}

// Only run when invoked as a script, not when imported by tests.
const isCli = typeof require !== "undefined" && require.main === module;
if (isCli) {
  runCli();
}
