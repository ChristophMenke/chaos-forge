import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import type {
  CharacterInventoryWithDetails,
  CharacterNWPWithDetails,
  CharacterRow,
  EpicItemRow,
} from "@/lib/supabase/types";
import { createUndoStub } from "@/components/undo/undo-test-utils";
import { baseCharacter } from "./effect-test-helpers";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/characters/char-1/play",
}));

/** Every query resolves to { data, error: null }; writes are logged. */
const writes: { table: string; op: string; values?: unknown }[] = [];
function chain(table: string, data: unknown = []): unknown {
  const target = {
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data, error: null }).then(resolve),
  };
  return new Proxy(target, {
    get(t, prop) {
      if (prop === "then") return t.then;
      return (...args: unknown[]) => {
        if (prop === "update" || prop === "insert" || prop === "delete") {
          writes.push({ table, op: String(prop), values: args[0] });
        }
        if (prop === "select" && writes.length > 0) {
          // update(...).select(): echo the touched spell row
          return chain(table, [{ character_id: "char-1", spell_id: "s1" }]);
        }
        return chain(table, data);
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

const { PlayMode } = await import("./play-mode");

const rope = {
  id: "inv-1",
  character_id: "char-1",
  item_id: null,
  custom_name: "Seil",
  quantity: 2,
  notes: "",
  item: null,
} as unknown as CharacterInventoryWithDetails;

const character = {
  ...baseCharacter,
  user_id: "user-1",
  race_id: "human",
  level: 3,
  is_npc: false,
  spell_system: "slots",
  spell_points_used: 0,
  gold_pp: 0,
  gold_gp: 10,
  gold_ep: 0,
  gold_sp: 0,
  gold_cp: 0,
  ignore_encumbrance: true,
} as unknown as CharacterRow;

const missile = {
  character_id: "char-1",
  spell_id: "s1",
  prepared: true,
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
    components: "V, S",
    saving_throw: "",
    description: "",
  },
};

function renderPlayMode({
  wizard = false,
  epicItems = [] as EpicItemRow[],
  nonweaponProficiencies = [] as CharacterNWPWithDetails[],
  userId = "user-1",
} = {}) {
  const undo = createUndoStub();
  render(
    <NextIntlClientProvider locale="de" messages={messages}>
      <undo.Wrapper>
        <PlayMode
          character={character}
          characterClasses={[
            {
              id: "cc-1",
              character_id: "char-1",
              class_id: wizard ? "mage" : "fighter",
              level: 3,
              xp_current: 5000,
              is_active: true,
            } as never,
          ]}
          userId={userId}
          equipment={[]}
          spells={wizard ? [missile as never] : []}
          weaponProficiencies={[]}
          nonweaponProficiencies={nonweaponProficiencies}
          inventory={[rope]}
          epicItems={epicItems}
        />
      </undo.Wrapper>
    </NextIntlClientProvider>
  );
  return undo;
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
});
afterEach(cleanup);

describe("PlayMode undo", () => {
  it("records damage and restores the hit points on undo", async () => {
    const undo = renderPlayMode();
    const hpText = () => screen.getByTestId("play-hp-text").textContent;
    expect(hpText()).toMatch(/^20/);

    fireEvent.click(screen.getByTestId("play-damage-btn"));
    fireEvent.change(screen.getByTestId("play-hp-input-field"), { target: { value: "5" } });
    fireEvent.click(screen.getByTestId("play-hp-apply"));

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0]).toMatchObject({
      label: { key: "damage", values: { amount: 5 } },
      changes: [{ table: "characters", before: { hp_current: 20 }, after: { hp_current: 15 } }],
    });

    expect(hpText()).toMatch(/^15/);
    undo.replay("undo");
    expect(hpText()).toMatch(/^20/);
    undo.replay("redo");
    expect(hpText()).toMatch(/^15/);
  });

  it("records quantity changes and puts a removed item back on undo", async () => {
    const undo = renderPlayMode();
    const item = () => screen.queryAllByTestId("play-inventory-item-inv-1")[0];

    fireEvent.click(screen.getAllByTestId("play-inventory-plus-inv-1")[0]);
    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0]).toMatchObject({
      label: { key: "quantity" },
      coalesceKey: "inv-qty-inv-1",
      changes: [{ before: { quantity: 2 }, after: { quantity: 3 } }],
    });
    undo.replay("undo");
    expect(within(item()).getByText("2")).toBeInTheDocument();

    // 2 → 1 → 0 asks for confirmation, then deletes
    fireEvent.click(screen.getAllByTestId("play-inventory-minus-inv-1")[0]);
    await waitFor(() => expect(undo.entries).toHaveLength(2));
    fireEvent.click(screen.getAllByTestId("play-inventory-minus-inv-1")[0]);
    fireEvent.click(await screen.findByTestId("confirm-delete"));
    await waitFor(() => expect(item()).toBeUndefined());
    expect(undo.entries[2]).toMatchObject({
      label: { key: "itemRemoved", values: { name: "Seil" } },
      changes: [{ table: "character_inventory", after: null }],
    });

    undo.replay("undo");
    expect(item()).toBeDefined();
  });

  it("records coins received and puts them back on redo", async () => {
    const undo = renderPlayMode();
    const gp = () => screen.getAllByTestId("play-coin-gp")[0].textContent;
    fireEvent.click(screen.getAllByTestId("play-receive-btn")[0]);
    fireEvent.change(screen.getByTestId("play-receive-gp"), { target: { value: "5" } });
    fireEvent.click(screen.getByTestId("play-receive-confirm"));

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0].changes[0]).toMatchObject({
      before: { gold_gp: 10 },
      after: { gold_gp: 15 },
    });
    expect(gp()).toMatch(/15/);
    undo.replay("undo");
    expect(gp()).toMatch(/10/);
    undo.replay("redo");
    expect(gp()).toMatch(/15/);
  });

  it("records a cast spell and makes it castable again on undo", async () => {
    const undo = renderPlayMode({ wizard: true });
    fireEvent.click(screen.getAllByTestId("play-nav-spellbook")[0]);
    const cast = () => screen.getAllByTestId("play-cast-s1")[0];
    fireEvent.click(cast());

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0]).toMatchObject({
      label: { key: "spellCast", values: { name: "Magisches Geschoss" } },
      changes: [
        {
          table: "character_spells",
          key: { character_id: "char-1", spell_id: "s1" },
          before: { expended: false },
          after: { expended: true },
        },
      ],
    });
    expect(cast()).toBeDisabled();
    undo.replay("undo");
    expect(cast()).toBeEnabled();
  });
});

