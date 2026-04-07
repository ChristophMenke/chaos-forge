export { runSimulation } from "./simulator";
export { characterToCombatEntity, monsterToCombatEntities } from "./adapters";
export { createSeededRng } from "./dice";
export { COMBAT_SPELLS, matchSpellToCatalog } from "./spell-catalog";
export { parseSpecialAttacks, parseSpecialDefenses } from "./monster-abilities";
export type {
  CombatEntity,
  SimulationResult,
  SimulationConfig,
  RoundLogEntry,
  ActionLogEntry,
  SimSpell,
  CombatRole,
  Zone,
  Side,
  MonsterAbility,
  MonsterDefense,
} from "./types";
