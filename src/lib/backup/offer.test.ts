import { describe, it, expect, beforeEach, vi } from "vitest";
import { BACKUP_OFFERED_STORAGE_KEY, markBackupOffered, shouldOfferBackup } from "./offer";

beforeEach(() => localStorage.clear());

describe("backup offer per session", () => {
  it("offers once per session", () => {
    expect(shouldOfferBackup("s1")).toBe(true);

    markBackupOffered("s1");

    expect(shouldOfferBackup("s1")).toBe(false);
    expect(shouldOfferBackup("s2")).toBe(true);
  });

  it("remembers only the 50 most recent sessions", () => {
    for (let i = 0; i < 51; i++) markBackupOffered(`s${i}`);

    expect(shouldOfferBackup("s0")).toBe(true);
    expect(shouldOfferBackup("s50")).toBe(false);
    expect(JSON.parse(localStorage.getItem(BACKUP_OFFERED_STORAGE_KEY)!)).toHaveLength(50);
  });

  it("recovers from a broken stored value", () => {
    localStorage.setItem(BACKUP_OFFERED_STORAGE_KEY, "{not json");
    expect(shouldOfferBackup("s1")).toBe(true);
    markBackupOffered("s1");
    expect(shouldOfferBackup("s1")).toBe(false);
  });

  it("still works when storage is unavailable", () => {
    const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });

    expect(shouldOfferBackup("s1")).toBe(true);
    expect(() => markBackupOffered("s1")).not.toThrow();

    get.mockRestore();
    set.mockRestore();
  });
});
