import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import { getXpThreshold } from "@/lib/rules/experience";
import type { CharacterClassRow, CharacterRow } from "@/lib/supabase/types";
import type { LevelUpPlan } from "@/lib/level-up/apply-level-up";

const applyLevelUp =
  vi.fn<(client: unknown, plan: LevelUpPlan) => Promise<{ ok: boolean; errors: string[] }>>();

vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));
vi.mock("@/lib/level-up/apply-level-up", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/level-up/apply-level-up")>()),
  applyLevelUp: (client: unknown, plan: LevelUpPlan) => applyLevelUp(client, plan),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { LevelUpDialog } = await import("./level-up-dialog");

afterEach(cleanup);

function classRow(class_id: string, level: number, xpLevel = level + 1, id = `${class_id}-row`) {
  return {
    id,
    character_id: "c1",
    class_id,
    level,
    xp_current: getXpThreshold(class_id as never, xpLevel),
    is_active: true,
    switch_level: null,
  } as CharacterClassRow;
}

const character = {
  id: "c1",
  name: "Nowi",
  level: 8,
  hp_max: 31,
  hp_current: 20,
  con: 15,
  con_health: null,
  con_fitness: null,
  kit: null,
  priesthood: null,
  thief_pick_locks: 65,
  thief_find_traps: 55,
  thief_move_silently: 80,
  thief_hide_shadows: 70,
  thief_climb_walls: 90,
  thief_detect_noise: 30,
  thief_read_languages: 20,
} as unknown as CharacterRow;

function renderDialog(classes: CharacterClassRow[], onApplied = vi.fn()) {
  render(
    <NextIntlClientProvider locale="de" messages={messages}>
      <LevelUpDialog
        open
        onOpenChange={() => {}}
        character={{ ...character, level: classes[0].level }}
        classes={classes}
        epicItems={[]}
        onApplied={onApplied}
      />
    </NextIntlClientProvider>
  );
  return onApplied;
}

const next = () => fireEvent.click(screen.getByRole("button", { name: "Weiter" }));

describe("LevelUpDialog", () => {
  beforeEach(() => {
    applyLevelUp.mockReset();
    applyLevelUp.mockResolvedValue({ ok: true, errors: [] });
  });

  it("walks a thief through hit points, skill points and the summary", async () => {
    const onApplied = renderDialog([classRow("thief", 8)]);

    expect(screen.getByText("Nowi · Dieb 8 → 9")).toBeInTheDocument();
    expect(screen.getByText("Wirf 1W6 und trage das Ergebnis ein:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weiter" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Würfelergebnis (1–6)"), { target: { value: "4" } });
    expect(screen.getByTestId("level-up-hp-gain")).toHaveTextContent("+5");
    expect(screen.getByTestId("level-up-hp-max")).toHaveTextContent("31 → 36");
    next();

    // Step 2: 30 points, max 15 per skill
    expect(screen.getByText("Übrig: 30 / 30")).toBeInTheDocument();
    const pickLocks = screen.getByTestId("level-up-skill-pickLocks");
    for (let i = 0; i < 3; i++) {
      fireEvent.click(within(pickLocks).getByRole("button", { name: "Schlösser öffnen erhöhen" }));
    }
    expect(within(pickLocks).getByText("+15")).toBeInTheDocument();
    expect(
      within(pickLocks).getByRole("button", { name: "Schlösser öffnen erhöhen" })
    ).toBeDisabled();
    expect(screen.getByText("Übrig: 15 / 30")).toBeInTheDocument();
    next();

    // Step 3: summary
    const summary = screen.getByTestId("level-up-summary");
    expect(within(summary).getByText("17 → 16")).toBeInTheDocument();
    expect(within(summary).getByText("×3 → ×4")).toBeInTheDocument();
    expect(within(summary).getByText(/Schlösser öffnen 65 → 80/)).toBeInTheDocument();
    expect(screen.getByText(/15 Punkte nicht verteilt/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aufstieg übernehmen" }));
    await waitFor(() => expect(applyLevelUp).toHaveBeenCalledTimes(1));
    expect(applyLevelUp.mock.calls[0][1]).toMatchObject({
      classRowId: "thief-row",
      toLevel: 9,
      hpMaxAfter: 36,
      characterLevelAfter: 9,
      thiefSkillUpdates: { thief_pick_locks: 80 },
    });
    await waitFor(() => expect(onApplied).toHaveBeenCalledWith(applyLevelUp.mock.calls[0][1]));
  });

  it("rejects a die result the die cannot show", () => {
    renderDialog([classRow("thief", 8)]);
    fireEvent.change(screen.getByLabelText("Würfelergebnis (1–6)"), { target: { value: "7" } });
    expect(screen.getByText("Bitte eine ganze Zahl von 1 bis 6 eingeben.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weiter" })).toBeDisabled();
  });

  it("skips the skill step for a fighter", () => {
    renderDialog([classRow("fighter", 6)]);
    expect(screen.getByText("Schritt 1 / 2")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Würfelergebnis (1–10)"), { target: { value: "6" } });
    next();
    expect(screen.getByTestId("level-up-summary")).toHaveTextContent("1 → 3/2");
  });

  it("asks for no roll once the class gets fixed hit points", () => {
    renderDialog([classRow("thief", 10)]);
    expect(screen.queryByLabelText(/Würfelergebnis/)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Ab Stufe 11 würfelt diese Klasse nicht mehr: \+2 TP/)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weiter" })).toBeEnabled();
  });

  it("does not save anything when cancelled", () => {
    const onOpenChange = vi.fn();
    render(
      <NextIntlClientProvider locale="de" messages={messages}>
        <LevelUpDialog
          open
          onOpenChange={onOpenChange}
          character={character}
          classes={[classRow("thief", 8)]}
          epicItems={[]}
          onApplied={vi.fn()}
        />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(applyLevelUp).not.toHaveBeenCalled();
  });

  it("announces the next pending level when more are waiting", () => {
    renderDialog([classRow("thief", 8, 10)]);
    expect(screen.getByText("Danach folgt: Dieb 9 → 10")).toBeInTheDocument();
  });

  it("keeps the dialog open and shows an error when saving fails", async () => {
    applyLevelUp.mockResolvedValue({ ok: false, errors: ["boom"] });
    const onApplied = renderDialog([classRow("fighter", 6)]);
    fireEvent.change(screen.getByLabelText("Würfelergebnis (1–10)"), { target: { value: "6" } });
    next();
    fireEvent.click(screen.getByRole("button", { name: "Aufstieg übernehmen" }));
    await waitFor(() =>
      expect(screen.getByText("Der Aufstieg konnte nicht gespeichert werden.")).toBeInTheDocument()
    );
    expect(onApplied).not.toHaveBeenCalled();
  });
});
