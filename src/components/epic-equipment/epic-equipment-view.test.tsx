import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import type { EpicItemRow } from "@/lib/supabase/types";
import { createUndoStub } from "@/components/undo/undo-test-utils";

vi.mock("next/navigation", () => ({ usePathname: () => "/characters/char-1/epic" }));
const updates: { table: string; values: unknown }[] = [];
const db = {
  /** Gold as stored in the database (crafting re-reads it before paying). */
  gold: { gold_pp: 0, gold_gp: 150, gold_ep: 0, gold_sp: 0, gold_cp: 0 },
  /** Writes to this table fail. */
  failTable: null as string | null,
};
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => ({
      update: (values: unknown) => ({
        eq: async () => {
          if (table === db.failTable) return { error: { message: "boom" } };
          updates.push({ table, values });
          return { error: null };
        },
      }),
      select: () => ({
        eq: () => ({ single: async () => ({ data: db.gold, error: null }) }),
      }),
    }),
  }),
}));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }));

const { EpicEquipmentView } = await import("./epic-equipment-view");

afterEach(() => {
  cleanup();
  updates.length = 0;
  db.gold = { gold_pp: 0, gold_gp: 150, gold_ep: 0, gold_sp: 0, gold_cp: 0 };
  db.failTable = null;
});

const shield = {
  id: "epic-1",
  character_id: "char-1",
  slug: "schild",
  name: "Schild der Ahnen",
  name_en: "Ancestral Shield",
  description: "",
  description_en: null,
  icon: "",
  equipped: true,
  damage_level: 1,
  max_damage_level: 3,
  damage_levels: {},
  simple_effects: {},
  notes: "",
  created_at: "",
  updated_at: "",
} as EpicItemRow;

const blades = {
  ...shield,
  id: "epic-2",
  slug: "klingen",
  name: "Klingen",
  max_damage_level: 0,
  simple_effects: {
    type: "blade_system",
    max_prepared: 3,
    blades: [],
    mixtures: {},
  },
} as EpicItemRow;

function renderView(items: EpicItemRow[], { isOwner = true, gold_gp = 150 } = {}) {
  const undo = createUndoStub();
  render(
    <NextIntlClientProvider locale="de" messages={messages}>
      <undo.Wrapper>
        <EpicEquipmentView
          character={{
            id: "char-1",
            name: "Testheld",
            avatar_url: null,
            user_id: "user-1",
            level: 5,
            con: 14,
            con_health: null,
            con_fitness: null,
            hp_max: 30,
            hp_current: 20,
            gold_pp: 0,
            gold_gp,
            gold_ep: 0,
            gold_sp: 0,
            gold_cp: 0,
          }}
          characterClasses={[]}
          epicItems={items}
          isOwner={isOwner}
        />
      </undo.Wrapper>
    </NextIntlClientProvider>
  );
  return undo;
}

describe("EpicEquipmentView undo", () => {
  it("records a damage level change and shows the old level again on undo", async () => {
    const undo = renderView([shield]);
    fireEvent.click(screen.getByTestId("epic-damage-increase-schild"));

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0]).toMatchObject({
      label: { key: "damageLevel", values: { name: "Schild der Ahnen", level: 2 } },
      changes: [{ table: "epic_items", before: { damage_level: 1 }, after: { damage_level: 2 } }],
    });

    undo.replay("undo");
    fireEvent.click(screen.getByTestId("epic-damage-increase-schild"));
    await waitFor(() => expect(undo.entries).toHaveLength(2));
    // Starts from level 1 again after the undo.
    expect(undo.entries[1].changes[0].after).toEqual({ damage_level: 2 });
  });

  it("forges a blade through the parent and undoes it", async () => {
    const undo = renderView([blades]);
    fireEvent.click(screen.getByTestId("blade-forge"));

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0].label.key).toBe("blades");
    expect(updates[0].table).toBe("epic_items");
    expect(screen.getByTestId("blade-slot-1")).toBeInTheDocument();

    undo.replay("undo");
    expect(screen.queryByTestId("blade-slot-1")).toBeNull();
    undo.replay("redo");
    expect(screen.getByTestId("blade-slot-1")).toBeInTheDocument();
  });
});

const recipe = (keys: string[], extra: Record<string, unknown> = {}) => ({
  yield: 2,
  duration: "ca. 1 Stunde",
  duration_en: "about 1 hour",
  components: keys.map((key) => ({
    key,
    name: key,
    name_en: key,
    source: "Markt",
    source_en: "Market",
  })),
  ...extra,
});

