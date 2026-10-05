// Shared helpers für die Zauberkarten-Pipeline (nicht committed).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

// ── ENV / Supabase ──────────────────────────────────────────────────────────
function loadEnv() {
  const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
  return Object.fromEntries(
    raw
      .split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
}

export function supa() {
  const env = loadEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

// ── Metrische Konvertierung (1:1 aus src/lib/utils/units.ts) ─────────────────
function formatMetric(value) {
  const s = value.toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}
export function convertImperialText(text) {
  if (!text) return text;
  let result = text;
  // Flächen ("200 sq. ft.") zuerst — Wortstellung trennt sie von Kantenlängen
  // ("10-ft square" = 10 Fuß je Seite), siehe src/lib/utils/units.ts.
  result = result.replace(/(\d+(?:[.,]\d+)?)\s*(?:sq[.,]?|square|Quadrat-?)\s*(?:feet|foot|ft\.?|Fuß)/gi, (_, n) => `${formatMetric(parseFloat(n) * 0.0929)} m²`);
  result = result.replace(/(\d+(?:[.,]\d+)?)\s*(?:sq[.,]?|square|Quadrat-?)\s*(?:yards?|yds?\.?)/gi, (_, n) => `${formatMetric(parseFloat(n) * 0.8361)} m²`);
  result = result.replace(/(\d+(?:[.,]\d+)?)-(?:yards?|yds?\.?)/gi, (_, n) => `${formatMetric(parseFloat(n) * 0.9144)}-Meter`);
  result = result.replace(/(\d+(?:[.,]\d+)?)-(?:feet|foot|ft\.?|Fuß)/gi, (_, n) => `${formatMetric(parseFloat(n) * 0.3048)}-Meter`);
  result = result.replace(/(\d+(?:[.,]\d+)?)-(\d+(?:[.,]\d+)?)\s*(?:miles?|Meilen?)/gi, (_, a, b) => `${formatMetric(parseFloat(a) * 1.6093)}-${formatMetric(parseFloat(b) * 1.6093)} km`);
  result = result.replace(/(\d+(?:[.,]\d+)?)-(\d+(?:[.,]\d+)?)\s*(?:yards?|yds?\.?)/gi, (_, a, b) => `${formatMetric(parseFloat(a) * 0.9144)}-${formatMetric(parseFloat(b) * 0.9144)} m`);
  result = result.replace(/(\d+(?:[.,]\d+)?)-(\d+(?:[.,]\d+)?)\s*(?:feet|foot|ft\.?|Fuß)/gi, (_, a, b) => `${formatMetric(parseFloat(a) * 0.3048)}-${formatMetric(parseFloat(b) * 0.3048)} m`);
  result = result.replace(/(\d+(?:[.,]\d+)?)-(\d+(?:[.,]\d+)?)\s*(?:lbs?\.?|pounds?)/gi, (_, a, b) => `${formatMetric(parseFloat(a) * 0.4536)}-${formatMetric(parseFloat(b) * 0.4536)} kg`);
  result = result.replace(/(\d+(?:[.,]\d+)?)-(\d+(?:[.,]\d+)?)\s*(?:inches?|Zoll)/gi, (_, a, b) => `${formatMetric(parseFloat(a) * 2.54)}-${formatMetric(parseFloat(b) * 2.54)} cm`);
  result = result.replace(/(\d+(?:[.,]\d+)?)\s*(?:miles?|Meilen?)/gi, (_, n) => `${formatMetric(parseFloat(n) * 1.6093)} km`);
  result = result.replace(/(\d+(?:[.,]\d+)?)\s*(?:yards?|yds?\.?)/gi, (_, n) => `${formatMetric(parseFloat(n) * 0.9144)} m`);
  result = result.replace(/(\d+(?:[.,]\d+)?)\s*(?:feet|foot|ft\.?|Fuß)/gi, (_, n) => `${formatMetric(parseFloat(n) * 0.3048)} m`);
  result = result.replace(/(\d+(?:[.,]\d+)?)\s*(?:lbs?\.?|pounds?)/gi, (_, n) => `${formatMetric(parseFloat(n) * 0.4536)} kg`);
  result = result.replace(/(\d+(?:[.,]\d+)?)\s*(?:inches?|Zoll)/gi, (_, n) => `${formatMetric(parseFloat(n) * 2.54)} cm`);
  return result;
}

// ── Illusionist-Regeln ───────────────────────────────────────────────────────
// aus src/lib/rules/magic.ts SPECIALISTS
export const ILLUSIONIST_OPPOSITION = new Set(["necromancy", "invocation", "abjuration"]);

// ── Schulen: EN-Label + Akzentfarbe (Chaos-Forge Wizard-Teal als Grundton) ───
// Karten sind einheitlich Englisch (Wunsch: AD&D-2e-konforme Terminologie).
export const SCHOOLS = {
  illusion: { en: "Illusion", accent: "#b57bff", accent2: "#7c3aed" },
  alteration: { en: "Alteration", accent: "#2dd4bf", accent2: "#0d9488" },
  conjuration: { en: "Conjuration / Summoning", accent: "#818cf8", accent2: "#4f46e5" },
  divination: { en: "Divination", accent: "#38bdf8", accent2: "#0284c7" },
  enchantment: { en: "Enchantment / Charm", accent: "#fb7185", accent2: "#be123c" },
  // Oppositionsschulen (nicht im Deck, aber Fallback-Farben):
  necromancy: { en: "Necromancy", accent: "#a3a3a3", accent2: "#525252" },
  invocation: { en: "Invocation / Evocation", accent: "#f59e0b", accent2: "#b45309" },
  abjuration: { en: "Abjuration", accent: "#94a3b8", accent2: "#475569" },
};
export function schoolInfo(school) {
  return SCHOOLS[school] || { en: "Universal", accent: "#d4b483", accent2: "#a1782f" };
}

// ── Feld-Werte (Englisch, AD&D 2e Notation) ──────────────────────────────────
export function localizeSave(raw) {
  const map = { Keine: "None", "Neg.": "Neg.", None: "None", Special: "Special", "½": "½" };
  return map[raw] ?? (raw?.trim() || "—");
}
export function componentsLong(list) {
  const map = { V: "V", S: "S", M: "M" };
  return (list || []).map((c) => map[c] || c);
}

// ── Kurzfelder DE→EN (range/duration/area_of_effect/casting_time) ────────────
// Die DB speichert diese Felder nur einmal (kein *_en); bei übersetzten Zaubern
// sind sie deutsch. Für einheitlich englische Karten hier normalisieren.
const FIELD_MAP = [
  [/Berührte\s+Kreatur/gi, "Creature touched"],
  [/\bBerührung\b/gi, "Touch"],
  [/\bBerühren\b/gi, "Touch"],
  [/\bKeine\b/gi, "None"],
  [/\bDauerhaft\b/gi, "Permanent"],
  [/\bBleibend\b/gi, "Permanent"],
  [/\bTage\b/g, "days"],
  [/\bTag\b/g, "day"],
  [/\bWochen\b/g, "weeks"],
  [/\bWoche\b/g, "week"],
  [/\bMinuten\b/g, "min."],
  [/\bMinute\b/g, "min."],
  [/\bSichtweite\b/gi, "line of sight"],
  // Deutsche AD&D-Konvention (DB seit 00223): Kampfrunde = round, Runde = turn.
  // Kampfrunde ZUERST (sonst würde "Runde" fälschlich greifen).
  [/\bKampfrunden\b/g, "rds."],
  [/\bKampfrunde\b/g, "rd."],
  [/\bRunden\b/g, "turns"],
  [/\bRunde\b/g, "turn"],
  [/\bStunden\b/g, "hrs."],
  [/\bStunde\b/g, "hr."],
  [/\bStufe\b/g, "level"],
  [/\bSofort\b/gi, "Instantaneous"],
  [/\bSpeziell\b/gi, "Special"],
  [/\bUnbegrenzt\b/gi, "Unlimited"],
  [/\bKegel\b/g, "cone"],
  [/\bWürfel\b/g, "cube"],
  [/\bQuadrat\b/g, "square"],
  [/\bDurchmesser\b/g, "diameter"],
  [/\bRadius\b/g, "radius"],
  [/\bPfad\b/g, "path"],
  [/\bKugel\b/g, "sphere"],
  [/\bKeil\b/g, "wedge"],
  [/\bKreaturen\b/g, "creatures"],
  [/\bKreatur\b/g, "creature"],
  [/\bObjekte\b/g, "objects"],
  [/\bObjekt\b/g, "object"],
  [/\bGegenstand\b/g, "object"],
  [/\bPersonen\b/g, "creatures"],
  [/\bPerson\b/g, "creature"],
  [/\bWaffe\b/g, "weapon"],
  [/\bBogen\b/g, "arc"],
  [/\bZauberer\b/g, "The caster"],
  [/\bqm\b/g, "sq. m"],
];
export function translateField(raw) {
  let t = (raw || "").trim();
  if (!t || t === "]" || t === "l") return "—"; // leer/OCR-Junk
  t = t.replace(/(\d),(\d)/g, "$1.$2"); // Dezimalkomma → Punkt
  for (const [re, to] of FIELD_MAP) t = t.replace(re, to);
  return t.replace(/\s{2,}/g, " ").trim();
}

// ── Englischer Name (AD&D-2e-konform) + Beschreibung ─────────────────────────
// Namens-Korrekturen: OCR-/Tippfehler UND fehlende englische Namen (name_en null
// → sonst fällt englishName auf den deutschen name zurück). Kanonische AD&D-2e-Namen.
const NAME_FIX = {
  "Monster Summoning IIT": "Monster Summoning III",
  "Change self": "Change Self",
  Schlaf: "Sleep",
  Klopfen: "Knock",
  "Magisches Geschoss": "Magic Missile",
  Feuerball: "Fireball",
  "Monsterbeschwörung I": "Monster Summoning I",
  "Monsterbeschwörung II": "Monster Summoning II",
  Laughter: "Tasha's Hideous Laughter", // Kanon-Name (PHB); Kurzform
};
export function englishName(spell) {
  const n = ((spell.name_en && spell.name_en.trim()) || spell.name || "").trim();
  return NAME_FIX[n] || n;
}

// Level-Korrekturen für DB-Datenfehler (kanonische AD&D-2e-Grade), keyed by db-name.
const LEVEL_FIX = {
  "Monster Summoning IIT": 5, // Monster Summoning III ist Grad 5, nicht 4
};
export function applyCorrections(s) {
  const lv = LEVEL_FIX[(s.name || "").trim()];
  return lv ? { ...s, level: lv } : s;
}

// Dubletten nach englischem Namen entfernen (z.B. DB-Zeilen "Schlaf" + "Sleep").
// Behält die Zeile mit gesetztem name_en (sauberere Daten).
export function dedupeByEnglishName(list) {
  const best = new Map();
  for (const s of list) {
    const k = englishName(s);
    const cur = best.get(k);
    if (!cur || (!cur.name_en && s.name_en)) best.set(k, s);
  }
  return [...best.values()];
}

// OCR-Bereinigung: Silbentrennung zusammenführen, eingestreute Seitenzahlen/
// Running-Header entfernen ("825 ~ Sleep"), Leerraum normalisieren.
export function cleanOcr(text) {
  if (!text) return text;
  let t = text;
  // Running-Header/Seitenzahlen "823 ~ Title" bzw. "4 799 ~ Shadow Play"
  t = t.replace(/\b\d{1,3}(?:\s\d{3})?\s*~\s*(?:[A-Z][\w''-]*\s*){0,3}/g, " ");
  t = t.replace(/(?:[A-Z][\w''-]*\s+){0,3}~\s*\d{1,4}\b/g, " ");
  // Silbentrennung am Zeilenende: "compo- nent" → "component"
  t = t.replace(/([A-Za-z])-\s+([a-z])/g, "$1$2");
  // Aufräumen — NICHT vor Punkt (würde Dezimalzahlen "by .2" zerstören),
  // nur vor Komma/Semikolon/Doppelpunkt.
  t = t.replace(/\s+([,;:])/g, "$1").replace(/[ \t]{2,}/g, " ").replace(/ +\n/g, "\n").trim();
  return t;
}

// Per-Spell-Overrides für echt korrupte DB-Texte (aus PHB-OCR `ressources/books/
// Players Handbook.txt` rekonstruiert). Wert = String (Volltext-Ersatz) oder
// Funktion (gezielte Reparatur am DB-Text).
const DESC_OVERRIDES = {
  // Ende war abgeschnitten ("...a total of 4 799 ~ Shadow Play , ... is in...").
  "Shadow Monsters": (d) =>
    d.replace(
      /Thus,?\s*if the attacks score[\s\S]*$/i,
      "Thus if the attacks score 4, 2, and 11 points, then a total of 4 points of damage is inflicted (4 × .2 = .8 [rounded to 1], 2 × .2 = .4 [rounded to 1], 11 × .2 = 2.2 [rounded to 2]. The sum is 1+1+2 = 4)."
    ),
  // DB-Text hatte Spalten-Bleed ("42+ %+%+2", "creaof Horror = tures", "s/eep").
  Sleep:
    "When a wizard casts a sleep spell, he causes a comatose slumber to come upon one or more creatures (other than undead and certain other creatures specifically excluded from the spell's effects). All creatures to be affected by the sleep spell must be within 9.1 m of each other. The number of creatures that can be affected is a function of Hit Dice or levels. The spell affects 2d4 Hit Dice of monsters. Monsters with 4+3 Hit Dice (4 Hit Dice plus 3 hit points) or more are unaffected. The center of the area of effect is determined by the spellcaster. The creatures with the least Hit Dice are affected first, and partial effects are ignored.\n\nFor example, a wizard casts sleep at three kobolds, two gnolls, and an ogre. The roll (2d4) result is 4. All the kobolds and one gnoll are affected (1/2 + 1/2 + 1/2 + 2 = 3 1/2 Hit Dice). Note that the remainder is not enough to affect the last gnoll or the ogre.\n\nSlapping or wounding awakens affected creatures but normal noise does not. Awakening requires one entire round. Magically sleeping opponents can be attacked with substantial bonuses (see Combat, page 90).\n\nThe material component for this spell is a pinch of fine sand, rose petals, or a live cricket.",
};

export function englishDescription(spell) {
  // Bevorzugt das kuratierte (saubere) description_en-Feld …
  let src =
    spell.description_en && spell.description_en.trim() && !/[äöüß]/.test(spell.description_en)
      ? spell.description_en
      : spell.description; // … sonst das (englische) OCR-description-Feld
  const ov = DESC_OVERRIDES[englishName(spell)];
  if (typeof ov === "function") src = ov(src);
  else if (typeof ov === "string") src = ov;
  return cleanOcr(src);
}

// ── Deck-Definition: Sprockets Illusionisten-Repertoire ──────────────────────
// korrupte DB-Zeilen aussortieren: Namen, die mit Nicht-Buchstaben beginnen
// (_, ', () sowie Klammer-/Schul-Fragmente und OCR-Reste.
function isJunkName(name) {
  const n = (name || "").trim();
  return (
    !/^[A-Za-zÀ-ÿ]/.test(n) || // beginnt nicht mit Buchstabe
    /All Schools|ilusion|Evocation\)|^Cantrip$/i.test(n) ||
    n.length < 3
  );
}

export async function fetchIllusionistDeck({ maxLevel = 4 } = {}) {
  const sb = supa();
  const { data, error } = await sb
    .from("spells")
    .select("*")
    .eq("spell_type", "wizard")
    .eq("source_book", "Players Handbook")
    .gte("level", 1)
    .lte("level", maxLevel);
  if (error) throw error;
  const filtered = data
    .map(applyCorrections) // Level-Datenfehler korrigieren (z.B. Monster Summoning III → 5)
    .filter((s) => s.level >= 1 && s.level <= maxLevel) // nach Korrektur erneut filtern
    .filter((s) => s.school && !ILLUSIONIST_OPPOSITION.has(s.school)) // erlaubte Schulen
    .filter((s) => !isJunkName(s.name));
  return dedupeByEnglishName(filtered).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "de"));
}

