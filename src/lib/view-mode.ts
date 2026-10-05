// No "use client": the root layout (a server component) imports
// VIEW_MODE_INIT_SCRIPT as a plain string.

/**
 * Per-device layout preference.
 * - auto: Tailwind breakpoints follow the viewport width (default).
 * - mobile: all breakpoint variants are off — phone layout at any width.
 * - desktop: `sm` (the layout breakpoint) is on even below 640px.
 *
 * The mode is a class on <html>; globals.css redefines the breakpoint variants
 * around it.
 */
export type ViewMode = "auto" | "mobile" | "desktop";

export const VIEW_MODES: readonly ViewMode[] = ["auto", "mobile", "desktop"];
export const VIEW_MODE_STORAGE_KEY = "chaos-forge-view-mode";

const MODE_CLASSES: Record<ViewMode, string | null> = {
  auto: null,
  mobile: "view-mobile",
  desktop: "view-desktop",
};

export function parseViewMode(value: unknown): ViewMode {
  return VIEW_MODES.includes(value as ViewMode) ? (value as ViewMode) : "auto";
}

export function viewModeClass(mode: ViewMode): string | null {
  return MODE_CLASSES[mode];
}

export function applyViewMode(mode: ViewMode, root: HTMLElement = document.documentElement): void {
  for (const candidate of VIEW_MODES) {
    const className = MODE_CLASSES[candidate];
    if (className) root.classList.toggle(className, candidate === mode);
  }
}

export function getViewMode(): ViewMode {
  if (typeof window === "undefined") return "auto";
  try {
    return parseViewMode(window.localStorage.getItem(VIEW_MODE_STORAGE_KEY));
  } catch {
    return "auto";
  }
}

const listeners = new Set<() => void>();

export function setViewMode(mode: ViewMode): void {
  try {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // Storage blocked (private mode): the choice still applies to this page.
  }
  applyViewMode(mode);
  listeners.forEach((listener) => listener());
}

/** Subscribes to mode changes in this tab and in other tabs of the same browser. */
export function subscribeViewMode(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== VIEW_MODE_STORAGE_KEY) return;
    applyViewMode(getViewMode());
    listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Runs inline before the page content is parsed, so the stored mode is on
 * <html> before the first paint — no flash of the wrong layout. Only known
 * modes map to a class; anything else in storage is ignored.
 */
export const VIEW_MODE_INIT_SCRIPT = `try{var c=${JSON.stringify(
  MODE_CLASSES
)}[localStorage.getItem(${JSON.stringify(VIEW_MODE_STORAGE_KEY)})];if(c)document.documentElement.classList.add(c)}catch(e){}`;
