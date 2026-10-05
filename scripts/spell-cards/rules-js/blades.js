"use strict";
// Sprockets Mix-and-Match-Klingen: reine Zustandslogik.
// Framework- und DB-frei, damit vollständig unit-testbar. Die Komponente
// (blade-system-card.tsx) ruft diese Transformationen auf und persistiert das
// Ergebnis als simple_effects-JSONB.
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadBlade = loadBlade;
exports.throwBlade = throwBlade;
exports.collectBlade = collectBlade;
exports.loseBlade = loseBlade;
exports.forgeBlade = forgeBlade;
/** Klinge in einen sauberen ready-Zustand bringen (outcome wird entfernt). */
function toReady(blade, mixture) {
    return { id: blade.id, mixture, status: "ready" };
}
/**
 * Phiole aus dem Vorrat in eine Klinge einsetzen (= Bestücken/Nachladen).
 * Blockt, wenn die Mixtur unbekannt oder leer ist. Vorrat wird um 1 reduziert.
 */
function loadBlade(blades, mixtures, bladeId, mixtureKey) {
    const mix = mixtures[mixtureKey];
    if (!mix || mix.count <= 0)
        return { blades, mixtures };
    const newBlades = blades.map((b) => (b.id === bladeId ? toReady(b, mixtureKey) : b));
    const newMixtures = {
        ...mixtures,
        [mixtureKey]: { ...mix, count: mix.count - 1 },
    };
    return { blades: newBlades, mixtures: newMixtures };
}
/** Klinge werfen und das Ergebnis (Treffer/Fehlwurf) merken. */
function throwBlade(blades, bladeId, outcome) {
    return blades.map((b) => (b.id === bladeId ? { ...b, status: "thrown", outcome } : b));
}
/**
 * Geworfene Klinge einsammeln.
 * - Treffer: Phiole ist verbraucht → Klinge kommt leer zurück.
 * - Fehlwurf: intakt → Klinge bleibt bestückt; zerbrochen → leer.
 * Klingen ohne outcome (Altdaten) werden defensiv wie ein Fehlwurf behandelt.
 */
function collectBlade(blades, bladeId, vialIntact) {
    return blades.map((b) => {
        if (b.id !== bladeId)
            return b;
        const keepMixture = b.outcome !== "hit" && vialIntact;
        return toReady(b, keepMixture ? b.mixture : null);
    });
}
/** Geworfene (oder beliebige) Klinge dauerhaft entfernen (verloren). */
function loseBlade(blades, bladeId) {
    return blades.filter((b) => b.id !== bladeId);
}
/** Eine neue leere Klinge schmieden, sofern das Maximum noch nicht erreicht ist. */
function forgeBlade(blades, maxPrepared) {
    if (blades.length >= maxPrepared)
        return blades;
    const nextId = blades.reduce((max, b) => Math.max(max, b.id), 0) + 1;
    return [...blades, { id: nextId, mixture: null, status: "ready" }];
}
