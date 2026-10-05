import { CLASSES } from "./classes";
import { getAttacksPerRound } from "./combat";
import { getAutoUnlockedLevel } from "./epic-items";
import { formatSpellSlotString, getLevelForXp } from "./experience";
import { getConBonusCap, getFixedHitPointsAfterNameLevel, getHitDiceLevelCap } from "./hitpoints";
import { getEffectiveHitDie } from "./kits";
import {
  getEffectiveClassEntries,
  getHighestActiveClassLevel,
  getMulticlassSaves,
  getMulticlassThac0,
} from "./multiclass";
import {
  getActivePowers,
  priesthoodHasCommandUndead,
  priesthoodHasTurnUndead,
} from "./priesthoods";
import { getNonweaponProficiencySlots, getWeaponProficiencySlots } from "./proficiencies";
import {
  getBardSpellSlots,
  getPaladinSpellSlots,
  getPriestSpellPoints,
  getPriestSpellSlots,
  getRangerSpellSlots,
  getWizardSpellPoints,
  getWizardSpellSlots,
} from "./spellslots";
import { getBackstabMultiplier, type ThiefSkills } from "./thief";
import {
  getPaladinTurnLevel,
  getTurnTarget,
  UNDEAD_TYPES,
  type TurnTableResult,
  type UndeadType,
} from "./turn-undead";
import type { ClassId, GrantedPower, SavingThrows } from "./types";
import type { EpicItemRow } from "@/lib/supabase/types";

/** The class rows a level-up looks at (subset of CharacterClassRow). */
export interface LevelUpClassRow {
  id: string;
  class_id: string;
  level: number;
  xp_current: number;
  is_active: boolean;
  switch_level: number | null;
}

// ─── Pending level-ups ─────────────────────────────────────────────────────

export interface PendingLevelUp {
  classRowId: string;
  classId: ClassId;
  fromLevel: number;
  toLevel: number;
}

/**
 * Classes whose XP already reach a higher level than their stored level. The
 * level itself only rises through the level-up assistant, one level at a time,
 * so each step gets its own hit point roll and skill points. Sorted by row id
 * for a stable order (the class queries carry no ORDER BY).
 */
export function getPendingLevelUps(classes: LevelUpClassRow[]): PendingLevelUp[] {
  return classes
    .filter((cc) => cc.is_active)
    .filter((cc) => getLevelForXp(cc.class_id as ClassId, cc.xp_current) > cc.level)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((cc) => ({
      classRowId: cc.id,
      classId: cc.class_id as ClassId,
      fromLevel: cc.level,
      toLevel: cc.level + 1,
    }));
}

// ─── Hit points ────────────────────────────────────────────────────────────

export interface LevelUpHitPointsInput {
  classId: string;
  newLevel: number;
  kit: string | null;
  /** Constitution hp adjustment incl. the fitness sub-stat (getConstitutionModifiers().hpAdj). */
  conHpAdj: number;
  /** All class rows of the character, before the level-up. */
  classes: Pick<LevelUpClassRow, "class_id" | "level" | "is_active" | "switch_level">[];
  /** The real die the player rolled; only needed in "roll" mode. */
  dieRoll?: number;
}

export interface LevelUpHitPoints {
  /** roll: die + Con; fixed: flat amount after name level; none: dormant dual-class. */
  mode: "roll" | "fixed" | "none";
  die: number;
  conBonus: number;
  divisor: number;
  /** Hit points gained; null while the roll is still missing. */
  gain: number | null;
}

/**
 * Hit points for one class level (PHB):
 * - Roll the class die (kit override) + Constitution bonus, at least 1 per die.
 *   Con bonus cap +4 if the character has an active warrior class, else +2.
 * - After 9th (warrior/priest) or 10th (rogue/wizard): fixed 3/2/2/1, no Con.
 * - Multiclass: die and Con bonus are each divided by the number of classes
 *   (rounded down, die at least 1). Fixed hit points are divided likewise —
 *   an assumption, the PHB is silent on it.
 * - Dual-class: no hit points while the new class is at or below the level
 *   at which the original class was given up.
 */
