/**
 * Matching- und Normalisierungs-Helfer für den Charakterbogen-Scan.
 *
 * Diese Funktionen wurden aus `src/app/characters/import/page.tsx` extrahiert,
 * wo sie inline in `handleCreate()` lagen und damit nicht testbar waren. Sie
 * werden vom Create-Import (Charakter anlegen) und vom Rescan (Charakter
 * aktualisieren) gemeinsam genutzt.
 *
 * Alle Funktionen sind rein: kein DB-Zugriff, kein Framework. Stammdaten
 * (Waffen, Rüstungen, NWPs, Zauber) werden als Parameter hereingereicht.
 */

/** Minimal-Shape für Stammdaten mit zweisprachigem Namen. */
interface NamedRow {
  id: string;
  name: string;
  name_en: string | null;
}

/** Zauber-Stammdaten brauchen zusätzlich die Stufe für ein eindeutiges Match. */
interface SpellRowLike extends NamedRow {
  level: number;
}

export const VALID_CLASS_IDS = [
  "fighter",
  "ranger",
  "paladin",
  "mage",
  "abjurer",
  "conjurer",
  "diviner",
  "enchanter",
  "illusionist",
  "invoker",
  "necromancer",
  "transmuter",
  "cleric",
  "druid",
  "thief",
  "bard",
] as const;

export const VALID_KIT_IDS = [
  "barbarian",
  "cavalier",
  "swashbuckler",
  "berserker",
  "gladiator",
  "myrmidon",
  "assassin",
  "bounty_hunter",
  "acrobat",
  "scout",
  "burglar",
  "spy",
  "witch",
  "militant_wizard",
  "savage_wizard",
  "academician",
  "fighting_monk",
  "pacifist_priest",
  "beastmaster",
  "blade",
] as const;

/**
 * Subrassen, die auf ihre Hauptrasse abgebildet werden. Die Vision-Extraktion
 * liefert gelegentlich "Stout Halfling" statt "halfling", weil es so auf dem
 * Bogen steht.
 */
export const RACE_ALIAS_MAP: Record<string, string> = {
  stout_halfling: "halfling",
  tallfellow_halfling: "halfling",
  hairfeet_halfling: "halfling",
  standard_half_elf: "half_elf",
  wood_elf: "elf",
  high_elf: "elf",
  grey_elf: "elf",
  wild_elf: "elf",
  hill_dwarf: "dwarf",
  mountain_dwarf: "dwarf",
  rock_gnome: "gnome",
  deep_gnome: "gnome",
};

/** Wortbestandteile, die für ein Token-Match zu kurz sind. */
const MIN_TOKEN_LENGTH = 3;

function tokenize(value: string): string[] {
  return value.split(/[\s,/]+/).filter((t) => t.length >= MIN_TOKEN_LENGTH);
}

/**
 * Prüft, ob ein Stammdaten-Name zu einem gescannten Namen passt.
 *
 * Zwei Regeln, in dieser Reihenfolge:
 *  1. Substring in eine der beiden Richtungen ("Sword" ↔ "long sword")
 *  2. Token-Match: jedes Wort des DB-Namens findet eine Entsprechung im
 *     gescannten Namen. Damit greift "Hand Axe" auch bei "Axe, hand/throwing".
 */
export function matchesName(dbName: string, scannedBaseName: string): boolean {
  const db = dbName.toLowerCase().trim();
  const scanned = scannedBaseName.toLowerCase().trim();
  if (!db || !scanned) return false;

  if (db.includes(scanned) || scanned.includes(db)) return true;

  const dbTokens = tokenize(db);
  const scannedTokens = tokenize(scanned);
  if (dbTokens.length === 0 || scannedTokens.length === 0) return false;

  return dbTokens.every((dt) => scannedTokens.some((st) => st.includes(dt) || dt.includes(st)));
}

/**
 * Zerlegt einen Gegenstandsnamen vom Bogen in Basisnamen und Menge.
 * "Arrow +1 x20" → { baseName: "arrow", quantity: 20 }
 */
export function parseItemName(rawName: string): { baseName: string; quantity: number } {
  const quantityMatch = rawName.match(/x(\d+)\s*$/i);
  const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;

  const baseName = rawName
    .replace(/\s*\+\d+/g, "")
    .replace(/\s*x\d+\s*$/i, "")
    .toLowerCase()
    .trim();

  return { baseName, quantity };
}

/**
 * Wandelt eine imperiale Höhenangabe in Zentimeter.
 * Erkennt "5'10"", "5'10", "5 ft 10 in" und "6 feet 2 inches".
 * Nicht interpretierbare Eingaben ergeben 0.
 */
