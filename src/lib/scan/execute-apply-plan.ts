/**
 * Führt einen Apply-Plan gegen Supabase aus.
 *
 * Bewusst dünn: die gesamte Entscheidungslogik steckt in `character-apply.ts`,
 * hier wird nur noch übersetzt. Fehler werden gesammelt statt geworfen — der
 * Nutzer soll erfahren, was von seiner Auswahl nicht durchkam, statt nach der
 * ersten fehlgeschlagenen Operation im Ungewissen zu bleiben.
 */

import type { ApplyOperation } from "./character-diff-types";

/** Minimales strukturelles Interface des Supabase-Query-Builders. */
interface QueryResult {
  error: { message: string } | null;
}

interface FilterBuilder extends PromiseLike<QueryResult> {
  match(criteria: Record<string, string>): PromiseLike<QueryResult>;
  in(column: string, values: string[]): PromiseLike<QueryResult>;
}

interface TableBuilder {
  update(values: Record<string, unknown>): FilterBuilder;
  insert(rows: Record<string, unknown>[]): PromiseLike<QueryResult>;
  upsert(
    rows: Record<string, unknown>[],
    options: { onConflict: string }
  ): PromiseLike<QueryResult>;
  delete(): FilterBuilder;
}

export interface SupabaseLike {
  from(table: string): TableBuilder;
}

export interface FailedOperation {
  operation: ApplyOperation;
  message: string;
}

export interface ApplyResult {
  /** Anzahl erfolgreich ausgeführter Operationen. */
  applied: number;
  failed: FailedOperation[];
}

async function runOperation(supabase: SupabaseLike, op: ApplyOperation): Promise<QueryResult> {
  const table = supabase.from(op.table);

  switch (op.op) {
    case "update":
      return table.update(op.values ?? {}).match(op.match ?? {});
    case "insert":
      return table.insert(op.rows ?? []);
    case "upsert":
      return table.upsert(op.rows ?? [], { onConflict: op.onConflict ?? "" });
    case "delete":
      return op.ids ? table.delete().in("id", op.ids) : table.delete().match(op.match ?? {});
  }
}

/**
 * Arbeitet den Plan der Reihe nach ab. Sequenziell, weil die Reihenfolge
 * (löschen → anlegen → ändern) fachlich bedeutsam ist; bei den hier üblichen
 * Größenordnungen von unter 30 Operationen ist das nicht spürbar.
 */
export async function executeApplyPlan(
  supabase: SupabaseLike,
  operations: ApplyOperation[]
): Promise<ApplyResult> {
  const result: ApplyResult = { applied: 0, failed: [] };

  for (const operation of operations) {
    try {
      const { error } = await runOperation(supabase, operation);
      if (error) {
        result.failed.push({ operation, message: error.message });
      } else {
        result.applied++;
      }
    } catch (err) {
      result.failed.push({
        operation,
        message: err instanceof Error ? err.message : "Unbekannter Fehler",
      });
    }
  }

  return result;
}
