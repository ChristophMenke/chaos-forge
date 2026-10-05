import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import { getXpThreshold } from "@/lib/rules/experience";
import type { CharacterClassRow } from "@/lib/supabase/types";
import { PendingLevelUpBanner } from "./pending-level-up-banner";

afterEach(cleanup);

const thief = (level: number, xpLevel: number) =>
  ({
    id: "thief-row",
    character_id: "c1",
    class_id: "thief",
    level,
    xp_current: getXpThreshold("thief", xpLevel),
    is_active: true,
    switch_level: null,
  }) as CharacterClassRow;

function renderBanner(classes: CharacterClassRow[], isOwner = true, onStart = vi.fn()) {
  render(
    <NextIntlClientProvider locale="de" messages={messages}>
      <PendingLevelUpBanner classes={classes} isOwner={isOwner} onStart={onStart} />
    </NextIntlClientProvider>
  );
  return onStart;
}

describe("PendingLevelUpBanner", () => {
  it("offers the pending level and starts the assistant", () => {
    const onStart = renderBanner([thief(8, 9)]);
    expect(screen.getByText("Stufenaufstieg verfügbar: Dieb 8 → 9")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Jetzt aufsteigen" }));
    expect(onStart).toHaveBeenCalled();
  });

  it("stays hidden while the XP do not reach the next level", () => {
    renderBanner([thief(8, 8)]);
    expect(screen.queryByTestId("pending-level-up-banner")).not.toBeInTheDocument();
  });

  it("stays hidden for players who do not own the character", () => {
    renderBanner([thief(8, 9)], false);
    expect(screen.queryByTestId("pending-level-up-banner")).not.toBeInTheDocument();
  });
});
