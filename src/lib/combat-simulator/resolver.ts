/**
 * Single-round resolution engine for the combat simulator.
 * Uses existing rules engine functions where possible.
 */

import type {
  CombatEntity,
  SimSpell,
  ActionLogEntry,
  SimulationState,
  ActiveEffect,
} from "./types";
import type { SeededRng } from "./dice";
import { decideSpellAction } from "./spell-ai";

/**
 * Resolve one entity's turn in combat.
 */
export function resolveEntityTurn(
  entity: CombatEntity,
  state: SimulationState,
  rng: SeededRng
): ActionLogEntry[] {
  const logs: ActionLogEntry[] = [];

  // Apply monster regeneration at start of turn
  if (entity.specialAbilities?.length) {
    for (const ability of entity.specialAbilities) {
      if (ability.type === "regeneration" && entity.hpCurrent < entity.hpMax) {
        const healed = Math.min(ability.regenPerRound ?? 3, entity.hpMax - entity.hpCurrent);
        entity.hpCurrent += healed;
        logs.push({
          actorId: entity.id,
          actorName: entity.name,
          type: "special",
          detail: `Regeneration — healed ${healed} HP`,
        });
      }
    }
  }

  // Skip if held/incapacitated
  if (entity.activeEffects.some((e) => e.effect.held)) {
    logs.push({
      actorId: entity.id,
      actorName: entity.name,
      type: "skip",
      detail: "Held — cannot act",
    });
    return logs;
  }

  // Skip if feared
  if (entity.activeEffects.some((e) => e.effect.feared)) {
    logs.push({
      actorId: entity.id,
      actorName: entity.name,
      type: "skip",
      detail: "Feared — cannot act",
    });
    return logs;
  }

  // Apply monster fear aura
  if (entity.specialAbilities?.some((a) => a.type === "fear")) {
    logs.push(...resolveFearAura(entity, state, rng));
  }

  // Check if silenced — cannot cast spells
  const isSilenced = entity.activeEffects.some((e) => e.effect.silenced);

  // Try backstab first (thief with isHidden or invisible)
  if (canBackstab(entity)) {
    const backstabLogs = resolveBackstab(entity, state, rng);
    if (backstabLogs.length > 0) return [...logs, ...backstabLogs];
  }

  // Try spell action (unless silenced)
  if (!isSilenced) {
    const spellDecision = decideSpellAction(entity, state, rng);
    if (spellDecision) {
      logs.push(...resolveSpell(entity, spellDecision.spell, spellDecision.targets, state, rng));
      return logs;
    }
  }

  // Try re-hide for rogues (if not hidden and have hide skill)
  if (entity.backstabMultiplier && !entity.isHidden && entity.hideInShadows && state.round > 1) {
    const hideResult = attemptReHide(entity, rng);
    if (hideResult) {
      logs.push(hideResult);
      return logs;
    }
  }

  // Physical attack
  logs.push(...resolvePhysicalAttack(entity, state, rng));
  return logs;
}

// ─── Backstab ───────────────────────────────────────────────────────────

function canBackstab(entity: CombatEntity): boolean {
  if (!entity.backstabMultiplier) return false;
  if (entity.isHidden) return true;
  if (entity.activeEffects.some((e) => e.effect.invisible)) return true;
  return false;
}

