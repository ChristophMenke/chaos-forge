/**
 * Heuristic spell decision tree for the combat simulator.
 *
 * Philosophy: Mages influence combat best through smart spellcasting, never melee.
 * The AI prioritizes battlefield control and force multiplication over raw damage.
 *
 * Decision order:
 * Round 1-2: Self-Buff > Group-Buff > Counter > AoE > CC > Single Damage
 * Round 3+:  Counter > Heal > Debuff/CC > AoE > Single Damage > Late Buff
 */

import type { CombatEntity, SimSpell, SimulationState } from "./types";
import type { SeededRng } from "./dice";

export interface SpellDecision {
  spell: SimSpell;
  targets: CombatEntity[];
}

/** Spells that only affect humanoid-sized targets (not large monsters) */
const HUMANOID_ONLY_SPELLS = new Set(["Hold Person", "Sleep", "Command", "Charm Person"]);

/**
 * Estimate how likely a spell is to succeed against a target,
 * factoring in magic resistance.
 */
function spellSuccessChance(target: CombatEntity): number {
  return Math.max(0, (100 - target.magicResistance) / 100);
}

/**
 * Check if a target is a humanoid for Hold Person / Sleep / Command.
 * Characters (PCs/NPCs) are always humanoid; monsters are NOT.
 */
function isLikelyHumanoid(target: CombatEntity): boolean {
  return target.source === "character";
}

/**
 * Decide if and which spell to cast this turn.
 * Returns null if no useful spell available → physical attack instead.
 */
export function decideSpellAction(
  entity: CombatEntity,
  state: SimulationState,
  _rng: SeededRng
): SpellDecision | null {
  if (!entity.spellSlots || entity.knownSpells.length === 0) return null;

  // Silenced entities cannot cast
  if (entity.activeEffects.some((e) => e.effect.silenced)) return null;

  // High spell failure: prefer physical attacks (but still try if no other option)
  if ((entity.spellFailure ?? 0) > 50) return null;

  const enemies = state.entities.filter((e) => e.side !== entity.side && e.isAlive);
  const allies = state.entities.filter(
    (e) => e.side === entity.side && e.isAlive && e.id !== entity.id
  );
  if (enemies.length === 0) return null;

  // Helper: can cast this spell?
  const canCast = (spell: SimSpell): boolean => {
    if (!entity.spellSlots) return false;
    const slotIdx = spell.level - 1;
    return slotIdx < entity.spellSlots.length && entity.spellSlots[slotIdx] > 0;
  };

  /** Check if a CC spell is valid for a target */
  const canCCTarget = (spell: SimSpell, target: CombatEntity): boolean => {
    if (target.activeEffects.some((e) => e.effect.held)) return false;
    if (HUMANOID_ONLY_SPELLS.has(spell.name) && !isLikelyHumanoid(target)) return false;
    if (spellSuccessChance(target) < 0.3) return false; // >70% MR → skip
    return true;
  };

  const availableSpells = entity.knownSpells.filter(canCast);
  if (availableSpells.length === 0) return null;

  // ─── Round 1-2: Buff Phase ──────────────────────────────────────
  if (state.round <= 2) {
    const buffResult = tryBuff(entity, allies, availableSpells);
    if (buffResult) return buffResult;
  }

  // ─── Counter: Dispel enemy buffs/invisibility, Free Action ─────
  const counterResult = tryCounter(entity, enemies, allies, availableSpells);
  if (counterResult) return counterResult;

  // ─── Heal: Support role or any priest, when ally critically wounded
  if (entity.role === "support" || availableSpells.some((s) => s.category === "heal")) {
    const healResult = tryHeal(entity, allies, availableSpells);
    if (healResult) return healResult;
  }

  // ─── Debuff/CC before damage (battlefield control > raw damage) ─
  const ccResult = tryCrowdControl(enemies, availableSpells, canCCTarget);
  if (ccResult) return ccResult;

  // ─── AoE Damage (Density Check) ────────────────────────────────
  const aoeResult = tryAoeDamage(entity, enemies, allies, availableSpells);
  if (aoeResult) return aoeResult;

  // ─── Single-Target Damage ──────────────────────────────────────
  const singleResult = trySingleDamage(entity, enemies, availableSpells);
  if (singleResult) return singleResult;

  // ─── Late-round buffs (if nothing else useful) ─────────────────
  if (state.round > 2) {
    const lateBuffResult = tryBuff(entity, allies, availableSpells);
    if (lateBuffResult) return lateBuffResult;
  }

  // No useful spell → physical attack
  return null;
}

