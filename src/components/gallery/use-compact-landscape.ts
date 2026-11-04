import { useSyncExternalStore } from "react";

/**
 * A phone held sideways: landscape with little height. Desktop and tablet
 * screens are landscape too, but tall enough for the caption below the image.
 */
export const COMPACT_LANDSCAPE_QUERY = "(orientation: landscape) and (max-height: 500px)";

const hasMatchMedia = () => typeof window.matchMedia === "function";

function subscribe(onChange: () => void) {
  if (!hasMatchMedia()) return () => {};
  const query = window.matchMedia(COMPACT_LANDSCAPE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function useCompactLandscape(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hasMatchMedia() && window.matchMedia(COMPACT_LANDSCAPE_QUERY).matches,
    () => false
  );
}
