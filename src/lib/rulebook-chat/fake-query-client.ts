/**
 * Read-only stand-in for the Supabase query builder used by the SvenBot
 * character context: from().select().in()/eq()/is()/order(), awaited.
 * Records every query so tests can check which ids were requested.
 * Test helper only.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

export interface RecordedQuery {
  table: string;
  select: string;
  filters: { op: "in" | "eq" | "is"; column: string; value: unknown }[];
}

export interface FakeQueryClient {
  client: SupabaseClient;
  queries: RecordedQuery[];
}

export function createFakeQueryClient(
  initial: Record<string, object[]>,
  { failTable }: { failTable?: string } = {}
): FakeQueryClient {
  const queries: RecordedQuery[] = [];
  const tables = initial as Record<string, Row[]>;

  const client = {
    from(table: string) {
      return {
        select(select = "*") {
          const query: RecordedQuery = { table, select, filters: [] };
          queries.push(query);
          const builder = {
            in(column: string, value: unknown[]) {
              query.filters.push({ op: "in", column, value });
              return builder;
            },
            eq(column: string, value: unknown) {
              query.filters.push({ op: "eq", column, value });
              return builder;
            },
            is(column: string, value: unknown) {
              query.filters.push({ op: "is", column, value });
              return builder;
            },
            order() {
              return builder;
            },
            then<R>(resolve: (result: { data: Row[] | null; error: unknown }) => R) {
              if (table === failTable) {
                return Promise.resolve(resolve({ data: null, error: { message: "boom" } }));
              }
              const data = (tables[table] ?? []).filter((row) =>
                query.filters.every((f) =>
                  f.op === "in"
                    ? (f.value as unknown[]).includes(row[f.column])
                    : f.op === "is"
                      ? (row[f.column] ?? null) === f.value
                      : row[f.column] === f.value
                )
              );
              return Promise.resolve(resolve({ data: structuredClone(data), error: null }));
            },
          };
          return builder;
        },
      };
    },
  };

  return { client: client as unknown as SupabaseClient, queries };
}
