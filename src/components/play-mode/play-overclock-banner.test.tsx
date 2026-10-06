import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import { PlayOverclockBanner } from "./play-overclock-banner";
import type { OverclockAbility } from "@/lib/rules/epic-items";

afterEach(cleanup);

const ability: OverclockAbility = {
  name: "Übertakten",
  name_en: "Overclock",
  requiresCheck: "Ingenieurskunst",
  requiresCheck_en: "Engineering",
  conOverride: 20,
  poisonSavePenalty: 1,
  healsPerHour: 1,
  description: "",
  description_en: "",
};

function renderBanner(baseTarget: number | null, hours: number) {
  render(
    <NextIntlClientProvider locale="de" messages={messages}>
      <PlayOverclockBanner
        ability={ability}
        state={{ active: true, hours, cooldown: false }}
        baseTarget={baseTarget}
        isOwner
        onAction={vi.fn()}
      />
    </NextIntlClientProvider>
  );
}

describe("PlayOverclockBanner", () => {
  it("zeigt Zielwert inklusive Erschwernis", () => {
    renderBanner(12, 2);
    expect(screen.getByTestId("play-overclock-next-check")).toHaveTextContent(
      "Ingenieurskunst 11 (−1)"
    );
  });

  it("zeigt ohne Fertigkeit nur die Erschwernis", () => {
    renderBanner(null, 4);
    expect(screen.getByTestId("play-overclock-next-check")).toHaveTextContent(
      "Nächster Kühlungswurf: Ingenieurskunst (−2)"
    );
  });

  it("zeigt Erschwernis 0 ohne Zusatz", () => {
    renderBanner(12, 0);
    expect(screen.getByTestId("play-overclock-next-check")).toHaveTextContent(
      /Ingenieurskunst 12$/
    );
  });
});
