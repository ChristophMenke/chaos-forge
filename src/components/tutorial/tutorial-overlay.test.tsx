import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { setReleaseNotesOpen } from "@/lib/release-notes";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

// A player who still gets tutorials (skip_tutorials = false).
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getClaims: async () => ({ data: { claims: { sub: "player-1" } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: { skip_tutorials: false } }) }),
      }),
    }),
  }),
}));

const { TutorialOverlay } = await import("./tutorial-overlay");

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  setReleaseNotesOpen(false);
  vi.useRealTimers();
});

async function letTutorialStart() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
}

describe("TutorialOverlay", () => {
  it("starts on its own for players who have not seen it", async () => {
    render(<TutorialOverlay page="dashboard" />);
    await letTutorialStart();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("waits while the release notes are open and starts after they close", async () => {
    setReleaseNotesOpen(true);
    render(<TutorialOverlay page="dashboard" />);
    await letTutorialStart();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    act(() => setReleaseNotesOpen(false));
    await letTutorialStart();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
