/**
 * Pure helpers for the Gemini text/vision requests.
 *
 * Kept free of SDK and network access so the request shaping and the response
 * handling can be unit tested — the thin I/O layer lives in `generate-text.ts`.
 */

/**
 * Alias models rather than pinned versions: this app is touched every few
 * weeks, and Google retires pinned IDs (`gemini-2.5-flash` already answers 404
 * for new users). An alias keeps working; the tradeoff is that Google may move
 * it to a newer model without notice.
 */
export const GEMINI_MODEL_STANDARD = "gemini-flash-latest";
export const GEMINI_MODEL_PRECISE = "gemini-pro-latest";

/** An image or PDF handed to the model, base64 encoded. */
export interface AiInputFile {
  data: string;
  mimeType: string;
}

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

/** One turn of chat history, in the role names the app already uses. */
export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

/** Minimal shape of what the SDK returns — everything we actually read. */
export interface GeminiResponseLike {
  text?: string;
  candidates?: Array<{ finishReason?: string }>;
}

export function pickModel(precise: boolean): string {
  return precise ? GEMINI_MODEL_PRECISE : GEMINI_MODEL_STANDARD;
}

/**
 * Files first, prompt last — the scan prompts refer to "the sheet above", and
 * the previous Claude implementation ordered the blocks the same way.
 */
export function buildParts(files: AiInputFile[], prompt: string): GeminiPart[] {
  return [
    ...files.map((file) => ({
      inlineData: { mimeType: file.mimeType, data: file.data },
    })),
    { text: prompt },
  ];
}

export function isTruncated(response: GeminiResponseLike): boolean {
  return response.candidates?.[0]?.finishReason === "MAX_TOKENS";
}

/**
 * Gemini leaves `text` undefined when it ran into the token limit, so callers
 * must not read it unguarded — that is precisely the failure case.
 */
export function extractText(response: GeminiResponseLike): string {
  return response.text ?? "";
}

/**
 * Builds the full `contents` array for a chat turn.
 *
 * Gemini calls the assistant role "model" — mapping it wrong makes the model
 * read its own past answers as user input. Files belong to the current message
 * only; the history is plain text.
 */
export function buildContents(
  history: AiMessage[],
  files: AiInputFile[],
  prompt: string
): GeminiContent[] {
  return [
    ...history.map((message) => ({
      role: message.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: message.content }],
    })),
    { role: "user" as const, parts: buildParts(files, prompt) },
  ];
}