const condenser = {
  id: "epic-c",
  character_id: "char-1",
  slug: "constitution_condenser",
  name: "Kondensator",
  name_en: "Condenser",
  description: "",
  description_en: "",
  icon: "",
  equipped: true,
  damage_level: 0,
  max_damage_level: 8,
  damage_levels: {
    "0": { description: "", stat_overrides: { con: 18 } },
    "1": { description: "", stat_overrides: { con: 17 } },
    "8": { description: "", stat_overrides: { con: 5 }, effects: ["device_offline"] },
  },
  simple_effects: {
    overclock: {
      name: "Übertakten",
      name_en: "Overclock",
      requires_check: "Ingenieurskunst",
      requires_check_en: "Engineering",
      con_override: 20,
      poison_save_penalty: 1,
      heals_per_hour: 1,
      description: "",
      description_en: "",
    },
  },
  notes: "",
  created_at: "",
  updated_at: "",
} as EpicItemRow;

const engineering = {
  id: "nwp-1",
  character_id: "char-1",
  proficiency_id: "engineering",
  proficiency: {
    id: "engineering",
    name: "Ingenieurskunst",
    name_en: "Engineering",
    ability: "int",
    modifier: -3,
  },
} as unknown as CharacterNWPWithDetails;

function overclocked(se: Record<string, unknown>, extra: Partial<EpicItemRow> = {}) {
  return { ...condenser, ...extra, simple_effects: { ...condenser.simple_effects, ...se } };
}

async function roll(openTestId: string, result: "success" | "failure") {
  fireEvent.click(screen.getByTestId(openTestId));
  fireEvent.click(await screen.findByTestId(`skill-check-${result}`));
}

