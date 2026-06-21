// Sprockets Mix-and-Match-Klingen: reine Zustandslogik.
// Framework- und DB-frei, damit vollständig unit-testbar. Die Komponente
// (blade-system-card.tsx) ruft diese Transformationen auf und persistiert das
// Ergebnis als simple_effects-JSONB.

export type BladeOutcome = "hit" | "miss";

export interface Blade {
  id: number;
  /** Mixtur-Key (z.B. "red") oder null = leere Klinge (normaler Wurfdolch). */
  mixture: string | null;
  status: "ready" | "thrown";
  /** Nur gesetzt, solange die Klinge geworfen (thrown) ist. */
  outcome?: BladeOutcome;
}

export interface MixtureInfo {
  count: number;
  name: string;
  name_en: string;
  color: string;
  effect: string;
  effect_en: string;
  duration: string;
  duration_en: string;
}

export interface WeaponStats {
  damage_sm: string;
  damage_l: string;
  weapon_type: string;
  speed: number;
  weight: number;
  range_short: number;
  range_medium: number;
  range_long: number;
}

export interface BladeSystemData {
  type: "blade_system";
  max_prepared: number;
  blades: Blade[];
  mixtures: Record<string, MixtureInfo>;
  weapon_stats?: WeaponStats;
}

/** Klinge in einen sauberen ready-Zustand bringen (outcome wird entfernt). */
function toReady(blade: Blade, mixture: string | null): Blade {
  return { id: blade.id, mixture, status: "ready" };
}

/**
 * Phiole aus dem Vorrat in eine Klinge einsetzen (= Bestücken/Nachladen).
 * Blockt, wenn die Mixtur unbekannt oder leer ist. Vorrat wird um 1 reduziert.
 */
export function loadBlade(
  blades: Blade[],
  mixtures: Record<string, MixtureInfo>,
  bladeId: number,
  mixtureKey: string
): { blades: Blade[]; mixtures: Record<string, MixtureInfo> } {
  const mix = mixtures[mixtureKey];
  if (!mix || mix.count <= 0) return { blades, mixtures };

  const newBlades = blades.map((b) => (b.id === bladeId ? toReady(b, mixtureKey) : b));
  const newMixtures: Record<string, MixtureInfo> = {
    ...mixtures,
    [mixtureKey]: { ...mix, count: mix.count - 1 },
  };
  return { blades: newBlades, mixtures: newMixtures };
}

/** Klinge werfen und das Ergebnis (Treffer/Fehlwurf) merken. */
export function throwBlade(blades: Blade[], bladeId: number, outcome: BladeOutcome): Blade[] {
  return blades.map((b) => (b.id === bladeId ? { ...b, status: "thrown" as const, outcome } : b));
}

/**
 * Geworfene Klinge einsammeln.
 * - Treffer: Phiole ist verbraucht → Klinge kommt leer zurück.
 * - Fehlwurf: intakt → Klinge bleibt bestückt; zerbrochen → leer.
 * Klingen ohne outcome (Altdaten) werden defensiv wie ein Fehlwurf behandelt.
 */
export function collectBlade(blades: Blade[], bladeId: number, vialIntact: boolean): Blade[] {
  return blades.map((b) => {
    if (b.id !== bladeId) return b;
    const keepMixture = b.outcome !== "hit" && vialIntact;
    return toReady(b, keepMixture ? b.mixture : null);
  });
}

/** Geworfene (oder beliebige) Klinge dauerhaft entfernen (verloren). */
export function loseBlade(blades: Blade[], bladeId: number): Blade[] {
  return blades.filter((b) => b.id !== bladeId);
}

/** Eine neue leere Klinge schmieden, sofern das Maximum noch nicht erreicht ist. */
export function forgeBlade(blades: Blade[], maxPrepared: number): Blade[] {
  if (blades.length >= maxPrepared) return blades;
  const nextId = blades.reduce((max, b) => Math.max(max, b.id), 0) + 1;
  return [...blades, { id: nextId, mixture: null, status: "ready" }];
}