export function getLevelUpHitPoints(input: LevelUpHitPointsInput): LevelUpHitPoints {
  const cls = CLASSES[input.classId as ClassId];
  if (!cls) throw new Error(`Unknown class: ${input.classId}`);

  const die = getEffectiveHitDie(cls.hitDie, input.kit);
  const active = input.classes.filter((cc) => cc.is_active);

  const dualOrig = input.classes.find((cc) => cc.switch_level != null);
  if (dualOrig && dualOrig.class_id !== input.classId) {
    if (input.newLevel <= dualOrig.switch_level!) {
      return { mode: "none", die, conBonus: 0, divisor: 1, gain: 0 };
    }
  }
  const divisor = dualOrig ? 1 : Math.max(1, active.length);

  if (input.newLevel > getHitDiceLevelCap(cls.group)) {
    const fixed = getFixedHitPointsAfterNameLevel(cls.group);
    return {
      mode: "fixed",
      die,
      conBonus: 0,
      divisor,
      gain: Math.max(1, Math.floor(fixed / divisor)),
    };
  }

  const anyActiveWarrior = active.some(
    (cc) => CLASSES[cc.class_id as ClassId]?.group === "warrior"
  );
  const cap = getConBonusCap(anyActiveWarrior ? "warrior" : cls.group);
  const conBonus = input.conHpAdj < 0 ? input.conHpAdj : Math.min(input.conHpAdj, cap);

  if (input.dieRoll === undefined) {
    return { mode: "roll", die, conBonus, divisor, gain: null };
  }
  if (!Number.isInteger(input.dieRoll) || input.dieRoll < 1 || input.dieRoll > die) {
    throw new Error(`Die roll ${input.dieRoll} is not possible on a d${die}`);
  }

  const fromDie = Math.max(1, Math.floor(input.dieRoll / divisor));
  const fromCon = Math.floor(conBonus / divisor);
  return { mode: "roll", die, conBonus, divisor, gain: Math.max(1, fromDie + fromCon) };
}

// ─── Thief / bard skill points ─────────────────────────────────────────────

export type ThiefSkillKey = keyof ThiefSkills;

export const THIEF_SKILL_KEYS: ThiefSkillKey[] = [
  "pickLocks",
  "findTraps",
  "moveSilently",
  "hideInShadows",
  "climbWalls",
  "detectNoise",
  "readLanguages",
];

export interface SkillPointRules {
  points: number;
  maxPerSkill: number;
  cap: number;
  skills: ThiefSkillKey[];
}

/**
 * Discretionary skill points per level (PHB): thieves 30 on all skills, bards
 * 15 on their skills — max 15 per skill and level, no skill above 95%. Pick
 * Pockets has no field in the app, so points meant for it stay unassigned.
 */
export function getLevelUpSkillPoints(classId: string): SkillPointRules | null {
  if (classId === "thief") {
    return { points: 30, maxPerSkill: 15, cap: 95, skills: [...THIEF_SKILL_KEYS] };
  }
  if (classId === "bard") {
    return {
      points: 15,
      maxPerSkill: 15,
      cap: 95,
      skills: ["climbWalls", "detectNoise", "readLanguages"],
    };
  }
  return null;
}

export type SkillAllocation = Partial<Record<ThiefSkillKey, number>>;

export interface SkillAllocationError {
  skill: ThiefSkillKey;
  reason: "maxPerSkill" | "cap" | "negative" | "notAllowed";
}

export interface SkillAllocationResult {
  valid: boolean;
  /** Points not yet assigned; negative when overspent. */
  remaining: number;
  errors: SkillAllocationError[];
}

export function validateSkillAllocation(
  current: Record<ThiefSkillKey, number>,
  allocation: SkillAllocation,
  rules: SkillPointRules
): SkillAllocationResult {
  const errors: SkillAllocationError[] = [];
  let spent = 0;

  for (const [skill, raw] of Object.entries(allocation) as [ThiefSkillKey, number][]) {
    const points = raw ?? 0;
    if (points === 0) continue;
    spent += points;
    if (!rules.skills.includes(skill)) errors.push({ skill, reason: "notAllowed" });
    else if (points < 0) errors.push({ skill, reason: "negative" });
    else if (points > rules.maxPerSkill) errors.push({ skill, reason: "maxPerSkill" });
    else if ((current[skill] ?? 0) + points > rules.cap) errors.push({ skill, reason: "cap" });
  }

  const remaining = rules.points - spent;
  return { valid: errors.length === 0 && remaining >= 0, remaining, errors };
}

