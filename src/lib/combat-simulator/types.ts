/**
 * Central types for the Forge of Fate combat simulator.
 */

import type { SavingThrows } from "@/lib/rules/types";
import type { DamageDie } from "@/lib/rules/monsters";

export type Zone = "melee" | "ranged";
export type CombatRole = "tank" | "striker" | "artillery" | "support";
export type Side = "party" | "opposition";

export type SpellCategory =
  | "counter"
  | "aoe_damage"
  | "single_damage"
  | "cc"
  | "buff"
  | "heal"
  | "summon";

export type SaveType = keyof SavingThrows;

export interface SimSpell {
  name: string;
  level: number;
  type: "wizard" | "priest";
  castingTime: number;
  savingThrow: SaveType | "none";
  category: SpellCategory;
  targetMode: "single" | "zone_aoe" | "self" | "ally";
  estimatedDamage: DamageDie | null;
  /** Duration in rounds (-1 = permanent until dispelled) */
  duration: number;
  /** What conditions/effects this spell can counter */
  counters: string[];
  /** What conditions this spell applies */
  conditions: string[];
  /** Whether the caster must concentrate to maintain this spell */
  requiresConcentration?: boolean;
  /** Damage type for immunity checks (e.g., "fire", "cold", "lightning") */
  damageType?: string;
  /** If true, damage dice count scales with caster level */
  scalesWithLevel?: boolean;
  /** Maximum dice count for level-scaled spells */
  maxDiceCount?: number;
}

export interface ActiveEffect {
  name: string;
  roundsRemaining: number;
  /** ID of the caster who created this effect (for concentration tracking) */
  casterId?: string;
  effect: {
    acBonus?: number;
    thac0Bonus?: number;
    damageBonus?: number;
    invisible?: boolean;
    held?: boolean;
    charmed?: boolean;
    attacksPerRoundBonus?: number;
    hasted?: boolean;
    /** Mirror Image: number of images remaining (attacks destroy images instead of hitting) */
    mirrorImages?: number;
    /** Stoneskin: number of attacks absorbed (attack deals 0 damage) */
    stoneskinCharges?: number;
    /** Slow: halves attacks per round */
    slowed?: boolean;
    /** Silenced: cannot cast spells */
    silenced?: boolean;
    /** Sanctuary: enemies must save vs spell to target this entity */
    sanctuary?: boolean;
    /** Temporary HP (from Aid etc.) */
    tempHp?: number;
    /** Save bonus to all saving throws */
    saveBonusAll?: number;
    /** Feared: skip turn, AC penalty */
    feared?: boolean;
  };
}

/** Parsed monster special ability */
export interface MonsterAbility {
  type: "regeneration" | "poison" | "paralysis" | "fear" | "level_drain" | "constriction";
  regenPerRound?: number;
  poisonDamage?: number;
  poisonSavePenalty?: number;
  paralysisDuration?: number;
  drainLevels?: number;
}

/** Parsed monster special defense */
export interface MonsterDefense {
  type: "immunity" | "resistance" | "requires_magic_weapon";
  element?: string;
  weaponBonus?: number;
}

export interface CombatEntity {
  id: string;
  name: string;
  side: Side;
  source: "character" | "monster";

  // Combat stats
  ac: number;
  thac0: number;
  hpMax: number;
  hpCurrent: number;
  attacksPerRound: number;
  damageDice: DamageDie[];
  saves: SavingThrows;
  magicResistance: number;
  weaponSpeed: number;

  // Positioning
  zone: Zone;
  role: CombatRole;

  // Spellcasting
  spellSlots: number[] | null;
  knownSpells: SimSpell[];
  activeEffects: ActiveEffect[];

  // State
  isAlive: boolean;
  /** Fractional attack debt tracker (for 3/2 APR etc.) */
  attackDebt: number;

  // ─── Phase 1: Thief/Rogue abilities ───
  /** Backstab damage multiplier (x2-x5), null if not a thief */
  backstabMultiplier?: number | null;
  /** Hide in Shadows skill percentage (0-100) */
  hideInShadows?: number | null;
  /** Move Silently skill percentage (0-100) */
  moveSilently?: number | null;
  /** Whether the entity is currently hidden/stealthed */
  isHidden?: boolean;

  // ─── Phase 2: Concentration & Spell Failure ───
  /** Name of the spell currently being concentrated on */
  concentratingOn?: string | null;
  /** Spell failure percentage (from armor/epic items) */
  spellFailure?: number;
  /** Caster level for damage scaling */
  casterLevel?: number;

  // ─── Phase 4: Perception ───
  /** Perception score — floor((INT+WIS)/2) + bonuses */
  perception?: number;

  // ─── Phase 5: Monster special abilities ───
  specialAbilities?: MonsterAbility[];
  specialDefenses?: MonsterDefense[];
  /** Minimum magic weapon bonus needed to hit this entity */
  weaponMagicBonus?: number;
}

export interface ActionLogEntry {
  actorId: string;
  actorName: string;
  type: "attack" | "spell" | "skip" | "special";
  target?: string;
  targetName?: string;
  detail: string;
  damage?: number;
  hit?: boolean;
}

export interface RoundLogEntry {
  round: number;
  actions: ActionLogEntry[];
}

export interface SimulationState {
  round: number;
  entities: CombatEntity[];
  log: RoundLogEntry[];
  outcome: "party_win" | "opposition_win" | "ongoing";
  maxRounds: number;
}

export interface IterationOutcome {
  outcome: "party_win" | "opposition_win";
  rounds: number;
  totalPartyDamage: number;
  totalOppositionDamage: number;
  partySurvivors: number;
  log: RoundLogEntry[];
}

export interface SimulationResult {
  iterations: number;
  partyWins: number;
  oppositionWins: number;
  pWin: number;
  avgRounds: number;
  avgPartyDPR: number;
  avgOppositionDPR: number;
  avgPartySurvivors: number;
  difficulty: "trivial" | "easy" | "moderate" | "hard" | "deadly";
  /** Log from the median-outcome iteration */
  representativeLog: RoundLogEntry[];
}

export interface SimulationConfig {
  iterations: number;
  maxRounds: number;
  seed?: number;
}

export { type DamageDie };