function resolveBackstab(
  attacker: CombatEntity,
  state: SimulationState,
  rng: SeededRng
): ActionLogEntry[] {
  const logs: ActionLogEntry[] = [];
  const enemies = state.entities.filter((e) => e.side !== attacker.side && e.isAlive);
  if (enemies.length === 0) return logs;

  // Target highest-threat enemy (casters > support > strikers)
  const target = selectBackstabTarget(enemies);
  if (!target) return logs;

  // Check sanctuary: attacker must save vs spell to overcome it
  if (target.activeEffects.some((e) => e.effect.sanctuary)) {
    if (!makeSave(attacker, "spell", rng)) {
      // Failed save — sanctuary prevents the backstab
      return logs;
    }
  }

  // AD&D 2e backstab: auto-hit, damage multiplied
  const dmg = attacker.damageDice[0];
  const baseDamage = Math.max(
    1,
    rng.roll(dmg.count, dmg.sides, dmg.bonus + getEffectiveDamageBonus(attacker))
  );
  const totalDamage = baseDamage * attacker.backstabMultiplier!;

  target.hpCurrent -= totalDamage;
  if (target.hpCurrent <= 0) target.isAlive = false;

  // Break stealth — Improved Invisibility persists through attacks
  attacker.isHidden = false;
  attacker.activeEffects = attacker.activeEffects.filter(
    (e) => !e.effect.invisible || e.name === "Improved Invisibility"
  );

  logs.push({
    actorId: attacker.id,
    actorName: attacker.name,
    type: "attack",
    target: target.id,
    targetName: target.name,
    detail: `Backstab (x${attacker.backstabMultiplier}) — auto-hit, ${totalDamage} dmg (${baseDamage} x ${attacker.backstabMultiplier})${target.isAlive ? "" : " [KILLED]"}`,
    damage: totalDamage,
    hit: true,
  });

  return logs;
}

function selectBackstabTarget(enemies: CombatEntity[]): CombatEntity | undefined {
  // Priority: artillery (casters) > support (healers) > striker > tank
  return [...enemies].sort((a, b) => {
    const rolePrio = (r: string) =>
      r === "artillery" ? 0 : r === "support" ? 1 : r === "striker" ? 2 : 3;
    return rolePrio(a.role) - rolePrio(b.role);
  })[0];
}

function attemptReHide(entity: CombatEntity, rng: SeededRng): ActionLogEntry | null {
  const roll = rng.d100();
  if (roll <= (entity.hideInShadows ?? 0)) {
    entity.isHidden = true;
    return {
      actorId: entity.id,
      actorName: entity.name,
      type: "special",
      detail: `Hide in Shadows — success (rolled ${roll} vs ${entity.hideInShadows}%), now hidden`,
    };
  }
  // Failed — will fall through to physical attack
  return null;
}

// ─── Monster Fear Aura ──────────────────────────────────────────────────

function resolveFearAura(
  entity: CombatEntity,
  state: SimulationState,
  rng: SeededRng
): ActionLogEntry[] {
  const logs: ActionLogEntry[] = [];
  const enemies = state.entities.filter(
    (e) => e.side !== entity.side && e.isAlive && !e.activeEffects.some((eff) => eff.effect.feared)
  );

  for (const target of enemies) {
    if (checkMagicResistance(target, rng)) continue;
    if (makeSave(target, "spell", rng)) continue;

    target.activeEffects.push({
      name: "Fear Aura",
      roundsRemaining: 3,
      effect: { feared: true },
    });
    logs.push({
      actorId: entity.id,
      actorName: entity.name,
      type: "special",
      target: target.id,
      targetName: target.name,
      detail: `Fear Aura — ${target.name} is feared for 3 rounds`,
    });
  }
  return logs;
}

/**
 * Resolve physical attacks.
 */
