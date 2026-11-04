/**
 * Order of the gallery: the highest sort_order is shown first.
 */

/** sort_order values for a new batch; the first selected image ends up on top. */
export function nextSortOrders(currentMax: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => currentMax + count - i);
}

/** Id of the neighbour in a list sorted like the UI (top first), or null at the edge. */
export function neighbourFor(
  list: { id: string }[],
  id: string,
  direction: "up" | "down"
): string | null {
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return null;
  return list[direction === "up" ? index - 1 : index + 1]?.id ?? null;
}
