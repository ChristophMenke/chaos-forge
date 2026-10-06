// Sprockets Geräte: Übertakten des Kondensators, Reparatur mit Kupferelixier
// und Herstellung über Komponenten-Checklisten. Reine Zustandslogik auf dem
// simple_effects-JSONB der epischen Gegenstände – die Komponenten persistieren
// das Ergebnis. Die App kennt keine Spielzeit: Stunden und Tage meldet der
// Spieler per Knopf, Würfe würfelt er selbst und meldet Gelungen/Misslungen.

import type { DamageLevelEffect, EpicItemRow } from "@/lib/supabase/types";
import { calculatePayment, type CoinPurse } from "./equipment";

export type SimpleEffects = Record<string, unknown>;

export interface RecipeComponent {
  key: string;
  name: string;
  name_en: string;
  source: string;
  source_en: string;
}

export interface Recipe {
  components: RecipeComponent[];
  /** Stück pro Herstellung. */
  yield: number;
  duration: string;
  duration_en: string;
  /** Kosten in Goldmünzen, aus der Börse bezahlt. */
  cost_gp?: number;
}

/** Ein herstellbarer Vorrat: Bestand, Rezept und bereits gesammelte Komponenten. */
export interface CraftableStock {
  count: number;
  recipe?: Recipe;
  collected?: string[];
}

export interface OverclockState {
  active: boolean;
  /** Bereits vergangene Stunden; die laufende Stunde ist `hours + 1`. */
  hours: number;
  /** Nach misslungenem Kühlungswurf für einen Tag gesperrt. */
  cooldown: boolean;
}

/** Bedienschritte beim Übertakten (Ergebnis des selbst gewürfelten Wurfs). */
export type OverclockAction =
  | { type: "start"; success: boolean }
  | { type: "hour"; success: boolean }
  | { type: "stop" }
  | { type: "cooldownEnd" };

/** Änderungen an einem herstellbaren Vorrat. */
export type StockChange =
  { type: "toggle"; key: string } | { type: "adjust"; delta: number } | { type: "craft" };

// ── Übertakten ───────────────────────────────────────────────

/** Erschwernis des Kühlungswurfs für Stunde `hour` (1-basiert): jede zweite Stunde −1. */
export function getCoolingModifier(hour: number): number {
  return 0 - Math.floor((hour - 1) / 2);
}

export function readOverclockState(se: SimpleEffects): OverclockState {
  return {
    active: se.overclock_active === true,
    hours: typeof se.overclock_hours === "number" ? se.overclock_hours : 0,
    cooldown: se.overclock_cooldown === true,
  };
}

/** Erschwernis des nächsten Kühlungswurfs (am Ende der laufenden Stunde). */
export function nextCoolingModifier(state: OverclockState): number {
  return getCoolingModifier(state.hours + 1);
}

/**
 * Ergebnis des Ingenieurskunst-Wurfs beim Aktivieren. Erfolg startet bei
 * Stunde 0, Fehlschlag kostet den Kondensator eine Schadensstufe.
 * `null`, solange die Abkühlsperre gilt oder bereits übertaktet ist.
 */
export function startOverclock(
  se: SimpleEffects,
  success: boolean
): { effects: SimpleEffects; damageLevelDelta: 0 | 1 } | null {
  const state = readOverclockState(se);
  if (state.active || state.cooldown) return null;
  if (!success) return { effects: se, damageLevelDelta: 1 };
  // Der frühere Echtzeit-Timer ist abgelöst – seine Endzeit fällt weg.
  const { overclock_end_time: _legacyEndTime, ...rest } = se;
  return {
    effects: { ...rest, overclock_active: true, overclock_hours: 0 },
    damageLevelDelta: 0,
  };
}

/** Eine Stunde vergeht: mitzählen, bei misslungenem Kühlungswurf abschalten und sperren. */
export function passOverclockHour(se: SimpleEffects, coolingSuccess: boolean): SimpleEffects {
  const state = readOverclockState(se);
  if (!state.active) return se;
  const next = { ...se, overclock_hours: state.hours + 1 };
  return coolingSuccess ? next : { ...next, overclock_active: false, overclock_cooldown: true };
}

/** Freiwilliges Abschalten – ohne Sperre. */
export function stopOverclock(se: SimpleEffects): SimpleEffects {
  return { ...se, overclock_active: false };
}

/** „Ein Tag ist vergangen“: Abkühlsperre aufheben. */
export function endCooldown(se: SimpleEffects): SimpleEffects {
  return { ...se, overclock_cooldown: false };
}