describe("PlayMode Übertakten", () => {
  it("zeigt den Besitzer-Start mit Ingenieurskunst-Zielwert (INT 12 − 3)", () => {
    renderPlayMode({ wizard: true, epicItems: [condenser], nonweaponProficiencies: [engineering] });
    expect(screen.getByTestId("play-overclock-idle")).toHaveTextContent("Ingenieurskunst 9");
  });

  it("startet nach gelungenem Wurf als ein Schritt", async () => {
    const undo = renderPlayMode({ wizard: true, epicItems: [condenser] });
    await roll("overclock-start", "success");

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0]).toMatchObject({
      label: { key: "overclockOn" },
      changes: [{ table: "epic_items", after: { simple_effects: { overclock_active: true } } }],
    });
    expect(screen.getByTestId("play-overclock")).toHaveTextContent("Stunde 1");
  });

  it("nimmt bei misslungenem Start eine Schadensstufe", async () => {
    const undo = renderPlayMode({ wizard: true, epicItems: [condenser] });
    await roll("overclock-start", "failure");

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0]).toMatchObject({
      label: { key: "overclockFailed", values: { level: 1 } },
      changes: [{ table: "epic_items", before: { damage_level: 0 }, after: { damage_level: 1 } }],
    });
  });

  it("„Eine Stunde vergeht“ zählt, heilt und ist ein Schritt; Undo stellt beides her", async () => {
    const undo = renderPlayMode({
      wizard: true,
      epicItems: [overclocked({ overclock_active: true, overclock_hours: 2 })],
      nonweaponProficiencies: [engineering],
    });
    expect(screen.getByTestId("play-overclock")).toHaveTextContent("Stunde 3");
    expect(screen.getByTestId("play-overclock-next-check")).toHaveTextContent(
      "Ingenieurskunst 8 (−1)"
    );
    const hpText = () => screen.getByTestId("play-hp-text").textContent;
    expect(hpText()).toMatch(/^20/);

    await roll("overclock-hour", "success");

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0]).toMatchObject({
      label: { key: "overclockHour", values: { hour: 3 } },
      changes: [
        { table: "epic_items", after: { simple_effects: { overclock_hours: 3 } } },
        { table: "characters", before: { hp_current: 20 }, after: { hp_current: 21 } },
      ],
    });
    expect(undo.entries[0].coalesceKey).toBeUndefined();
    expect(hpText()).toMatch(/^21/);
    expect(screen.getByTestId("play-overclock")).toHaveTextContent("Stunde 4");

    undo.replay("undo");
    expect(hpText()).toMatch(/^20/);
    expect(screen.getByTestId("play-overclock")).toHaveTextContent("Stunde 3");
  });

  it("schaltet bei misslungener Kühlung ab und zeigt die Abkühlsperre", async () => {
    const undo = renderPlayMode({
      wizard: true,
      epicItems: [overclocked({ overclock_active: true, overclock_hours: 0 })],
    });
    await roll("overclock-hour", "failure");

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0].label.key).toBe("overclockCooledDown");
    expect(screen.getByTestId("play-overclock-idle")).toHaveTextContent("kühlt ab");
    expect(screen.getByTestId("overclock-day-passed")).toBeInTheDocument();
  });

  it("beendet freiwillig als ein Schritt", async () => {
    const undo = renderPlayMode({
      wizard: true,
      epicItems: [overclocked({ overclock_active: true, overclock_hours: 1 })],
    });
    fireEvent.click(screen.getByTestId("overclock-stop"));

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0].label.key).toBe("overclockOff");
    expect(screen.getByTestId("overclock-start")).toBeInTheDocument();
  });

  it("zeigt anderen nur die laufende Übertaktung, ohne Knöpfe", () => {
    renderPlayMode({ wizard: true, epicItems: [condenser], userId: "user-2" });
    expect(screen.queryByTestId("play-overclock-idle")).toBeNull();
    cleanup();
    renderPlayMode({
      wizard: true,
      epicItems: [overclocked({ overclock_active: true })],
      userId: "user-2",
    });
    expect(screen.getByTestId("play-overclock")).toBeInTheDocument();
    expect(screen.queryByTestId("overclock-hour")).toBeNull();
  });

  it("zeigt nichts, wenn das Gerät ausgefallen oder abgelegt ist", () => {
    renderPlayMode({ wizard: true, epicItems: [{ ...condenser, damage_level: 8 }] });
    expect(screen.queryByTestId("play-overclock-idle")).toBeNull();
    cleanup();
    renderPlayMode({ wizard: true, epicItems: [{ ...condenser, equipped: false }] });
    expect(screen.queryByTestId("play-overclock-idle")).toBeNull();
  });
});