const condenser = {
  ...shield,
  id: "epic-3",
  slug: "constitution_condenser",
  name: "Kondensator",
  damage_level: 2,
  max_damage_level: 8,
  damage_levels: {
    "2": { description: "Stufe 2", stat_overrides: { con: 16 } },
    "3": { description: "Stufe 3", stat_overrides: { con: 15 } },
    "7": { description: "Stufe 7", stat_overrides: { con: 8 } },
    "8": { description: "Aus", stat_overrides: { con: 5 }, effects: ["device_offline"] },
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
    repair_skill: "Ingenieurskunst",
    repair_skill_en: "Engineering",
    repair_time: "10 Minuten",
    repair_time_en: "10 minutes",
    elixir: {
      count: 4,
      bonus: 4,
      name: "Kupferelixier",
      name_en: "Copper Elixir",
      collected: [],
      recipe: recipe(["vinegar", "salt", "oil"], { yield: 1, cost_gp: 100 }),
    },
  },
} as EpicItemRow;

function withEffects(
  item: EpicItemRow,
  se: Record<string, unknown>,
  extra: Partial<EpicItemRow> = {}
) {
  return { ...item, ...extra, simple_effects: { ...item.simple_effects, ...se } } as EpicItemRow;
}

async function rollCheck(openTestId: string, result: "success" | "failure") {
  fireEvent.click(screen.getByTestId(openTestId));
  fireEvent.click(await screen.findByTestId(`skill-check-${result}`));
}

describe("Kondensator: Übertakten", () => {
  it("startet nach gelungenem Wurf als ein Schritt", async () => {
    const undo = renderView([condenser]);
    await rollCheck("overclock-start", "success");

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0]).toMatchObject({
      label: { key: "overclockOn" },
      changes: [
        {
          table: "epic_items",
          after: { simple_effects: { overclock_active: true, overclock_hours: 0 } },
        },
      ],
    });
    expect(screen.getByTestId("overclock-hour-badge")).toHaveTextContent("Stunde 1");
  });

  it("kostet bei misslungenem Wurf eine Schadensstufe und bleibt aus", async () => {
    const undo = renderView([condenser]);
    await rollCheck("overclock-start", "failure");

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0]).toMatchObject({
      label: { key: "overclockFailed", values: { level: 3 } },
      changes: [{ table: "epic_items", before: { damage_level: 2 }, after: { damage_level: 3 } }],
    });
    expect(screen.getByTestId("overclock-start")).toBeInTheDocument();

    undo.replay("undo");
    expect(screen.getByText("Schadensstufe 2 von 8")).toBeInTheDocument();
  });

  it("zählt eine Stunde, heilt 1 TP und zeigt den nächsten Kühlungswurf – ein Schritt", async () => {
    const active = withEffects(condenser, { overclock_active: true, overclock_hours: 1 });
    const undo = renderView([active]);
    expect(screen.getByTestId("overclock-next-check")).toHaveTextContent("Ingenieurskunst");
    expect(screen.getByTestId("overclock-next-check")).not.toHaveTextContent("−");

    await rollCheck("overclock-hour", "success");

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0]).toMatchObject({
      label: { key: "overclockHour", values: { hour: 2 } },
      changes: [
        { table: "epic_items", after: { simple_effects: { overclock_hours: 2 } } },
        { table: "characters", before: { hp_current: 20 }, after: { hp_current: 21 } },
      ],
    });
    // Stunde 3 läuft: Kühlungswurf −1
    expect(screen.getByTestId("overclock-next-check")).toHaveTextContent("Ingenieurskunst (−1)");
  });

  it("schaltet bei misslungener Kühlung ab und sperrt bis „Ein Tag ist vergangen“", async () => {
    const active = withEffects(condenser, { overclock_active: true, overclock_hours: 0 });
    const undo = renderView([active]);
    await rollCheck("overclock-hour", "failure");

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0].label.key).toBe("overclockCooledDown");
    expect(screen.queryByTestId("overclock-start")).toBeNull();
    expect(screen.getByTestId("overclock-cooldown")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("overclock-day-passed"));
    await waitFor(() => expect(undo.entries).toHaveLength(2));
    expect(undo.entries[1].label.key).toBe("overclockCooldownEnded");
    expect(screen.getByTestId("overclock-start")).toBeInTheDocument();
  });

  it("beendet die Übertaktung, wenn der Kondensator ausfällt (gleicher Schritt)", async () => {
    const active = withEffects(
      condenser,
      { overclock_active: true, overclock_hours: 2 },
      { damage_level: 7 }
    );
    const undo = renderView([active]);
    fireEvent.click(screen.getByTestId("epic-damage-increase-constitution_condenser"));

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0].changes[0]).toMatchObject({
      table: "epic_items",
      after: { damage_level: 8, simple_effects: { overclock_active: false } },
    });
    expect(screen.queryByTestId("epic-overclock-panel")).toBeNull();
  });

  it("sperrt Übertakten bei abgelegtem Kondensator", () => {
    renderView([{ ...condenser, equipped: false }]);
    expect(screen.getByTestId("overclock-start")).toBeDisabled();
    expect(screen.getByTestId("overclock-not-equipped")).toBeInTheDocument();
  });

  it("zeigt Nicht-Besitzern keine Bedienung", () => {
    renderView([condenser], { isOwner: false });
    expect(screen.queryByTestId("overclock-start")).toBeNull();
    expect(screen.queryByTestId("repair-open")).toBeNull();
    expect(screen.queryByTestId("epic-elixir-increase")).toBeNull();
  });
});

