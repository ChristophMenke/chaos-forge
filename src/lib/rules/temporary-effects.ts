/**
 * Temporary effects (spells, monster attacks, injuries, poison, disease,
 * environment) — pure aggregation of a character's active effects into the
 * adjustments the derived values need.
 *
 * Values are stored in PLAYER terms: positive = advantage. Callers convert
 * where AD&D counts downwards (saves, THAC0, AC: a +1 bonus lowers the number).
 * Conditional changes ("+2 vs. evil") never enter the numbers — they are
 * collected as notes, because the app cannot know what a roll is against.
 */
import type {
  CharacterEffectRow,
  EffectFlag,
  EffectModifier,
  EffectOp,
  EffectTarget,
} from "@/lib/supabase/types";

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export type SaveKey = "paralyzation" | "rod" | "petrification" | "breath" | "spell";

export const ABILITY_KEYS: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];
export const SAVE_KEYS: SaveKey[] = ["paralyzation", "rod", "petrification", "breath", "spell"];

const SAVE_TARGETS: Record<SaveKey, EffectTarget> = {
  paralyzation: "saveParalyzation",
  rod: "saveRod",
  petrification: "savePetrification",
  breath: "saveBreath",
  spell: "saveSpell",
};

/** Factors offered in the UI (Haste ×2 … held ×0). */
export const FACTOR_CHOICES = [2, 2 / 3, 1 / 2, 1 / 3, 0] as const;

const ABILITY_OPS: EffectOp[] = ["delta", "set", "factor"];

/** Which operations each target supports. */
export const ALLOWED_OPS: Record<EffectTarget, EffectOp[]> = {
  str: ABILITY_OPS,
  dex: ABILITY_OPS,
  con: ABILITY_OPS,
  int: ABILITY_OPS,
  wis: ABILITY_OPS,
  cha: ABILITY_OPS,
  allAbilities: ABILITY_OPS,
  savesAll: ["delta"],
  saveParalyzation: ["delta"],
  saveRod: ["delta"],
  savePetrification: ["delta"],
  saveBreath: ["delta"],
  saveSpell: ["delta"],
  attack: ["delta"],
  damage: ["delta"],
  ac: ["delta", "set"],
  movement: ["factor"],
  attacksPerRound: ["factor"],
  tempHp: ["delta"],
  perception: ["delta"],
  abilityChecks: ["delta"],
  /** Percentage points on every thief skill. */
  thiefSkills: ["delta"],
  /** Percentage points chance to miscast. */
  spellFailure: ["delta"],
};

export function validateModifier(modifier: EffectModifier): boolean {
  const ops = ALLOWED_OPS[modifier.target];
  if (!ops || !ops.includes(modifier.op)) return false;
  if (!Number.isFinite(modifier.value)) return false;
  if (modifier.op === "factor") {
    return FACTOR_CHOICES.some((f) => Math.abs(f - modifier.value) < 1e-9);
  }
  return Number.isInteger(modifier.value);
}

// ─── Aggregation ───────────────────────────────────────────────────────────

export interface EffectSource {
  effectName: string;
  op: EffectOp;
  value: number;
}

export interface AbilityAdjustment {
  set: number | null;
  factor: number;
  delta: number;
}

export interface ConditionalNote {
  target: EffectTarget;
  value: number;
  condition: string;
  effectName: string;
}

export interface EffectSummary {
  abilities: Record<AbilityKey, AbilityAdjustment>;
  /** Save bonus per category (player terms; savesAll included). */
  saves: Record<SaveKey, number>;
  attack: number;
  damage: number;
  /** AC bonus in player terms — subtract from the AC number. */
  acBonus: number;
  acSet: number | null;
  movementFactor: number;
  attacksFactor: number;
  /** Temporary hit points still left on active effects. */
  tempHp: number;
  perception: number;
  abilityChecks: number;
  thiefSkills: number;
  spellFailure: number;
  noAttacks: boolean;
  cannotCast: boolean;
  noDexAc: boolean;
  noShield: boolean;
  flags: EffectFlag[];
  conditionalNotes: ConditionalNote[];
  /** Which effects contributed to a target (for "where does this come from"). */
  sources: Partial<Record<EffectTarget | SaveKey, EffectSource[]>>;
}