function resolvePhysicalAttack(
  attacker: CombatEntity,
  state: SimulationState,
  rng: SeededRng
): ActionLogEntry[] {
  const logs: ActionLogEntry[] = [];
  const enemies = state.entities.filter((e) => e.side !== attacker.side && e.isAlive);
  if (enemies.length === 0) return logs;

  // Determine number of attacks this round (fractional APR tracking)
  const effectiveAPR = getEffectiveAPR(attacker);
  attacker.attackDebt += effectiveAPR;
  const attacksThisRound = Math.floor(attacker.attackDebt);
  attacker.attackDebt -= attacksThisRound;

  for (let i = 0; i < attacksThisRound; i++) {
    // Target selection: melee → opposing frontline, ranged → opposing backline
    const target = selectTarget(attacker, enemies);
    if (!target || !target.isAlive) continue;

    // Sanctuary check
    if (target.activeEffects.some((e) => e.effect.sanctuary)) {
      if (!makeSave(attacker, "spell", rng)) {
        logs.push({
          actorId: attacker.id,
          actorName: attacker.name,
          type: "attack",
          target: target.id,
          targetName: target.name,
          detail: "Cannot attack — Sanctuary (failed save)",
          damage: 0,
          hit: false,
        });
        continue;
      }
    }

    // Check if target requires magic weapon
    if (
      (target.weaponMagicBonus ?? 0) > 0 &&
      (attacker.weaponMagicBonus ?? 0) < (target.weaponMagicBonus ?? 0)
    ) {
      logs.push({
        actorId: attacker.id,
        actorName: attacker.name,
        type: "attack",
        target: target.id,
        targetName: target.name,
        detail: `Requires +${target.weaponMagicBonus} weapon — attack has no effect`,
        damage: 0,
        hit: false,
      });
      continue;
    }

    const effectiveThac0 = getEffectiveThac0(attacker);
    const targetAC = getEffectiveAC(target);
    const needed = effectiveThac0 - targetAC;
    const roll = rng.d20();
    const hit = roll >= needed || roll === 20;

    if (hit) {
      // Mirror Image: attack hits an image instead of the real target
      const mirrorEffect = target.activeEffects.find(
        (e) => e.effect.mirrorImages && e.effect.mirrorImages > 0
      );
      if (mirrorEffect && mirrorEffect.effect.mirrorImages) {
        mirrorEffect.effect.mirrorImages--;
        if (mirrorEffect.effect.mirrorImages <= 0) {
          target.activeEffects = target.activeEffects.filter((e) => e !== mirrorEffect);
        }
        logs.push({
          actorId: attacker.id,
          actorName: attacker.name,
          type: "attack",
          target: target.id,
          targetName: target.name,
          detail: `${roll} vs AC ${targetAC} (need ${needed}) — hit Mirror Image (${mirrorEffect.effect.mirrorImages ?? 0} left)`,
          damage: 0,
          hit: true,
        });
        continue;
      }

      const isCrit = roll === 20;
      const dmgIndex = Math.min(i, attacker.damageDice.length - 1);
      const dmg = attacker.damageDice[dmgIndex];
      let damage = Math.max(
        1,
        rng.roll(dmg.count, dmg.sides, dmg.bonus + getEffectiveDamageBonus(attacker))
      );
      if (isCrit) damage *= 2; // Natural 20 = double damage

      // Stoneskin: absorb the hit completely, consume a charge
      const stoneskinEffect = target.activeEffects.find(
        (e) => e.effect.stoneskinCharges && e.effect.stoneskinCharges > 0
      );
      if (stoneskinEffect && stoneskinEffect.effect.stoneskinCharges) {
        stoneskinEffect.effect.stoneskinCharges--;
        if (stoneskinEffect.effect.stoneskinCharges <= 0) {
          target.activeEffects = target.activeEffects.filter((e) => e !== stoneskinEffect);
        }
        logs.push({
          actorId: attacker.id,
          actorName: attacker.name,
          type: "attack",
          target: target.id,
          targetName: target.name,
          detail: `${roll} vs AC ${targetAC} (need ${needed}) — absorbed by Stoneskin (${stoneskinEffect.effect.stoneskinCharges ?? 0} left)`,
          damage: 0,
          hit: true,
        });
        continue;
      }

      // Apply temp HP first
      const tempHpEffect = target.activeEffects.find((e) => e.effect.tempHp && e.effect.tempHp > 0);
      if (tempHpEffect && tempHpEffect.effect.tempHp) {
        const absorbed = Math.min(damage, tempHpEffect.effect.tempHp);
        tempHpEffect.effect.tempHp -= absorbed;
        damage -= absorbed;
        if (tempHpEffect.effect.tempHp <= 0) {
          target.activeEffects = target.activeEffects.filter((e) => e !== tempHpEffect);
        }
      }

      target.hpCurrent -= damage;

      // Check concentration break on damage
      if (target.concentratingOn) {
        if (!makeSave(target, "spell", rng)) {
          breakConcentration(target, state);
          logs.push({
            actorId: target.id,
            actorName: target.name,
            type: "special",
            detail: `Concentration broken — lost ${target.concentratingOn}`,
          });
          target.concentratingOn = null;
        }
      }

      // Monster on-hit abilities: poison, paralysis, level drain
      if (attacker.specialAbilities?.length) {
        logs.push(...resolveOnHitAbilities(attacker, target, rng));
      }

      if (target.hpCurrent <= 0) {
        target.isAlive = false;
      }

      const critLabel = isCrit ? " CRIT!" : "";
      logs.push({
        actorId: attacker.id,
        actorName: attacker.name,
        type: "attack",
        target: target.id,
        targetName: target.name,
        detail: `${roll} vs AC ${targetAC} (need ${needed}) — ${damage} dmg${critLabel}${target.isAlive ? "" : " [KILLED]"}`,
        damage,
        hit: true,
      });
    } else {
      logs.push({
        actorId: attacker.id,
        actorName: attacker.name,
        type: "attack",
        target: target.id,
        targetName: target.name,
        detail: `${roll} vs AC ${targetAC} (need ${needed}) — miss`,
        damage: 0,
        hit: false,
      });
    }
  }

  return logs;
}

