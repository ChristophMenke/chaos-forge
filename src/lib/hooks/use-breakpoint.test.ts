import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { setViewMode, VIEW_MODE_STORAGE_KEY } from "@/lib/view-mode";
import { useBreakpoint } from "./use-breakpoint";

let matches = false;

beforeEach(() => {
  matches = false;
  localStorage.clear();
  document.documentElement.className = "";
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useBreakpoint", () => {
  it("follows the media query in auto mode", () => {
    matches = true;
    expect(renderHook(() => useBreakpoint("sm")).result.current).toBe(true);
    matches = false;
    expect(renderHook(() => useBreakpoint("lg")).result.current).toBe(false);
  });

  it("queries the Tailwind breakpoint widths", () => {
    renderHook(() => useBreakpoint("sm"));
    renderHook(() => useBreakpoint("lg"));
    expect(window.matchMedia).toHaveBeenCalledWith("(min-width: 640px)");
    expect(window.matchMedia).toHaveBeenCalledWith("(min-width: 1024px)");
  });

  it("is always off in mobile mode, even on a wide screen", () => {
    matches = true;
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, "mobile");
    expect(renderHook(() => useBreakpoint("sm")).result.current).toBe(false);
    expect(renderHook(() => useBreakpoint("lg")).result.current).toBe(false);
  });

  it("forces sm on in desktop mode but leaves lg to the viewport", () => {
    matches = false;
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, "desktop");
    expect(renderHook(() => useBreakpoint("sm")).result.current).toBe(true);
    expect(renderHook(() => useBreakpoint("lg")).result.current).toBe(false);
  });

  it("re-renders when the mode changes", () => {
    matches = true;
    const { result } = renderHook(() => useBreakpoint("sm"));
    expect(result.current).toBe(true);

    act(() => setViewMode("mobile"));
    expect(result.current).toBe(false);
  });

  it("re-renders when another tab changes the mode", () => {
    matches = true;
    const { result } = renderHook(() => useBreakpoint("sm"));

    act(() => {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, "mobile");
      window.dispatchEvent(new StorageEvent("storage", { key: VIEW_MODE_STORAGE_KEY }));
    });
    expect(result.current).toBe(false);
  });
});
