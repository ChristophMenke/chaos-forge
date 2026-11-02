import { describe, it, expect, vi, afterEach } from "vitest";
import { buildCharacterContext } from "./character-context";
import { decodeCharacterHeader, encodeCharacterHeader, parseCharacterInfo } from "./character-info";
import { createFakeQueryClient } from "./fake-query-client";
import { makeCharacter, makeClass } from "./character-fixtures";

afterEach(() => vi.restoreAllMocks());

/** "visible" = what the RLS-bound characters query returns for this user. */
function db(visible: { id: string; name: string; is_npc?: boolean; is_active?: boolean }[]) {
  const characters = visible.map((c) =>
    makeCharacter({
      id: c.id,
      name: c.name,
      is_npc: c.is_npc ?? false,
      is_active: c.is_active ?? true,
    })
  );
  return createFakeQueryClient({
    characters,
    character_classes: visible.map((c) => ({ ...makeClass("fighter", 3), character_id: c.id })),
    // Child tables are readable for everyone — including a hidden hero.
    character_spells: [{ character_id: "hidden", spell_id: "x", spell: { name: "Geheim" } }],
  });
}

const input = {
  history: [],
  summary: "",
  scope: "player" as const,
};

describe("buildCharacterContext", () => {
  it("returns the named character as a prompt block", async () => {
    const fake = db([{ id: "t", name: "Thorin" }]);
    const ctx = await buildCharacterContext(fake.client, { ...input, message: "RK von Thorin?" });
    expect(ctx.names).toEqual(["Thorin"]);
    expect(ctx.groupSize).toBeNull();
    expect(ctx.block).toContain("## Thorin");
  });

  it("returns an empty context when no character is named", async () => {
    const fake = db([{ id: "t", name: "Thorin" }]);
    const ctx = await buildCharacterContext(fake.client, { ...input, message: "Was ist ETW0?" });
    expect(ctx).toEqual({ block: "", names: [], groupSize: null });
    // Only the candidate query ran
    expect(fake.queries.map((q) => q.table)).toEqual(["characters"]);
  });

  it("only ever loads ids returned by the RLS-bound candidate query", async () => {
    const fake = db([{ id: "t", name: "Thorin" }]);
    await buildCharacterContext(fake.client, {
      ...input,
      message: "Was können Thorin und Hidden?",
    });
    const requested = fake.queries
      .flatMap((q) => q.filters.filter((f) => f.op === "in").map((f) => f.value as string[]))
      .flat();
    expect(new Set(requested)).toEqual(new Set(["t"]));
  });

  it("adds the party in compact form for group questions", async () => {
    const fake = db([
      { id: "t", name: "Thorin" },
      { id: "e", name: "Elandril" },
      { id: "n", name: "Grimbold", is_npc: true },
    ]);
    const ctx = await buildCharacterContext(fake.client, {
      ...input,
      message: "Wer von uns hat die beste RK?",
    });
    expect(ctx.names).toEqual([]);
    expect(ctx.groupSize).toBe(2);
    expect(ctx.block).toContain("Weitere aktive Helden");
    expect(ctx.block).not.toContain("Grimbold");
  });

  it("swallows database errors and logs without content", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = createFakeQueryClient({}, { failTable: "characters" });
    const ctx = await buildCharacterContext(fake.client, { ...input, message: "Thorin?" });
    expect(ctx).toEqual({ block: "", names: [], groupSize: null });
    expect(log).toHaveBeenCalledWith("SvenBot character context:", "boom");
  });
});

describe("character header", () => {
  it("round-trips names with umlauts", () => {
    const header = encodeCharacterHeader({ names: ["Björn Ölbart", "Éowyn"], groupSize: 5 });
    expect(header).toMatch(/^[\x20-\x7e]+$/);
    expect(decodeCharacterHeader(header)).toEqual({
      names: ["Björn Ölbart", "Éowyn"],
      groupSize: 5,
    });
  });

  it("is omitted without characters", () => {
    expect(encodeCharacterHeader({ names: [], groupSize: null })).toBeNull();
  });

  it("decodes missing or broken values to null", () => {
    expect(decodeCharacterHeader(null)).toBeNull();
    expect(decodeCharacterHeader("%E0%A4%A")).toBeNull();
    expect(decodeCharacterHeader(encodeURIComponent('{"names":"Thorin"}'))).toBeNull();
  });

  it("validates stored info", () => {
    expect(parseCharacterInfo({ names: ["Thorin"], groupSize: null })).toEqual({
      names: ["Thorin"],
      groupSize: null,
    });
    expect(parseCharacterInfo({ names: [1], groupSize: null })).toBeNull();
    expect(parseCharacterInfo({ names: [], groupSize: 2.5 })).toBeNull();
    expect(parseCharacterInfo({ names: [], groupSize: null })).toBeNull();
  });
});
