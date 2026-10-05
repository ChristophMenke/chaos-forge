import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { VIEW_MODE_STORAGE_KEY } from "@/lib/view-mode";

const sonnerProps = vi.fn();
vi.mock("sonner", () => ({
  Toaster: (props: Record<string, unknown>) => {
    sonnerProps(props);
    return null;
  },
}));
vi.mock("next-themes", () => ({ useTheme: () => ({ theme: "dark" }) }));

const { Toaster } = await import("./sonner");

afterEach(cleanup);

describe("Toaster position", () => {
  beforeEach(() => {
    localStorage.clear();
    sonnerProps.mockClear();
  });

  it("uses the configured position by default", () => {
    render(<Toaster position="bottom-right" />);
    expect(sonnerProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ position: "bottom-right" })
    );
  });

  // In forced mobile view the bottom nav would cover bottom-anchored toasts.
  it("moves toasts to the top in mobile view", () => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, "mobile");
    render(<Toaster position="bottom-right" />);
    expect(sonnerProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ position: "top-center" })
    );
  });
});
