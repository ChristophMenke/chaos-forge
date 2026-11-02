import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    key === "botName"
      ? "SvenBot"
      : key === "knewCharacters"
        ? `Kannte: ${values?.names}`
        : key === "knewGroup"
          ? `Gruppe (${values?.count})`
          : key,
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

describe("ChatMessage character context", () => {
  it("names the characters SvenBot knew under the answer", () => {
    render(
      <ChatMessage
        role="assistant"
        content="Thorin hat RK 2."
        context={{ names: ["Thorin", "Elandril"], groupSize: null }}
      />
    );
    expect(screen.getByTestId("chat-message-context")).toHaveTextContent(
      "Kannte: Thorin, Elandril"
    );
  });

  it("shows the party size for group questions, next to named heroes", () => {
    render(
      <ChatMessage
        role="assistant"
        content="Thorin."
        context={{ names: ["Thorin"], groupSize: 5 }}
      />
    );
    expect(screen.getByTestId("chat-message-context")).toHaveTextContent(
      "Kannte: Thorin · Gruppe (5)"
    );
  });

  it("shows nothing without character data", () => {
    render(<ChatMessage role="assistant" content="ETW0 ist …" />);
    expect(screen.queryByTestId("chat-message-context")).not.toBeInTheDocument();
  });
});
