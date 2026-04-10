/**
 * Monte Carlo combat simulator — "Forge of Fate"
 * Runs N iterations of combat and aggregates results.
 */

import type {
  CombatEntity,
  SimulationState,
  SimulationResult,
  SimulationConfig,
  IterationOutcome,
  ActionLogEntry,
} from "./types";
import { createSeededRng, type SeededRng } from "./dice";
import { resolveEntityTurn, tickEffects } from "./resolver";

const DEFAULT_CONFIG: SimulationConfig = {
  iterations: 20,
  maxRounds: 30,
};

/**
 * Run a full Monte Carlo combat simulation.
 */
export function runSimulation(
  partyEntities: CombatEntity[],
  oppositionEntities: CombatEntity[],
  config: Partial<SimulationConfig> = {}
): SimulationResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const baseSeed = cfg.seed ?? Date.now();
  const outcomes: IterationOutcome[] = [];

  for (let i = 0; i < cfg.iterations; i++) {
    const rng = createSeededRng(baseSeed + i);
    const result = runSingleIteration(partyEntities, oppositionEntities, cfg.maxRounds, rng);
    outcomes.push(result);
  }

  return aggregateResults(outcomes, cfg.iterations);
}

/**
 * Run a single combat iteration.
 */
function runSingleIteration(
  partyTemplate: CombatEntity[],
  oppositionTemplate: CombatEntity[],
  maxRounds: number,
  rng: SeededRng
): IterationOutcome {
  const state: SimulationState = {
    round: 0,
    entities: [...deepCloneEntities(partyTemplate), ...deepCloneEntities(oppositionTemplate)],
    log: [],
    outcome: "ongoing",
    maxRounds,
  };

  let totalPartyDamage = 0;
  let totalOppositionDamage = 0;

  while (state.outcome === "ongoing" && state.round < maxRounds) {
    state.round++;
    const roundLog: ActionLogEntry[] = [];

    // Roll initiative for all living entities (lower = faster)
    const living = state.entities.filter((e) => e.isAlive);
    const initiatives = new Map<string, number>();
    for (const entity of living) {
      initiatives.set(entity.id, rollInitiative(entity, rng));
    }

    // Sort by initiative (ascending = fastest first)
    const turnOrder = [...living].sort(
      (a, b) => (initiatives.get(a.id) ?? 10) - (initiatives.get(b.id) ?? 10)
    );

    // Resolve each entity's turn
    for (const entity of turnOrder) {
      if (!entity.isAlive) continue;

      // Tick effects
      tickEffects(entity);

      // Resolve turn
      const actions = resolveEntityTurn(entity, state, rng);
      roundLog.push(...actions);

      // Track damage
      for (const action of actions) {
        if (action.damage && action.damage > 0) {
          if (entity.side === "party") totalPartyDamage += action.damage;
          else totalOppositionDamage += action.damage;
        }
      }
    }

    state.log.push({ round: state.round, actions: roundLog });

    // Check victory
    const partyAlive = state.entities.filter((e) => e.side === "party" && e.isAlive);
    const oppAlive = state.entities.filter((e) => e.side === "opposition" && e.isAlive);

    if (oppAlive.length === 0) state.outcome = "party_win";
    else if (partyAlive.length === 0) state.outcome = "opposition_win";
  }

  // Timeout = opposition wins (unbreakable morale)
  if (state.outcome === "ongoing") state.outcome = "opposition_win";

  return {
    outcome: state.outcome as "party_win" | "opposition_win",
    rounds: state.round,
    totalPartyDamage,
    totalOppositionDamage,
    partySurvivors: state.entities.filter((e) => e.side === "party" && e.isAlive).length,
    log: state.log,
  };
}

function rollInitiative(entity: CombatEntity, rng: SeededRng): number {
  // Perception bonus: higher perception = slight initiative edge (lower = faster)
  const perceptionBonus = Math.floor((entity.perception ?? 10) / 5);
  return rng.d10() + entity.weaponSpeed - perceptionBonus;
}

function deepCloneEntities(entities: CombatEntity[]): CombatEntity[] {
  return entities.map((e) => ({
    ...e,
    damageDice: e.damageDice.map((d) => ({ ...d })),
    saves: { ...e.saves },
    spellSlots: e.spellSlots ? [...e.spellSlots] : null,
    knownSpells: [...e.knownSpells],
    activeEffects: e.activeEffects.map((a) => ({ ...a, effect: { ...a.effect } })),
    specialAbilities: e.specialAbilities ? [...e.specialAbilities] : [],
    specialDefenses: e.specialDefenses ? [...e.specialDefenses] : [],
  }));
}

function aggregateResults(outcomes: IterationOutcome[], iterations: number): SimulationResult {
  const partyWins = outcomes.filter((o) => o.outcome === "party_win").length;
  const pWin = partyWins / iterations;

  const avgRounds = outcomes.reduce((s, o) => s + o.rounds, 0) / iterations;
  const avgPartySurvivors = outcomes.reduce((s, o) => s + o.partySurvivors, 0) / iterations;

  const totalRounds = outcomes.reduce((s, o) => s + o.rounds, 0);
  const avgPartyDPR =
    totalRounds > 0 ? outcomes.reduce((s, o) => s + o.totalPartyDamage, 0) / totalRounds : 0;
  const avgOppositionDPR =
    totalRounds > 0 ? outcomes.reduce((s, o) => s + o.totalOppositionDamage, 0) / totalRounds : 0;

  // Difficulty rating
  let difficulty: SimulationResult["difficulty"];
  if (pWin >= 0.9) difficulty = "trivial";
  else if (pWin >= 0.7) difficulty = "easy";
  else if (pWin >= 0.4) difficulty = "moderate";
  else if (pWin >= 0.2) difficulty = "hard";
  else difficulty = "deadly";

  // Representative log: pick the iteration closest to median round count
  const sorted = [...outcomes].sort((a, b) => a.rounds - b.rounds);
  const medianIdx = Math.floor(sorted.length / 2);
  const representativeLog = sorted[medianIdx]?.log ?? [];

  return {
    iterations,
    partyWins,
    oppositionWins: iterations - partyWins,
    pWin,
    avgRounds: Math.round(avgRounds * 10) / 10,
    avgPartyDPR: Math.round(avgPartyDPR * 10) / 10,
    avgOppositionDPR: Math.round(avgOppositionDPR * 10) / 10,
    avgPartySurvivors: Math.round(avgPartySurvivors * 10) / 10,
    difficulty,
    representativeLog,
  };
}
