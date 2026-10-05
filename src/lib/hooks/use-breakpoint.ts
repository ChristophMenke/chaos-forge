"use client";

import { useMediaQuery } from "./use-media-query";
import { useViewMode } from "./use-view-mode";

// Mirrors the Tailwind breakpoints redefined in globals.css.
const BREAKPOINT_QUERIES = {
  sm: "(min-width: 640px)",
  lg: "(min-width: 1024px)",
} as const;

export type Breakpoint = keyof typeof BREAKPOINT_QUERIES;

/**
 * JS counterpart of Tailwind's `sm:`/`lg:` variants that honours the view
 * mode: off in mobile mode, `sm` forced on in desktop mode. Use this instead
 * of matchMedia for any layout decision, so JS and CSS agree.
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const [mode] = useViewMode();
  const matches = useMediaQuery(BREAKPOINT_QUERIES[breakpoint]);

  if (mode === "mobile") return false;
  if (mode === "desktop" && breakpoint === "sm") return true;
  return matches;
}
