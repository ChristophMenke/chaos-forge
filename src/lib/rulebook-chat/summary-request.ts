import type { ApiMessage } from "./chat-history";

/** Upper bound for a stored/sent running summary. */
export const MAX_SUMMARY_LENGTH = 4000;
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 2000;

export interface SummaryRequest {
  previousSummary: string;
  messages: ApiMessage[];
}

/** Validates the body of POST /api/rulebook-chat/summary; null when unusable. */
export function parseSummaryRequest(body: unknown): SummaryRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const { previousSummary, messages } = body as Record<string, unknown>;
  if (typeof previousSummary !== "string" || previousSummary.length > MAX_SUMMARY_LENGTH) {
    return null;
  }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return null;
  }
  const valid = messages.every(
    (m) =>
      typeof m === "object" &&
      m !== null &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string"
  );
  if (!valid) return null;
  return {
    previousSummary,
    messages: (messages as ApiMessage[]).map(({ role, content }) => ({ role, content })),
  };
}

function shorten(text: string): string {
  return text.length > MAX_MESSAGE_CHARS ? `${text.slice(0, MAX_MESSAGE_CHARS)} …` : text;
}

export function buildSummaryPrompt(previousSummary: string, messages: ApiMessage[]): string {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Spieler" : "SvenBot"}: ${shorten(m.content)}`)
    .join("\n\n");
  return `Bisherige Zusammenfassung:\n${previousSummary.trim() || "(noch keine)"}\n\n---\n\nNeue Nachrichten:\n\n${transcript}\n\n---\n\nSchreibe die aktualisierte Zusammenfassung.`;
}
