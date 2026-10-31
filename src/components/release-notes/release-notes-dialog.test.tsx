import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LATEST_RELEASE_ID, RELEASE_SEEN_STORAGE_KEY, RELEASES } from "@/lib/release-notes";

vi.mock("next-intl", () => ({
  useLocale: () => "de",
  useTranslations: () => (key: string) => key,
}));

let pathname = "/dashboard";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

let userId: string | null = "player-1";
vi.mock("@/components/approval-provider", () => ({
  useApproval: () => ({ userId, isApproved: true, isLoading: false }),
}));

// profiles query + update, recorded per test.
let profileRow: { last_seen_release: string | null; created_at: string } | null;
let updateError: { code: string; message: string } | null;
const maybeSingle = vi.fn(async () => ({ data: profileRow, error: null }));
const updateEq = vi.fn(async () => ({ error: updateError }));
const update = vi.fn(() => ({ eq: updateEq }));
const select = vi.fn(() => ({ eq: () => ({ maybeSingle }) }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: () => ({ select, update }) }),
}));

const { ReleaseNotesDialog } = await import("./release-notes-dialog");

const OLD_ACCOUNT = "2025-01-01T10:00:00+00:00";
const storageKey = (id: string) => `${RELEASE_SEEN_STORAGE_KEY}:${id}`;

beforeEach(() => {
  localStorage.clear();
  pathname = "/dashboard";
  userId = "player-1";
  profileRow = { last_seen_release: null, created_at: OLD_ACCOUNT };
  updateError = null;
  document.documentElement.className = "dark";
  delete document.documentElement.dataset.releaseNotesOpen;
  vi.clearAllMocks();
});

afterEach(cleanup);

const dialog = () => screen.findByTestId("release-notes-dialog");

describe("ReleaseNotesDialog", () => {
  it("shows unseen releases to a player who has not dismissed them", async () => {
    render(<ReleaseNotesDialog />);

    expect(await dialog()).toBeInTheDocument();
    expect(screen.getByText("dialogTitle")).toBeInTheDocument();
    expect(screen.getAllByTestId("release-notes-release")).toHaveLength(RELEASES.length);
    expect(document.documentElement.dataset.releaseNotesOpen).toBe("true");
  });

  it("stays quiet without a signed-in player", async () => {
    userId = null;
    render(<ReleaseNotesDialog />);

    await Promise.resolve();
    expect(select).not.toHaveBeenCalled();
    expect(screen.queryByTestId("release-notes-dialog")).not.toBeInTheDocument();
  });

  it("checks once the player becomes known", async () => {
    userId = null;
    const { rerender } = render(<ReleaseNotesDialog />);
    expect(select).not.toHaveBeenCalled();

    userId = "player-1";
    rerender(<ReleaseNotesDialog />);

    expect(await dialog()).toBeInTheDocument();
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("does not ask the database again when the player navigates", async () => {
    const { rerender } = render(<ReleaseNotesDialog />);
    await dialog();

    pathname = "/characters";
    rerender(<ReleaseNotesDialog />);
    pathname = "/party";
    rerender(<ReleaseNotesDialog />);

    await Promise.resolve();
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });

  it.each(["/master", "/login", "/characters/42/print"])("stays quiet on %s", async (path) => {
    pathname = path;
    render(<ReleaseNotesDialog />);

    await Promise.resolve();
    expect(select).not.toHaveBeenCalled();
  });

  it("stays quiet inside an embed", async () => {
    document.documentElement.classList.add("embed-mode");
    render(<ReleaseNotesDialog />);

    await Promise.resolve();
    expect(select).not.toHaveBeenCalled();
  });

  it("skips the database once this device knows the latest release was seen", async () => {
    localStorage.setItem(storageKey("player-1"), LATEST_RELEASE_ID);
    render(<ReleaseNotesDialog />);

    await Promise.resolve();
    expect(select).not.toHaveBeenCalled();
  });

  it("does not skip another player on the same device", async () => {
    localStorage.setItem(storageKey("player-2"), LATEST_RELEASE_ID);
    render(<ReleaseNotesDialog />);

    expect(await dialog()).toBeInTheDocument();
  });

  it("shows nothing to an account newer than the release, and remembers that", async () => {
    profileRow = { last_seen_release: null, created_at: "2099-01-01T10:00:00+00:00" };
    render(<ReleaseNotesDialog />);

    await waitFor(() =>
      expect(localStorage.getItem(storageKey("player-1"))).toBe(LATEST_RELEASE_ID)
    );
    expect(screen.queryByTestId("release-notes-dialog")).not.toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it("marks the latest release as seen when the player confirms", async () => {
    render(<ReleaseNotesDialog />);
    await dialog();

    fireEvent.click(screen.getByRole("button", { name: "confirm" }));

    await waitFor(() =>
      expect(screen.queryByTestId("release-notes-dialog")).not.toBeInTheDocument()
    );
    expect(update).toHaveBeenCalledWith({ last_seen_release: LATEST_RELEASE_ID });
    expect(updateEq).toHaveBeenCalledWith("id", "player-1");
    expect(localStorage.getItem(storageKey("player-1"))).toBe(LATEST_RELEASE_ID);
    expect(document.documentElement.dataset.releaseNotesOpen).toBeUndefined();
  });

  it("also counts Escape as seen, saving only once", async () => {
    render(<ReleaseNotesDialog />);
    const popup = await dialog();

    fireEvent.keyDown(popup, { key: "Escape" });

    await waitFor(() =>
      expect(screen.queryByTestId("release-notes-dialog")).not.toBeInTheDocument()
    );
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("closes and saves when following the link to the settings", async () => {
    render(<ReleaseNotesDialog />);
    await dialog();

    const link = screen.getByRole("link", { name: "allNotesLink" });
    expect(link).toHaveAttribute("href", "/settings");
    fireEvent.click(link);

    await waitFor(() =>
      expect(screen.queryByTestId("release-notes-dialog")).not.toBeInTheDocument()
    );
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("logs a failed save and stays closed", async () => {
    updateError = { code: "42501", message: "denied" };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ReleaseNotesDialog />);
    await dialog();

    fireEvent.click(screen.getByRole("button", { name: "confirm" }));

    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith("[ReleaseNotes] markSeen failed:", updateError)
    );
    expect(screen.queryByTestId("release-notes-dialog")).not.toBeInTheDocument();
    consoleError.mockRestore();
  });
});
