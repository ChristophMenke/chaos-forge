"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_ALIGNMENTS = void 0;
exports.getAlignmentLabel = getAlignmentLabel;
exports.getAllowedAlignments = getAllowedAlignments;
exports.ALL_ALIGNMENTS = [
    "lawful_good",
    "neutral_good",
    "chaotic_good",
    "lawful_neutral",
    "true_neutral",
    "chaotic_neutral",
    "lawful_evil",
    "neutral_evil",
    "chaotic_evil",
];
const ALIGNMENT_LABELS = {
    lawful_good: "Rechtschaffen Gut",
    neutral_good: "Neutral Gut",
    chaotic_good: "Chaotisch Gut",
    lawful_neutral: "Rechtschaffen Neutral",
    true_neutral: "Neutral",
    chaotic_neutral: "Chaotisch Neutral",
    lawful_evil: "Rechtschaffen Böse",
    neutral_evil: "Neutral Böse",
    chaotic_evil: "Chaotisch Böse",
};
const ALIGNMENT_LABELS_EN = {
    lawful_good: "Lawful Good",
    neutral_good: "Neutral Good",
    chaotic_good: "Chaotic Good",
    lawful_neutral: "Lawful Neutral",
    true_neutral: "Neutral",
    chaotic_neutral: "Chaotic Neutral",
    lawful_evil: "Lawful Evil",
    neutral_evil: "Neutral Evil",
    chaotic_evil: "Chaotic Evil",
};
function getAlignmentLabel(alignmentId, locale = "de") {
    const labels = locale === "en" ? ALIGNMENT_LABELS_EN : ALIGNMENT_LABELS;
    return labels[alignmentId] ?? alignmentId;
}
// PHB class alignment restrictions
const GOOD_ONLY = ["lawful_good", "neutral_good", "chaotic_good"];
const NON_LAWFUL = [
    "neutral_good",
    "chaotic_good",
    "true_neutral",
    "chaotic_neutral",
    "neutral_evil",
    "chaotic_evil",
];
const CLASS_RESTRICTIONS = {
    paladin: ["lawful_good"],
    ranger: GOOD_ONLY,
    druid: ["true_neutral"],
    bard: NON_LAWFUL,
};
function getAllowedAlignments(classId) {
    return CLASS_RESTRICTIONS[classId] ?? [...exports.ALL_ALIGNMENTS];
}
