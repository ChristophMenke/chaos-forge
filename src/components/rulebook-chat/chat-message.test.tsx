import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => (key === "botName" ? "SvenBot" : key),
}));

const { ChatMessage } = await import("./chat-message");

afterEach(cleanup);

describe("ChatMessage", () => {
  it("puts SvenBot's face next to his answers", () => {
    render(<ChatMessage role="assistant" content="ETW0 16" />);

    const row = screen.getByTestId("chat-message-assistant");
    expect(row).toContainElement(screen.getByTestId("svenbot-avatar"));
  });

  it("shows the face while an answer is still streaming", () => {
    render(<ChatMessage role="assistant" content="ETW" isStreaming />);

    expect(screen.getByTestId("svenbot-avatar")).toBeInTheDocument();
  });

  it("shows no face next to the player's own question", () => {
    render(<ChatMessage role="user" content="Was ist mein ETW0?" />);

    expect(screen.queryByTestId("svenbot-avatar")).not.toBeInTheDocument();
  });
});