// ─── Monster On-Hit Abilities ───────────────────────────────────────────

function resolveOnHitAbilities(
  attacker: CombatEntity,
  target: CombatEntity,
  rng: SeededRng
): ActionLogEntry[] {
  const logs: ActionLogEntry[] = [];

  for (const ability of attacker.specialAbilities ?? []) {
    if (ability.type === "poison") {
      if (!makeSave(target, "paralyzation", rng)) {
        const poisonDmg = ability.poisonDamage ?? 20;
        target.hpCurrent -= poisonDmg;
        logs.push({
          actorId: attacker.id,
          actorName: attacker.name,
          type: "special",
          target: target.id,
          targetName: target.name,
          detail: `Poison — failed save, ${poisonDmg} extra damage`,
          damage: poisonDmg,
        });
      } else {
        logs.push({
          actorId: attacker.id,
          actorName: attacker.name,
          type: "special",
          target: target.id,
          targetName: target.name,
          detail: "Poison — saved",
        });
      }
    }

    if (ability.type === "paralysis") {
      if (!makeSave(target, "paralyzation", rng)) {
        const duration = ability.paralysisDuration ?? 4;
        target.activeEffects.push({
          name: "Paralysis",
          roundsRemaining: duration,
          effect: { held: true },
        });
        logs.push({
          actorId: attacker.id,
          actorName: attacker.name,
          type: "special",
          target: target.id,
          targetName: target.name,
          detail: `Paralysis — failed save, held for ${duration} rounds`,
        });
      }
    }

    if (ability.type === "level_drain") {
      const levels = ability.drainLevels ?? 1;
      const hpLoss = levels * 10;
      target.hpMax -= hpLoss;
      target.hpCurrent = Math.min(target.hpCurrent, target.hpMax);
      logs.push({
        actorId: attacker.id,
        actorName: attacker.name,
        type: "special",
        target: target.id,
        targetName: target.name,
        detail: `Level Drain — ${levels} level(s), -${hpLoss} max HP`,
        damage: hpLoss,
      });
    }
  }

  return logs;
}

/**
 * Resolve a spell action.
 */
