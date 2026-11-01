import { describe, it, expect } from "vitest";
import { APP_HELP_CONTEXT, SYSTEM_PROMPT } from "./system-prompt";

describe("SYSTEM_PROMPT (SvenBot)", () => {
  it("speaks as SvenBot, the group's game master Sven", () => {
    expect(SYSTEM_PROMPT).toContain("SvenBot");
    expect(SYSTEM_PROMPT).toContain("Sven");
    expect(SYSTEM_PROMPT).toContain("Spielleiter");
  });

  it("has dropped the old scholar persona entirely", () => {
    expect(SYSTEM_PROMPT).not.toMatch(/Gelehrte/);
    expect(SYSTEM_PROMPT).not.toMatch(/Folianten/);
  });

  it("keeps the teasing to one jab and never insults", () => {
    expect(SYSTEM_PROMPT).toMatch(/HÖCHSTENS EINE Stichelei/);
    expect(SYSTEM_PROMPT).toMatch(/Niemals beleidigend/);
  });

  it("keeps the factual rules: sources only, citation format, no invention", () => {
    expect(SYSTEM_PROMPT.match(/AUSSCHLIESSLICH/g)?.length).toBeGreaterThanOrEqual(2);
    expect(SYSTEM_PROMPT).toContain("**(Buchname)**");
    expect(SYSTEM_PROMPT).toMatch(/Erfinde NIEMALS/);
    expect(SYSTEM_PROMPT).toContain("frag Christoph direkt");
  });

  it("keeps answers short, metric and in the asker's language", () => {
    expect(SYSTEM_PROMPT).toContain("FASSE DICH KURZ");
    expect(SYSTEM_PROMPT).toMatch(/metrische Maßeinheiten/);
    expect(SYSTEM_PROMPT).toMatch(/Sprache, in der die Frage gestellt wurde/);
  });
});

describe("APP_HELP_CONTEXT", () => {
  it("calls the chat SvenBot and describes where to find it", () => {
    expect(APP_HELP_CONTEXT).not.toMatch(/Rulebook Chat/);
    expect(APP_HELP_CONTEXT).not.toMatch(/\bChat\)/);
    expect(APP_HELP_CONTEXT).toMatch(/SVENBOT/);
    expect(APP_HELP_CONTEXT).toMatch(/Desktop: direkt in der Sidebar/);
  });

  it("explains that the conversation is kept until 'Neuer Chat'", () => {
    expect(APP_HELP_CONTEXT).toMatch(/Neuer Chat/);
    expect(APP_HELP_CONTEXT).toMatch(/Spieler- und GM-Chat sind getrennt/);
  });

  it("describes the level-up assistant instead of an automatic level-up", () => {
    expect(APP_HELP_CONTEXT).not.toMatch(/Stufenaufstieg passiert automatisch/);
    expect(APP_HELP_CONTEXT).toMatch(/Stufenaufstieg verfügbar/);
  });
});
