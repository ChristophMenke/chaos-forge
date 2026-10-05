import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  VIEW_MODE_INIT_SCRIPT,
  VIEW_MODE_STORAGE_KEY,
  applyViewMode,
  getViewMode,
  parseViewMode,
  setViewMode,
  subscribeViewMode,
  viewModeClass,
} from "./view-mode";

const root = () => document.documentElement;

describe("view mode", () => {
  beforeEach(() => {
    localStorage.clear();
    root().className = "dark";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("parseViewMode", () => {
    it("accepts the three modes", () => {
      expect(parseViewMode("auto")).toBe("auto");
      expect(parseViewMode("mobile")).toBe("mobile");
      expect(parseViewMode("desktop")).toBe("desktop");
    });

    it("falls back to auto for anything else", () => {
      expect(parseViewMode(null)).toBe("auto");
      expect(parseViewMode("tablet")).toBe("auto");
      expect(parseViewMode(42)).toBe("auto");
    });
  });

  it("maps modes to their <html> class", () => {
    expect(viewModeClass("auto")).toBeNull();
    expect(viewModeClass("mobile")).toBe("view-mobile");
    expect(viewModeClass("desktop")).toBe("view-desktop");
  });

  describe("applyViewMode", () => {
    it("sets exactly one view class and keeps unrelated classes", () => {
      root().classList.add("embed-mode");

      applyViewMode("mobile");
      expect(root().classList.contains("view-mobile")).toBe(true);

      applyViewMode("desktop");
      expect(root().classList.contains("view-mobile")).toBe(false);
      expect(root().classList.contains("view-desktop")).toBe(true);

      applyViewMode("auto");
      expect(root().classList.contains("view-desktop")).toBe(false);
      expect(root().classList.contains("dark")).toBe(true);
      expect(root().classList.contains("embed-mode")).toBe(true);
    });
  });

  describe("getViewMode / setViewMode", () => {
    it("defaults to auto", () => {
      expect(getViewMode()).toBe("auto");
    });

    it("persists, applies and notifies subscribers", () => {
      const listener = vi.fn();
      const unsubscribe = subscribeViewMode(listener);

      setViewMode("mobile");

      expect(localStorage.getItem(VIEW_MODE_STORAGE_KEY)).toBe("mobile");
      expect(getViewMode()).toBe("mobile");
      expect(root().classList.contains("view-mobile")).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      setViewMode("auto");
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("picks up a change made in another tab", () => {
      const listener = vi.fn();
      const unsubscribe = subscribeViewMode(listener);

      localStorage.setItem(VIEW_MODE_STORAGE_KEY, "desktop");
      window.dispatchEvent(new StorageEvent("storage", { key: VIEW_MODE_STORAGE_KEY }));

      expect(listener).toHaveBeenCalledTimes(1);
      expect(getViewMode()).toBe("desktop");
      expect(root().classList.contains("view-desktop")).toBe(true);
      unsubscribe();
    });

    it("stays on auto when storage is unavailable", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("blocked");
      });
      expect(getViewMode()).toBe("auto");
    });
  });

  describe("VIEW_MODE_INIT_SCRIPT", () => {
    const runScript = () => new Function(VIEW_MODE_INIT_SCRIPT)();

    it("applies a stored mode before React hydrates", () => {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, "mobile");
      runScript();
      expect(root().classList.contains("view-mobile")).toBe(true);
    });

    it("adds nothing for auto or unknown values", () => {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, "auto");
      runScript();
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, "<img onerror=alert(1)>");
      runScript();
      expect(root().className).toBe("dark");
    });

    it("never throws when storage is blocked", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("blocked");
      });
      expect(runScript).not.toThrow();
    });
  });
});