function resolveSpell(
  caster: CombatEntity,
  spell: SimSpell,
  targets: CombatEntity[],
  state: SimulationState,
  rng: SeededRng
): ActionLogEntry[] {
  const logs: ActionLogEntry[] = [];

  // Deduct spell slot
  if (caster.spellSlots) {
    caster.spellSlots[spell.level - 1]--;
  }

  // Spell failure check
  if ((caster.spellFailure ?? 0) > 0 && rng.d100() <= caster.spellFailure!) {
    logs.push({
      actorId: caster.id,
      actorName: caster.name,
      type: "spell",
      detail: `${spell.name} — spell failure (${caster.spellFailure}%)`,
    });
    return logs;
  }

  // Concentration: if casting a concentration spell, drop old one
  if (spell.requiresConcentration) {
    if (caster.concentratingOn) {
      breakConcentration(caster, state);
      logs.push({
        actorId: caster.id,
        actorName: caster.name,
        type: "special",
        detail: `Dropped concentration on ${caster.concentratingOn}`,
      });
    }
    caster.concentratingOn = spell.name;
  }

  // Scale damage with caster level if applicable
  let effectiveDamage = spell.estimatedDamage;
  if (spell.scalesWithLevel && effectiveDamage && (caster.casterLevel ?? 0) > 0) {
    const maxDice = spell.maxDiceCount ?? 10;
    effectiveDamage = {
      ...effectiveDamage,
      count: Math.min(caster.casterLevel!, maxDice),
    };
  }

  if (spell.category === "aoe_damage" && effectiveDamage) {
    // AoE: hit a percentage (30-60%) of enemies in the zone
    const hitRate = 0.3 + rng.random() * 0.3;
    const hitCount = Math.max(1, Math.round(targets.length * hitRate));
    const shuffled = [...targets].sort(() => rng.random() - 0.5);
    const hit = shuffled.slice(0, hitCount);

    const baseDmg = rng.roll(effectiveDamage.count, effectiveDamage.sides, effectiveDamage.bonus);

    for (const target of hit) {
      if (!target.isAlive) continue;

      // Check damage type immunity
      if (spell.damageType && isImmuneToElement(target, spell.damageType)) {
        logs.push({
          actorId: caster.id,
          actorName: caster.name,
          type: "spell",
          target: target.id,
          targetName: target.name,
          detail: `${spell.name} — immune (${spell.damageType})`,
        });
        continue;
      }

      if (checkMagicResistance(target, rng)) {
        logs.push({
          actorId: caster.id,
          actorName: caster.name,
          type: "spell",
          target: target.id,
          targetName: target.name,
          detail: `${spell.name} — resisted (MR ${target.magicResistance}%)`,
        });
        continue;
      }

      let damage = baseDmg;
      if (spell.savingThrow !== "none" && makeSave(target, spell.savingThrow, rng)) {
        damage = Math.floor(damage / 2);
      }
      target.hpCurrent -= damage;
      if (target.hpCurrent <= 0) target.isAlive = false;

      logs.push({
        actorId: caster.id,
        actorName: caster.name,
        type: "spell",
        target: target.id,
        targetName: target.name,
        detail: `${spell.name} — ${damage} dmg${target.isAlive ? "" : " [KILLED]"}`,
        damage,
      });
    }
  } else if (spell.category === "single_damage" && effectiveDamage) {
    const target = targets[0];
    if (target && target.isAlive) {
      // Check damage type immunity
      if (spell.damageType && isImmuneToElement(target, spell.damageType)) {
        logs.push({
          actorId: caster.id,
          actorName: caster.name,
          type: "spell",
          target: target.id,
          targetName: target.name,
          detail: `${spell.name} — immune (${spell.damageType})`,
        });
      } else if (!checkMagicResistance(target, rng)) {
        let damage = Math.max(
          1,
          rng.roll(effectiveDamage.count, effectiveDamage.sides, effectiveDamage.bonus)
        );
        if (spell.savingThrow !== "none" && makeSave(target, spell.savingThrow, rng)) {
          damage = Math.floor(damage / 2);
        }
        target.hpCurrent -= damage;
        if (target.hpCurrent <= 0) target.isAlive = false;

        logs.push({
          actorId: caster.id,
          actorName: caster.name,
          type: "spell",
          target: target.id,
          targetName: target.name,
          detail: `${spell.name} — ${damage} dmg${target.isAlive ? "" : " [KILLED]"}`,
          damage,
        });
      }
    }
  } else if (spell.category === "cc") {
    const target = targets[0];
    if (target && target.isAlive) {
      if (checkMagicResistance(target, rng)) {
        logs.push({
          actorId: caster.id,
          actorName: caster.name,
          type: "spell",
          target: target.id,
          targetName: target.name,
          detail: `${spell.name} — resisted (MR)`,
        });
      } else if (spell.savingThrow !== "none" && makeSave(target, spell.savingThrow, rng)) {
        logs.push({
          actorId: caster.id,
          actorName: caster.name,
          type: "spell",
          target: target.id,
          targetName: target.name,
          detail: `${spell.name} — saved`,
        });
      } else {
        const eff: ActiveEffect = {
          name: spell.name,
          roundsRemaining: spell.duration,
          casterId: caster.id,
          effect: {},
        };

        // Determine CC effect type
        if (spell.conditions.includes("held")) {
          eff.effect.held = true;
        }
        if (spell.conditions.includes("charmed")) {
          eff.effect.charmed = true;
        }
        if (spell.conditions.includes("slowed")) {
          eff.effect.slowed = true;
        }
        if (spell.conditions.includes("silenced")) {
          eff.effect.silenced = true;
        }

        target.activeEffects.push(eff);

        const conditionLabel = spell.conditions.join(", ") || "held";
        logs.push({
          actorId: caster.id,
          actorName: caster.name,
          type: "spell",
          target: target.id,
          targetName: target.name,
          detail: `${spell.name} — ${conditionLabel} for ${spell.duration} rounds`,
        });
      }
    }
  } else if (spell.category === "heal" && effectiveDamage) {
    const target = targets[0];
    if (target && target.isAlive) {
      let healing: number;
      // Special case: full Heal spell (heals to max)
      if (spell.name === "Heal") {
        healing = target.hpMax - target.hpCurrent;
      } else {
        healing = rng.roll(effectiveDamage.count, effectiveDamage.sides, effectiveDamage.bonus);
      }
      target.hpCurrent = Math.min(target.hpMax, target.hpCurrent + healing);
      logs.push({
        actorId: caster.id,
        actorName: caster.name,
        type: "spell",
        target: target.id,
        targetName: target.name,
        detail: `${spell.name} — healed ${healing} HP`,
      });
    }
  } else if (spell.category === "buff") {
    for (const target of targets) {
      if (!target.isAlive) continue;
      const eff: ActiveEffect = {
        name: spell.name,
        roundsRemaining: spell.duration,
        casterId: caster.id,
        effect: {},
      };

      // Buff effect mapping
      switch (spell.name) {
        case "Haste":
          eff.effect.hasted = true;
          eff.effect.attacksPerRoundBonus = 1;
          eff.effect.acBonus = -2;
          break;
        case "Bless":
          eff.effect.thac0Bonus = -1;
          eff.effect.damageBonus = 1;
          break;
        case "Shield":
          eff.effect.acBonus = -4;
          break;
        case "Mirror Image":
          eff.effect.mirrorImages = 1 + Math.floor(rng.random() * 4);
          break;
        case "Stoneskin":
          eff.effect.stoneskinCharges = 1 + Math.floor(rng.random() * 4);
          break;
        case "Invisibility":
          eff.effect.invisible = true;
          break;
        case "Improved Invisibility":
          eff.effect.invisible = true;
          eff.effect.acBonus = -4;
          break;
        case "Blur":
          eff.effect.acBonus = -3;
          break;
        case "Protection from Evil 10'":
          eff.effect.acBonus = -2;
          eff.effect.saveBonusAll = 2;
          break;
        case "Sanctuary":
          eff.effect.sanctuary = true;
          break;
        case "Aid":
          eff.effect.thac0Bonus = -1;
          eff.effect.damageBonus = 1;
          eff.effect.tempHp = rng.d8();
          break;
        case "Prayer":
          eff.effect.thac0Bonus = -1;
          eff.effect.damageBonus = 1;
          break;
        default:
          // Generic buff with conditions
          if (spell.conditions.includes("invisible")) eff.effect.invisible = true;
          break;
      }
      target.activeEffects.push(eff);
    }

    // Prayer also debuffs enemies
    if (spell.name === "Prayer") {
      const enemies = state.entities.filter((e) => e.side !== caster.side && e.isAlive);
      for (const enemy of enemies) {
        enemy.activeEffects.push({
          name: "Prayer (debuff)",
          roundsRemaining: spell.duration,
          casterId: caster.id,
          effect: { thac0Bonus: 1, damageBonus: -1 },
        });
      }
    }

    logs.push({
      actorId: caster.id,
      actorName: caster.name,
      type: "spell",
      detail: `${spell.name} on ${targets.length} target(s)`,
    });
  } else if (spell.category === "counter") {
    const target = targets[0];
    if (target) {
      // Remove countered effects
      for (const counterCond of spell.counters) {
        target.activeEffects = target.activeEffects.filter((e) => {
          if (counterCond === "invisible" && e.effect.invisible) return false;
          if (counterCond === "hasted" && e.effect.hasted) return false;
          if (counterCond === "charmed" && e.effect.charmed) return false;
          if (counterCond === "held" && e.effect.held) return false;
          if (counterCond === "slowed" && e.effect.slowed) return false;
          return true;
        });
      }
      logs.push({
        actorId: caster.id,
        actorName: caster.name,
        type: "spell",
        target: target.id,
        targetName: target.name,
        detail: `${spell.name} — dispelled effects`,
      });
    }
  }

  return logs;
}

