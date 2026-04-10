/**
 * Adapters to convert DB data into CombatEntity for the simulator.
 */

import type { CharacterRow, CharacterClassRow, MonsterRow, SpellRow } from "@/lib/supabase/types";
import type { CharacterCombatData } from "@/lib/rules/character-computed";
import type { CombatEntity, SimSpell } from "./types";
import { inferCharacterRole, inferMonsterRole, zoneFromRole } from "./roles";
import {
  parseHitDice,
  parseDamageString,
  parseAttacksPerRound,
  rollMonsterHp,
} from "@/lib/rules/monsters";
import { COMBAT_SPELLS, matchSpellToCatalog } from "./spell-catalog";
import { getAttacksPerRound } from "@/lib/rules/combat";
import {
  getWizardSpellSlots,
  getSpecialistBonusSlots,
  getPriestSpellSlots,
  getPriestBonusSlots,
} from "@/lib/rules/spellslots";
import { parseSpecialAttacks, parseSpecialDefenses } from "./monster-abilities";
import type { SeededRng } from "./dice";

/**
 * Convert a player character into a CombatEntity.
 */
export function characterToCombatEntity(
  character: CharacterRow,
  classes: CharacterClassRow[],
  combat: CharacterCombatData,
  spells: SpellRow[]
): CombatEntity {
  // Match known spells against the combat catalog
  const knownSpells: SimSpell[] = [];
  const seenSpellNames = new Set<string>();
  for (const spell of spells) {
    const key = matchSpellToCatalog(spell.name) ?? matchSpellToCatalog(spell.name_en ?? "");
    if (key && COMBAT_SPELLS[key] && !seenSpellNames.has(key)) {
      knownSpells.push(COMBAT_SPELLS[key]);
      seenSpellNames.add(key);
    }
  }

  // Add epic item spell abilities (e.g., Larry's Cone of Cold from Blade of Water)
  if (combat.epicEffects?.spellAbilities) {
    for (const ability of combat.epicEffects.spellAbilities) {
      const key = matchSpellToCatalog(ability.name) ?? matchSpellToCatalog(ability.name_en ?? "");
      if (key && COMBAT_SPELLS[key] && !seenSpellNames.has(key)) {
        knownSpells.push(COMBAT_SPELLS[key]);
        seenSpellNames.add(key);
      }
    }
  }

  // Build spell slots from character data
  // If character has epic spell abilities but no caster class, give minimal slots
  let spellSlots = buildCharacterSpellSlots(character, classes);
  if (!spellSlots && knownSpells.length > 0) {
    // Non-caster with epic spell abilities: 1 slot per spell level needed
    const maxLevel = Math.max(...knownSpells.map((s) => s.level));
    spellSlots = Array.from({ length: maxLevel }, () => 1);
  }

  // Use actual weapon data if available, fallback to estimates
  let apr: number;
  let damageDice: { count: number; sides: number; bonus: number }[];
  let effectiveThac0 = combat.thac0;
  let weaponSpeed = 5;

  if (combat.primaryWeapon) {
    const pw = combat.primaryWeapon;
    effectiveThac0 = pw.adjustedThac0;
    apr = parseAttacksPerRound(pw.attacksPerRound);
    damageDice = [parseSingleDamageDie(pw.damageDice, pw.damageBonus)];
    weaponSpeed = pw.speed;
  } else {
    const aprStr = getAttacksPerRound(combat.primaryClassGroup, combat.maxLevel, false);
    apr = parseAttacksPerRound(aprStr);
    damageDice = [{ count: 1, sides: 4, bonus: 0 }]; // Unarmed fallback
  }

  const role = inferCharacterRole(combat.classGroups, combat.ac, knownSpells);
  const zone = zoneFromRole(role);

  return {
    id: character.id,
    name: character.name,
    side: "party",
    source: "character",
    ac: combat.ac,
    thac0: effectiveThac0,
    hpMax: character.hp_max,
    hpCurrent: character.hp_max, // Start at full HP for simulation
    attacksPerRound: apr,
    damageDice,
    saves: combat.saves,
    magicResistance: combat.magicResistance,
    weaponSpeed,
    zone,
    role,
    spellSlots,
    knownSpells,
    activeEffects: [],
    isAlive: true,
    attackDebt: 0,
    // Thief abilities
    backstabMultiplier: combat.backstabMultiplier ?? null,
    hideInShadows: combat.thiefSkills?.hideInShadows ?? null,
    moveSilently: combat.thiefSkills?.moveSilently ?? null,
    isHidden: combat.backstabMultiplier != null, // Rogues start hidden (pre-combat stealth)
    // Concentration & Spell Failure
    concentratingOn: null,
    spellFailure: combat.magicSpellFailure,
    casterLevel: combat.maxLevel,
    // Perception
    perception: combat.perception,
    // Monster abilities (N/A for characters)
    specialAbilities: [],
    specialDefenses: [],
  };
}

