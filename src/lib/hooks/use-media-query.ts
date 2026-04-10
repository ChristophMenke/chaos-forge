"use client";

import { useSyncExternalStore } from "react";

/**
 * Client-only media query hook. Returns false on the server and on first
 * client render (SSR-safe), then the real value after hydration. Uses
 * useSyncExternalStore so React reads the match value directly from the
 * MediaQueryList without a setState-in-effect anti-pattern.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => {
    if (typeof window === "undefined") return () => {};
    const mql = window.matchMedia(query);
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  };
  const getSnapshot = () =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches;
  const getServerSnapshot = () => false;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
