/** PostgREST caps every response at this many rows (Supabase default `max-rows`). */
export const SUPABASE_MAX_ROWS = 1000;

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  const message = (error as { message?: string } | null)?.message ?? String(error);
  return new Error(message);
}

/**
 * Loads all rows of a query that may exceed the PostgREST response cap: counts
 * first, then fetches every page in parallel and concatenates them in order.
 *
 * `page` must sort by a unique key (e.g. end with `.order("id")`) — otherwise
 * rows with equal sort values can repeat or go missing across page boundaries.
 *
 * @example
 * fetchAllRows(
 *   () => supabase.from("spells").select("id", { count: "exact", head: true }).eq("spell_type", t),
 *   (from, to) => supabase.from("spells").select("*").eq("spell_type", t).order("id").range(from, to)
 * );
 */
export async function fetchAllRows<T>(
  count: () => PromiseLike<{ count: number | null; error: unknown }>,
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = SUPABASE_MAX_ROWS
): Promise<T[]> {
  const counted = await count();
  if (counted.error) throw toError(counted.error);

  const total = counted.count ?? 0;
  if (total === 0) return [];

  const pageCount = Math.ceil(total / pageSize);
  const pages = await Promise.all(
    Array.from({ length: pageCount }, (_, i) => page(i * pageSize, (i + 1) * pageSize - 1))
  );

  return pages.flatMap((result) => {
    if (result.error) throw toError(result.error);
    return result.data ?? [];
  });
}