// ─── Helper Functions ────────────────────────────────────────────────

function tryCounter(
  caster: CombatEntity,
  enemies: CombatEntity[],
  allies: CombatEntity[],
  spells: SimSpell[]
): SpellDecision | null {
  // Counter invisible enemy
  const invisibleEnemy = enemies.find((e) => e.activeEffects.some((eff) => eff.effect.invisible));
  if (invisibleEnemy) {
    // Don't cast detect invisibility if already concentrating on it
    if (!(caster.concentratingOn === "Detect Invisibility")) {
      const counter = spells.find(
        (s) => s.category === "counter" && s.counters.includes("invisible")
      );
      if (counter) return { spell: counter, targets: [invisibleEnemy] };
    }
  }

  // Counter hasted enemy
  const buffedEnemy = enemies.find((e) => e.activeEffects.some((eff) => eff.effect.hasted));
  if (buffedEnemy) {
    const dispel = spells.find((s) => s.category === "counter" && s.counters.includes("hasted"));
    if (dispel) return { spell: dispel, targets: [buffedEnemy] };
  }

  // Free Action on held/slowed ally
  const heldAlly = allies.find((a) =>
    a.activeEffects.some((eff) => eff.effect.held || eff.effect.slowed)
  );
  if (heldAlly) {
    const freeAction = spells.find(
      (s) =>
        s.category === "counter" && (s.counters.includes("held") || s.counters.includes("slowed"))
    );
    if (freeAction) return { spell: freeAction, targets: [heldAlly] };
  }

  return null;
}

function tryHeal(
  entity: CombatEntity,
  allies: CombatEntity[],
  spells: SimSpell[]
): SpellDecision | null {
  const healSpells = spells.filter((s) => s.category === "heal").sort((a, b) => b.level - a.level);
  if (healSpells.length === 0) return null;

  // Check all allies + self for healing needs
  const healCandidates = [...allies, entity]
    .filter((a) => a.hpCurrent < a.hpMax * 0.5) // Heal below 50% (was 30%)
    .sort((a, b) => a.hpCurrent / a.hpMax - b.hpCurrent / b.hpMax);

  if (healCandidates.length === 0) return null;

  const wounded = healCandidates[0];
  const missingHp = wounded.hpMax - wounded.hpCurrent;

  // Pick appropriately-sized heal: don't waste Heal (full) on minor wounds
  let bestHeal: SimSpell | null = null;
  for (const heal of healSpells) {
    if (heal.name === "Heal" && missingHp > wounded.hpMax * 0.5) {
      bestHeal = heal;
      break;
    }
    if (heal.name !== "Heal") {
      bestHeal = heal;
      break;
    }
  }
  if (!bestHeal) bestHeal = healSpells[healSpells.length - 1]; // Fallback to lowest

  // Only heal if missing HP is significant enough (at least half the heal amount)
  if (bestHeal.name !== "Heal" && bestHeal.estimatedDamage) {
    const avgHeal =
      bestHeal.estimatedDamage.count * ((bestHeal.estimatedDamage.sides + 1) / 2) +
      bestHeal.estimatedDamage.bonus;
    if (missingHp < avgHeal * 0.5) return null;
  }

  return { spell: bestHeal, targets: [wounded] };
}

