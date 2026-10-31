import { toDateInputValue, todayInGroupTimezone } from "@/lib/game-dates";
import type { Release } from "./releases";

export { RELEASES, LATEST_RELEASE_ID } from "./releases";
export type { Release, ReleaseItem, ReleaseIcon } from "./releases";

interface ReleaseViewer {
  /** profiles.last_seen_release — id of the newest release the player dismissed. */
  lastSeenId: string | null;
  /** profiles.created_at (ISO timestamp). */
  createdAt: string | null;
}

/**
 * Releases the player hasn't dismissed yet, newest first. A release only counts
 * if it came out after the day the account was created (group calendar day),
 * so new players get the tutorials instead of old news.
 */
export function getUnseenReleases(releases: Release[], viewer: ReleaseViewer): Release[] {
  const accountDay = viewer.createdAt
    ? toDateInputValue(todayInGroupTimezone(new Date(viewer.createdAt)))
    : null;

  return releases.filter(
    (release) =>
      (viewer.lastSeenId === null || release.id > viewer.lastSeenId) &&
      (accountDay === null || release.date > accountDay)
  );
}

const SKIPPED_PREFIXES = ["/login", "/impressum", "/datenschutz", "/share", "/master", "/admin"];

/**
 * Pages where the release-notes dialog may open: signed-in app pages only.
 * Public pages, the immersive GM area, admin pages and print views stay quiet.
 */
export function isReleaseNotesRoute(pathname: string): boolean {
  if (pathname === "/") return false;
  if (SKIPPED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)))
    return false;
  return !pathname.split("/").includes("print");
}

/** localStorage prefix; the user id is appended so shared devices don't skip anyone. */
export const RELEASE_SEEN_STORAGE_KEY = "chaos-forge-release-seen";

export function readSeenRelease(userId: string): string | null {
  try {
    return window.localStorage.getItem(`${RELEASE_SEEN_STORAGE_KEY}:${userId}`);
  } catch {
    return null;
  }
}

export function writeSeenRelease(userId: string, releaseId: string): void {
  try {
    window.localStorage.setItem(`${RELEASE_SEEN_STORAGE_KEY}:${userId}`, releaseId);
  } catch {
    // Private mode or full storage: the DB still remembers it.
  }
}

/*
 * While the release-notes dialog is open, other auto-opening overlays (the
 * tutorial) wait. The flag lives on <html> so both sides need no shared React
 * context; closing fires an event.
 */
const OPEN_ATTRIBUTE = "releaseNotesOpen";
const CLOSED_EVENT = "chaos-forge:release-notes-closed";

export function isReleaseNotesOpen(): boolean {
  return document.documentElement.dataset[OPEN_ATTRIBUTE] === "true";
}

export function setReleaseNotesOpen(open: boolean): void {
  const wasOpen = isReleaseNotesOpen();
  if (open) {
    document.documentElement.dataset[OPEN_ATTRIBUTE] = "true";
    return;
  }
  delete document.documentElement.dataset[OPEN_ATTRIBUTE];
  if (wasOpen) window.dispatchEvent(new Event(CLOSED_EVENT));
}

/** Runs `callback` once no release notes are open. Returns a cancel function. */
export function whenReleaseNotesClosed(callback: () => void): () => void {
  if (!isReleaseNotesOpen()) {
    callback();
    return () => {};
  }
  const listener = () => callback();
  window.addEventListener(CLOSED_EVENT, listener, { once: true });
  return () => window.removeEventListener(CLOSED_EVENT, listener);
}
