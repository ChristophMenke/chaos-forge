// Server-only, same as the rest of this folder: it reads GOOGLE_API_KEY.
import { getGenAI } from "./client";
import {
  buildContents,
  extractText,
  isTruncated,
  pickModel,
  type AiInputFile,
  type AiMessage,
} from "./text-request";

export type { AiInputFile, AiMessage };

export interface GenerateTextOptions {
  /** The instruction for this turn — goes last, after any files. */
  prompt: string;
  /** Images or PDFs for this turn, base64 encoded. */
  files?: AiInputFile[];
  /** Earlier turns of the conversation. */
  history?: AiMessage[];
  /** Persistent instruction, kept out of the conversation itself. */
  system?: string;
  /**
   * Ceiling for the whole answer. On Gemini 3 the model's thinking counts
   * against this budget too, so leave clear headroom above the expected output.
   */
  maxOutputTokens: number;
  /** Use the stronger (slower) model — wired to the app's "precise" toggle. */
  precise?: boolean;
  /** Force a raw JSON answer, without markdown fences around it. */
  json?: boolean;
}

export interface GenerateTextResult {
  text: string;
  /** True when the token limit cut the answer off — the text is then unusable. */
  truncated: boolean;
}

function buildConfig(options: GenerateTextOptions) {
  return {
    maxOutputTokens: options.maxOutputTokens,
    ...(options.system ? { systemInstruction: options.system } : {}),
    ...(options.json ? { responseMimeType: "application/json" } : {}),
  };
}

export async function generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
  const response = await getGenAI().models.generateContent({
    model: pickModel(options.precise ?? false),
    contents: buildContents(options.history ?? [], options.files ?? [], options.prompt),
    config: buildConfig(options),
  });

  return { text: extractText(response), truncated: isTruncated(response) };
}

/** Streams the answer in text chunks, for the chat's live output. */
export async function* streamText(options: GenerateTextOptions): AsyncGenerator<string> {
  const stream = await getGenAI().models.generateContentStream({
    model: pickModel(options.precise ?? false),
    contents: buildContents(options.history ?? [], options.files ?? [], options.prompt),
    config: buildConfig(options),
  });

  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}
