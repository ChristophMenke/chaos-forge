import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import { getXpThreshold } from "@/lib/rules/experience";
import type { CharacterClassRow } from "@/lib/supabase/types";

const updates: { table: string; values: Record<string, unknown> }[] = [];
const inserts: { table: string; values: Record<string, unknown> }[] = [];

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => ({
      update: (values: Record<string, unknown>) => ({
        eq: () => {
          updates.push({ table, values });
          return Promise.resolve({ error: null });
        },
      }),
      insert: (values: Record<string, unknown>) => {
        inserts.push({ table, values });
        return {
          select: () => ({
            single: () => Promise.resolve({ data: { id: "xp-1", ...values }, error: null }),
          }),
        };
      },
    }),
  }),
}));

const { XpAddDialog } = await import("./xp-add-dialog");
const { createUndoStub } = await import("@/components/undo/undo-test-utils");

afterEach(cleanup);

const thief = (level: number, xp: number) =>
  ({
    id: "thief-row",
    character_id: "c1",
    class_id: "thief",
    level,
    xp_current: xp,
    is_active: true,
    switch_level: null,
  }) as CharacterClassRow;

function renderDialog(classes: CharacterClassRow[]) {
  const onClassesChange = vi.fn();
  const onLevelUpPending = vi.fn();
  render(
    <NextIntlClientProvider locale="de" messages={messages}>
      <XpAddDialog
        open
        characterId="c1"
        characterClasses={classes}
        sessions={[]}
        onClose={() => {}}
        onClassesChange={onClassesChange}
        onLevelUpPending={onLevelUpPending}
      />
    </NextIntlClientProvider>
  );
  return { onClassesChange, onLevelUpPending };
}

describe("XpAddDialog", () => {
  beforeEach(() => {
    updates.length = 0;
    inserts.length = 0;
  });

  it("stores only the XP and hands the level-up to the assistant", async () => {
    const xp = getXpThreshold("thief", 9) - 100;
    const { onClassesChange, onLevelUpPending } = renderDialog([thief(8, xp)]);

    fireEvent.change(screen.getByTestId("xp-amount-input"), { target: { value: "200" } });
    expect(screen.getByTestId("level-up-indicator-thief")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("xp-apply-button"));

    await waitFor(() => expect(onLevelUpPending).toHaveBeenCalledTimes(1));
    expect(updates).toEqual([{ table: "character_classes", values: { xp_current: xp + 200 } }]);
    expect(onClassesChange).toHaveBeenCalledWith([
      expect.objectContaining({ level: 8, xp_current: xp + 200 }),
    ]);
    expect(inserts[0]).toMatchObject({ table: "xp_history", values: { xp_amount: 200 } });
  });

  it("does not report a level-up when the XP stay below the next level", async () => {
    const { onLevelUpPending } = renderDialog([thief(8, getXpThreshold("thief", 8))]);
    fireEvent.change(screen.getByTestId("xp-amount-input"), { target: { value: "10" } });
    fireEvent.click(screen.getByTestId("xp-apply-button"));
    await waitFor(() => expect(updates).toHaveLength(1));
    expect(onLevelUpPending).not.toHaveBeenCalled();
  });

  it("announces no new level-up when one is already pending and the XP add none", () => {
    renderDialog([thief(8, getXpThreshold("thief", 9) + 10)]);
    fireEvent.change(screen.getByTestId("xp-amount-input"), { target: { value: "10" } });
    expect(screen.queryByTestId("level-up-indicator-thief")).not.toBeInTheDocument();
  });

  it("records the XP and the history entry as one undo step", async () => {
    const undo = createUndoStub();
    const onXpAdded = vi.fn();
    render(
      <NextIntlClientProvider locale="de" messages={messages}>
        <undo.Wrapper>
          <XpAddDialog
            open
            characterId="c1"
            characterClasses={[thief(3, 3000)]}
            sessions={[]}
            onClose={() => {}}
            onClassesChange={() => {}}
            onXpAdded={onXpAdded}
          />
        </undo.Wrapper>
      </NextIntlClientProvider>
    );
    fireEvent.change(screen.getByTestId("xp-amount-input"), { target: { value: "500" } });
    fireEvent.click(screen.getByTestId("xp-apply-button"));

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0]).toMatchObject({
      label: { key: "xpAdded", values: { amount: 500 } },
      changes: [
        { table: "character_classes", before: { xp_current: 3000 }, after: { xp_current: 3500 } },
        { table: "xp_history", before: null, after: expect.objectContaining({ id: "xp-1" }) },
      ],
    });
    expect(onXpAdded).toHaveBeenCalledWith(expect.objectContaining({ id: "xp-1", xp_amount: 500 }));
  });
});
