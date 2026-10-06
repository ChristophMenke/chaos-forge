import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

const { PayDialog } = await import("./pay-dialog");

afterEach(cleanup);

const purse = { pp: 0, gp: 10, ep: 0, sp: 0, cp: 0 };

describe("PayDialog", () => {
  // Regression: on an iPad in desktop view the dialog opened inside the glass
  // coin-purse card and the inventory panel below covered its pay button.
  it("is not trapped inside the panel that opens it", () => {
    const { container } = render(
      <div className="glass">
        <PayDialog purse={purse} onPay={vi.fn()} onClose={vi.fn()} />
      </div>
    );

    expect(container).not.toContainElement(screen.getByTestId("pay-dialog"));
    expect(screen.getByTestId("pay-confirm")).toBeInTheDocument();
  });
});
