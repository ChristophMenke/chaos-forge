import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => (key === "botName" ? "SvenBot" : key),
}));

const { RulebookChat } = await import("./rulebook-chat");

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("RulebookChat", () => {
  it("introduces SvenBot with his face in the header", () => {
    render(<RulebookChat />);

    const heading = screen.getByRole("heading", { level: 1, name: "SvenBot" });
    const header = heading.closest("[data-testid='rulebook-chat-header']") as HTMLElement;
    expect(header).not.toBeNull();
    expect(within(header).getByText("title")).toBeInTheDocument();
    expect(within(header).getByTestId("svenbot-avatar")).toBeInTheDocument();
  });

  it("greets with a large portrait in the empty chat", () => {
    render(<RulebookChat />);

    const welcome = screen.getByTestId("chat-welcome");
    expect(within(welcome).getByText("welcome")).toBeInTheDocument();
    expect(within(welcome).getByTestId("svenbot-avatar")).toHaveClass("h-20", "w-20");
  });

  it("shows SvenBot rubbing his hands while the answer is loading", async () => {
    // A request that never settles keeps the chat in its loading state.
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    );
    render(<RulebookChat />);

    fireEvent.click(screen.getAllByTestId("example-question")[0]);

    const loading = await screen.findByTestId("chat-loading");
    expect(within(loading).getByText("thinking")).toBeInTheDocument();
    expect(within(loading).getByTestId("svenbot-avatar")).toBeInTheDocument();
  });
});
