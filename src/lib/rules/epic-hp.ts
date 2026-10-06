// TP-Abgleich, wenn epische Gegenstände die Konstitution ändern (Anlegen,
// Schadensstufe, Ausfall). Rein, damit Epic-Seite und Play Mode gleich rechnen.

import type { CharacterClassRow, EpicItemRow } from "@/lib/supabase/types";
import type { ClassId } from "./types";
import { getConstitutionModifiers } from "./abilities";
import { getClassGroup } from "./classes";
import { getConBonusCap } from "./hitpoints";
import { getMulticlassHpDivisor } from "./multiclass";
import { getEpicEffects } from "./epic-items";

/**
 * HP delta when the effective CON HP adjustment differs from the stored one.
 * Multiclass-aware (divisor applied per rules).
 */
export function computeHpDelta(
  effectiveConHpAdj: number,
  storedConHpAdj: number,
  activeClasses: Pick<CharacterClassRow, "class_id" | "level">[]
): number {
  if (effectiveConHpAdj === storedConHpAdj) return 0;
  const divisor = getMulticlassHpDivisor(activeClasses.length);
  let totalDelta = 0;
  for (const cc of activeClasses) {
    const group = getClassGroup(cc.class_id as ClassId);
    const cap = getConBonusCap(group);
    // Apply cap only to positive bonuses (penalties are uncapped per AD&D rules)
    const cappedNew = effectiveConHpAdj < 0 ? effectiveConHpAdj : Math.min(effectiveConHpAdj, cap);
    const cappedOld = storedConHpAdj < 0 ? storedConHpAdj : Math.min(storedConHpAdj, cap);
    totalDelta += (cappedNew - cappedOld) * cc.level;
  }
  return Math.round(totalDelta / divisor);
}

export interface HpAfterConChangeInput {
  itemsBefore: EpicItemRow[];
  itemsAfter: EpicItemRow[];
  character: {
    con: number;
    con_health?: number | null;
    con_fitness?: number | null;
    hp_max: number;
  };
  activeClasses: Pick<CharacterClassRow, "class_id" | "level">[];
  hpCurrent: number;
  characterLevel: number;
}

/**
 * Stored hp_current after an item change that alters the effective CON, or
 * null when nothing has to be written. CON↑ raises max HP but does not heal;
 * CON↓ clamps current HP to the new maximum.
 */
export function computeHpAfterConChange(input: HpAfterConChangeInput): number | null {
  const { itemsBefore, itemsAfter, character, activeClasses, hpCurrent, characterLevel } = input;
  const effectsBefore = getEpicEffects(itemsBefore, characterLevel);
  const effectsAfter = getEpicEffects(itemsAfter, characterLevel);

  const before = effectsBefore.forceStatOverrides.con ?? effectsBefore.statOverrides.con;
  const after = effectsAfter.forceStatOverrides.con ?? effectsAfter.statOverrides.con;
  const effectiveConBefore = before ?? character.con;
  const effectiveConAfter = after ?? character.con;
  if (effectiveConBefore === effectiveConAfter) return null;

  const storedConHpAdj = getConstitutionModifiers(
    character.con,
    character.con_health ?? undefined,
    character.con_fitness ?? undefined
  ).hpAdj;
  const deltaBefore = computeHpDelta(
    getConstitutionModifiers(effectiveConBefore).hpAdj,
    storedConHpAdj,
    activeClasses
  );
  const deltaAfter = computeHpDelta(
    getConstitutionModifiers(effectiveConAfter).hpAdj,
    storedConHpAdj,
    activeClasses
  );
  const effectiveMaxBefore = Math.max(1, character.hp_max + deltaBefore);
  const effectiveMaxAfter = Math.max(1, character.hp_max + deltaAfter);

  // Keep what the player sees: never heal, clamp to the new maximum.
  const visibleCurrentBefore = Math.min(hpCurrent, effectiveMaxBefore);
  const desired = Math.min(visibleCurrentBefore, effectiveMaxAfter);
  return desired === hpCurrent ? null : desired;
}
