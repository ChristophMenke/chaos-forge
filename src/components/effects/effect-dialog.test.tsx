import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import type { EffectDraft } from "@/lib/rules/effect-presets";
import { EffectDialog } from "./effect-dialog";

afterEach(cleanup);

function renderDialog(
  onSubmit = vi.fn().mockResolvedValue({ ok: true, error: null, notApproved: false })
) {
  const onOpenChange = vi.fn();
  render(
    <NextIntlClientProvider locale="de" messages={messages}>
      <EffectDialog open onOpenChange={onOpenChange} onSubmit={onSubmit} />
    </NextIntlClientProvider>
  );
  return { onSubmit, onOpenChange };
}

const submittedDraft = (onSubmit: ReturnType<typeof vi.fn>) =>
  onSubmit.mock.calls[0][0] as EffectDraft;

describe("EffectDialog", () => {
  it("fills the form from a preset", async () => {
    const { onSubmit } = renderDialog();
    fireEvent.change(screen.getByLabelText("Vorlage"), { target: { value: "slow" } });

    expect(screen.getByLabelText("Name")).toHaveValue("Verlangsamen");
    expect(screen.getAllByTestId("modifier-row")).toHaveLength(4);
    expect(screen.getByLabelText("kein GE-Bonus auf RK")).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Hinzufügen" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(submittedDraft(onSubmit)).toMatchObject({
      name: "Verlangsamen",
      preset_key: "slow",
      flags: ["noDexAc"],
      modifiers: expect.arrayContaining([
        { target: "movement", op: "factor", value: 0.5 },
        { target: "attacksPerRound", op: "factor", value: 0.5 },
        { target: "attack", op: "delta", value: -4 },
        { target: "ac", op: "delta", value: -4 },
      ]),
    });
  });

  it("builds a custom effect with a note and a conditional save", async () => {
    const { onSubmit, onOpenChange } = renderDialog();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Krit: Bein gebrochen" } });
    fireEvent.change(screen.getByLabelText("Notiz"), { target: { value: "Krit-Tabelle 14" } });
    fireEvent.click(screen.getByRole("button", { name: "Auswirkung hinzufügen" }));

    const row = screen.getByTestId("modifier-row");
    fireEvent.change(within(row).getByLabelText("Wert"), { target: { value: "savesAll" } });
    fireEvent.change(within(row).getByLabelText("Betrag"), { target: { value: "-2" } });
    fireEvent.change(within(row).getByLabelText("gegen"), { target: { value: "Furcht" } });
    fireEvent.click(screen.getByLabelText("liegend"));

    fireEvent.click(screen.getByRole("button", { name: "Hinzufügen" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(submittedDraft(onSubmit)).toEqual({
      name: "Krit: Bein gebrochen",
      notes: "Krit-Tabelle 14",
      duration_text: "",
      preset_key: null,
      modifiers: [{ target: "savesAll", op: "delta", value: -2, condition: "Furcht" }],
      flags: ["prone"],
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("only offers the operations a value allows", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Auswirkung hinzufügen" }));
    const row = screen.getByTestId("modifier-row");

    fireEvent.change(within(row).getByLabelText("Wert"), { target: { value: "attack" } });
    const ops = within(row).getByLabelText("Art") as HTMLSelectElement;
    expect([...ops.options].map((o) => o.value)).toEqual(["delta"]);

    fireEvent.change(within(row).getByLabelText("Wert"), { target: { value: "movement" } });
    expect(within(row).getByLabelText("Betrag").tagName).toBe("SELECT");
  });

  it("requires a name", () => {
    const { onSubmit } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Hinzufügen" }));
    expect(screen.getByText("Bitte einen Namen angeben.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and explains a missing approval", async () => {
    const { onOpenChange } = renderDialog(
      vi.fn().mockResolvedValue({ ok: false, error: "user_not_approved", notApproved: true })
    );
    fireEvent.change(screen.getByLabelText("Vorlage"), { target: { value: "bless" } });
    fireEvent.click(screen.getByRole("button", { name: "Hinzufügen" }));
    await waitFor(() => expect(screen.getByText(/noch nicht freigegeben/)).toBeInTheDocument());
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
