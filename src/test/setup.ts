import "@testing-library/jest-dom/vitest";

// Node ≥ 25 ships its own Web Storage globals. Without `--localstorage-file`
// they resolve to undefined and shadow jsdom's implementation, so tests using
// localStorage failed locally while CI (Node 24) passed. Fall back to jsdom's.
const jsdomWindow = (globalThis as { jsdom?: { window: Window } }).jsdom?.window;
if (jsdomWindow) {
  for (const key of ["localStorage", "sessionStorage"] as const) {
    if (globalThis[key] === undefined) {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        value: jsdomWindow[key],
      });
    }
  }
}
