import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
import type { GameDateRow } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "de",
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({}),
}));

const createGameDateMock = vi.fn();
const updateGameDateMock = vi.fn();
const deleteGameDateMock = vi.fn();
vi.mock("@/lib/game-dates/api", () => ({
  createGameDate: (...args: unknown[]) => createGameDateMock(...args),
  updateGameDate: (...args: unknown[]) => updateGameDateMock(...args),
  deleteGameDate: (...args: unknown[]) => deleteGameDateMock(...args),
}));

// Imported AFTER the mocks are registered.
import { GameDatesPanel } from "./game-dates-panel";

const USER_ID = "11111111-1111-1111-1111-111111111111";

function makeDate(overrides: Partial<GameDateRow> = {}): GameDateRow {
  return {
    id: "game-date-1",
    event_date: "2026-06-20",
    title: null,
    created_by: USER_ID,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

function renderPanel(dates: GameDateRow[] = [], canEdit = true) {
  return render(<GameDatesPanel initialDates={dates} userId={USER_ID} canEdit={canEdit} />);
}

beforeEach(() => {
  // Only Date is faked — timers stay real so waitFor() still works.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 5, 18, 22, 30, 0));
  createGameDateMock.mockResolvedValue({ data: makeDate({ id: "created-1" }), error: null });
  updateGameDateMock.mockResolvedValue({ data: makeDate(), error: null });
  deleteGameDateMock.mockResolvedValue({ error: null });
});

describe("GameDatesPanel — Anzeige", () => {
  it("shows an empty state when there are no dates", () => {
    renderPanel([]);
    expect(screen.getByTestId("game-dates-empty")).toBeInTheDocument();
  });

  it("lists upcoming dates with the nearest one first", () => {
    renderPanel([
      makeDate({ id: "far", event_date: "2026-08-01" }),
      makeDate({ id: "near", event_date: "2026-06-20" }),
    ]);
    const rows = screen.getAllByTestId(/^game-date-row-/);
    expect(rows.map((r) => r.getAttribute("data-testid"))).toEqual([
      "game-date-row-near",
      "game-date-row-far",
    ]);
  });

  it("falls back to the generic title when none is set", () => {
    renderPanel([makeDate({ title: null })]);
    const row = screen.getByTestId("game-date-row-game-date-1");
    expect(within(row).getByText("dates.fallbackTitle")).toBeInTheDocument();
  });

  it("shows the custom title when set", () => {
    renderPanel([makeDate({ title: "Finale in Waterdeep" })]);
    expect(screen.getByText("Finale in Waterdeep")).toBeInTheDocument();
  });

  it("hides past dates behind a toggle", () => {
    renderPanel([makeDate({ id: "gone", event_date: "2026-01-10" })]);
    expect(screen.queryByTestId("game-date-row-gone")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("game-dates-past-toggle"));
    expect(screen.getByTestId("game-date-row-gone")).toBeInTheDocument();
  });

  it("does not render the past toggle when there are no past dates", () => {
    renderPanel([makeDate({ event_date: "2026-06-20" })]);
    expect(screen.queryByTestId("game-dates-past-toggle")).not.toBeInTheDocument();
  });

  it("keeps a date scheduled for today in the upcoming list", () => {
    renderPanel([makeDate({ id: "today", event_date: "2026-06-18" })]);
    expect(screen.getByTestId("game-date-row-today")).toBeInTheDocument();
  });
});

describe("GameDatesPanel — Anlegen", () => {
  it("blocks saving without a date and names the reason", async () => {
    renderPanel([]);
    fireEvent.click(screen.getByTestId("game-dates-add"));
    fireEvent.click(screen.getByTestId("game-date-save"));

    await waitFor(() => {
      expect(screen.getByTestId("game-date-error")).toHaveTextContent("dates.errorDateRequired");
    });
    expect(createGameDateMock).not.toHaveBeenCalled();
  });

  it("warns about a past date but still allows saving — house rule: never block", async () => {
    renderPanel([]);
    fireEvent.click(screen.getByTestId("game-dates-add"));
    fireEvent.change(screen.getByTestId("game-date-date-input"), {
      target: { value: "2026-06-01" },
    });

    expect(screen.getByTestId("game-date-warning")).toHaveTextContent("dates.warningDatePast");

    fireEvent.click(screen.getByTestId("game-date-save"));
    await waitFor(() => expect(createGameDateMock).toHaveBeenCalled());
  });

  it("creates the date and adds it to the list", async () => {
    createGameDateMock.mockResolvedValue({
      data: makeDate({ id: "created-1", event_date: "2026-07-04", title: "Drachenjagd" }),
      error: null,
    });
    renderPanel([]);

    fireEvent.click(screen.getByTestId("game-dates-add"));
    fireEvent.change(screen.getByTestId("game-date-date-input"), {
      target: { value: "2026-07-04" },
    });
    fireEvent.change(screen.getByTestId("game-date-title-input"), {
      target: { value: "Drachenjagd" },
    });
    fireEvent.click(screen.getByTestId("game-date-save"));

    await waitFor(() => {
      expect(screen.getByTestId("game-date-row-created-1")).toBeInTheDocument();
    });
    expect(createGameDateMock).toHaveBeenCalledWith(expect.anything(), {
      eventDate: "2026-07-04",
      title: "Drachenjagd",
      userId: USER_ID,
    });
    expect(screen.queryByTestId("game-dates-empty")).not.toBeInTheDocument();
  });

  it("keeps the form open and the list unchanged when the insert fails", async () => {
    createGameDateMock.mockResolvedValue({ data: null, error: "boom" });
    renderPanel([]);

    fireEvent.click(screen.getByTestId("game-dates-add"));
    fireEvent.change(screen.getByTestId("game-date-date-input"), {
      target: { value: "2026-07-04" },
    });
    fireEvent.click(screen.getByTestId("game-date-save"));

    await waitFor(() => expect(createGameDateMock).toHaveBeenCalled());
    expect(screen.getByTestId("game-date-date-input")).toBeInTheDocument();
    expect(screen.getByTestId("game-dates-empty")).toBeInTheDocument();
  });

  it("closes the form on cancel without saving", () => {
    renderPanel([]);
    fireEvent.click(screen.getByTestId("game-dates-add"));
    fireEvent.click(screen.getByTestId("game-date-cancel"));
    expect(screen.queryByTestId("game-date-date-input")).not.toBeInTheDocument();
    expect(createGameDateMock).not.toHaveBeenCalled();
  });
});

describe("GameDatesPanel — Bearbeiten", () => {
  it("prefills the form with the existing values", () => {
    renderPanel([makeDate({ event_date: "2026-06-20", title: "Endkampf" })]);
    fireEvent.click(screen.getByTestId("game-date-edit-game-date-1"));

    expect(screen.getByTestId("game-date-date-input")).toHaveValue("2026-06-20");
    expect(screen.getByTestId("game-date-title-input")).toHaveValue("Endkampf");
  });

  it("saves the changed date and re-sorts the list", async () => {
    updateGameDateMock.mockResolvedValue({
      data: makeDate({ id: "moved", event_date: "2026-09-09" }),
      error: null,
    });
    renderPanel([
      makeDate({ id: "moved", event_date: "2026-06-20" }),
      makeDate({ id: "stays", event_date: "2026-07-01" }),
    ]);

    fireEvent.click(screen.getByTestId("game-date-edit-moved"));
    fireEvent.change(screen.getByTestId("game-date-date-input"), {
      target: { value: "2026-09-09" },
    });
    fireEvent.click(screen.getByTestId("game-date-save"));

    await waitFor(() => {
      expect(updateGameDateMock).toHaveBeenCalledWith(expect.anything(), "moved", {
        eventDate: "2026-09-09",
        title: "",
      });
    });
    await waitFor(() => {
      const rows = screen.getAllByTestId(/^game-date-row-/);
      expect(rows.map((r) => r.getAttribute("data-testid"))).toEqual([
        "game-date-row-stays",
        "game-date-row-moved",
      ]);
    });
  });
});

describe("GameDatesPanel — Löschen", () => {
  it("asks for confirmation before deleting", () => {
    renderPanel([makeDate()]);
    fireEvent.click(screen.getByTestId("game-date-delete-game-date-1"));

    expect(screen.getByTestId("game-date-delete-confirm-game-date-1")).toBeInTheDocument();
    expect(deleteGameDateMock).not.toHaveBeenCalled();
  });

  it("removes the row once confirmed", async () => {
    renderPanel([makeDate()]);
    fireEvent.click(screen.getByTestId("game-date-delete-game-date-1"));
    fireEvent.click(screen.getByTestId("game-date-delete-submit-game-date-1"));

    await waitFor(() => {
      expect(screen.queryByTestId("game-date-row-game-date-1")).not.toBeInTheDocument();
    });
    expect(deleteGameDateMock).toHaveBeenCalledWith(expect.anything(), "game-date-1");
  });

  it("keeps the row when the delete is cancelled", () => {
    renderPanel([makeDate()]);
    fireEvent.click(screen.getByTestId("game-date-delete-game-date-1"));
    fireEvent.click(screen.getByTestId("game-date-delete-cancel-game-date-1"));

    expect(screen.getByTestId("game-date-row-game-date-1")).toBeInTheDocument();
    expect(deleteGameDateMock).not.toHaveBeenCalled();
  });

  it("keeps the row when the delete fails", async () => {
    deleteGameDateMock.mockResolvedValue({ error: "boom" });
    renderPanel([makeDate()]);
    fireEvent.click(screen.getByTestId("game-date-delete-game-date-1"));
    fireEvent.click(screen.getByTestId("game-date-delete-submit-game-date-1"));

    await waitFor(() => expect(deleteGameDateMock).toHaveBeenCalled());
    expect(screen.getByTestId("game-date-row-game-date-1")).toBeInTheDocument();
  });
});

describe("GameDatesPanel — nicht freigegebene Nutzer", () => {
  it("renders read-only without any write controls", () => {
    renderPanel([makeDate()], false);

    expect(screen.getByTestId("game-date-row-game-date-1")).toBeInTheDocument();
    expect(screen.queryByTestId("game-dates-add")).not.toBeInTheDocument();
    expect(screen.queryByTestId("game-date-edit-game-date-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("game-date-delete-game-date-1")).not.toBeInTheDocument();
  });
});
