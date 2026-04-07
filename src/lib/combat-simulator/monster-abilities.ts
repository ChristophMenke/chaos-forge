/**
 * Parser for monster special_attacks and special_defenses strings.
 * Extracts structured abilities from freeform German/English text.
 */

import type { MonsterAbility, MonsterDefense } from "./types";

/**
 * Parse special_attacks string into structured MonsterAbility array.
 */
export function parseSpecialAttacks(text: string): MonsterAbility[] {
  const abilities: MonsterAbility[] = [];
  const lower = text.toLowerCase();

  // Regeneration: "Regeneration 3 HP/Runde" or "regenerates 3 hp per round"
  const regenMatch = lower.match(/regenerat\w*\s*(\d+)/);
  if (regenMatch) {
    abilities.push({
      type: "regeneration",
      regenPerRound: parseInt(regenMatch[1], 10),
    });
  } else if (/regenerat/i.test(lower)) {
    // Regeneration without explicit number (e.g., Troll = 3)
    abilities.push({ type: "regeneration", regenPerRound: 3 });
  }

  // Poison: "Gift" or "Poison" — optionally with damage or save penalty
  if (/gift|poison/i.test(lower)) {
    const dmgMatch = lower.match(/(?:gift|poison)\w*[^0-9]*(\d+)\s*(?:schaden|damage|hp)/);
    abilities.push({
      type: "poison",
      poisonDamage: dmgMatch ? parseInt(dmgMatch[1], 10) : 20,
      poisonSavePenalty: 0,
    });
  }

  // Paralysis: "Paralyse", "Lähmung", "Paralysis"
  if (/paraly|lähm/i.test(lower)) {
    const durMatch = lower.match(/(?:paraly|lähm)\w*[^0-9]*(\d+)\s*(?:runde|round)/);
    abilities.push({
      type: "paralysis",
      paralysisDuration: durMatch ? parseInt(durMatch[1], 10) : 4,
    });
  }

  // Fear: "Furcht", "Angst", "Fear", "Fright"
  if (/furcht|angst|fear|fright/i.test(lower)) {
    abilities.push({ type: "fear" });
  }

  // Level Drain: "2 Stufen Stufenverlust", "Level Drain", "Stufe(n) entziehen"
  const drainMatch = lower.match(
    /(\d+)\s*(?:stufen?\s*)?(?:stufen?\s*)?(?:verlust|drain|entz)|(?:verlust|drain|entz)\w*\s*(\d+)/
  );
  if (drainMatch || /stufen\s*(?:verlust|entz)|level\s*drain/i.test(lower)) {
    abilities.push({
      type: "level_drain",
      drainLevels: drainMatch ? parseInt(drainMatch[1] || drainMatch[2], 10) || 1 : 1,
    });
  }

  // Constriction: "Umschlingung", "Constriction"
  if (/umschling|constric/i.test(lower)) {
    abilities.push({ type: "constriction" });
  }

  return abilities;
}

/**
 * Parse special_defenses string into structured MonsterDefense array.
 */
export function parseSpecialDefenses(text: string): MonsterDefense[] {
  const defenses: MonsterDefense[] = [];
  const lower = text.toLowerCase();

  // Immunity: "Immun gegen Feuer", "Immune to fire", "Feuerimmunität"
  const immunityPatterns = [
    /immun\w*\s+(?:gegen\s+)?([\w\u00C0-\u024F]+)/gi,
    /([\w\u00C0-\u024F]+)\s*immun/gi,
    /immune\s+(?:to\s+)?([\w\u00C0-\u024F]+)/gi,
  ];
  const immunityElements = new Set<string>();
  for (const pattern of immunityPatterns) {
    let match;
    while ((match = pattern.exec(lower)) !== null) {
      const element = normalizeElement(match[1]);
      if (element) immunityElements.add(element);
    }
  }
  for (const element of immunityElements) {
    defenses.push({ type: "immunity", element });
  }

  // Requires magic weapon: "+1 Waffe", "+2 weapon", "magische Waffe nötig"
  const magicWeaponMatch = lower.match(/\+(\d+)\s*(?:waffe|weapon|oder besser|or better)/);
  if (magicWeaponMatch) {
    defenses.push({
      type: "requires_magic_weapon",
      weaponBonus: parseInt(magicWeaponMatch[1], 10),
    });
  } else if (/magische?\s*waffe|magic\w*\s*weapon|nur\s*magisch/i.test(lower)) {
    defenses.push({ type: "requires_magic_weapon", weaponBonus: 1 });
  }

  // Resistance: "Feuerresistenz", "Fire resistance", "Kälteresistenz"
  const resistancePatterns = [
    /([\w\u00C0-\u024F]+)\s*resist/gi,
    /resist\w*\s+(?:gegen\s+)?([\w\u00C0-\u024F]+)/gi,
  ];
  const resistanceElements = new Set<string>();
  for (const pattern of resistancePatterns) {
    let match;
    while ((match = pattern.exec(lower)) !== null) {
      const element = normalizeElement(match[1]);
      if (element && !immunityElements.has(element)) {
        resistanceElements.add(element);
      }
    }
  }
  for (const element of resistanceElements) {
    defenses.push({ type: "resistance", element });
  }

  return defenses;
}

/** Normalize element names from German/English to canonical form */
function normalizeElement(raw: string): string | null {
  const map: Record<string, string> = {
    feuer: "fire",
    fire: "fire",
    kälte: "cold",
    cold: "cold",
    frost: "cold",
    eis: "cold",
    ice: "cold",
    blitz: "lightning",
    lightning: "lightning",
    elektr: "lightning",
    gift: "poison",
    poison: "poison",
    säure: "acid",
    acid: "acid",
    charm: "charm",
    bezauber: "charm",
    schlaf: "sleep",
    sleep: "sleep",
    normal: "normal_weapons",
    nicht: "normal_weapons",
  };

  const lower = raw.toLowerCase();
  for (const [key, value] of Object.entries(map)) {
    if (lower.startsWith(key)) return value;
  }
  return null;
}
