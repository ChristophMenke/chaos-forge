/**
 * Übersetzt die vom Nutzer kuratierte Änderungsliste in ausführbare
 * DB-Operationen.
 *
 * Reines Modul: kein Supabase-Client, keine Promises. Das Ergebnis ist eine
 * Liste beschreibender Operationen, die `executeApplyPlan()` abarbeitet — so
 * bleibt die Umsetzungslogik ohne DB testbar.
 *
 * Gleichartige Schreibvorgänge werden zusammengefasst: alle Spalten von
 * `characters` landen in einem Update, alle neuen Zeilen einer Tabelle in
 * einem Insert. Statt 20 Roundtrips bei 20 Änderungen bleiben eine Handvoll.
 */

import type {
  CharacterSnapshot,
  SelectedChange,
  ApplyOperation,
  ChangeWrite,
} from "./character-diff-types";

/**
 * Tabellen mit Unique-Constraint werden per Upsert geschrieben. Damit ist ein
 * zweiter Scan mit denselben Daten folgenlos, statt an einem Constraint zu
 * scheitern.
 */
const UPSERT_CONFLICT_TARGETS: Record<string, string> = {
  character_classes: "character_id,class_id",
  character_weapon_proficiencies: "character_id,weapon_name",
  character_nonweapon_proficiencies: "character_id,proficiency_id",
  character_fighting_styles: "character_id,style_id",
  character_languages: "character_id,language_name",
  character_spells: "character_id,spell_id",
};

/** Der Zielwert einer Zeile: die Nutzer-Eingabe schlägt den Scan-Vorschlag. */
function effectiveValue(change: SelectedChange): unknown {
  return change.editedValue !== undefined ? change.editedValue : change.proposedValue;
}

/** Schlüssel, unter dem Updates derselben Zeile zusammengefasst werden. */
function updateKey(table: string, match: Record<string, string>): string {
  return `${table}|${Object.entries(match)
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join(",")}`;
}

export function buildApplyPlan(
  changes: SelectedChange[],
  snapshot: CharacterSnapshot
): ApplyOperation[] {
  const characterId = snapshot.character.id;
  const selected = changes.filter((c) => c.selected);
  if (selected.length === 0) return [];

  const updates = new Map<string, ApplyOperation>();
  const insertRows = new Map<string, Record<string, unknown>[]>();
  const deleteIds = new Map<string, string[]>();
  const deleteMatches: ApplyOperation[] = [];

  for (const change of selected) {
    const value = effectiveValue(change);

    for (const write of change.target.writes) {
      if (change.kind === "list-remove") {
        collectDelete(write, characterId, deleteIds, deleteMatches);
        continue;
      }

      if (change.kind === "list-add") {
        const rows = insertRows.get(write.table) ?? [];
        rows.push({ character_id: characterId, ...buildInsertRow(write, change, value) });
        insertRows.set(write.table, rows);
        continue;
      }

      // scalar / list-update — eine bestehende Zeile bekommt neue Spaltenwerte.
      if (!write.field) continue;
      const match = buildUpdateMatch(write, characterId);
      const key = updateKey(write.table, match);
      const existing = updates.get(key);
      if (existing) {
        existing.values = { ...existing.values, [write.field]: value };
      } else {
        updates.set(key, {
          table: write.table,
          op: "update",
          match,
          values: { [write.field]: value },
        });
      }
    }
  }

  // Reihenfolge: erst löschen, dann anlegen, dann ändern. Ein umbenannter
  // Eintrag (löschen + neu anlegen) kollidiert so nicht mit sich selbst.
  const ops: ApplyOperation[] = [];

  for (const [table, ids] of deleteIds) {
    ops.push({ table, op: "delete", ids });
  }
  ops.push(...deleteMatches);

  for (const [table, rows] of insertRows) {
    const onConflict = UPSERT_CONFLICT_TARGETS[table];
    ops.push(
      onConflict ? { table, op: "upsert", onConflict, rows } : { table, op: "insert", rows }
    );
  }

  ops.push(...updates.values());

  return ops;
}

function collectDelete(
  write: ChangeWrite,
  characterId: string,
  deleteIds: Map<string, string[]>,
  deleteMatches: ApplyOperation[]
): void {
  if (write.rowId) {
    const ids = deleteIds.get(write.table) ?? [];
    ids.push(write.rowId);
    deleteIds.set(write.table, ids);
    return;
  }
  // Tabellen mit zusammengesetztem Schlüssel (character_spells) haben keine
  // eigene Zeilen-ID — sie werden über den Match gelöscht.
  if (write.matchKey) {
    deleteMatches.push({
      table: write.table,
      op: "delete",
      match: { character_id: characterId, ...write.matchKey },
    });
  }
}

/**
 * Baut die einzufügende Zeile. Der vom Nutzer editierte Wert überschreibt das
 * dafür vorgesehene Feld — bei Gegenständen die Menge, bei neuen Klassen die
 * Stufe.
 */
function buildInsertRow(
  write: ChangeWrite,
  change: SelectedChange,
  value: unknown
): Record<string, unknown> {
  const row = { ...(write.values ?? {}) };
  if (change.editedValue === undefined) return row;

  if ("quantity" in row) row.quantity = value;
  else if ("level" in row) row.level = value;

  return row;
}

function buildUpdateMatch(write: ChangeWrite, characterId: string): Record<string, string> {
  if (write.rowId) return { id: write.rowId };
  if (write.table === "characters") return { id: characterId };
  return { character_id: characterId, ...(write.matchKey ?? {}) };
}
