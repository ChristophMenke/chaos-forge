import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import type { CharacterRow, CharacterSpellWithDetails, SpellRow } from "@/lib/supabase/types";
import { PlaySpellbookPanel } from "./play-spellbook-panel";
import { baseCharacter } from "./effect-test-helpers";

afterEach(cleanup);

function spell(id: string, level: number, type: "wizard" | "priest" = "wizard"): SpellRow {
  return {
    id,
    name: id,
    name_en: id,
    level,
    spell_type: type,
    school: type === "wizard" ? "Evocation" : null,
    sphere: type === "priest" ? "Healing" : null,
    range: "",
    duration: "",
    area_of_effect: "",
    components: [],
    description: "",
    description_en: null,
    casting_time: "1",
    saving_throw: "None",
    source_book: "PHB",
    is_custom: false,
    created_by: null,
  };
}

function charSpell(
  s: SpellRow,
  { prepared = true, expended = false } = {}
): CharacterSpellWithDetails {
  return { character_id: "char-1", spell_id: s.id, prepared, expended, spell: s };
}

interface Options {
  character?: Partial<CharacterRow>;
  classEntries: { classId: string; level: number }[];
  wisScore?: number;
  spells?: CharacterSpellWithDetails[];
  epicBonusSpellPoints?: number;
}

function renderPanel(o: Options) {
  const character = {
    ...baseCharacter,
    spell_system: "slots",
    spell_points_used: 0,
    spell_slots_adj: null,
    ...o.character,
  } as CharacterRow;
  render(
    <NextIntlClientProvider locale="de" messages={messages}>
      <PlaySpellbookPanel
        spells={o.spells ?? []}
        character={character}
        classEntries={o.classEntries}
        wisScore={o.wisScore ?? 12}
        readOnly={false}
        onCast={() => {}}
        onRest={() => {}}
        epicBonusSpellPoints={o.epicBonusSpellPoints}
      />
    </NextIntlClientProvider>
  );
}

/** Slot tiles as "level → used/available". */
function slotTiles(): Record<number, string> {
  const result: Record<number, string> = {};
  const container = screen.queryByTestId("play-spell-slots");
  if (!container) return result;
  for (let lvl = 1; lvl <= 9; lvl++) {
    const tile = within(container).queryByTestId(`play-slot-level-${lvl}`);
    if (tile) result[lvl] = tile.querySelector(".font-mono")!.textContent!;
  }
  return result;
}

describe("PlaySpellbookPanel resources (characterization)", () => {
  it("wizard 7 shows PHB slots per level", () => {
    renderPanel({ classEntries: [{ classId: "mage", level: 7 }] });
    expect(slotTiles()).toEqual({ 1: "0/4", 2: "0/3", 3: "0/2", 4: "0/1" });
  });

  it("specialist gets one bonus slot per level", () => {
    renderPanel({ classEntries: [{ classId: "invoker", level: 7 }] });
    expect(slotTiles()).toEqual({ 1: "0/5", 2: "0/4", 3: "0/3", 4: "0/2" });
  });

  it("priest 5 with WIS 17 gets bonus slots", () => {
    renderPanel({
      classEntries: [{ classId: "cleric", level: 5 }],
      wisScore: 17,
    });
    expect(slotTiles()).toEqual({ 1: "0/5", 2: "0/5", 3: "0/2" });
  });

  it("counts expended prepared spells and applies slot adjustments", () => {
    const mm = spell("mm", 1);
    const sleep = spell("sleep", 1);
    const web = spell("web", 2);
    renderPanel({
      character: { spell_slots_adj: { "1": 1 } },
      classEntries: [{ classId: "mage", level: 3 }],
      spells: [
        charSpell(mm, { expended: true }),
        charSpell(sleep, { expended: true }),
        charSpell(web, { prepared: false, expended: true }),
      ],
    });
    expect(slotTiles()).toEqual({ 1: "2/3", 2: "0/1" });
  });

  it("bard uses the bard table", () => {
    renderPanel({ classEntries: [{ classId: "bard", level: 5 }] });
    expect(slotTiles()).toEqual({ 1: "0/3", 2: "0/1" });
  });

  it("wizard point mode shows remaining and total points", () => {
    renderPanel({
      character: { spell_system: "points", spell_points_used: 5, int: 16 },
      classEntries: [{ classId: "mage", level: 5 }],
      epicBonusSpellPoints: 2,
    });
    const points = screen.getByTestId("play-spell-points");
    expect(screen.queryByTestId("play-spell-slots")).toBeNull();
    expect(points).toHaveTextContent("54/ 59");
  });

  it("priest point mode uses the effective WIS", () => {
    renderPanel({
      character: { spell_system: "points", spell_points_used: 0 },
      classEntries: [{ classId: "cleric", level: 3 }],
      wisScore: 16,
    });
    expect(screen.getByTestId("play-spell-points")).toHaveTextContent("28/ 28");
  });
});
