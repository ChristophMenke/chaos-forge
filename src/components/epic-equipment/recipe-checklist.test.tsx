import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import { RecipeChecklist } from "./recipe-checklist";
import type { CraftableStock } from "@/lib/rules/sprocket-devices";

afterEach(cleanup);

const stock: CraftableStock = {
  count: 2,
  collected: ["salt"],
  recipe: {
    yield: 2,
    duration: "ca. 1 Stunde",
    duration_en: "about 1 hour",
    components: [
      { key: "salt", name: "Salz", name_en: "Salt", source: "Krämer", source_en: "Grocer" },
      { key: "honey", name: "Honig", name_en: "Honey", source: "Imker", source_en: "Beekeeper" },
    ],
  },
};
const purse = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };

function renderChecklist(isOwner: boolean) {
  const onToggle = vi.fn();
  render(
    <NextIntlClientProvider locale="de" messages={messages}>
      <RecipeChecklist
        testId="r"
        stock={stock}
        purse={purse}
        locale="de"
        isOwner={isOwner}
        onToggle={onToggle}
        onCraft={vi.fn()}
      />
    </NextIntlClientProvider>
  );
  fireEvent.click(screen.getByTestId("r-toggle"));
  return onToggle;
}

describe("RecipeChecklist", () => {
  it("zeigt Fortschritt, Fundorte und Ertrag", () => {
    renderChecklist(true);
    expect(screen.getByTestId("r-toggle")).toHaveTextContent("Rezept (1/2)");
    expect(screen.getByText(/Imker/)).toBeInTheDocument();
    expect(screen.getByText("Ergibt 2 · ca. 1 Stunde")).toBeInTheDocument();
    expect(screen.getByTestId("r-craft")).toBeDisabled();
  });

  it("meldet Häkchen an den Besitzer weiter", () => {
    const onToggle = renderChecklist(true);
    fireEvent.click(screen.getByTestId("r-component-honey"));
    expect(onToggle).toHaveBeenCalledWith("honey");
  });

  it("zeigt Nicht-Besitzern die Liste ohne Bedienung", () => {
    renderChecklist(false);
    expect(screen.getByTestId("r-component-salt")).toBeDisabled();
    expect(screen.getByTestId("r-component-salt")).toBeChecked();
    expect(screen.queryByTestId("r-craft")).toBeNull();
  });
});