// ─── Summary of everything a level changes ─────────────────────────────────

export type LevelUpNote = "followers" | "stronghold" | "fixedHpNext";

export type LevelUpChange =
  | { kind: "thac0"; before: number; after: number }
  | { kind: "save"; save: keyof SavingThrows; before: number; after: number }
  | { kind: "attacks"; before: string; after: string }
  | { kind: "weaponSlots"; before: number; after: number }
  | { kind: "nwpSlots"; before: number; after: number }
  | { kind: "spellSlots"; list: "main" | "druid" | "wizard"; before: string; after: string }
  | { kind: "spellPoints"; before: number; after: number }
  | { kind: "backstab"; before: number; after: number }
  | { kind: "turnUndead"; undead: UndeadType; before: TurnTableResult; after: TurnTableResult }
  | { kind: "grantedPower"; power: GrantedPower }
  | {
      kind: "epicUnlock";
      itemName: string;
      itemNameEn: string | null;
      before: number;
      after: number;
    }
  | { kind: "note"; note: LevelUpNote };

/** Level-gated class features that have no field in the rules data (PHB). */
const LEVEL_UP_NOTES: { classId: ClassId; level: number; note: LevelUpNote }[] = [
  { classId: "fighter", level: 9, note: "followers" },
  { classId: "thief", level: 10, note: "followers" },
  { classId: "ranger", level: 10, note: "followers" },
  { classId: "bard", level: 9, note: "followers" },
  { classId: "cleric", level: 9, note: "stronghold" },
];

export interface LevelUpSummaryInput {
  /** `level` is the deprecated characters.level the app still uses for epic thresholds. */
  character: { level: number; priesthood: string | null };
  classes: LevelUpClassRow[];
  classRowId: string;
  epicItems: EpicItemRow[];
}

const SAVE_KEYS: (keyof SavingThrows)[] = [
  "paralyzation",
  "rod",
  "petrification",
  "breath",
  "spell",
];

function spellSlotLists(
  classId: ClassId,
  level: number
): { list: "main" | "druid" | "wizard"; slots: number[] }[] {
  if (classId === "ranger") {
    const { druid, wizard } = getRangerSpellSlots(level);
    return [
      { list: "druid", slots: druid },
      { list: "wizard", slots: wizard },
    ];
  }
  if (classId === "paladin") return [{ list: "main", slots: getPaladinSpellSlots(level) }];
  if (classId === "bard") return [{ list: "main", slots: getBardSpellSlots(level) }];
  const group = CLASSES[classId]?.group;
  if (group === "wizard") return [{ list: "main", slots: getWizardSpellSlots(level) }];
  if (group === "priest") return [{ list: "main", slots: getPriestSpellSlots(level) }];
  return [];
}

/** Effective turning level for the class, or 0 if it cannot turn undead. */
function turningLevel(classId: ClassId, level: number, priesthood: string | null): number {
  if (classId === "paladin") return level >= 3 ? getPaladinTurnLevel(level) : 0;
  if (classId !== "cleric") return 0;
  if (!priesthood) return level;
  return priesthoodHasTurnUndead(priesthood) || priesthoodHasCommandUndead(priesthood) ? level : 0;
}

/**
 * Everything one class level changes, as before → after pairs. THAC0 and saves
 * use the effective multiclass/dual-class entries, so only changes the player
 * actually sees are listed. Epic unlocks compare against characters.level
 * (what the app used so far) and the new highest active class level.
 */
