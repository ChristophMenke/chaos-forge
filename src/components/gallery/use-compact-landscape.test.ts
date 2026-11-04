import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { COMPACT_LANDSCAPE_QUERY, useCompactLandscape } from "./use-compact-landscape";

afterEach(() => vi.unstubAllGlobals());

function stubMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      get matches() {
        return query === COMPACT_LANDSCAPE_QUERY && matches;
      },
      addEventListener: (_: string, cb: () => void) => listeners.add(cb),
      removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
    }))
  );
  return (next: boolean) => {
    matches = next;
    listeners.forEach((cb) => cb());
  };
}

describe("useCompactLandscape", () => {
  it("is only about phones held sideways, not desktop screens", () => {
    expect(COMPACT_LANDSCAPE_QUERY).toBe("(orientation: landscape) and (max-height: 500px)");
  });

  it("follows the device rotation", () => {
    const rotate = stubMatchMedia(false);
    const { result } = renderHook(() => useCompactLandscape());
    expect(result.current).toBe(false);

    act(() => rotate(true));
    expect(result.current).toBe(true);
  });
});