function tryAoeDamage(
  caster: CombatEntity,
  enemies: CombatEntity[],
  allies: CombatEntity[],
  spells: SimSpell[]
): SpellDecision | null {
  const aoeSpells = spells
    .filter((s) => s.category === "aoe_damage")
    .sort((a, b) => b.level - a.level);

  if (aoeSpells.length === 0) return null;

  const meleeEnemies = enemies.filter((e) => e.zone === "melee");
  const rangedEnemies = enemies.filter((e) => e.zone === "ranged");

  // Check both zones, prefer the one with more enemies
  const zones = [
    { enemies: meleeEnemies, zone: "melee" as const },
    { enemies: rangedEnemies, zone: "ranged" as const },
  ].sort((a, b) => b.enemies.length - a.enemies.length);

  for (const { enemies: zoneEnemies, zone } of zones) {
    if (zoneEnemies.length < 2) continue;

    const density = zoneEnemies.length / Math.max(enemies.length, 1);
    if (density < 0.3) continue;

    // Friendly fire check: skip if allies are in the target zone
    const alliesInZone = allies.filter((a) => a.zone === zone);
    if (alliesInZone.length > 0 && alliesInZone.length >= zoneEnemies.length * 0.5) {
      continue; // Too many allies in the blast zone
    }

    // Resource conservation: use lower-level AoE if enough targets
    const selectedSpell = selectConservativeSpell(caster, aoeSpells, zoneEnemies.length >= 3);
    if (selectedSpell) return { spell: selectedSpell, targets: zoneEnemies };
  }

  return null;
}

function trySingleDamage(
  caster: CombatEntity,
  enemies: CombatEntity[],
  spells: SimSpell[]
): SpellDecision | null {
  const dmgSpells = spells
    .filter((s) => s.category === "single_damage")
    .sort((a, b) => b.level - a.level);

  if (dmgSpells.length === 0) return null;

  // Target by threat score (not just lowest HP)
  const target = selectByThreat(enemies);

  // Resource conservation: use lower-level spells for weak targets
  const targetIsWeak = target.hpCurrent < 15;
  const selectedSpell = targetIsWeak
    ? dmgSpells[dmgSpells.length - 1] // Lowest level for weak targets
    : selectConservativeSpell(caster, dmgSpells, true);

  if (selectedSpell) return { spell: selectedSpell, targets: [target] };
  return null;
}

function tryCrowdControl(
  enemies: CombatEntity[],
  spells: SimSpell[],
  canCCTarget: (spell: SimSpell, target: CombatEntity) => boolean
): SpellDecision | null {
  const ccSpells = spells.filter((s) => s.category === "cc").sort((a, b) => b.level - a.level);

  if (ccSpells.length === 0) return null;

  // Prioritize CC on casters (removing a caster from combat is huge)
  const prioritized = [...enemies].sort((a, b) => {
    const rolePrio = (e: CombatEntity) => {
      if (e.knownSpells.length > 0) return 0; // Casters first
      if (e.role === "artillery") return 1;
      if (e.role === "striker") return 2;
      if (e.role === "support") return 3;
      return 4;
    };
    return rolePrio(a) - rolePrio(b);
  });

  // Zone AoE CC spells (Web, Silence, Slow) target enemy zones
  for (const spell of ccSpells) {
    if (spell.targetMode === "zone_aoe") {
      const validTargets = enemies.filter((t) => canCCTarget(spell, t));
      if (validTargets.length >= 2) {
        return { spell, targets: validTargets };
      }
    }
  }

  // Single-target CC
  for (const spell of ccSpells) {
    if (spell.targetMode === "single") {
      const target = prioritized.find((t) => canCCTarget(spell, t));
      if (target) return { spell, targets: [target] };
    }
  }

  return null;
}