// ── Charaktere & gelernte Zauber ─────────────────────────────────────────────
export async function fetchCharacters() {
  const sb = supa();
  const { data } = await sb.from("characters").select("id,name,class_id,avatar_url,is_active,player_name");
  return data || [];
}

// Einzelne Spell-IDs, die trotz generischem Junk-Namen (z. B. "Cantrip") echte,
// korrekt angelegte custom Zauber sind — nicht OCR-Müll aus dem Compendium-Import.
const JUNK_NAME_ALLOWLIST = new Set([
  "d5002d56-d334-44a5-8637-e4d0ceb62e7e", // Nowi: "Cantrip" (PHB, is_custom, korrekt befüllt)
]);

// Alle vom Charakter gelernten Magierzauber (dedupliziert, sortiert), Junk raus.
// preparedOnly: nur aktuell aktive/vorbereitete Zauber (character_spells.prepared = true).
export async function fetchLearnedWizardSpells(characterId, { preparedOnly = false } = {}) {
  const sb = supa();
  const { data } = await sb
    .from("character_spells")
    .select("spell_id, prepared, spells(*)")
    .eq("character_id", characterId);
  const seen = new Set();
  const rows = (data || [])
    .filter((r) => !preparedOnly || r.prepared)
    .map((r) => r.spells)
    .filter((s) => s && s.spell_type === "wizard" && s.school && (JUNK_NAME_ALLOWLIST.has(s.id) || !isJunkName(s.name)))
    .map(applyCorrections) // Level-Datenfehler korrigieren
    .filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
  return dedupeByEnglishName(rows).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "de"));
}

// ── Utility ──────────────────────────────────────────────────────────────────
export function slug(name) {
  return name
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function fontFaceCss() {
  const fonts = JSON.parse(readFileSync(join(HERE, "fonts", "fonts.json"), "utf8"));
  const face = (fam, key, weight, style) =>
    fonts[key]
      ? `@font-face{font-family:'${fam}';font-style:${style};font-weight:${weight};src:url(data:font/ttf;base64,${fonts[key]}) format('truetype');}`
      : "";
  return [
    face("Cinzel", "Cinzel|700|normal", 700, "normal"),
    face("Cinzel", "Cinzel|600|normal", 600, "normal"),
    face("EB Garamond", "EB Garamond|400|normal", 400, "normal"),
    face("EB Garamond", "EB Garamond|500|normal", 500, "normal"),
    face("EB Garamond", "EB Garamond|400|italic", 400, "italic"),
  ].join("\n");
}

export function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
