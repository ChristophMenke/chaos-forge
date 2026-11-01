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
    render(<ChatMessage role="assistant" content="ETW" status="streaming" />);

    expect(screen.getByTestId("svenbot-avatar")).toBeInTheDocument();
  });

  it("shows no face next to the player's own question", () => {
    render(<ChatMessage role="user" content="Was ist mein ETW0?" />);

    expect(screen.queryByTestId("svenbot-avatar")).not.toBeInTheDocument();
  });
});

describe("ChatMessage status", () => {
  it("marks an interrupted answer", async () => {
    render(<ChatMessage role="assistant" content="Stufe 5 und" status="interrupted" />);

    expect(await screen.findByText("Stufe 5 und")).toBeInTheDocument();
    expect(screen.getByText(/interrupted/)).toBeInTheDocument();
  });

  it("shows only the note when nothing arrived before the interruption", () => {
    render(<ChatMessage role="assistant" content="" status="interrupted" />);

    expect(screen.getByTestId("chat-message-assistant").textContent).toMatch(/interrupted/);
  });

  it("prefixes errors in the current language, after any partial answer", async () => {
    render(<ChatMessage role="assistant" content="Teil" status="error" errorMessage="HTTP 500" />);

    await screen.findByText("Teil");
    const row = screen.getByTestId("chat-message-assistant");
    expect(row.textContent).toContain("error: HTTP 500");
  });
});