function tryBuff(
  entity: CombatEntity,
  allies: CombatEntity[],
  spells: SimSpell[]
): SpellDecision | null {
  const buffSpells = spells.filter((s) => s.category === "buff").sort((a, b) => b.level - a.level);

  if (buffSpells.length === 0) return null;

  // Self-buff first (Shield, Stoneskin, Mirror Image, Blur, Sanctuary)
  const selfBuff = buffSpells.find((s) => s.targetMode === "self");
  if (selfBuff) {
    const alreadyBuffed = entity.activeEffects.some((e) => e.name === selfBuff.name);
    if (!alreadyBuffed) {
      // Concentration awareness: don't drop valuable concentration for lesser buff
      if (selfBuff.requiresConcentration && entity.concentratingOn) {
        // Only replace if the new spell is higher level
        const currentConc = entity.knownSpells.find((s) => s.name === entity.concentratingOn);
        if (currentConc && currentConc.level >= selfBuff.level) {
          // Don't replace — current concentration is more valuable
        } else {
          return { spell: selfBuff, targets: [entity] };
        }
      } else {
        return { spell: selfBuff, targets: [entity] };
      }
    }
  }

  // Haste for melee allies (massive force multiplier)
  const haste = buffSpells.find((s) => s.name === "Haste");
  if (haste) {
    const meleeAllies = allies.filter(
      (a) => a.zone === "melee" && !a.activeEffects.some((e) => e.effect.hasted)
    );
    if (meleeAllies.length >= 2) {
      return { spell: haste, targets: meleeAllies };
    }
  }

  // Protection from Evil 10' on allies
  const protEvil = buffSpells.find((s) => s.name === "Protection from Evil 10'");
  if (protEvil) {
    const unbuffed = allies.filter(
      (a) => !a.activeEffects.some((e) => e.name === "Protection from Evil 10'")
    );
    if (unbuffed.length >= 2) {
      return { spell: protEvil, targets: [...unbuffed, entity] };
    }
  }

  // Prayer (buffs allies AND debuffs enemies)
  const prayer = buffSpells.find((s) => s.name === "Prayer");
  if (prayer) {
    const alreadyPrayed = entity.activeEffects.some((e) => e.name === "Prayer");
    if (!alreadyPrayed) {
      return { spell: prayer, targets: [...allies, entity] };
    }
  }

  // Aid on low-HP ally
  const aid = buffSpells.find((s) => s.name === "Aid");
  if (aid) {
    const needsAid = allies.find(
      (a) => !a.activeEffects.some((e) => e.name === "Aid") && a.hpCurrent < a.hpMax * 0.7
    );
    if (needsAid) return { spell: aid, targets: [needsAid] };
  }

  // Group buff (Bless)
  const groupBuff = buffSpells.find(
    (s) =>
      s.targetMode === "zone_aoe" &&
      s.name !== "Haste" &&
      s.name !== "Prayer" &&
      s.name !== "Protection from Evil 10'"
  );
  if (groupBuff) {
    const alreadyBuffed = entity.activeEffects.some((e) => e.name === groupBuff.name);
    if (!alreadyBuffed) return { spell: groupBuff, targets: [...allies, entity] };
  }

  return null;
}

// ─── Utility Functions ──────────────────────────────────────────────

/** Select target by threat score — prioritize dangerous enemies */
function selectByThreat(enemies: CombatEntity[]): CombatEntity {
  return [...enemies].sort((a, b) => threatScore(b) - threatScore(a))[0];
}

function threatScore(enemy: CombatEntity): number {
  let score = 0;
  // Casters are high threat
  if (enemy.knownSpells.length > 0) score += 30;
  // DPR estimate
  const avgDmg = enemy.damageDice[0]
    ? enemy.damageDice[0].count * ((enemy.damageDice[0].sides + 1) / 2) + enemy.damageDice[0].bonus
    : 0;
  score += enemy.attacksPerRound * avgDmg * 2;
  // Healers extend fights
  if (enemy.role === "support") score += 20;
  // Bonus for low HP (finishable targets)
  if (enemy.hpCurrent < 15) score += 15;
  return score;
}

/** Resource conservation: prefer lower-level spells when possible */
function selectConservativeSpell(
  caster: CombatEntity,
  spells: SimSpell[],
  highValue: boolean
): SimSpell | null {
  if (!caster.spellSlots) return spells[0] ?? null;

  // If this is a high-value target/situation, use best spell
  if (highValue) return spells[0] ?? null;

  // Otherwise: use lowest-level spell that still has slots remaining
  // Prefer lower-level spells to conserve high-level slots
  const reversed = [...spells].reverse(); // lowest level first
  for (const spell of reversed) {
    const slotIdx = spell.level - 1;
    const remaining = caster.spellSlots[slotIdx] ?? 0;
    if (remaining > 1) return spell; // Use if more than 1 slot left (save the last one)
  }
  // Fallback: any spell with remaining slots
  return spells.find((s) => (caster.spellSlots![s.level - 1] ?? 0) > 0) ?? null;
}
