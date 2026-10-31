import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => (key === "botName" ? "SvenBot" : key),
}));

const { SvenBotAvatar, SvenBotIcon } = await import("./svenbot-avatar");

afterEach(cleanup);

describe("SvenBotAvatar", () => {
  it("shows the game master's face labelled as SvenBot", () => {
    render(<SvenBotAvatar />);

    const img = screen.getByRole("img", { name: "SvenBot" });
    expect(img).toHaveClass("rounded-full");
    expect(screen.getByTestId("svenbot-avatar")).toBe(img);
  });

  it.each([
    ["sm", "h-7", "w-7"],
    ["md", "h-9", "w-9"],
    ["lg", "h-20", "w-20"],
  ] as const)("renders size %s as %s %s", (size, height, width) => {
    render(<SvenBotAvatar size={size} />);

    const img = screen.getByTestId("svenbot-avatar");
    expect(img).toHaveClass(height, width);
  });

  it("accepts extra classes", () => {
    render(<SvenBotAvatar className="self-start" />);

    expect(screen.getByTestId("svenbot-avatar")).toHaveClass("self-start");
  });
});

describe("SvenBotIcon", () => {
  it("is decorative, because navigation labels already name it", () => {
    const { container } = render(<SvenBotIcon className="h-5 w-5 shrink-0" />);

    const img = container.querySelector("img");
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveClass("h-5", "w-5", "shrink-0", "rounded-full");
  });
});
