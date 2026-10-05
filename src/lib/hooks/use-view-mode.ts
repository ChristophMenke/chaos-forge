"use client";

import { useSyncExternalStore } from "react";
import { getViewMode, setViewMode, subscribeViewMode, type ViewMode } from "@/lib/view-mode";

/** The device's layout preference (auto/mobile/desktop) and its setter. */
export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const mode = useSyncExternalStore(subscribeViewMode, getViewMode, () => "auto" as const);
  return [mode, setViewMode];
}
