import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ModalPortal } from "./modal-portal";

afterEach(cleanup);

describe("ModalPortal", () => {
  // A `backdrop-filter` ancestor (every .glass card) turns `position: fixed`
  // into "relative to that card" and traps z-index in its stacking context.
  it("renders its children directly under document.body", () => {
    const { container } = render(
      <div className="glass">
        <ModalPortal>
          <div data-testid="overlay" />
        </ModalPortal>
      </div>
    );

    const overlay = screen.getByTestId("overlay");
    expect(overlay.parentElement).toBe(document.body);
    expect(container).not.toContainElement(overlay);
  });
});
