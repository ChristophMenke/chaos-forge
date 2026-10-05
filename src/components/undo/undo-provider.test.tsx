import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import { rowUpdate } from "@/lib/undo/changes";
import type { ApplyResult } from "@/lib/undo/apply";
import { CharacterModeNav } from "@/components/character-mode-nav";
import { UndoProvider } from "./undo-provider";
import { useUndo, useUndoSync, type UndoContextValue, type UndoListener } from "./undo-context";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
  usePathname: () => "/characters/c1/play",
}));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));

const applyEntry = vi.fn<() => Promise<ApplyResult>>();
vi.mock("@/lib/undo/apply", () => ({ applyEntry: () => applyEntry() }));

const toast = vi.hoisted(() => ({ success: vi.fn(), warning: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const OK: ApplyResult = { ok: true, conflict: false, error: null };

let ctx: UndoContextValue | null = null;
const capture = (value: UndoContextValue | null) => {
  ctx = value;
};
const listener = vi.fn<UndoListener>();

function Probe({ onValue }: { onValue: typeof capture }) {
  onValue(useUndo());
  useUndoSync(listener);
  return null;
}

function renderWithProvider() {
  return render(
    <NextIntlClientProvider locale="de" messages={messages}>
      <UndoProvider>
        <CharacterModeNav characterId="c1" hasEpicItems={false} />
        <Probe onValue={capture} />
      </UndoProvider>
    </NextIntlClientProvider>
  );
}

const hpEntry = (from: number, to: number) => ({
  label: { key: "hp", values: { from, to } },
  changes: [rowUpdate("characters", { id: "c1" }, { hp_current: from }, { hp_current: to })!],
});

beforeEach(() => {
  ctx = null;
  vi.clearAllMocks();
  applyEntry.mockResolvedValue(OK);
});
afterEach(cleanup);

describe("UndoProvider + UndoButtons", () => {
  it("disables both buttons while there is nothing to do", () => {
    renderWithProvider();
    expect(screen.getByTestId("undo-button")).toBeDisabled();
    expect(screen.getByTestId("redo-button")).toBeDisabled();
    expect(screen.getByTestId("undo-button")).toHaveAccessibleName("Nichts rückgängig zu machen");
  });

  it("names the step it would undo", () => {
    renderWithProvider();
    act(() => ctx!.record(hpEntry(10, 5)));
    expect(screen.getByTestId("undo-button")).toBeEnabled();
    expect(screen.getByTestId("undo-button")).toHaveAccessibleName("Rückgängig: TP 10 → 5");
  });

  it("undoes, patches the page, refreshes and confirms", async () => {
    renderWithProvider();
    act(() => ctx!.record(hpEntry(10, 5)));
    fireEvent.click(screen.getByTestId("undo-button"));

    await waitFor(() => expect(screen.getByTestId("redo-button")).toBeEnabled());
    expect(listener).toHaveBeenCalledWith(
      [expect.objectContaining({ before: { hp_current: 10 } })],
      "undo",
      "db"
    );
    expect(refresh).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Rückgängig: TP 10 → 5");
    expect(screen.getByTestId("undo-button")).toBeDisabled();
    expect(screen.getByTestId("redo-button")).toHaveAccessibleName("Wiederherstellen: TP 10 → 5");

    fireEvent.click(screen.getByTestId("redo-button"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Wiederhergestellt: TP 10 → 5"));
  });

  it("drops a step that conflicts and says why", async () => {
    applyEntry.mockResolvedValue({ ok: false, conflict: true, error: null });
    renderWithProvider();
    act(() => ctx!.record(hpEntry(10, 5)));
    fireEvent.click(screen.getByTestId("undo-button"));

    await waitFor(() => expect(toast.warning).toHaveBeenCalled());
    expect(screen.getByTestId("undo-button")).toBeDisabled();
    expect(screen.getByTestId("redo-button")).toBeDisabled();
    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps a step after a database error", async () => {
    applyEntry.mockResolvedValue({ ok: false, conflict: false, error: "boom" });
    renderWithProvider();
    act(() => ctx!.record(hpEntry(10, 5)));
    fireEvent.click(screen.getByTestId("undo-button"));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByTestId("undo-button")).toBeEnabled();
  });

  it("queues changes recorded while an undo runs", async () => {
    let finish: (r: ApplyResult) => void = () => {};
    applyEntry.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderWithProvider();
    act(() => ctx!.record(hpEntry(10, 5)));
    fireEvent.click(screen.getByTestId("undo-button"));
    await waitFor(() => expect(screen.getByTestId("undo-button")).toBeDisabled());

    act(() => ctx!.record(hpEntry(10, 8)));
    await act(async () => finish(OK));

    expect(screen.getByTestId("undo-button")).toHaveAccessibleName("Rückgängig: TP 10 → 8");
    expect(screen.getByTestId("redo-button")).toBeDisabled();
  });

  it("saves pending debounced writes before undoing, then undoes them first", async () => {
    renderWithProvider();
    act(() => ctx!.record(hpEntry(10, 5)));
    act(() => {
      ctx!.registerPending(async () => ctx!.record(hpEntry(5, 3)));
    });
    fireEvent.click(screen.getByTestId("undo-button"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Rückgängig: TP 5 → 3"));
    expect(screen.getByTestId("undo-button")).toHaveAccessibleName("Rückgängig: TP 10 → 5");
  });

  it("does not refresh for draft steps", async () => {
    renderWithProvider();
    act(() => ctx!.record({ ...hpEntry(10, 5), kind: "draft" }));
    expect(ctx!.hasDraft).toBe(true);
    fireEvent.click(screen.getByTestId("undo-button"));
    await waitFor(() => expect(listener).toHaveBeenCalled());
    expect(refresh).not.toHaveBeenCalled();
  });

  it("renders no buttons without a provider", () => {
    render(
      <NextIntlClientProvider locale="de" messages={messages}>
        <CharacterModeNav characterId="c1" hasEpicItems={false} />
      </NextIntlClientProvider>
    );
    expect(screen.queryByTestId("undo-button")).toBeNull();
  });
});