/** Heilung pro übertakteter Stunde, gekappt am Maximum (senkt nie). */
export function healOneHour(hpCurrent: number, hpMax: number, heal: number): number {
  return Math.max(hpCurrent, Math.min(hpMax, hpCurrent + heal));
}

/** Erstes angelegtes Gerät mit Übertakten-Fähigkeit. */
export function findOverclockItem<T extends Pick<EpicItemRow, "equipped" | "simple_effects">>(
  items: T[]
): T | null {
  return items.find((item) => item.equipped && !!item.simple_effects?.overclock) ?? null;
}

/**
 * Neue Schadensstufe samt Folgen für den Zustand: fällt das Gerät aus
 * (`device_offline`), endet eine laufende Übertaktung im selben Schritt.
 */
export function withDamageLevel(
  item: { damage_levels: Record<string, DamageLevelEffect>; simple_effects: SimpleEffects },
  newLevel: number
): { damage_level: number; simple_effects: SimpleEffects } {
  const offline = item.damage_levels[String(newLevel)]?.effects?.includes("device_offline");
  const se = item.simple_effects;
  return {
    damage_level: newLevel,
    simple_effects: offline && se.overclock_active === true ? stopOverclock(se) : se,
  };
}

// ── Reparatur ────────────────────────────────────────────────

/** Ergebnis eines Reparaturwurfs; ein eingesetztes Elixier ist immer verbraucht. */
export function resolveRepair(input: {
  damageLevel: number;
  elixirCount: number;
  useElixir: boolean;
  success: boolean;
}): { damageLevel: number; elixirCount: number } {
  const { damageLevel, elixirCount, useElixir, success } = input;
  return {
    damageLevel: success ? Math.max(0, damageLevel - 1) : damageLevel,
    elixirCount: useElixir ? Math.max(0, elixirCount - 1) : elixirCount,
  };
}

// ── Herstellung ──────────────────────────────────────────────

export function toggleComponent<T extends CraftableStock>(stock: T, key: string): T {
  const collected = stock.collected ?? [];
  return {
    ...stock,
    collected: collected.includes(key) ? collected.filter((k) => k !== key) : [...collected, key],
  };
}

export function isRecipeComplete(stock: CraftableStock): boolean {
  if (!stock.recipe) return false;
  const collected = stock.collected ?? [];
  return stock.recipe.components.every((c) => collected.includes(c.key));
}

/** Manuelle Korrektur des Bestands, nie unter 0. */
export function adjustStock<T extends CraftableStock>(stock: T, delta: number): T {
  return { ...stock, count: Math.max(0, stock.count + delta) };
}

/**
 * Herstellen: Ertrag gutschreiben, Checkliste leeren, Kosten aus der Börse
 * zahlen. `null`, wenn Komponenten fehlen oder das Geld nicht reicht.
 */
export function craft<T extends CraftableStock>(
  stock: T,
  purse: CoinPurse
): { stock: T; purse: CoinPurse } | null {
  if (!stock.recipe || !isRecipeComplete(stock)) return null;
  let remaining = purse;
  if (stock.recipe.cost_gp) {
    const payment = calculatePayment(purse, stock.recipe.cost_gp * 100);
    if (!payment.success) return null;
    remaining = payment.remaining;
  }
  return {
    stock: { ...stock, count: stock.count + stock.recipe.yield, collected: [] },
    purse: remaining,
  };
}

/** Wo ein Vorrat in simple_effects liegt: das Elixier am Kondensator oder eine Mixtur der Klingen. */
export type StockTarget = { kind: "elixir" } | { kind: "mixture"; key: string };

/** Vorrat mit Anzeigenamen (Elixier und Mixturen tragen name/name_en); `bonus` nur beim Elixier. */
export type NamedStock = CraftableStock & { name: string; name_en: string; bonus?: number };

export function readStock(se: SimpleEffects, target: StockTarget): NamedStock | null {
  const stock =
    target.kind === "elixir"
      ? se.elixir
      : (se.mixtures as Record<string, unknown> | undefined)?.[target.key];
  return stock && typeof stock === "object" ? (stock as NamedStock) : null;
}

export function writeStock(
  se: SimpleEffects,
  target: StockTarget,
  stock: CraftableStock
): SimpleEffects {
  if (target.kind === "elixir") return { ...se, elixir: stock };
  const mixtures = (se.mixtures as Record<string, unknown> | undefined) ?? {};
  return { ...se, mixtures: { ...mixtures, [target.key]: stock } };
}
