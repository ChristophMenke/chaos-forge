import type { ClassId, MagicSchool, PriestSphere, SphereAccess } from "./types";
import { getPriesthood } from "./priesthoods";

// ─── WIZARD SPECIALIST SCHOOLS ─────────────────────────────────────────────────
// PHB Table 22: Specialist Wizards

export interface SpecialistDefinition {
  classId: ClassId;
  school: MagicSchool;
  oppositionSchools: MagicSchool[];
}

export const SPECIALISTS: SpecialistDefinition[] = [
  { classId: "abjurer", school: "abjuration", oppositionSchools: ["alteration", "illusion"] },
  {
    classId: "conjurer",
    school: "conjuration",
    oppositionSchools: ["divination", "invocation"],
  },
  { classId: "diviner", school: "divination", oppositionSchools: ["conjuration"] },
  {
    classId: "enchanter",
    school: "enchantment",
    oppositionSchools: ["invocation", "necromancy"],
  },
  {
    classId: "illusionist",
    school: "illusion",
    oppositionSchools: ["necromancy", "invocation", "abjuration"],
  },
  {
    classId: "invoker",
    school: "invocation",
    oppositionSchools: ["enchantment", "conjuration"],
  },
  {
    classId: "necromancer",
    school: "necromancy",
    oppositionSchools: ["illusion", "enchantment"],
  },
  {
    classId: "transmuter",
    school: "alteration",
    oppositionSchools: ["abjuration", "necromancy"],
  },
];

export function getSpecialist(classId: ClassId): SpecialistDefinition | null {
  return SPECIALISTS.find((s) => s.classId === classId) ?? null;
}

export function getOppositionSchools(classId: ClassId): MagicSchool[] {
  const spec = getSpecialist(classId);
  return spec ? spec.oppositionSchools : [];
}

// ─── PRIEST SPHERE ACCESS ──────────────────────────────────────────────────────
// PHB: Cleric and Druid sphere access

export type SphereMap = Partial<Record<PriestSphere, SphereAccess>>;

export const CLERIC_SPHERES: SphereMap = {
  all: "major",
  astral: "major",
  charm: "major",
  combat: "major",
  creation: "major",
  divination: "major",
  guardian: "major",
  healing: "major",
  necromantic: "major",
  protection: "major",
  summoning: "major",
  sun: "major",
  elemental: "minor",
  weather: "minor",
};

export const CRUSADER_SPHERES: SphereMap = {
  all: "major",
  combat: "major",
  guardian: "major",
  healing: "major",
  war: "major",
  wards: "major",
  necromantic: "minor",
  protection: "minor",
};

export const MONK_SPHERES: SphereMap = {
  all: "major",
  divination: "major",
  guardian: "major",
  numbers: "major",
  thought: "major",
  combat: "minor",
  healing: "minor",
  necromantic: "minor",
  time: "minor",
};

export const SHAMAN_SPHERES: SphereMap = {
  all: "major",
  animal: "major",
  protection: "major",
  summoning: "major",
  travelers: "major",
  wards: "major",
  healing: "minor",
  plant: "minor",
};

export const DRUID_SPHERES: SphereMap = {
  all: "major",
  animal: "major",
  elemental: "major",
  healing: "major",
  plant: "major",
  weather: "major",
  divination: "minor",
};

/** Classes that cast priest spells (full or partial) */
const PRIEST_CASTER_IDS: ClassId[] = [
  "cleric",
  "crusader",
  "druid",
  "monk",
  "shaman",
  "ranger",
  "paladin",
];

export function isPriestCaster(classId: ClassId): boolean {
  return PRIEST_CASTER_IDS.includes(classId);
}

