"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMulticlassThac0 = getMulticlassThac0;
exports.getMulticlassSaves = getMulticlassSaves;
exports.getMulticlassHpDivisor = getMulticlassHpDivisor;
exports.isRuleCompliantMulticlass = isRuleCompliantMulticlass;
exports.multiclassHasExceptionalStr = multiclassHasExceptionalStr;
exports.getMulticlassGroups = getMulticlassGroups;
exports.getMulticlassArmorWarnings = getMulticlassArmorWarnings;
exports.meetsDualclassRequirements = meetsDualclassRequirements;
exports.isDualclassDormant = isDualclassDormant;
exports.getDualclassThac0 = getDualclassThac0;
exports.getDualclassSaves = getDualclassSaves;
const classes_1 = require("./classes");
const races_1 = require("./races");
const combat_1 = require("./combat");
// ─── THAC0 ───────────────────────────────────────────────────────────────────
// Multiclass: Use the best (lowest) THAC0 from all active classes
function getMulticlassThac0(classes) {
    if (classes.length === 0)
        return 20;
    return Math.min(...classes.map((c) => {
        const cls = classes_1.CLASSES[c.classId];
        if (!cls)
            return 20;
        return (0, combat_1.getThac0)(cls.group, c.level, c.classId);
    }));
}
// ─── SAVING THROWS ───────────────────────────────────────────────────────────
// Multiclass: Use the best (lowest) value in each category
function getMulticlassSaves(classes) {
    if (classes.length === 0) {
        return { paralyzation: 20, rod: 20, petrification: 20, breath: 20, spell: 20 };
    }
    // Saves use class group (no warrior override) — Crusader saves as priest per PO:S&M
    const allSaves = classes.map((c) => {
        const cls = classes_1.CLASSES[c.classId];
        if (!cls)
            return (0, combat_1.getSavingThrows)("warrior", 1);
        return (0, combat_1.getSavingThrows)(cls.group, c.level);
    });
    return {
        paralyzation: Math.min(...allSaves.map((s) => s.paralyzation)),
        rod: Math.min(...allSaves.map((s) => s.rod)),
        petrification: Math.min(...allSaves.map((s) => s.petrification)),
        breath: Math.min(...allSaves.map((s) => s.breath)),
        spell: Math.min(...allSaves.map((s) => s.spell)),
    };
}
// ─── HP DIVISOR ──────────────────────────────────────────────────────────────
// Multiclass: HP divided by number of classes
function getMulticlassHpDivisor(classCount) {
    return Math.max(1, classCount);
}
// ─── RULE COMPLIANCE ─────────────────────────────────────────────────────────
// Only for warnings — NEVER used to block selections
function isRuleCompliantMulticlass(raceId, classIds) {
    if (classIds.length <= 1)
        return true;
    const race = races_1.RACES[raceId];
    if (!race)
        return false;
    // Check if this exact combination exists in the race's multiclass options
    const sorted = [...classIds].sort();
    return race.multiclassOptions.some((option) => {
        const optionSorted = [...option].sort();
        return (optionSorted.length === sorted.length && optionSorted.every((cls, i) => cls === sorted[i]));
    });
}
// ─── EXCEPTIONAL STRENGTH ────────────────────────────────────────────────────
// At least one warrior class → eligible for exceptional strength
function multiclassHasExceptionalStr(classIds) {
    return classIds.some((id) => classes_1.CLASSES[id].exceptionalStrength);
}
// ─── CLASS GROUPS ────────────────────────────────────────────────────────────
// Get unique class groups for the multiclass combination
function getMulticlassGroups(classIds) {
    const groups = new Set(classIds.map((id) => classes_1.CLASSES[id]?.group).filter(Boolean));
    return [...groups];
}
/**
 * Check if a multiclass character has armor restrictions that should be warned about.
 * Returns warnings for wizard (no spellcasting in armor) and thief (limited skills in heavy armor).
 * Only relevant when character is multiclassed AND wears armor.
 */