export function buildLevelUpSummary(input: LevelUpSummaryInput): LevelUpChange[] {
  const row = input.classes.find((cc) => cc.id === input.classRowId);
  if (!row) return [];
  const classId = row.class_id as ClassId;
  const cls = CLASSES[classId];
  if (!cls) return [];

  const from = row.level;
  const to = from + 1;
  const after = input.classes.map((cc) => (cc.id === row.id ? { ...cc, level: to } : cc));
  const changes: LevelUpChange[] = [];

  const entriesBefore = getEffectiveClassEntries(input.classes);
  const entriesAfter = getEffectiveClassEntries(after);

  const thac0Before = getMulticlassThac0(entriesBefore);
  const thac0After = getMulticlassThac0(entriesAfter);
  if (thac0Before !== thac0After)
    changes.push({ kind: "thac0", before: thac0Before, after: thac0After });

  const savesBefore = getMulticlassSaves(entriesBefore);
  const savesAfter = getMulticlassSaves(entriesAfter);
  for (const save of SAVE_KEYS) {
    if (savesBefore[save] !== savesAfter[save]) {
      changes.push({ kind: "save", save, before: savesBefore[save], after: savesAfter[save] });
    }
  }

  if (cls.group === "warrior" || classId === "crusader") {
    const attacksBefore = getAttacksPerRound("warrior", from, false);
    const attacksAfter = getAttacksPerRound("warrior", to, false);
    if (attacksBefore !== attacksAfter)
      changes.push({ kind: "attacks", before: attacksBefore, after: attacksAfter });
  }

  const wpBefore = getWeaponProficiencySlots(cls.group, from);
  const wpAfter = getWeaponProficiencySlots(cls.group, to);
  if (wpBefore !== wpAfter) changes.push({ kind: "weaponSlots", before: wpBefore, after: wpAfter });

  const nwpBefore = getNonweaponProficiencySlots(cls.group, from);
  const nwpAfter = getNonweaponProficiencySlots(cls.group, to);
  if (nwpBefore !== nwpAfter)
    changes.push({ kind: "nwpSlots", before: nwpBefore, after: nwpAfter });

  const listsAfter = spellSlotLists(classId, to);
  spellSlotLists(classId, from).forEach(({ list, slots }, i) => {
    const before = formatSpellSlotString(slots);
    const afterSlots = formatSpellSlotString(listsAfter[i].slots);
    if (before !== afterSlots)
      changes.push({ kind: "spellSlots", list, before, after: afterSlots });
  });

  const spellPoints =
    cls.group === "priest"
      ? getPriestSpellPoints
      : cls.group === "wizard"
        ? getWizardSpellPoints
        : null;
  if (spellPoints && spellPoints(from) !== spellPoints(to)) {
    changes.push({ kind: "spellPoints", before: spellPoints(from), after: spellPoints(to) });
  }

  if (classId === "thief" && getBackstabMultiplier(from) !== getBackstabMultiplier(to)) {
    changes.push({
      kind: "backstab",
      before: getBackstabMultiplier(from),
      after: getBackstabMultiplier(to),
    });
  }

  const turnBefore = turningLevel(classId, from, input.character.priesthood);
  const turnAfter = turningLevel(classId, to, input.character.priesthood);
  if (turnAfter > 0) {
    for (const undead of UNDEAD_TYPES) {
      const before = turnBefore > 0 ? getTurnTarget(undead, turnBefore) : null;
      const afterTarget = getTurnTarget(undead, turnAfter);
      if (before !== afterTarget)
        changes.push({ kind: "turnUndead", undead, before, after: afterTarget });
    }
  }

  if (input.character.priesthood && (classId === "cleric" || classId === "druid")) {
    const known = new Set(getActivePowers(input.character.priesthood, from).map((p) => p.id));
    for (const power of getActivePowers(input.character.priesthood, to)) {
      if (!known.has(power.id)) changes.push({ kind: "grantedPower", power });
    }
  }

  const epicLevelAfter = getHighestActiveClassLevel(after, input.character.level);
  for (const item of input.epicItems) {
    const before = getAutoUnlockedLevel(item, input.character.level);
    const afterStage = getAutoUnlockedLevel(item, epicLevelAfter);
    if (afterStage > before) {
      changes.push({
        kind: "epicUnlock",
        itemName: item.name,
        itemNameEn: item.name_en ?? null,
        before,
        after: afterStage,
      });
    }
  }

  for (const entry of LEVEL_UP_NOTES) {
    if (entry.classId === classId && entry.level === to)
      changes.push({ kind: "note", note: entry.note });
  }
  if (to === getHitDiceLevelCap(cls.group)) changes.push({ kind: "note", note: "fixedHpNext" });

  return changes;
}