describe("Kondensator: Reparatur", () => {
  it("senkt mit Elixier die Schadensstufe und verbraucht ein Elixier", async () => {
    const undo = renderView([condenser]);
    fireEvent.click(screen.getByTestId("repair-open"));
    fireEvent.click(await screen.findByTestId("repair-use-elixir"));
    expect(screen.getByTestId("skill-check-roll")).toHaveTextContent("Ingenieurskunst (+2)");
    fireEvent.click(screen.getByTestId("skill-check-success"));

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0]).toMatchObject({
      label: { key: "repairSucceeded", values: { level: 1 } },
      changes: [
        {
          table: "epic_items",
          after: { damage_level: 1, simple_effects: { elixir: { count: 3 } } },
        },
      ],
    });
    expect(screen.getByTestId("epic-elixir-count")).toHaveTextContent("3×");
  });

  it("verbraucht das Elixier auch bei Fehlschlag", async () => {
    const undo = renderView([condenser]);
    fireEvent.click(screen.getByTestId("repair-open"));
    fireEvent.click(await screen.findByTestId("repair-use-elixir"));
    fireEvent.click(screen.getByTestId("skill-check-failure"));

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    expect(undo.entries[0].label.key).toBe("repairFailed");
    expect(undo.entries[0].changes[0].after).toEqual({
      simple_effects: expect.objectContaining({ elixir: expect.objectContaining({ count: 3 }) }),
    });
  });

  it("repariert bei Doppelklick nur eine Stufe", async () => {
    const undo = renderView([condenser]);
    fireEvent.click(screen.getByTestId("repair-open"));
    const success = await screen.findByTestId("skill-check-success");
    fireEvent.click(success);
    fireEvent.click(success);

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    await new Promise((r) => setTimeout(r, 0));
    expect(undo.entries).toHaveLength(1);
    expect(updates).toHaveLength(1);
  });

  it("schreibt nichts bei Fehlschlag ohne Elixier", async () => {
    const undo = renderView([condenser]);
    await rollCheck("repair-open", "failure");
    await new Promise((r) => setTimeout(r, 0));
    expect(updates).toHaveLength(0);
    expect(undo.entries).toHaveLength(0);
  });
});

