import { describe, it, expect } from "vitest";
import {
  GEMINI_MODEL_PRECISE,
  GEMINI_MODEL_STANDARD,
  buildContents,
  buildParts,
  extractText,
  isTruncated,
  pickModel,
} from "./text-request";

describe("pickModel", () => {
  it("uses the pro model in precise mode", () => {
    expect(pickModel(true)).toBe(GEMINI_MODEL_PRECISE);
  });

  it("uses the flash model otherwise", () => {
    expect(pickModel(false)).toBe(GEMINI_MODEL_STANDARD);
  });
});

describe("buildParts", () => {
  it("puts the files before the prompt", () => {
    const parts = buildParts(
      [
        { data: "AAA", mimeType: "image/jpeg" },
        { data: "BBB", mimeType: "application/pdf" },
      ],
      "Lies den Bogen aus."
    );

    expect(parts).toEqual([
      { inlineData: { mimeType: "image/jpeg", data: "AAA" } },
      { inlineData: { mimeType: "application/pdf", data: "BBB" } },
      { text: "Lies den Bogen aus." },
    ]);
  });

  it("works without any files", () => {
    expect(buildParts([], "Nur Text")).toEqual([{ text: "Nur Text" }]);
  });
});

describe("isTruncated", () => {
  it("detects a response cut off by the token limit", () => {
    expect(isTruncated({ candidates: [{ finishReason: "MAX_TOKENS" }] })).toBe(true);
  });

  it("accepts a normally finished response", () => {
    expect(isTruncated({ candidates: [{ finishReason: "STOP" }] })).toBe(false);
  });

  it("does not treat a missing finish reason as truncated", () => {
    expect(isTruncated({})).toBe(false);
    expect(isTruncated({ candidates: [] })).toBe(false);
    expect(isTruncated({ candidates: [{}] })).toBe(false);
  });
});

describe("extractText", () => {
  it("returns the response text", () => {
    expect(extractText({ text: "Hallo" })).toBe("Hallo");
  });

  // Gemini leaves `text` undefined when the answer was cut off at MAX_TOKENS —
  // reading it unguarded would blow up exactly in the error case.
  it("returns an empty string when the model produced no text", () => {
    expect(extractText({})).toBe("");
    expect(extractText({ text: undefined })).toBe("");
  });
});

describe("buildContents", () => {
  it("maps the assistant role to Gemini's model role", () => {
    const contents = buildContents(
      [
        { role: "user", content: "Was ist THAC0?" },
        { role: "assistant", content: "Eine Trefferwurf-Tabelle." },
      ],
      [],
      "Und wie rechne ich damit?"
    );

    expect(contents).toEqual([
      { role: "user", parts: [{ text: "Was ist THAC0?" }] },
      { role: "model", parts: [{ text: "Eine Trefferwurf-Tabelle." }] },
      { role: "user", parts: [{ text: "Und wie rechne ich damit?" }] },
    ]);
  });

  it("attaches files to the current message, not to the history", () => {
    const contents = buildContents(
      [{ role: "user", content: "Früher" }],
      [{ data: "AAA", mimeType: "image/jpeg" }],
      "Lies das aus."
    );

    expect(contents).toHaveLength(2);
    expect(contents[0].parts).toEqual([{ text: "Früher" }]);
    expect(contents[1]).toEqual({
      role: "user",
      parts: [{ inlineData: { mimeType: "image/jpeg", data: "AAA" } }, { text: "Lies das aus." }],
    });
  });

  it("works without any history", () => {
    expect(buildContents([], [], "Allein")).toEqual([
      { role: "user", parts: [{ text: "Allein" }] },
    ]);
  });
});
