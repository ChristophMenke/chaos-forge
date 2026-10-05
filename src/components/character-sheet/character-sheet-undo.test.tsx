import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import type { CharacterRow } from "@/lib/supabase/types";
import { createUndoStub } from "@/components/undo/undo-test-utils";
import { rowUpdate } from "@/lib/undo/changes";
import { baseCharacter } from "@/components/play-mode/effect-test-helpers";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/characters/char-1/manage",
}));

/** Every query resolves to { data, error: null }; writes are logged. */
const writes: { table: string; op: string; values?: unknown }[] = [];
function chain(table: string): unknown {
  const target = {
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
  };
  return new Proxy(target, {
    get(t, prop) {
      if (prop === "then") return t.then;
      return (...args: unknown[]) => {
        if (prop === "update" || prop === "insert" || prop === "delete") {
          writes.push({ table, op: String(prop), values: args[0] });
        }
        return chain(table);
      };
    },
  });
}
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => chain(table),
    channel: () => {
      const ch = { on: () => ch, subscribe: () => ch };
      return ch;
    },
    removeChannel: () => {},
  }),
}));

const { CharacterSheet } = await import("./character-sheet");

const character = {
  ...baseCharacter,
  user_id: "user-1",
  race_id: "human",
  level: 3,
  is_npc: false,
  alignment: "TN",
  notes: "",
  gold_pp: 0,
  gold_gp: 10,
  gold_ep: 0,
  gold_sp: 0,
  gold_cp: 0,
  traits: [],
  disadvantages: [],
  spell_whitelist: [],
} as unknown as CharacterRow;

const rope = {
  id: "inv-1",
  character_id: "char-1",
  item_id: null,
  custom_name: "Seil",
  quantity: 2,
  notes: "",
  item: null,
};
const elvish = { id: "lang-1", character_id: "char-1", language_name: "Elfisch" };

const missile = {
  character_id: "char-1",
  spell_id: "s1",
  prepared: false,
  expended: false,
  spell: {
    id: "s1",
    name: "Magisches Geschoss",
    name_en: "Magic Missile",
    level: 1,
    school: "Evocation",
    sphere: null,
    spell_type: "wizard",
    source_book: "PHB",
    range: "",
    duration: "",
    area_of_effect: "",
    casting_time: "1",
    components: ["V", "S"],
    saving_throw: "",
    description: "",
  },
};

function renderSheet({
  inventory = [] as unknown[],
  languages = [] as unknown[],
  spells = [] as unknown[],
  classId = "fighter",
} = {}) {
  const undo = createUndoStub();
  const view = render(
    <NextIntlClientProvider locale="de" messages={messages}>
      <undo.Wrapper>
        <CharacterSheet
          character={character}
          characterClasses={[
            {
              id: "cc-1",
              character_id: "char-1",
              class_id: classId,
              level: 3,
              xp_current: 5000,
              is_active: true,
            } as never,
          ]}
          userId="user-1"
          equipment={[]}
          spells={spells as never}
          allWeapons={[]}
          allArmor={[]}
          allSpells={[]}
          weaponProficiencies={[]}
          nonweaponProficiencies={[]}
          inventory={inventory as never}
          allGeneralItems={[]}
          allNonweaponProficiencies={[]}
          languages={languages as never}
          fightingStyles={[]}
          sessions={[]}
          xpHistory={[]}
        />
      </undo.Wrapper>
    </NextIntlClientProvider>
  );
  return { undo, ...view };
}

beforeEach(() => {
  writes.length = 0;
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    }
  );
});
afterEach(cleanup);