describe("Herstellung", () => {
  function openElixirRecipe() {
    fireEvent.click(screen.getByTestId("epic-elixir-recipe-toggle"));
  }

  it("hakt Komponenten an und stellt mit 100 GM aus der Börse her (ein Schritt)", async () => {
    const undo = renderView([condenser]);
    openElixirRecipe();
    expect(screen.getByTestId("epic-elixir-recipe-craft")).toBeDisabled();

    for (const key of ["vinegar", "salt", "oil"]) {
      fireEvent.click(screen.getByTestId(`epic-elixir-recipe-component-${key}`));
      await waitFor(() => expect(undo.entries.at(-1)?.label.key).toBe("componentToggled"));
    }
    await waitFor(() => expect(undo.entries).toHaveLength(3));
    expect(screen.getByTestId("epic-elixir-recipe-craft")).toBeEnabled();

    fireEvent.click(screen.getByTestId("epic-elixir-recipe-craft"));
    await waitFor(() => expect(undo.entries).toHaveLength(4));
    expect(undo.entries[3]).toMatchObject({
      label: { key: "crafted", values: { name: "Kupferelixier", count: 5 } },
      changes: [
        { table: "characters", before: { gold_gp: 150 }, after: { gold_gp: 50 } },
        { table: "epic_items", after: { simple_effects: { elixir: { count: 5, collected: [] } } } },
      ],
    });
    expect(screen.getByTestId("epic-elixir-count")).toHaveTextContent("5×");
  });

  it("stellt bei Doppelklick nur einmal her und zahlt nur einmal", async () => {
    const ready = withEffects(condenser, {
      elixir: {
        ...(condenser.simple_effects.elixir as object),
        collected: ["vinegar", "salt", "oil"],
      },
    });
    const undo = renderView([ready]);
    openElixirRecipe();
    fireEvent.click(screen.getByTestId("epic-elixir-recipe-craft"));
    fireEvent.click(screen.getByTestId("epic-elixir-recipe-craft"));

    await waitFor(() => expect(undo.entries).toHaveLength(1));
    await new Promise((r) => setTimeout(r, 0));
    expect(undo.entries).toHaveLength(1);
    expect(updates.filter((u) => u.table === "characters")).toHaveLength(1);
  });

  it("sperrt Herstellen bei zu wenig Geld", () => {
    const ready = withEffects(condenser, {
      elixir: {
        ...(condenser.simple_effects.elixir as object),
        collected: ["vinegar", "salt", "oil"],
      },
    });
    renderView([ready], { gold_gp: 99 });
    openElixirRecipe();
    expect(screen.getByTestId("epic-elixir-recipe-craft")).toBeDisabled();
    expect(screen.getByTestId("epic-elixir-recipe-cost")).toHaveTextContent("vorhanden: 99 GM");
  });

  it("zahlt das Gold zurück, wenn das Speichern des Gegenstands scheitert", async () => {
    const ready = withEffects(condenser, {
      elixir: {
        ...(condenser.simple_effects.elixir as object),
        collected: ["vinegar", "salt", "oil"],
      },
    });
    const undo = renderView([ready]);
    openElixirRecipe();
    db.failTable = "epic_items";
    fireEvent.click(screen.getByTestId("epic-elixir-recipe-craft"));

    await waitFor(() => expect(updates).toHaveLength(2));
    const purse = { gold_pp: 0, gold_ep: 0, gold_sp: 0, gold_cp: 0 };
    expect(updates.map((u) => u.values)).toEqual([
      { ...purse, gold_gp: 50 },
      { ...purse, gold_gp: 150 },
    ]);
    expect(undo.entries).toHaveLength(0);
  });

  it("stellt eine Mixtur her (+2) und korrigiert den Bestand", async () => {
    const mixtureBlades = withEffects(blades, {
      mixtures: {
        red: {
          count: 3,
          name: "Rauchbombe",
          name_en: "Smoke Bomb",
          color: "#f00",
          effect: "",
          effect_en: "",
          duration: "1 Runde",
          duration_en: "1 round",
          collected: ["saltpeter"],
          recipe: recipe(["saltpeter", "honey"]),
        },
      },
    });
    const undo = renderView([mixtureBlades]);
    fireEvent.click(screen.getByTestId("mixture-red-recipe-toggle"));
    fireEvent.click(screen.getByTestId("mixture-red-recipe-component-honey"));
    await waitFor(() => expect(undo.entries).toHaveLength(1));
    fireEvent.click(screen.getByTestId("mixture-red-recipe-craft"));

    await waitFor(() => expect(undo.entries).toHaveLength(2));
    expect(undo.entries[1].label).toEqual({
      key: "crafted",
      values: { name: "Rauchbombe", count: 5 },
    });
    expect(updates.every((u) => u.table === "epic_items")).toBe(true);
    expect(screen.getByTestId("mixture-count-red")).toHaveTextContent("5×");

    fireEvent.click(screen.getByTestId("mixture-red-stock-decrease"));
    await waitFor(() => expect(undo.entries).toHaveLength(3));
    expect(undo.entries[2].label).toEqual({
      key: "stockChanged",
      values: { name: "Rauchbombe", count: 4 },
    });
  });
});