/**
 * Convert a monster row into one or more CombatEntities.
 */
export function monsterToCombatEntities(
  monster: MonsterRow,
  count: number,
  rng: SeededRng
): CombatEntity[] {
  const parsed = parseHitDice(monster.hit_dice);
  const damageDice = parseDamageString(monster.damage);
  const apr = parseAttacksPerRound(monster.attacks_per_round);
  const typicalSpells = monster.typical_spells ?? [];
  const role = inferMonsterRole(
    monster.ac,
    monster.hit_dice_value,
    monster.has_ranged_attack,
    typicalSpells
  );
  const zone = monster.default_zone ?? zoneFromRole(role);

  // Match monster spells to catalog
  const knownSpells: SimSpell[] = [];
  for (const spellName of typicalSpells) {
    const key = matchSpellToCatalog(spellName);
    if (key && COMBAT_SPELLS[key]) knownSpells.push(COMBAT_SPELLS[key]);
  }

  // Parse breath weapon / special attacks as AoE spell-like abilities
  if (monster.special_attacks) {
    const breathSpell = parseBreathWeapon(monster.special_attacks, monster.hit_dice_value);
    if (breathSpell) knownSpells.push(breathSpell);
  }

  // Build simple spell slots from HD
  const spellSlots = knownSpells.length > 0 ? buildMonsterSpellSlots(monster.hit_dice_value) : null;

  // Parse monster special abilities and defenses
  const specialAbilities = monster.special_attacks
    ? parseSpecialAttacks(monster.special_attacks)
    : [];
  const specialDefenses = monster.special_defenses
    ? parseSpecialDefenses(monster.special_defenses)
    : [];
  const requiresMagicWeapon = specialDefenses.find((d) => d.type === "requires_magic_weapon");

  return Array.from({ length: count }, (_, i) => {
    const hp = rollMonsterHp(parsed, () => rng.random());
    return {
      id: `${monster.id}-${i}`,
      name: count > 1 ? `${monster.name} ${i + 1}` : monster.name,
      side: "opposition" as const,
      source: "monster" as const,
      ac: monster.ac,
      thac0: monster.thac0,
      hpMax: hp,
      hpCurrent: hp,
      attacksPerRound: apr,
      damageDice: damageDice.map((d) => ({ ...d })),
      saves: estimateMonsterSaves(monster.hit_dice_value),
      magicResistance: monster.magic_resistance,
      weaponSpeed: 5,
      zone: zone as "melee" | "ranged",
      role,
      spellSlots: spellSlots ? [...spellSlots] : null,
      knownSpells: [...knownSpells],
      activeEffects: [],
      isAlive: true,
      attackDebt: 0,
      // Monster abilities
      specialAbilities: [...specialAbilities],
      specialDefenses: [...specialDefenses],
      weaponMagicBonus: requiresMagicWeapon?.weaponBonus ?? 0,
      casterLevel: monster.hit_dice_value,
    };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────

const WIZARD_CLASS_IDS = new Set([
  "mage",
  "abjurer",
  "conjurer",
  "diviner",
  "enchanter",
  "illusionist",
  "invoker",
  "necromancer",
  "transmuter",
]);
const PRIEST_CLASS_IDS = new Set(["cleric", "druid", "crusader", "shaman"]);
const PARTIAL_PRIEST_IDS = new Set(["ranger", "paladin"]);

function buildCharacterSpellSlots(
  character: CharacterRow,
  classes: CharacterClassRow[]
): number[] | null {
  let wizardSlots: number[] | null = null;
  let priestSlots: number[] | null = null;

  for (const cls of classes) {
    if (WIZARD_CLASS_IDS.has(cls.class_id)) {
      const base = getWizardSpellSlots(cls.level);
      const bonus = getSpecialistBonusSlots(
        cls.class_id as Parameters<typeof getSpecialistBonusSlots>[0],
        cls.level
      );
      wizardSlots = base.map((b, i) => b + bonus[i]);
    } else if (cls.class_id === "bard") {
      // Bards use wizard spell table but capped progression
      wizardSlots = getWizardSpellSlots(cls.level);
    } else if (PRIEST_CLASS_IDS.has(cls.class_id)) {
      const base = getPriestSpellSlots(cls.level);
      const wis = character.wis ?? 13;
      const bonus = getPriestBonusSlots(wis);
      priestSlots = base.map((b, i) => b + (bonus[i] ?? 0));
    } else if (PARTIAL_PRIEST_IDS.has(cls.class_id)) {
      // Rangers/Paladins get limited priest slots at higher levels
      if (cls.class_id === "ranger" && cls.level >= 8) {
        const effectiveLevel = Math.min(cls.level - 7, 9);
        priestSlots = getPriestSpellSlots(effectiveLevel).slice(0, 3);
      } else if (cls.class_id === "paladin" && cls.level >= 9) {
        const effectiveLevel = Math.min(cls.level - 8, 9);
        priestSlots = getPriestSpellSlots(effectiveLevel).slice(0, 4);
      }
    }
  }

  // Merge wizard + priest slots (multiclass casters)
  if (wizardSlots && priestSlots) {
    const maxLen = Math.max(wizardSlots.length, priestSlots.length);
    const merged = new Array(maxLen).fill(0);
    for (let i = 0; i < maxLen; i++) {
      merged[i] = (wizardSlots[i] ?? 0) + (priestSlots[i] ?? 0);
    }
    return merged;
  }
  return wizardSlots ?? priestSlots;
}

function buildMonsterSpellSlots(hitDiceValue: number): number[] {
  // Rough estimate based on HD
  const maxSpellLevel = Math.min(9, Math.ceil(hitDiceValue / 2));
  return Array.from({ length: maxSpellLevel }, () => 2);
}

/**
 * Parse breath weapon from monster special_attacks string.
 * Matches patterns like "Blitzatem (Linie, 16d8+8)" or "Feueratem (Kegel, 12d6)"
 * Returns a SimSpell representing the breath weapon as an AoE ability.
 */
function parseBreathWeapon(specialAttacks: string, hitDiceValue: number): SimSpell | null {
  // Match breath weapon patterns in DE and EN
  const breathMatch = specialAttacks.match(
    /(?:atem|breath)[^(]*\([^)]*?(\d+)d(\d+)(?:\s*\+\s*(\d+))?\)/i
  );
  if (!breathMatch) return null;

  const count = parseInt(breathMatch[1], 10);
  const sides = parseInt(breathMatch[2], 10);
  const bonus = breathMatch[3] ? parseInt(breathMatch[3], 10) : 0;

  // Breath weapons: 3/day for most dragons, save for half
  return {
    name: "Breath Weapon",
    level: Math.max(1, Math.ceil(hitDiceValue / 3)),
    type: "wizard" as const,
    castingTime: 1,
    savingThrow: "breath" as const,
    category: "aoe_damage" as const,
    targetMode: "zone_aoe" as const,
    estimatedDamage: { count, sides, bonus },
    duration: 0,
    counters: [],
    conditions: [],
  };
}

/** Parse a damage string like "1d8" into {count, sides, bonus} */
function parseSingleDamageDie(
  diceStr: string,
  extraBonus: number = 0
): { count: number; sides: number; bonus: number } {
  const match = diceStr.match(/(\d+)d(\d+)(?:\s*([+-]\s*\d+))?/);
  if (!match) return { count: 1, sides: 4, bonus: extraBonus };
  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const inlineBonus = match[3] ? parseInt(match[3].replace(/\s/g, ""), 10) : 0;
  return { count, sides, bonus: inlineBonus + extraBonus };
}

function estimateMonsterSaves(hitDiceValue: number): CombatEntity["saves"] {
  // Approximate saves from HD (lower = better)
  const base = Math.max(4, 20 - Math.floor(hitDiceValue * 1.2));
  return {
    paralyzation: base,
    rod: base + 1,
    petrification: base,
    breath: base + 2,
    spell: base + 1,
  };
}
