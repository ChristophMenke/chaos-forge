"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DRUID_SPHERES = exports.SHAMAN_SPHERES = exports.MONK_SPHERES = exports.CRUSADER_SPHERES = exports.CLERIC_SPHERES = exports.SPECIALISTS = void 0;
exports.getSpecialist = getSpecialist;
exports.getOppositionSchools = getOppositionSchools;
exports.isPriestCaster = isPriestCaster;
exports.getPriestSpheres = getPriestSpheres;
exports.hasSphereAccess = hasSphereAccess;
exports.getAvailablePriestSpells = getAvailablePriestSpells;
const priesthoods_1 = require("./priesthoods");
exports.SPECIALISTS = [
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
function getSpecialist(classId) {
    return exports.SPECIALISTS.find((s) => s.classId === classId) ?? null;
}
function getOppositionSchools(classId) {
    const spec = getSpecialist(classId);
    return spec ? spec.oppositionSchools : [];
}
exports.CLERIC_SPHERES = {
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
exports.CRUSADER_SPHERES = {
    all: "major",
    combat: "major",
    guardian: "major",
    healing: "major",
    war: "major",
    wards: "major",
    necromantic: "minor",
    protection: "minor",
};
exports.MONK_SPHERES = {
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
exports.SHAMAN_SPHERES = {
    all: "major",
    animal: "major",
    protection: "major",
    summoning: "major",
    travelers: "major",
    wards: "major",
    healing: "minor",
    plant: "minor",
};
exports.DRUID_SPHERES = {
    all: "major",
    animal: "major",
    elemental: "major",
    healing: "major",
    plant: "major",
    weather: "major",
    divination: "minor",
};
/** Classes that cast priest spells (full or partial) */
const PRIEST_CASTER_IDS = [
    "cleric",
    "crusader",
    "druid",
    "monk",
    "shaman",
    "ranger",
    "paladin",
];
function isPriestCaster(classId) {
    return PRIEST_CASTER_IDS.includes(classId);
}
function getPriestSpheres(classId, priesthoodId, alignment) {
    // Monk: own spheres, can choose a priesthood (PO:S&M)
    if (classId === "monk") {
        if (priesthoodId) {
            const priesthood = (0, priesthoods_1.getPriesthood)(priesthoodId);
            if (priesthood)
                return { ...priesthood.spheres };
        }
        return { ...exports.MONK_SPHERES };
    }
    // Shaman: own spheres, can choose a priesthood (PO:S&M)
    if (classId === "shaman") {
        if (priesthoodId) {
            const priesthood = (0, priesthoods_1.getPriesthood)(priesthoodId);
            if (priesthood)
                return { ...priesthood.spheres };
        }
        return { ...exports.SHAMAN_SPHERES };
    }
    // Druid always uses own spheres (no priesthood)
    if (classId === "druid")
        return { ...exports.DRUID_SPHERES };
    // Ranger uses druid spheres (PHB Ch3: Ranger)
    if (classId === "ranger")
        return { ...exports.DRUID_SPHERES };
    // Paladin uses standard cleric spheres (PHB Ch3: Paladin)
    if (classId === "paladin")
        return { ...exports.CLERIC_SPHERES };
    // Crusader: own spheres + alignment-based law/chaos (PO:S&M)
    // Priesthood fully replaces Crusader defaults including alignment spheres
    if (classId === "crusader") {
        if (priesthoodId) {
            const priesthood = (0, priesthoods_1.getPriesthood)(priesthoodId);
            if (priesthood)
                return { ...priesthood.spheres };
        }
        const spheres = { ...exports.CRUSADER_SPHERES };
        if (alignment?.startsWith("lawful"))
            spheres.law = "major";
        else if (alignment?.startsWith("chaotic"))
            spheres.chaos = "major";
        return spheres;
    }
    // If priesthood specified, use its spheres
    if (priesthoodId) {
        const priesthood = (0, priesthoods_1.getPriesthood)(priesthoodId);
        if (priesthood)
            return { ...priesthood.spheres };
    }
    // Fallback: standard cleric spheres
    if (classId === "cleric")
        return { ...exports.CLERIC_SPHERES };
    return {};
}
function hasSphereAccess(classId, sphere, accessLevel, priesthoodId, alignment) {
    const spheres = getPriestSpheres(classId, priesthoodId, alignment);
    const access = spheres[sphere];
    if (!access)
        return false;
    if (accessLevel === "minor")
        return true; // major includes minor access
    return access === "major";
}
/**
 * Returns all priest spells available to a character based on class, level,
 * and priesthood spheres. No "learn" step needed — priests know all spells
 * in their spheres automatically.
 */
function getAvailablePriestSpells(classId, characterLevel, priesthoodId, allSpells, alignment) {
    if (!isPriestCaster(classId))
        return [];
    const spheres = getPriestSpheres(classId, priesthoodId, alignment);
    if (Object.keys(spheres).length === 0)
        return [];
    // Determine max castable spell level based on the priest spell slot table
    // Priest slot table: L1=1st, L3=2nd, L5=3rd, L7=4th, L9=5th, L11=6th, L14=7th
    // Rangers: L8=1st druid, L12=2nd, L15=3rd
    // Paladins: L9=1st, L11=2nd, L13=3rd, L15=4th
    let maxSpellLevel = 7;
    if (classId === "ranger") {
        if (characterLevel < 8)
            return [];
        maxSpellLevel = characterLevel >= 15 ? 3 : characterLevel >= 12 ? 2 : 1;
    }
    else if (classId === "paladin") {
        if (characterLevel < 9)
            return [];
        maxSpellLevel =
            characterLevel >= 15 ? 4 : characterLevel >= 13 ? 3 : characterLevel >= 11 ? 2 : 1;
    }
    else {
        // Full priests (cleric/druid): max spell level from slot table
        // L1→1st, L3→2nd, L5→3rd, L7→4th, L9→5th, L11→6th, L14→7th
        const priestLevelThresholds = [1, 3, 5, 7, 9, 11, 14];
        maxSpellLevel = 0;
        for (let i = 0; i < priestLevelThresholds.length; i++) {
            if (characterLevel >= priestLevelThresholds[i])
                maxSpellLevel = i + 1;
        }
    }
    return allSpells.filter((spell) => {
        // Only priest spells
        if (spell.spell_type !== "priest")
            return false;
        // Must not exceed max castable level
        if (spell.level > maxSpellLevel)
            return false;
        const sphere = spell.sphere;
        if (!sphere)
            return false;
        const access = spheres[sphere];
        if (!access)
            return false;
        // Minor access: only levels 1-3
        if (access === "minor" && spell.level > 3)
            return false;
        return true;
    });
}
