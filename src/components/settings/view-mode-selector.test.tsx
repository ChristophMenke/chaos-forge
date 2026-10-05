import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { VIEW_MODE_STORAGE_KEY } from "@/lib/view-mode";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

const { ViewModeSelector } = await import("./view-mode-selector");

afterEach(cleanup);

const option = (mode: string) => screen.getByTestId(`view-mode-${mode}`);

describe("ViewModeSelector", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "dark";
  });

  it("offers the three modes as a radio group with auto selected by default", () => {
    render(<ViewModeSelector />);

    expect(screen.getByRole("radiogroup", { name: "viewMode" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(option("auto")).toHaveAttribute("aria-checked", "true");
    expect(option("mobile")).toHaveAttribute("aria-checked", "false");
  });

  it("switches the whole app to the mobile layout on click", () => {
    render(<ViewModeSelector />);

    fireEvent.click(option("mobile"));

    expect(option("mobile")).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.classList.contains("view-mobile")).toBe(true);
    expect(localStorage.getItem(VIEW_MODE_STORAGE_KEY)).toBe("mobile");
  });

  it("shows the stored mode after a reload", () => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, "desktop");
    render(<ViewModeSelector />);

    expect(option("desktop")).toHaveAttribute("aria-checked", "true");
  });
});