function getMulticlassArmorWarnings(classIds, wearsArmor, armorAC, isMagicalProtection) {
    // Magical protection (e.g. Bracers of Defense) does not restrict spellcasting or thief skills
    if (classIds.length <= 1 || !wearsArmor || isMagicalProtection)
        return [];
    const warnings = [];
    const groups = new Set(classIds.map((id) => classes_1.CLASSES[id].group));
    // Wizard in armor: cannot cast spells (PHB p.44)
    if (groups.has("wizard")) {
        warnings.push({ type: "wizard" });
    }
    // Thief/Bard in armor heavier than studded leather: loses most thief abilities (PHB p.44)
    // Thieves can wear leather (AC 8), studded leather (AC 7), padded (AC 8). AC < 7 = too heavy.
    if (groups.has("rogue") && armorAC !== null && armorAC < 7) {
        warnings.push({ type: "thief" });
    }
    return warnings;
}
/**
 * Check if a character meets dual-class requirements.
 * PHB: 17+ in ALL prime requisites of the OLD class, 15+ in ALL prime requisites of the NEW class.
 */
function meetsDualclassRequirements(originalClassId, newClassId, abilities) {
    const failures = [];
    const origClass = classes_1.CLASSES[originalClassId];
    const newClass = classes_1.CLASSES[newClassId];
    if (!origClass || !newClass)
        return { allowed: false, failures: ["Ungültige Klasse."] };
    if (originalClassId === newClassId)
        return { allowed: false, failures: ["Kann nicht in die gleiche Klasse wechseln."] };
    // 17+ in all prime requisites of the OLD class
    for (const req of origClass.primeRequisites) {
        const score = abilities[req] ?? 0;
        if (score < 17) {
            failures.push(`${req.toUpperCase()} ${score} < 17 (alte Klasse ${origClass.name})`);
        }
    }
    // 15+ in all prime requisites of the NEW class
    for (const req of newClass.primeRequisites) {
        const score = abilities[req] ?? 0;
        if (score < 15) {
            failures.push(`${req.toUpperCase()} ${score} < 15 (neue Klasse ${newClass.name})`);
        }
    }
    return { allowed: failures.length === 0, failures };
}
/**
 * Check if the original class abilities are still dormant.
 * PHB: Dormant until new class level EXCEEDS old class level.
 */
function isDualclassDormant(dualclass, newClassLevel) {
    return newClassLevel <= dualclass.switchLevel;
}
/**
 * Get the best THAC0 for a dual-class character.
 * If dormant: only new class THAC0. If active: best of both.
 */
function getDualclassThac0(dualclass, newClassLevel) {
    const newCls = classes_1.CLASSES[dualclass.newClass];
    const newThac0 = newCls ? (0, combat_1.getThac0)(newCls.group, newClassLevel, dualclass.newClass) : 20;
    if (isDualclassDormant(dualclass, newClassLevel))
        return newThac0;
    const origCls = classes_1.CLASSES[dualclass.originalClass];
    const origThac0 = origCls
        ? (0, combat_1.getThac0)(origCls.group, dualclass.switchLevel, dualclass.originalClass)
        : 20;
    return Math.min(newThac0, origThac0);
}
/**
 * Get the best saving throws for a dual-class character.
 * If dormant: only new class saves. If active: best of both.
 */
function getDualclassSaves(dualclass, newClassLevel) {
    const newCls = classes_1.CLASSES[dualclass.newClass];
    const newSaves = newCls
        ? (0, combat_1.getSavingThrows)(newCls.group, newClassLevel)
        : (0, combat_1.getSavingThrows)("warrior", 1);
    if (isDualclassDormant(dualclass, newClassLevel))
        return newSaves;
    const origCls = classes_1.CLASSES[dualclass.originalClass];
    const origSaves = origCls
        ? (0, combat_1.getSavingThrows)(origCls.group, dualclass.switchLevel)
        : (0, combat_1.getSavingThrows)("warrior", 1);
    return {
        paralyzation: Math.min(newSaves.paralyzation, origSaves.paralyzation),
        rod: Math.min(newSaves.rod, origSaves.rod),
        petrification: Math.min(newSaves.petrification, origSaves.petrification),
        breath: Math.min(newSaves.breath, origSaves.breath),
        spell: Math.min(newSaves.spell, origSaves.spell),
    };
}
