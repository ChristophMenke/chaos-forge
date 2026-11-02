import { describe, it, expect } from "vitest";
import {
  findMentionedCharacters,
  hasGroupWords,
  normalizeName,
  selectCharacters,
  type CharacterCandidate,
} from "./character-match";

const pc = (id: string, name: string, extra: Partial<CharacterCandidate> = {}) => ({
  id,
  name,
  is_npc: false,
  is_active: true,
  ...extra,
});

const elandril = pc("e", "Elandril der Weise");
const thorin = pc("t", "Thorin");
const eowyn = pc("w", "Éowyn");
const tor = pc("tor", "Tor");
const bo = pc("b", "Bo Rabenfeder");
const npc = pc("n", "Grimbold", { is_npc: true });
const candidates = [elandril, thorin, eowyn, tor, bo, npc];

const names = (text: string, list = candidates) =>
  findMentionedCharacters(text, list).map((c) => c.id);

describe("normalizeName", () => {
  it("lowercases and strips accents", () => {
    expect(normalizeName("Éowyn ÄÖÜ")).toBe("eowyn aou");
  });
});

describe("findMentionedCharacters", () => {
  it("finds the whole name", () => {
    expect(names("Was kann Elandril der Weise zaubern?")).toEqual(["e"]);
  });

  it("finds a name part of a multi-word name", () => {
    expect(names("Welche Zauber hat Elandril memoriert?")).toEqual(["e"]);
  });

  it("ignores case and accents", () => {
    expect(names("wie viele TP hat THORIN?")).toEqual(["t"]);
    expect(names("Was trägt eowyn?")).toEqual(["w"]);
  });

  it("accepts the German genitive", () => {
    expect(names("Wie ist Thorins RK?")).toEqual(["t"]);
  });

  it("matches whole words only", () => {
    expect(names("Ich esse eine Torte")).toEqual([]);
    expect(names("Was macht Tor im Kampf?")).toEqual(["tor"]);
  });

  it("does not match parts shorter than 3 characters or stop words", () => {
    expect(names("Bo hat was?")).toEqual([]);
    expect(names("Ist der Zauber gut?")).toEqual([]);
    expect(names("Wo ist Rabenfeder?")).toEqual(["b"]);
  });

  it("returns every character sharing a first name", () => {
    const list = [pc("a", "Thorin Eichenschild"), pc("b", "Thorin Steinfaust")];
    expect(names("Was kann Thorin?", list)).toEqual(["a", "b"]);
  });

  it("ranks whole-name matches first, then by position", () => {
    const list = [pc("a", "Thorin Eichenschild"), pc("b", "Thorin Steinfaust")];
    expect(names("Thorin Steinfaust gegen Thorin", list)).toEqual(["b", "a"]);
    expect(names("Thorin und Elandril", candidates)).toEqual(["t", "e"]);
  });
});

describe("hasGroupWords", () => {
  it.each([
    "Wer von uns hat den besten Rettungswurf gegen Gift?",
    "Wie stark ist unsere Gruppe?",
    "Welche Zauber haben unsere Helden?",
    "Who of us has the best AC?",
    "Which of us can cast fireball?",
    "How strong is our party?",
  ])("detects %s", (text) => {
    expect(hasGroupWords(text)).toBe(true);
  });

  it.each([
    "Wie würfeln wir Initiative?",
    "Können wir zweimal angreifen?",
    "Ist Gruppenzwang eine Fertigkeit?",
    "Can we attack twice?",
  ])("ignores %s", (text) => {
    expect(hasGroupWords(text)).toBe(false);
  });
});

describe("selectCharacters", () => {
  const base = { history: [], summary: "", candidates, scope: "player" as const };

  it("takes characters named in the question", () => {
    expect(selectCharacters({ ...base, message: "Was kann Thorin?" })).toEqual({
      fullIds: ["t"],
      groupIds: [],
      names: ["Thorin"],
      groupSize: null,
    });
  });

  it("returns nothing without any name", () => {
    expect(selectCharacters({ ...base, message: "Wie funktioniert ETW0?" }).fullIds).toEqual([]);
  });

  it("limits full details to three characters", () => {
    const sel = selectCharacters({
      ...base,
      message: "Elandril, Thorin, Eowyn, Tor und Rabenfeder",
    });
    expect(sel.fullIds).toEqual(["e", "t", "w"]);
  });

  it("finds NPCs only in the GM chat", () => {
    expect(selectCharacters({ ...base, message: "Was kann Grimbold?" }).fullIds).toEqual([]);
    expect(
      selectCharacters({ ...base, scope: "gm", message: "Was kann Grimbold?" }).fullIds
    ).toEqual(["n"]);
  });

  describe("follow-up questions", () => {
    const history = [
      { content: "Was kann Elandril?" },
      { content: "Elandril zaubert Feuerbälle." },
      { content: "Und Thorin?" },
      { content: "Thorin trägt eine Axt." },
    ];

    it("uses the latest mention in the history", () => {
      const sel = selectCharacters({ ...base, history, message: "Und seine Rettungswürfe?" });
      expect(sel.fullIds).toEqual(["t"]);
    });

    it("prefers names in the current question", () => {
      const sel = selectCharacters({ ...base, history, message: "Und Eowyn?" });
      expect(sel.fullIds).toEqual(["w"]);
    });

    it("falls back to the running summary", () => {
      const sel = selectCharacters({
        ...base,
        summary: "Aktueller Charakter: Elandril der Weise",
        message: "Wie viele Slots noch?",
      });
      expect(sel.fullIds).toEqual(["e"]);
    });
  });

  describe("group questions", () => {
    it("adds all active player characters in compact form", () => {
      const sel = selectCharacters({
        ...base,
        candidates: [...candidates, pc("x", "Altheld", { is_active: false })],
        message: "Wer von uns hat den besten Rettungswurf gegen Gift?",
      });
      expect(sel.fullIds).toEqual([]);
      expect(sel.groupIds).toEqual(["e", "t", "w", "tor", "b"]);
      expect(sel.groupSize).toBe(5);
    });

    it("keeps named characters in full detail and out of the compact list", () => {
      const sel = selectCharacters({
        ...base,
        message: "Ist Thorin der Stärkste in unserer Gruppe?",
      });
      expect(sel.fullIds).toEqual(["t"]);
      expect(sel.groupIds).not.toContain("t");
      expect(sel.groupSize).toBe(5);
    });

    it("never adds NPCs to the party, even for the GM", () => {
      const sel = selectCharacters({ ...base, scope: "gm", message: "Wie stark ist die Gruppe?" });
      expect(sel.groupIds).not.toContain("n");
    });

    it("does not pull the last hero from the history", () => {
      const sel = selectCharacters({
        ...base,
        history: [{ content: "Thorin hat RK 2." }],
        message: "Wer von uns hat die beste RK?",
      });
      expect(sel.fullIds).toEqual([]);
    });
  });
});