function emptyAbility(): AbilityAdjustment {
  return { set: null, factor: 1, delta: 0 };
}

export function emptyEffectSummary(): EffectSummary {
  return {
    abilities: {
      str: emptyAbility(),
      dex: emptyAbility(),
      con: emptyAbility(),
      int: emptyAbility(),
      wis: emptyAbility(),
      cha: emptyAbility(),
    },
    saves: { paralyzation: 0, rod: 0, petrification: 0, breath: 0, spell: 0 },
    attack: 0,
    damage: 0,
    acBonus: 0,
    acSet: null,
    movementFactor: 1,
    attacksFactor: 1,
    tempHp: 0,
    perception: 0,
    abilityChecks: 0,
    thiefSkills: 0,
    spellFailure: 0,
    noAttacks: false,
    cannotCast: false,
    noDexAc: false,
    noShield: false,
    flags: [],
    conditionalNotes: [],
    sources: {},
  };
}

/** Active effects, oldest first (later effects win set-to conflicts). */
function activeInOrder(effects: CharacterEffectRow[]): CharacterEffectRow[] {
  return effects
    .filter((e) => e.ended_at == null)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

function applyToAbility(adjustment: AbilityAdjustment, modifier: EffectModifier): void {
  if (modifier.op === "set") adjustment.set = modifier.value;
  else if (modifier.op === "factor") adjustment.factor *= modifier.value;
  else adjustment.delta += modifier.value;
}

export function aggregateEffects(effects: CharacterEffectRow[]): EffectSummary {
  const summary = emptyEffectSummary();
  const flags = new Set<EffectFlag>();

  const addSource = (key: EffectTarget | SaveKey, effectName: string, m: EffectModifier) => {
    (summary.sources[key] ??= []).push({ effectName, op: m.op, value: m.value });
  };

  for (const effect of activeInOrder(effects)) {
    for (const flag of effect.flags ?? []) flags.add(flag);
    summary.tempHp += effect.temp_hp_remaining ?? 0;

    for (const m of effect.modifiers ?? []) {
      if (!validateModifier(m)) continue;
      if (m.condition && m.condition.trim() !== "") {
        summary.conditionalNotes.push({
          target: m.target,
          value: m.value,
          condition: m.condition.trim(),
          effectName: effect.name,
        });
        continue;
      }

      switch (m.target) {
        case "str":
        case "dex":
        case "con":
        case "int":
        case "wis":
        case "cha":
          applyToAbility(summary.abilities[m.target], m);
          addSource(m.target, effect.name, m);
          break;
        case "allAbilities":
          for (const key of ABILITY_KEYS) {
            applyToAbility(summary.abilities[key], m);
            addSource(key, effect.name, m);
          }
          break;
        case "savesAll":
          for (const key of SAVE_KEYS) {
            summary.saves[key] += m.value;
            addSource(key, effect.name, m);
          }
          break;
        case "saveParalyzation":
        case "saveRod":
        case "savePetrification":
        case "saveBreath":
        case "saveSpell": {
          const key = SAVE_KEYS.find((k) => SAVE_TARGETS[k] === m.target)!;
          summary.saves[key] += m.value;
          addSource(key, effect.name, m);
          break;
        }
        case "ac":
          if (m.op === "set") summary.acSet = m.value;
          else summary.acBonus += m.value;
          addSource("ac", effect.name, m);
          break;
        case "movement":
          summary.movementFactor *= m.value;
          addSource("movement", effect.name, m);
          break;
        case "attacksPerRound":
          summary.attacksFactor *= m.value;
          addSource("attacksPerRound", effect.name, m);
          break;
        case "tempHp":
          // The granted amount lives on the effect (temp_hp_remaining).
          addSource("tempHp", effect.name, m);
          break;
        case "attack":
        case "damage":
        case "perception":
        case "abilityChecks":
        case "thiefSkills":
        case "spellFailure":
          summary[m.target] += m.value;
          addSource(m.target, effect.name, m);
          break;
      }
    }
  }

  summary.flags = [...flags];
  summary.noAttacks = flags.has("noAttacks") || summary.attacksFactor === 0;
  summary.cannotCast = flags.has("cannotCast");
  summary.noDexAc = flags.has("noDexAc");
  summary.noShield = flags.has("noShield");
  return summary;
}

/**
 * Applies the effects to an ability that already includes items: set-to
 * (most recent wins) → factors → deltas, clamped to 0–25. 0 stays possible so
 * the threshold warning can say "deadly"; the modifier tables use
 * toModifierScore() instead.
 */
export function applyEffectsToAbility(resolved: number, adjustment: AbilityAdjustment): number {
  const base = adjustment.set ?? resolved;
  const value = Math.floor(base * adjustment.factor) + adjustment.delta;
  return Math.max(0, Math.min(25, value));
}

/**
 * Attacks per round ("1", "3/2", "2") scaled by the effect factor and kept as
 * a fraction ("3/2" × ½ = "3/4"). "0" when the character cannot attack.
 */
export function scaleAttacksPerRound(
  rate: string,
  summary: Pick<EffectSummary, "attacksFactor" | "noAttacks">
): string {
  if (summary.noAttacks || summary.attacksFactor === 0) return "0";
  if (summary.attacksFactor === 1) return rate;
  const [num, den = "1"] = rate.split("/");
  const value = (Number(num) / Number(den)) * summary.attacksFactor;
  for (let d = 1; d <= 12; d++) {
    const n = Math.round(value * d);
    if (Math.abs(n / d - value) < 1e-9) {
      return d === 1 ? String(n) : `${n}/${d}`;
    }
  }
  return String(Math.round(value * 100) / 100);
}

// ─── Temporary hit points ──────────────────────────────────────────────────

export interface TempHpConsumption {
  updates: { id: string; temp_hp_remaining: number }[];
  remainingDamage: number;
}

/** Damage eats temporary hit points first, oldest effect first; the rest hits HP. */
export function consumeTempHp(effects: CharacterEffectRow[], damage: number): TempHpConsumption {
  let remainingDamage = Math.max(0, damage);
  const updates: TempHpConsumption["updates"] = [];

  for (const effect of activeInOrder(effects)) {
    if (remainingDamage === 0) break;
    if ((effect.temp_hp_remaining ?? 0) <= 0) continue;
    const absorbed = Math.min(effect.temp_hp_remaining, remainingDamage);
    remainingDamage -= absorbed;
    updates.push({ id: effect.id, temp_hp_remaining: effect.temp_hp_remaining - absorbed });
  }

  return { updates, remainingDamage };
}

// ─── Warnings ──────────────────────────────────────────────────────────────

export interface ThresholdWarning {
  ability: AbilityKey;
  value: number;
  level: "deadly" | "unconscious" | "incapacitated";
}

/**
 * Rule thresholds seen across the sources (shadow, pernicon, …): 0 is deadly,
 * Constitution below 3 means unconscious, anything else below 3 leaves the
 * character incapacitated. Warnings only — the app never applies them.
 */
export function getThresholdWarnings(values: Record<AbilityKey, number>): ThresholdWarning[] {
  const warnings: ThresholdWarning[] = [];
  for (const ability of ABILITY_KEYS) {
    const value = values[ability];
    if (value <= 0) warnings.push({ ability, value, level: "deadly" });
    else if (value < 3) {
      warnings.push({ ability, value, level: ability === "con" ? "unconscious" : "incapacitated" });
    }
  }
  return warnings;
}

/** Presets active more than once ("multiple bless spells are not cumulative"). */
export function getStackingWarnings(effects: CharacterEffectRow[]): string[] {
  const counts = new Map<string, number>();
  for (const effect of activeInOrder(effects)) {
    if (!effect.preset_key) continue;
    counts.set(effect.preset_key, (counts.get(effect.preset_key) ?? 0) + 1);
  }
  return [...counts].filter(([, n]) => n > 1).map(([key]) => key);
}
