import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllRows } from "@/lib/supabase/fetch-all-rows";
import { CUSTOM_ROW_TABLES, FULL_TABLES, orderColumns } from "./tables";

type Rows = Record<string, unknown>[];

/** The part of the PostgREST builder we use — keeps the generic types shallow. */
interface Query extends PromiseLike<{ data: Rows | null; count: number | null; error: unknown }> {
  eq(column: string, value: unknown): Query;
  order(column: string): Query;
  range(from: number, to: number): Query;
}

async function loadTable(service: SupabaseClient, table: string, customOnly: boolean) {
  // Count and page must carry the same filter, or paging is off.
  const select = (head: boolean) => {
    const query = service
      .from(table)
      .select("*", head ? { count: "exact", head: true } : undefined) as unknown as Query;
    return customOnly ? query.eq("is_custom", true) : query;
  };

  return fetchAllRows<Record<string, unknown>>(
    () => select(true),
    (from, to) => {
      let query = select(false);
      for (const column of orderColumns(table)) query = query.order(column);
      return query.range(from, to);
    }
  );
}

/**
 * Reads every backed-up table with the service client (server only — it
 * bypasses RLS, e.g. for other players' notifications).
 */
export async function loadBackupTables(service: SupabaseClient): Promise<Record<string, Rows>> {
  const jobs = [
    ...FULL_TABLES.map((table) => [table, false] as const),
    ...CUSTOM_ROW_TABLES.map((table) => [table, true] as const),
  ];
  const results = await Promise.all(
    jobs.map(async ([table, customOnly]) => {
      try {
        return [table, await loadTable(service, table, customOnly)] as const;
      } catch (error) {
        console.error("[Backup] table failed:", table, error);
        throw new Error(`Backup-Tabelle ${table}: ${(error as Error).message}`);
      }
    })
  );
  return Object.fromEntries(results);
}
