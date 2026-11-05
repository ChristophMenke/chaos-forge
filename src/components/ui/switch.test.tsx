import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Switch } from "./switch";

afterEach(cleanup);

describe("Switch", () => {
  it("reports its state and asks for the opposite on click", () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onChange} aria-label="Push" />);
    const control = screen.getByRole("switch", { name: "Push" });
    expect(control.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(control);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("is visible when off: outlined track and a knob that is not the background colour", () => {
    render(<Switch checked={false} onCheckedChange={() => {}} aria-label="Push" />);
    const control = screen.getByRole("switch");
    const knob = control.firstElementChild as HTMLElement;

    expect(control.className).toContain("border-muted-foreground");
    expect(knob.className).toContain("bg-muted-foreground");
    expect(`${control.className} ${knob.className}`).not.toMatch(
      /\bbg-(muted|background)(?![\w-])/
    );
  });

  it("fills with the primary colour when on", () => {
    render(<Switch checked onCheckedChange={() => {}} aria-label="Push" />);
    const control = screen.getByRole("switch");
    expect(control.getAttribute("aria-checked")).toBe("true");
    expect(control.className).toContain("bg-primary");
  });

  it("cannot be toggled while disabled or busy", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Switch checked={false} onCheckedChange={onChange} disabled aria-label="Push" />
    );
    fireEvent.click(screen.getByRole("switch"));

    rerender(<Switch checked={false} onCheckedChange={onChange} busy aria-label="Push" />);
    const control = screen.getByRole("switch");
    expect(control.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(control);

    expect(onChange).not.toHaveBeenCalled();
  });
});
