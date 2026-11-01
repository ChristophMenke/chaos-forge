import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useBackupOffer } from "./use-backup-offer";

beforeEach(() => localStorage.clear());

describe("useBackupOffer", () => {
  it("never opens for players", () => {
    const { result } = renderHook(() => useBackupOffer({ isAdmin: false, sessionId: "s1" }));

    act(() => result.current.offer());

    expect(result.current.open).toBe(false);
  });

  it("opens for the admin once per session", () => {
    const { result } = renderHook(() => useBackupOffer({ isAdmin: true, sessionId: "s1" }));

    act(() => result.current.offer());
    expect(result.current.open).toBe(true);

    act(() => result.current.close());
    expect(result.current.open).toBe(false);

    act(() => result.current.offer());
    expect(result.current.open).toBe(false);
  });

  it("offers again in another session", () => {
    const first = renderHook(() => useBackupOffer({ isAdmin: true, sessionId: "s1" }));
    act(() => first.result.current.offer());

    const second = renderHook(() => useBackupOffer({ isAdmin: true, sessionId: "s2" }));
    act(() => second.result.current.offer());

    expect(second.result.current.open).toBe(true);
  });
});
