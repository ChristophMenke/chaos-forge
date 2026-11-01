import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getUnseenReleases,
  isReleaseNotesOpen,
  isReleaseNotesRoute,
  readSeenRelease,
  RELEASE_SEEN_STORAGE_KEY,
  setReleaseNotesOpen,
  whenReleaseNotesClosed,
  writeSeenRelease,
} from "./index";
import type { Release } from "./releases";

function release(id: string): Release {
  return {
    id,
    date: id.slice(0, 10),
    items: [{ icon: "undo", title: { de: id, en: id }, text: { de: "x", en: "x" } }],
  };
}

// Newest first, like RELEASES.
const RELEASES = [release("2026-12-01"), release("2026-11-15-2"), release("2026-11-15")];
const OLD_ACCOUNT = "2025-01-01T10:00:00+00:00";
const ids = (list: Release[]) => list.map((r) => r.id);

describe("getUnseenReleases", () => {
  it("shows everything to an old account that has never dismissed anything", () => {
    expect(ids(getUnseenReleases(RELEASES, { lastSeenId: null, createdAt: OLD_ACCOUNT }))).toEqual([
      "2026-12-01",
      "2026-11-15-2",
      "2026-11-15",
    ]);
  });

  it("shows nothing once the newest release has been dismissed", () => {
    expect(
      getUnseenReleases(RELEASES, { lastSeenId: "2026-12-01", createdAt: OLD_ACCOUNT })
    ).toEqual([]);
  });

  it("shows only releases newer than the last one seen, newest first", () => {
    expect(
      ids(getUnseenReleases(RELEASES, { lastSeenId: "2026-11-15", createdAt: OLD_ACCOUNT }))
    ).toEqual(["2026-12-01", "2026-11-15-2"]);
  });

  it("hides releases from before or on the day the account was created", () => {
    expect(
      ids(
        getUnseenReleases(RELEASES, {
          lastSeenId: null,
          createdAt: "2026-11-15T12:00:00+00:00",
        })
      )
    ).toEqual(["2026-12-01"]);
  });

  it("uses the group's calendar day (Europe/Berlin), not the UTC day", () => {
    const oneRelease = [release("2026-10-31")];
    // 23:30 UTC on 31 Oct is already 1 Nov in Berlin → the account is newer.
    expect(
      getUnseenReleases(oneRelease, { lastSeenId: null, createdAt: "2026-10-31T23:30:00+00:00" })
    ).toEqual([]);
    // 22:30 UTC on 30 Oct is 30 Oct 23:30 in Berlin → the release is newer.
    expect(
      ids(
        getUnseenReleases(oneRelease, { lastSeenId: null, createdAt: "2026-10-30T22:30:00+00:00" })
      )
    ).toEqual(["2026-10-31"]);
  });

  it("still compares correctly when the last seen release no longer exists", () => {
    expect(
      ids(getUnseenReleases(RELEASES, { lastSeenId: "2026-11-20", createdAt: OLD_ACCOUNT }))
    ).toEqual(["2026-12-01"]);
  });

  it("treats an unknown creation date like an old account", () => {
    expect(getUnseenReleases(RELEASES, { lastSeenId: null, createdAt: null })).toHaveLength(3);
  });
});

describe("isReleaseNotesRoute", () => {
  it.each(["/", "/login", "/impressum", "/datenschutz", "/share/sessions/abc"])(
    "skips the public page %s",
    (path) => expect(isReleaseNotesRoute(path)).toBe(false)
  );

  it.each(["/master", "/master/npcs/1", "/admin/approve/42", "/characters/42/print"])(
    "skips the immersive or print page %s",
    (path) => expect(isReleaseNotesRoute(path)).toBe(false)
  );

  it.each(["/dashboard", "/characters/42", "/characters/42/play", "/chat", "/settings"])(
    "shows on the app page %s",
    (path) => expect(isReleaseNotesRoute(path)).toBe(true)
  );

  it("does not confuse look-alike paths with excluded ones", () => {
    expect(isReleaseNotesRoute("/masterful")).toBe(true);
    expect(isReleaseNotesRoute("/characters/printer")).toBe(true);
  });
});

describe("readSeenRelease / writeSeenRelease", () => {
  beforeEach(() => localStorage.clear());

  it("remembers the dismissed release per player", () => {
    writeSeenRelease("player-a", "2026-10-31");

    expect(readSeenRelease("player-a")).toBe("2026-10-31");
    expect(readSeenRelease("player-b")).toBeNull();
    expect(localStorage.getItem(`${RELEASE_SEEN_STORAGE_KEY}:player-a`)).toBe("2026-10-31");
  });

  it("survives a browser that refuses storage", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });

    expect(readSeenRelease("player-a")).toBeNull();
    expect(() => writeSeenRelease("player-a", "2026-10-31")).not.toThrow();

    spy.mockRestore();
    setSpy.mockRestore();
  });
});

describe("release-notes open signal", () => {
  afterEach(() => setReleaseNotesOpen(false));

  it("runs the callback right away when no release notes are open", () => {
    const callback = vi.fn();
    whenReleaseNotesClosed(callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("waits until the release notes are closed", () => {
    setReleaseNotesOpen(true);
    expect(isReleaseNotesOpen()).toBe(true);
    const callback = vi.fn();
    whenReleaseNotesClosed(callback);
    expect(callback).not.toHaveBeenCalled();

    setReleaseNotesOpen(false);

    expect(isReleaseNotesOpen()).toBe(false);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("can be cancelled before the release notes close", () => {
    setReleaseNotesOpen(true);
    const callback = vi.fn();
    const cancel = whenReleaseNotesClosed(callback);

    cancel();
    setReleaseNotesOpen(false);

    expect(callback).not.toHaveBeenCalled();
  });
});