/**
 * Tick down active effects on an entity. Remove expired ones.
 */
export function tickEffects(entity: CombatEntity): void {
  entity.activeEffects = entity.activeEffects.filter((e) => {
    if (e.roundsRemaining === -1) return true; // Permanent
    e.roundsRemaining--;
    return e.roundsRemaining > 0;
  });

  // Clear concentration if the concentrated spell's effect expired
  if (entity.concentratingOn) {
    const stillActive = entity.activeEffects.some((e) => e.name === entity.concentratingOn);
    if (!stillActive) {
      entity.concentratingOn = null;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────

function selectTarget(attacker: CombatEntity, enemies: CombatEntity[]): CombatEntity | undefined {
  // Melee attackers prefer opposing frontline (melee zone)
  // Ranged attackers prefer opposing backline (ranged zone)
  const preferredZone = attacker.zone === "melee" ? "melee" : "ranged";
  const preferred = enemies.filter((e) => e.zone === preferredZone && e.isAlive);
  if (preferred.length > 0) return preferred[0];

  // Fallback: any alive enemy
  return enemies.find((e) => e.isAlive);
}

function getEffectiveThac0(entity: CombatEntity): number {
  let thac0 = entity.thac0;
  for (const eff of entity.activeEffects) {
    if (eff.effect.thac0Bonus) thac0 += eff.effect.thac0Bonus;
  }
  return thac0;
}

function getEffectiveAC(entity: CombatEntity): number {
  let ac = entity.ac;
  for (const eff of entity.activeEffects) {
    if (eff.effect.acBonus) ac += eff.effect.acBonus;
  }
  // Feared entities get +2 AC penalty (worse defense)
  if (entity.activeEffects.some((e) => e.effect.feared)) {
    ac += 2;
  }
  return ac;
}

function getEffectiveDamageBonus(entity: CombatEntity): number {
  let bonus = 0;
  for (const eff of entity.activeEffects) {
    if (eff.effect.damageBonus) bonus += eff.effect.damageBonus;
  }
  return bonus;
}

function getEffectiveAPR(entity: CombatEntity): number {
  let apr = entity.attacksPerRound;
  for (const eff of entity.activeEffects) {
    if (eff.effect.attacksPerRoundBonus) apr += eff.effect.attacksPerRoundBonus;
    if (eff.effect.slowed) apr = Math.max(0.5, apr / 2);
  }
  return apr;
}

function checkMagicResistance(target: CombatEntity, rng: SeededRng): boolean {
  if (target.magicResistance <= 0) return false;
  return rng.d100() <= target.magicResistance;
}

function makeSave(
  entity: CombatEntity,
  saveType: keyof typeof entity.saves,
  rng: SeededRng
): boolean {
  let target = entity.saves[saveType];
  // Apply save bonus from active effects
  for (const eff of entity.activeEffects) {
    if (eff.effect.saveBonusAll) target -= eff.effect.saveBonusAll;
  }
  return rng.d20() >= target;
}

function isImmuneToElement(entity: CombatEntity, element: string): boolean {
  return (entity.specialDefenses ?? []).some((d) => d.type === "immunity" && d.element === element);
}

/**
 * Break concentration: remove all effects created by this caster that match
 * the concentrated spell name.
 */
function breakConcentration(caster: CombatEntity, state: SimulationState): void {
  const spellName = caster.concentratingOn;
  if (!spellName) return;

  // Remove the effect from all entities (it may be on targets)
  for (const entity of state.entities) {
    entity.activeEffects = entity.activeEffects.filter(
      (e) => !(e.casterId === caster.id && e.name === spellName)
    );
  }
}
