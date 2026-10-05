import type { GameDateRow } from "@/lib/supabase/types";

/**
 * Reine Logik rund um Spieltermine (`game_dates`).
 *
 * Termine sind bewusst kalendarische Daten ohne Zeitzone: die Gruppe sitzt in
 * einer Zeitzone, und "Heute!"/"in 3 Tagen" darf sich nicht danach richten, in
 * welcher Region der Vercel-Server gerade läuft. Alle Funktionen rechnen daher
 * auf lokalen Kalendertagen, nicht auf Zeitstempeln.
 */

/** Maximale Titellänge — deckt sich mit dem CHECK-Constraint der Migration. */
export const MAX_GAME_DATE_TITLE_LENGTH = 120;

/** Zeitzone der Spielgruppe. Maßgeblich für alles, was serverseitig "heute" braucht. */
export const GROUP_TIME_ZONE = "Europe/Berlin";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type GameDateValidationError = "dateRequired" | "dateInvalid" | "titleTooLong";
export type GameDateValidationWarning = "datePast";

export interface GameDateInput {
  eventDate: string;
  title: string;
}

export interface GameDateValidationResult {
  /** Blockierend — Speichern nicht möglich. */
  error: GameDateValidationError | null;
  /** Nicht blockierend (Hausregel: warnen statt verbieten). */
  warning: GameDateValidationWarning | null;
}

/** `YYYY-MM-DD` → lokale Mitternacht. Bewusst nicht `new Date(iso)` (das wäre UTC). */
export function parseGameDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Der heutige Kalendertag aus Sicht der Spielgruppe, als lokale Mitternacht.
 *
 * Server Components laufen auf Vercel in UTC. Ohne dieses Pinning wäre "heute"
 * dort zwischen Mitternacht und 02:00 deutscher Zeit noch der Vortag — der
 * Banner würde einen bereits gespielten Abend als "Heute!" anzeigen.
 * Im Browser ist `new Date()` dagegen bereits die Zeitzone des Spielers.
 */
export function todayInGroupTimezone(now: Date = new Date(), timeZone = GROUP_TIME_ZONE): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return parseGameDate(`${part("year")}-${part("month")}-${part("day")}`);
}

/** Beginn des Kalendertages, auf dem `reference` liegt. */
function startOfDay(reference: Date): Date {
  return new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
}

/**
 * Ganze Kalendertage bis zum Termin. 0 = heute, negativ = vergangen.
 * `Math.round` fängt die Stunde ab, die bei einer Sommerzeitumstellung
 * zwischen den beiden Mitternachten fehlt oder doppelt ist.
 */
export function daysUntil(iso: string, today: Date = new Date()): number {
  const diffMs = parseGameDate(iso).getTime() - startOfDay(today).getTime();
  return Math.round(diffMs / 86_400_000);
}

/** Ein Termin am heutigen Tag gilt als kommend — der Abend liegt ja noch vor uns. */
export function isPastGameDate(iso: string, today: Date = new Date()): boolean {
  return daysUntil(iso, today) < 0;
}

export interface SplitGameDates {
  /** Aufsteigend — der nächste Termin zuerst. */
  upcoming: GameDateRow[];
  /** Absteigend — der zuletzt gespielte Termin zuerst. */
  past: GameDateRow[];
}

export function splitUpcomingPast(
  dates: readonly GameDateRow[],
  today: Date = new Date()
): SplitGameDates {
  const upcoming: GameDateRow[] = [];
  const past: GameDateRow[] = [];

  for (const date of dates) {
    (isPastGameDate(date.event_date, today) ? past : upcoming).push(date);
  }

  upcoming.sort((a, b) => a.event_date.localeCompare(b.event_date));
  past.sort((a, b) => b.event_date.localeCompare(a.event_date));

  return { upcoming, past };
}

/** Locale-abhängige Anzeige mit Wochentag, z. B. "Sa., 20.06.2026". */
export function formatGameDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseGameDate(iso));
}

/** Titel ist optional — ohne ihn zeigt die UI den generischen Fallback. */
export function resolveGameDateTitle(title: string | null, fallback: string): string {
  const trimmed = title?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : fallback;
}

/** Date → `YYYY-MM-DD` für `<input type="date">` (lokal, nicht UTC). */
export function toDateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function isRealCalendarDate(iso: string): boolean {
  const parsed = parseGameDate(iso);
  // Roundtrip: der 30.02. rollt beim Parsen auf den 02.03. weiter.
  return !Number.isNaN(parsed.getTime()) && toDateInputValue(parsed) === iso;
}

export function validateGameDate(
  input: GameDateInput,
  today: Date = new Date()
): GameDateValidationResult {
  const eventDate = input.eventDate.trim();

  if (eventDate.length === 0) {
    return { error: "dateRequired", warning: null };
  }
  if (!ISO_DATE_PATTERN.test(eventDate) || !isRealCalendarDate(eventDate)) {
    return { error: "dateInvalid", warning: null };
  }
  if (input.title.trim().length > MAX_GAME_DATE_TITLE_LENGTH) {
    return { error: "titleTooLong", warning: null };
  }

  return {
    error: null,
    warning: isPastGameDate(eventDate, today) ? "datePast" : null,
  };
}