export function getPriestSpheres(
  classId: ClassId,
  priesthoodId?: string | null,
  alignment?: string | null
): SphereMap {
  // Monk: own spheres, can choose a priesthood (PO:S&M)
  if (classId === "monk") {
    if (priesthoodId) {
      const priesthood = getPriesthood(priesthoodId);
      if (priesthood) return { ...priesthood.spheres };
    }
    return { ...MONK_SPHERES };
  }

  // Shaman: own spheres, can choose a priesthood (PO:S&M)
  if (classId === "shaman") {
    if (priesthoodId) {
      const priesthood = getPriesthood(priesthoodId);
      if (priesthood) return { ...priesthood.spheres };
    }
    return { ...SHAMAN_SPHERES };
  }

  // Druid always uses own spheres (no priesthood)
  if (classId === "druid") return { ...DRUID_SPHERES };

  // Ranger uses druid spheres (PHB Ch3: Ranger)
  if (classId === "ranger") return { ...DRUID_SPHERES };

  // Paladin uses standard cleric spheres (PHB Ch3: Paladin)
  if (classId === "paladin") return { ...CLERIC_SPHERES };

  // Crusader: own spheres + alignment-based law/chaos (PO:S&M)
  // Priesthood fully replaces Crusader defaults including alignment spheres
  if (classId === "crusader") {
    if (priesthoodId) {
      const priesthood = getPriesthood(priesthoodId);
      if (priesthood) return { ...priesthood.spheres };
    }
    const spheres: SphereMap = { ...CRUSADER_SPHERES };
    if (alignment?.startsWith("lawful")) spheres.law = "major";
    else if (alignment?.startsWith("chaotic")) spheres.chaos = "major";
    return spheres;
  }

  // If priesthood specified, use its spheres
  if (priesthoodId) {
    const priesthood = getPriesthood(priesthoodId);
    if (priesthood) return { ...priesthood.spheres };
  }

  // Fallback: standard cleric spheres
  if (classId === "cleric") return { ...CLERIC_SPHERES };

  return {};
}

export function hasSphereAccess(
  classId: ClassId,
  sphere: PriestSphere,
  accessLevel: SphereAccess,
  priesthoodId?: string | null,
  alignment?: string | null
): boolean {
  const spheres = getPriestSpheres(classId, priesthoodId, alignment);
  const access = spheres[sphere];
  if (!access) return false;
  if (accessLevel === "minor") return true; // major includes minor access
  return access === "major";
}

// ─── SPELL DATA STRUCTURE ──────────────────────────────────────────────────────

export interface SpellDefinition {
  name: string;
  level: number;
  type: "wizard" | "priest";
  school?: MagicSchool; // for wizard spells
  sphere?: PriestSphere; // for priest spells
  range: string;
  duration: string;
  areaOfEffect: string;
  components: ("V" | "S" | "M")[];
  description: string;
}

// ─── AVAILABLE PRIEST SPELLS ──────────────────────────────────────────────────
// Priests automatically know all spells in their spheres (PHB: "The knowledge
// of what spells are available to the priest becomes instantly clear as soon as
// he advances in level."). This function dynamically filters the spell database.

/** Minimal spell interface for filtering — works with both SpellRow and test mocks */
interface SpellLike {
  id: string;
  sphere: PriestSphere | string | null;
  level: number;
  spell_type: "wizard" | "priest";
}

/**
 * Returns all priest spells available to a character based on class, level,
 * and priesthood spheres. No "learn" step needed — priests know all spells
 * in their spheres automatically.
 */
export function getAvailablePriestSpells<T extends SpellLike>(
  classId: ClassId,
  characterLevel: number,
  priesthoodId: string | null | undefined,
  allSpells: T[],
  alignment?: string | null
): T[] {
  if (!isPriestCaster(classId)) return [];

  const spheres = getPriestSpheres(classId, priesthoodId, alignment);
  if (Object.keys(spheres).length === 0) return [];

  // Determine max castable spell level based on the priest spell slot table
  // Priest slot table: L1=1st, L3=2nd, L5=3rd, L7=4th, L9=5th, L11=6th, L14=7th
  // Rangers: L8=1st druid, L12=2nd, L15=3rd
  // Paladins: L9=1st, L11=2nd, L13=3rd, L15=4th
  let maxSpellLevel = 7;
  if (classId === "ranger") {
    if (characterLevel < 8) return [];
    maxSpellLevel = characterLevel >= 15 ? 3 : characterLevel >= 12 ? 2 : 1;
  } else if (classId === "paladin") {
    if (characterLevel < 9) return [];
    maxSpellLevel =
      characterLevel >= 15 ? 4 : characterLevel >= 13 ? 3 : characterLevel >= 11 ? 2 : 1;
  } else {
    // Full priests (cleric/druid): max spell level from slot table
    // L1→1st, L3→2nd, L5→3rd, L7→4th, L9→5th, L11→6th, L14→7th
    const priestLevelThresholds = [1, 3, 5, 7, 9, 11, 14];
    maxSpellLevel = 0;
    for (let i = 0; i < priestLevelThresholds.length; i++) {
      if (characterLevel >= priestLevelThresholds[i]) maxSpellLevel = i + 1;
    }
  }

  return allSpells.filter((spell) => {
    // Only priest spells
    if (spell.spell_type !== "priest") return false;

    // Must not exceed max castable level
    if (spell.level > maxSpellLevel) return false;

    const sphere = spell.sphere as PriestSphere;
    if (!sphere) return false;

    const access = spheres[sphere];
    if (!access) return false;

    // Minor access: only levels 1-3
    if (access === "minor" && spell.level > 3) return false;

    return true;
  });
}
