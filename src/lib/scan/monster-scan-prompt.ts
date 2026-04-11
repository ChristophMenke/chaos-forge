/**
 * Claude-Vision Prompt für den Monster-Scan-Endpoint.
 *
 * Extrahiert in ein eigenes Modul, damit die Prompt-Struktur unabhängig vom
 * Next.js-Route-Handler testbar ist (Snapshot-/Konsistenztests in
 * `monster-scan-prompt.test.ts`).
 *
 * Response-Shape: `{ variants: [MonsterVariantPayload] }`, auch bei einzelnen
 * Kreaturen als Array mit einem Element. Unterstützt parallele MM-Einträge
 * wie Orc + Orog, Dragon Age Categories, Titan-Stufen etc.
 */

/** Shape einer einzelnen Variante, wie sie vom Scan-Endpoint zurückkommt. */
export interface ScannedMonsterVariant {
  name: string;
  name_en: string | null;
  variant_name: string | null;
  climate_terrain: string | null;
  frequency: string | null;
  organization: string | null;
  activity_cycle: string | null;
  diet: string | null;
  intelligence: string | null;
  treasure: string | null;
  alignment: string | null;
  no_appearing: string | null;
  ac: number;
  movement: string | null;
  hit_dice: string;
  hit_dice_value: number;
  thac0: number;
  attacks_per_round: string;
  damage: string;
  special_attacks: string | null;
  special_defenses: string | null;
  magic_resistance: number;
  size: "T" | "S" | "M" | "L" | "H" | "G";
  morale: string | null;
  morale_value: number;
  xp_value: number;
  intro_text: string | null;
  combat_tactics: string | null;
  habitat_society: string | null;
  ecology: string | null;
  source_book: string | null;
  has_ranged_attack: boolean;
  typical_spells: string[] | null;
  default_zone: "melee" | "ranged";
}

export interface ScanResponse {
  variants: ScannedMonsterVariant[];
}

/**
 * The fixed text portion of the scan prompt. Exported for snapshot testing
 * so prompt drift gets caught.
 */
export const MONSTER_SCAN_PROMPT = `Analyze this AD&D 2nd Edition monster stat block and extract ALL available values as JSON.
Reply ONLY with valid JSON, no other text.

If the stat block contains multiple PARALLEL variants of the same creature
(e.g. Orc + Orog shown side by side, or a dragon listed with Young/Adult/Old
columns), return ALL variants as an array. For a single creature, still return
an array — with one element.

Expected format:
{
  "variants": [
    {
      "name": "Monster Name (German if visible, otherwise English)",
      "name_en": "Monster Name (English)",
      "variant_name": null,
      "climate_terrain": "Any",
      "frequency": "Common",
      "organization": "Pack",
      "activity_cycle": "Any",
      "diet": "Omnivore",
      "intelligence": "Low (5-7)",
      "treasure": "Nil",
      "alignment": "Neutral",
      "no_appearing": "2d4",
      "ac": 7,
      "movement": "12",
      "hit_dice": "3+3",
      "hit_dice_value": 3,
      "thac0": 17,
      "attacks_per_round": "1",
      "damage": "1d8",
      "special_attacks": null,
      "special_defenses": null,
      "magic_resistance": 0,
      "size": "M",
      "morale": "Steady (11-12)",
      "morale_value": 11,
      "xp_value": 120,
      "intro_text": "The introductory paragraph before the Combat heading. All imperial units (feet, pounds, yards, miles, inches) MUST be converted to metric (m, kg, km, cm).",
      "combat_tactics": "The full text under the 'Combat' heading. Metric units only.",
      "habitat_society": "The full text under the 'Habitat/Society' heading. Metric units only.",
      "ecology": "The full text under the 'Ecology' heading. Metric units only.",
      "source_book": "Monstrous Manual",
      "has_ranged_attack": false,
      "typical_spells": null,
      "default_zone": "melee"
    }
  ]
}

Notes:
- ALWAYS return "variants" as an array, even for a single creature.
- "variant_name" is null for a single creature. For parallel variants, set it
  to the distinguishing label (e.g. "Orog", "Adult", "Young", "Greater").
- "ac" must be a number (e.g. AC 5 → 5, AC -2 → -2).
- "hit_dice" is the string as written (e.g. "3+3", "1/2", "4", "8+8").
- "hit_dice_value" is the numeric HD value (e.g. "3+3" → 3, "1/2" → 0.5, "8+8" → 8).
- "thac0" must be a number.
- "attacks_per_round" must be a STRING (e.g. "1", "3", "3 or 1").
- "magic_resistance" must be a NUMBER in percent: 0 for "Nil", 30 for "30%".
- "size" must be one of: T (Tiny), S (Small), M (Medium), L (Large), H (Huge), G (Gargantuan).
- "morale_value" is the minimum value from the range (e.g. "Steady (11-12)" → 11).
- "no_appearing" is the string as written (e.g. "2-8", "2d4", "1").
- "intro_text", "combat_tactics", "habitat_society", "ecology" are the four
  narrative paragraphs from the MM entry. Include the FULL text, do not
  summarise. Use null only if a section is genuinely missing in the source.
- "source_book" is taken from the page header/footer if visible (e.g. "Monstrous
  Manual", "Monstrous Compendium Volume I"). Use null if not visible.
- "default_zone" is "melee" or "ranged" based on the monster's primary attack mode.
- "has_ranged_attack" is true if the monster has any ranged attacks.
- "typical_spells" is a brief note about spell capabilities, null if none.
- If a value is not visible or readable, use null.
- Translate German monster names to English for name_en if the source is German.
- If the stat block spans multiple pages, combine all information.
- ALL lengths and weights in the narrative text fields MUST be in metric units.
  Convert "5 feet" → "1,5 m", "200 pounds" → "91 kg", "1 mile" → "1,6 km" before
  writing them into intro_text/combat_tactics/habitat_society/ecology.`;

/**
 * Parse Claude's text response into a structured ScanResponse. The model
 * sometimes wraps its JSON in a ```json code fence — we strip that before
 * parsing. Throws a descriptive Error if the payload is unusable.
 */
export function parseScanResponse(responseText: string): ScanResponse {
  const fence = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonString = (fence ? fence[1] : responseText).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("Scan response is not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Scan response did not return an object.");
  }

  // Backward-compat: if the model forgot the wrapper and returned a single
  // variant object (legacy behaviour), auto-wrap it.
  const asRecord = parsed as Record<string, unknown>;
  if (!Array.isArray(asRecord.variants)) {
    if ("name" in asRecord || "name_en" in asRecord) {
      return { variants: [asRecord as unknown as ScannedMonsterVariant] };
    }
    throw new Error("Scan response is missing a `variants` array.");
  }

  return { variants: asRecord.variants as ScannedMonsterVariant[] };
}
