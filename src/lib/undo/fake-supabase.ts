/**
 * Minimal in-memory stand-in for the Supabase query builder calls undo uses:
 * select().match().maybeSingle(), update().match(), delete().match(), insert().
 * Test helper only.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;
type DbError = { message: string; code?: string } | null;

export interface FakeDb {
  client: SupabaseClient;
  tables: Record<string, Row[]>;
  writes: { table: string; op: string; value?: Row; key?: Row }[];
  failNext: (error: DbError) => void;
}

function matches(row: Row, key: Row) {
  return Object.entries(key).every(([k, v]) => String(row[k]) === String(v));
}

export function createFakeDb(initial: Record<string, Row[]> = {}): FakeDb {
  const tables: Record<string, Row[]> = structuredClone(initial);
  const writes: FakeDb["writes"] = [];
  let pendingError: DbError = null;

  function takeError(): DbError {
    const e = pendingError;
    pendingError = null;
    return e;
  }

  const client = {
    from(table: string) {
      tables[table] ??= [];
      const rows = () => tables[table];
      return {
        select() {
          return {
            match(key: Row) {
              return {
                async maybeSingle() {
                  const found = rows().find((r) => matches(r, key));
                  return { data: found ? structuredClone(found) : null, error: null };
                },
              };
            },
          };
        },
        update(value: Row) {
          return {
            async match(key: Row) {
              const error = takeError();
              if (error) return { error };
              writes.push({ table, op: "update", value, key });
              tables[table] = rows().map((r) => (matches(r, key) ? { ...r, ...value } : r));
              return { error: null };
            },
          };
        },
        delete() {
          return {
            async match(key: Row) {
              const error = takeError();
              if (error) return { error };
              writes.push({ table, op: "delete", key });
              tables[table] = rows().filter((r) => !matches(r, key));
              return { error: null };
            },
          };
        },
        async insert(value: Row) {
          const error = takeError();
          if (error) return { error };
          writes.push({ table, op: "insert", value });
          tables[table] = [...rows(), structuredClone(value)];
          return { error: null };
        },
      };
    },
  } as unknown as SupabaseClient;

  return {
    client,
    tables,
    writes,
    failNext: (error) => {
      pendingError = error;
    },
  };
}
