import { describe, it, expect } from "vitest";
import { MAX_SUMMARY_LENGTH, buildSummaryPrompt, parseSummaryRequest } from "./summary-request";
import { SUMMARY_SYSTEM_PROMPT } from "./system-prompt";

describe("buildSummaryPrompt", () => {
  it("combines the previous summary with the new messages", () => {
    const prompt = buildSummaryPrompt("Bisher: ETW0 16 für Kämpfer 5.", [
      { role: "user", content: "Und Stufe 7?" },
      { role: "assistant", content: "ETW0 14." },
    ]);

    expect(prompt).toContain("Bisher: ETW0 16 für Kämpfer 5.");
    expect(prompt).toContain("Spieler: Und Stufe 7?");
    expect(prompt).toContain("SvenBot: ETW0 14.");
  });

  it("says so when there is no summary yet", () => {
    expect(buildSummaryPrompt("", [{ role: "user", content: "Q" }])).toMatch(/noch keine/i);
  });

  it("shortens very long messages", () => {
    const prompt = buildSummaryPrompt("", [{ role: "assistant", content: "x".repeat(5000) }]);
    expect(prompt.length).toBeLessThan(2600);
    expect(prompt).toContain("…");
  });
});

describe("parseSummaryRequest", () => {
  const valid = {
    previousSummary: "alt",
    messages: [
      { role: "user", content: "Q" },
      { role: "assistant", content: "A" },
    ],
  };

  it("accepts a well-formed request", () => {
    expect(parseSummaryRequest(valid)).toEqual(valid);
  });

  it.each([
    ["no body", null],
    ["no messages", { previousSummary: "" }],
    ["empty messages", { previousSummary: "", messages: [] }],
    ["too many messages", { previousSummary: "", messages: Array(41).fill(valid.messages[0]) }],
    ["bad role", { previousSummary: "", messages: [{ role: "system", content: "x" }] }],
    ["summary too long", { ...valid, previousSummary: "x".repeat(MAX_SUMMARY_LENGTH + 1) }],
  ])("rejects %s", (_label, body) => {
    expect(parseSummaryRequest(body)).toBeNull();
  });
});

describe("SUMMARY_SYSTEM_PROMPT", () => {
  it("asks for a short, factual summary without invention", () => {
    expect(SUMMARY_SYSTEM_PROMPT).toMatch(/250 Wörter/);
    expect(SUMMARY_SYSTEM_PROMPT).toMatch(/Regeln/);
    expect(SUMMARY_SYSTEM_PROMPT).toMatch(/Erfinde nichts/);
  });
});
