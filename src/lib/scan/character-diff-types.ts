/**
 * Typen für den Rescan-Diff: der DB-Stand, gegen den verglichen wird, und
 * das Änderungs-Modell, das die Review-Liste rendert.
 *
 * Bewusst in einem eigenen Modul, damit UI-Komponenten die Typen importieren
 * können, ohne die Diff-Implementierung mitzuziehen.
 */

import type {
  CharacterRow,
  CharacterClassRow,
  CharacterEquipmentWithDetails,
  CharacterInventoryWithDetails,
  CharacterSpellWithDetails,
  CharacterWeaponProficiencyRow,
  CharacterNWPWithDetails,
  CharacterFightingStyleRow,
  CharacterLanguageRow,
} from "@/lib/supabase/types";
import type { ValueSource } from "./character-scan-prompt";

/** Der vollständige DB-Stand eines Charakters zum Zeitpunkt des Scans. */
export interface CharacterSnapshot {
  character: CharacterRow;
  classes: CharacterClassRow[];
  equipment: CharacterEquipmentWithDetails[];
  inventory: CharacterInventoryWithDetails[];
  spells: CharacterSpellWithDetails[];
  weaponProficiencies: CharacterWeaponProficiencyRow[];
  nonweaponProficiencies: CharacterNWPWithDetails[];
  fightingStyles: CharacterFightingStyleRow[];
  languages: CharacterLanguageRow[];
}

/** Stammdaten fürs Fuzzy-Matching. Hereingereicht, damit der Diff DB-frei bleibt. */
export interface MatchCatalogs {
  weapons: { id: string; name: string; name_en: string | null }[];
  armor: { id: string; name: string; name_en: string | null }[];
  nwps: { id: string; name: string; name_en: string | null }[];
  spells: { id: string; name: string; name_en: string | null; level: number }[];
}

export type ChangeCategory = "core" | "lists" | "identity" | "extended";
export type ChangeKind = "scalar" | "list-add" | "list-update" | "list-remove";

/** Wohin eine Änderung geschrieben wird. Eine Zeile kann mehrere Tabellen bedienen. */
export interface ChangeWrite {
  table: string;
  /** Spalte bei kind === "scalar" bzw. bei list-update. */
  field?: string;
  /** Getroffene Zeile bei list-update / list-remove. */
  rowId?: string;
  /** Für Upsert-Tabellen, z.B. { class_id: "thief" }. */
  matchKey?: Record<string, string>;
  /** Feste Werte, die beim Insert mitgeschrieben werden (z.B. spell_id). */
  values?: Record<string, unknown>;
}

export interface ChangeTarget {
  writes: ChangeWrite[];
}

/** Eine einzelne erkannte Änderung — eine Zeile der Review-Liste. */
export interface ScanChange {
  /** Stabil über den Lebenszyklus des Change-Sets: React-Key und Test-Selektor. */
  id: string;
  category: ChangeCategory;
  kind: ChangeKind;
  /** i18n-Key im Namespace "rescan". */
  labelKey: string;
  labelParams?: Record<string, string | number>;
  /** Freitext-Label für Dinge ohne festen i18n-Key (Item- und Zaubernamen). */
  labelText?: string;
  currentValue: unknown;
  proposedValue: unknown;
  source: ValueSource;
  /** Gesetzt, wenn gedruckt und handschriftlich voneinander abweichen. */
  conflict?: { printed: unknown; handwritten: unknown };
  defaultSelected: boolean;
  /** Optionaler Hinweis unter der Zeile, i18n-Key im Namespace "rescan". */
  noteKey?: string;
  /** Welcher Editor in der Zeile gerendert wird. */
  valueType: "number" | "text" | "none";
  target: ChangeTarget;
}

/** Was die UI an `buildApplyPlan()` zurückgibt. */
export interface SelectedChange extends ScanChange {
  selected: boolean;
  /** Vom Nutzer überschriebener Zielwert; gewinnt über `proposedValue`. */
  editedValue?: unknown;
}

/**
 * Eine ausführbare DB-Operation. Datenhaltig statt Callback, damit der Plan
 * ohne Supabase-Client assertbar ist. Gleichartige Operationen sind
 * zusammengefasst — ein Update pro Zeile, ein Insert pro Tabelle.
 */
export interface ApplyOperation {
  table: string;
  op: "update" | "insert" | "upsert" | "delete";
  /** Für upsert, z.B. "character_id,class_id". */
  onConflict?: string;
  /** Für update und Einzel-delete: welche Zeile(n). */
  match?: Record<string, string>;
  /** Für update: die zu setzenden Spalten. */
  values?: Record<string, unknown>;
  /** Für insert/upsert: die anzulegenden Zeilen (Bulk). */
  rows?: Record<string, unknown>[];
  /** Für Bulk-delete: die Zeilen-IDs. */
  ids?: string[];
}
