import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import type { EpicItemRow } from "@/lib/supabase/types";
import { createUndoStub } from "@/components/undo/undo-test-utils";

vi.mock("next/navigation", () => ({ usePathname: () => "/characters/char-1/epic" }));
const updates: { table: string; values: unknown }[] = [];
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => ({
      update: (values: unknown) => ({
        eq: async () => {
          updates.push({ table, values });
          return { error: null };
        },
      }),
    }),
  }),
}));

const { EpicEquipmentView } = await import("./epic-equipment-view");

afterEach(() => {
  cleanup();
  updates.length = 0;
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

function renderView(items: EpicItemRow[]) {
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
          }}
          characterClasses={[]}
          epicItems={items}
          isOwner
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