export function parseImperialHeight(raw: string): number {
  if (!raw) return 0;

  const feetMatch = raw.match(/(\d+)\s*(?:'|ft\.?|feet)/i);
  if (feetMatch) {
    const feet = parseInt(feetMatch[1], 10) || 0;
    let inches = 0;
    const inchMatch = raw.match(/(\d+)\s*(?:"|''|in\.?|inches)/i);
    if (inchMatch) {
      inches = parseInt(inchMatch[1], 10) || 0;
    } else {
      // "5'10" — die Zoll stehen ohne Einheit direkt hinter der Fußangabe.
      const rest = raw.slice((feetMatch.index ?? 0) + feetMatch[0].length);
      const restNumber = rest.match(/(\d+)/);
      if (restNumber) inches = parseInt(restNumber[1], 10) || 0;
    }
    return (feet * 12 + inches) * 2.54;
  }

  // Ohne Einheiten: zwei Zahlen = Fuß + Zoll, eine Zahl = Fuß.
  const twoNumbers = raw.match(/(\d+)\D+(\d+)/);
  if (twoNumbers) {
    return (parseInt(twoNumbers[1], 10) * 12 + parseInt(twoNumbers[2], 10)) * 2.54;
  }
  const oneNumber = raw.match(/(\d+)/);
  if (oneNumber) return parseInt(oneNumber[1], 10) * 12 * 2.54;

  return 0;
}

/** Bildet eine gescannte Rassen-ID auf die in der DB geführte Hauptrasse ab. */
export function normalizeRaceId<T extends string | null>(raceId: T): T {
  if (!raceId) return raceId;
  return (RACE_ALIAS_MAP[raceId] ?? raceId) as T;
}

/**
 * Ordnet einen Fertigkeits-Eintrag wie "Fighting Style: Two Weapon" einem
 * der vier Kampfstile zu. Gibt null zurück, wenn keiner passt.
 */
export function resolveFightingStyleId(rawName: string): string | null {
  const name = rawName.toLowerCase();
  if (name.includes("two weapon")) return "two_weapon";
  if (name.includes("two-hander") || name.includes("two handed")) return "two_hander";
  if (name.includes("shield")) return "weapon_and_shield";
  if (name.includes("single")) return "single_weapon";
  return null;
}

/** Erkennt Einträge, die eine Fertigkeit als Kampfstil ausweisen. */
export function isFightingStyleEntry(rawName: string): boolean {
  return rawName.toLowerCase().startsWith("fighting style");
}

/**
 * Normalisiert einen NWP-Namen vom Bogen. Gibt null zurück, wenn der Eintrag
 * übersprungen werden soll — Muttersprachen und "Common" sind keine
 * Fertigkeiten im Sinne der Tabelle.
 */
export function normalizeNwpName(rawName: string): string | null {
  const normalized = rawName
    .toLowerCase()
    .replace(/^native languages?:\s*/i, "")
    .trim();

  if (!normalized) return null;
  if (normalized.startsWith("common") || normalized.startsWith("native")) return null;

  return normalized;
}

/** Sucht die passende Fertigkeit in den Stammdaten. */
export function matchNwp<T extends NamedRow>(normalizedName: string, catalog: T[]): T | null {
  if (!normalizedName) return null;
  return (
    catalog.find((n) => {
      const name = n.name.toLowerCase();
      const nameEn = n.name_en?.toLowerCase() ?? "";
      return (
        name === normalizedName ||
        nameEn === normalizedName ||
        name.includes(normalizedName) ||
        (nameEn !== "" && nameEn.includes(normalizedName))
      );
    }) ?? null
  );
}

/**
 * Sucht einen Zauber in den Stammdaten. Die Stufe muss exakt übereinstimmen —
 * sie trennt gleichnamige Varianten wie "Invisibility" (2) und
 * "Invisibility, 10' Radius" (3) zuverlässig voneinander.
 */
export function matchSpell<T extends SpellRowLike>(
  scanned: { name: string; level: number },
  catalog: T[]
): T | null {
  const needle = scanned.name.toLowerCase().trim();
  if (!needle) return null;

  const sameLevel = catalog.filter((s) => s.level === scanned.level);

  // Exakte Treffer haben Vorrang vor Teiltreffern, damit "Invisibility" nicht
  // versehentlich die Radius-Variante einsammelt.
  const exact = sameLevel.find(
    (s) => s.name.toLowerCase() === needle || (s.name_en?.toLowerCase() ?? "") === needle
  );
  if (exact) return exact;

  return (
    sameLevel.find((s) => {
      const name = s.name.toLowerCase();
      const nameEn = s.name_en?.toLowerCase() ?? "";
      return (
        name.includes(needle) ||
        (nameEn !== "" && nameEn.includes(needle)) ||
        needle.includes(name) ||
        (nameEn !== "" && needle.includes(nameEn))
      );
    }) ?? null
  );
}

/**
 * Bildet einen Waffenfertigkeits-Namen auf den kanonischen DB-Namen ab.
 * Unbekannte Namen (z.B. Hausregel-Waffen) bleiben unverändert.
 */
export function normalizeWeaponProfName<T extends NamedRow>(rawName: string, weapons: T[]): string {
  const needle = rawName.toLowerCase();
  const matched = weapons.find(
    (w) => w.name.toLowerCase() === needle || (w.name_en ?? "").toLowerCase() === needle
  );
  return matched ? matched.name : rawName;
}