describe("CharacterSheet undo", () => {
  it("records unsaved input as draft steps that undo without writing", () => {
    const { undo } = renderSheet();
    const str = screen.getByTestId("sheet-ability-str") as HTMLInputElement;
    fireEvent.change(str, { target: { value: "17" } });

    expect(undo.entries).toHaveLength(1);
    expect(undo.entries[0]).toMatchObject({
      kind: "draft",
      label: { key: "draftField", values: { field: "Stärke" } },
      coalesceKey: "draft-str",
      changes: [{ table: "characters", before: { str: 16 }, after: { str: 17 } }],
    });

    undo.replay("undo");
    expect(str.value).toBe("16");
    undo.replay("redo");
    expect(str.value).toBe("17");
    expect(writes).toEqual([]);
  });

  it("turns the draft into one saved step on save", async () => {
    const { undo } = renderSheet();
    fireEvent.change(screen.getByTestId("sheet-ability-str"), { target: { value: "17" } });
    fireEvent.click(screen.getByTestId("sheet-save-button"));

    await waitFor(() => expect(undo.value.collapseDraft).toHaveBeenCalled());
    expect(undo.value.collapseDraft).toHaveBeenCalledWith({
      label: { key: "sheetSaved" },
      changes: [
        { table: "characters", key: { id: "char-1" }, before: { str: 16 }, after: { str: 17 } },
      ],
    });
  });

  it("drops the draft steps when the sheet is left", () => {
    const { undo, unmount } = renderSheet();
    unmount();
    expect(undo.value.dropDraft).toHaveBeenCalled();
  });

  it("records paying with several coins as one step", () => {
    const { undo } = renderSheet();
    fireEvent.click(screen.getByTestId("sheet-pay-button"));
    fireEvent.change(screen.getByTestId("pay-gp-input"), { target: { value: "3" } });
    fireEvent.click(screen.getByTestId("pay-confirm"));

    expect(undo.entries).toHaveLength(1);
    expect(undo.entries[0].label).toEqual({ key: "coins" });
    expect(undo.entries[0].changes[0].before).toMatchObject({ gold_gp: 10 });
  });

  it("does not put direct writes (e.g. a level-up) into the saved step", async () => {
    const { undo } = renderSheet();
    // A level-up elsewhere raised hp_max in the database (db step).
    const levelUp = {
      label: { key: "levelUp" },
      changes: [rowUpdate("characters", { id: "char-1" }, { hp_max: 30 }, { hp_max: 36 })!],
    };
    undo.replay("redo", levelUp);

    fireEvent.change(screen.getByTestId("sheet-ability-str"), { target: { value: "17" } });
    fireEvent.click(screen.getByTestId("sheet-save-button"));

    await waitFor(() => expect(undo.value.collapseDraft).toHaveBeenCalled());
    const saved = vi.mocked(undo.value.collapseDraft).mock.calls[0][0];
    expect(saved.changes).toEqual([
      { table: "characters", key: { id: "char-1" }, before: { str: 16 }, after: { str: 17 } },
    ]);
  });

  it("records a typed quantity as one step and restores a deleted item on undo", async () => {
    const { undo } = renderSheet({ inventory: [rope] });
    fireEvent.click(screen.getByTestId("tab-trigger-equipment"));
    const row = await screen.findByTestId("inventory-item-inv-1");
    const qty = row.querySelector("input")!;

    fireEvent.change(qty, { target: { value: "1" } });
    fireEvent.change(qty, { target: { value: "12" } });
    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0].changes[0]).toMatchObject({
      table: "character_inventory",
      before: { quantity: 2 },
      after: { quantity: 12 },
    });
    expect(writes.filter((w) => w.table === "character_inventory")).toHaveLength(1);

    fireEvent.click(within(row).getByText("✕"));
    fireEvent.click(await screen.findByTestId("confirm-delete"));
    await waitFor(() => expect(screen.queryByTestId("inventory-item-inv-1")).toBeNull());
    expect(undo.entries[1]).toMatchObject({
      label: { key: "itemRemoved", values: { name: "Seil" } },
      changes: [{ table: "character_inventory", after: null }],
    });

    undo.replay("undo");
    expect(screen.getByTestId("inventory-item-inv-1")).toBeInTheDocument();
  });

  it("restores a removed language on undo", async () => {
    const { undo } = renderSheet({ languages: [elvish] });
    fireEvent.click(screen.getByTestId("tab-trigger-proficiencies"));
    fireEvent.click(await screen.findByTestId("language-remove-Elfisch"));

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(screen.queryByTestId("language-Elfisch")).toBeNull();
    expect(undo.entries[0]).toMatchObject({
      label: { key: "profRemoved", values: { name: "Elfisch" } },
      changes: [{ table: "character_languages", before: elvish, after: null }],
    });

    undo.replay("undo");
    expect(screen.getByTestId("language-Elfisch")).toBeInTheDocument();
  });

  it("brings a removed spell back on undo", async () => {
    const { undo } = renderSheet({ spells: [missile], classId: "mage" });
    fireEvent.click(screen.getByTestId("tab-trigger-spells"));
    fireEvent.click(await screen.findByTestId("spell-remove-s1"));

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(screen.queryByTestId("spell-remove-s1")).toBeNull();
    expect(undo.entries[0]).toMatchObject({
      label: { key: "spellRemoved", values: { name: "Magisches Geschoss" } },
      changes: [
        {
          table: "character_spells",
          key: { character_id: "char-1", spell_id: "s1" },
          before: { character_id: "char-1", spell_id: "s1", prepared: false, expended: false },
          after: null,
        },
      ],
    });

    undo.replay("undo");
    expect(screen.getByTestId("spell-remove-s1")).toBeInTheDocument();
  });
});
