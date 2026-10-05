import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

type Handler = () => void;
const handlers: Handler[] = [];
const removedChannels: unknown[] = [];
const channelNames: string[] = [];

const channel = {
  on: vi.fn((_event: string, _filter: unknown, handler: Handler) => {
    handlers.push(handler);
    return channel;
  }),
  subscribe: vi.fn(() => channel),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: (name: string) => {
      channelNames.push(name);
      return channel;
    },
    removeChannel: (c: unknown) => removedChannels.push(c),
  }),
}));

const { useRealtimeRefresh } = await import("./use-realtime-refresh");

let visibility: DocumentVisibilityState = "visible";

function setVisibility(state: DocumentVisibilityState) {
  visibility = state;
  document.dispatchEvent(new Event("visibilitychange"));
}

function emit() {
  handlers.forEach((handler) => handler());
}

describe("useRealtimeRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    refresh.mockClear();
    handlers.length = 0;
    removedChannels.length = 0;
    channelNames.length = 0;
    visibility = "visible";
    vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Two mounted callers with the same name must not share a channel (#174).
  it("gives every instance its own channel name", () => {
    renderHook(() => useRealtimeRefresh("dash", [{ table: "characters" }]));
    renderHook(() => useRealtimeRefresh("dash", [{ table: "characters" }]));

    expect(channelNames).toHaveLength(2);
    expect(channelNames[0]).toMatch(/^dash-/);
    expect(channelNames[0]).not.toBe(channelNames[1]);
  });

  it("refreshes a visible page after the debounce", () => {
    renderHook(() => useRealtimeRefresh("dash", [{ table: "characters" }]));

    emit();
    expect(refresh).not.toHaveBeenCalled();
    vi.advanceTimersByTime(150);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("holds the refresh while the tab is hidden and catches up once on return", () => {
    renderHook(() => useRealtimeRefresh("dash", [{ table: "characters" }]));

    setVisibility("hidden");
    emit();
    emit();
    emit();
    vi.advanceTimersByTime(1000);
    expect(refresh).not.toHaveBeenCalled();

    setVisibility("visible");
    vi.advanceTimersByTime(150);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh on return when nothing changed meanwhile", () => {
    renderHook(() => useRealtimeRefresh("dash", [{ table: "characters" }]));

    setVisibility("hidden");
    setVisibility("visible");
    vi.advanceTimersByTime(1000);

    expect(refresh).not.toHaveBeenCalled();
  });

  it("stops listening for visibility changes after unmount", () => {
    const { unmount } = renderHook(() => useRealtimeRefresh("dash", [{ table: "characters" }]));

    setVisibility("hidden");
    emit();
    unmount();
    setVisibility("visible");
    vi.advanceTimersByTime(1000);

    expect(refresh).not.toHaveBeenCalled();
    expect(removedChannels).toHaveLength(1);
  });
});
