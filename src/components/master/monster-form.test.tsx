import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { MonsterRow } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
});

// Mock next-intl — the form uses useTranslations() for labels, we just want
// the raw key back as the rendered text so we can assert against it.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Importiert AFTER the mock is registered.
import { MonsterForm } from "./monster-form";

function makeMonster(overrides: Partial<MonsterRow> = {}): MonsterRow {
  return {
    id: "monster-id-1",
    name: "Kenku",
    name_en: "Kenku",
    climate_terrain: "Any land",
    frequency: "Uncommon",
    organization: "Clan",
    activity_cycle: "Any",
    diet: "Omnivore",
    intelligence: "Average (8-10)",
    treasure: "F",
    alignment: "Neutral",
    ac: 5,
    movement: "6, Fl 18 (D)",
    hit_dice: "2-5",
    hit_dice_value: 2,
    thac0: 19,
    attacks_per_round: "3 or 1",
    damage: "1d4/1d4/1d6",
    special_attacks: null,
    special_defenses: "See below",
    magic_resistance: 30,
    size: "M",
    morale: "Elite (13)",
    morale_value: 13,
    xp_value: 175,
    default_zone: "melee",
    has_ranged_attack: false,
    typical_spells: null,
    image_url: null,
    source_book: "Monstrous Manual",
    description: null,
    intro_text: "Intro text for Kenku.",
    combat_tactics: "Combat text for Kenku.",
    habitat_society: "Habitat text for Kenku.",
    ecology: "Ecology text for Kenku.",
    no_appearing: "2-8",
    variant_of_id: null,
    variant_name: null,
    is_custom: false,
    created_by: null,
    created_at: "2026-04-10T00:00:00Z",
    updated_at: "2026-04-10T00:00:00Z",
    ...overrides,
  } as MonsterRow;
}

describe("MonsterForm", () => {
  const noop = () => {};

  it("renders in create mode with a collapsed advanced section", () => {
    render(<MonsterForm mode="create" allMonsters={[]} onSubmit={noop} onCancel={noop} />);
    // Form root exists with the right mode attribute
    const form = screen.getByTestId("monster-form");
    expect(form).toHaveAttribute("data-mode", "create");
    // Advanced section is not mounted when collapsed
    expect(screen.queryByTestId("monster-form-advanced-section")).toBeNull();
    // Toggle is present and collapsed
    expect(screen.getByTestId("monster-form-advanced-toggle")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("renders in edit mode with the advanced section open and initial values pre-filled", () => {
    render(
      <MonsterForm
        mode="edit"
        initial={makeMonster()}
        allMonsters={[makeMonster()]}
        onSubmit={noop}
        onCancel={noop}
      />
    );
    expect(screen.getByTestId("monster-form")).toHaveAttribute("data-mode", "edit");
    expect(screen.getByTestId("monster-form-advanced-section")).toBeInTheDocument();
    expect(screen.getByTestId("monster-form-advanced-toggle")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    // Core stat fields are pre-filled
    expect(screen.getByTestId("monster-form-name")).toHaveValue("Kenku");
    expect(screen.getByTestId("monster-form-ac")).toHaveValue(5);
    expect(screen.getByTestId("monster-form-thac0")).toHaveValue(19);
    expect(screen.getByTestId("monster-form-hit-dice")).toHaveValue("2-5");
    // Narrative fields are present and pre-filled
    expect(screen.getByTestId("monster-form-combat-tactics")).toHaveValue("Combat text for Kenku.");
  });

  it("expands and collapses the advanced section on toggle click", () => {
    render(<MonsterForm mode="create" allMonsters={[]} onSubmit={noop} onCancel={noop} />);
    const toggle = screen.getByTestId("monster-form-advanced-toggle");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("monster-form-advanced-section")).toBeInTheDocument();
    // Now the fluff fields exist
    expect(screen.getByTestId("monster-form-no-appearing")).toBeInTheDocument();
    expect(screen.getByTestId("monster-form-intro-text")).toBeInTheDocument();
  });

  it("submits the current form state via onSubmit including narrative edits", async () => {
    const onSubmit = vi.fn();
    render(
      <MonsterForm
        mode="edit"
        initial={makeMonster()}
        allMonsters={[makeMonster()]}
        onSubmit={onSubmit}
        onCancel={noop}
      />
    );

    // Change a narrative field (the advanced section is already open in edit mode)
    fireEvent.change(screen.getByTestId("monster-form-ecology"), {
      target: { value: "Updated ecology text." },
    });
    fireEvent.click(screen.getByTestId("monster-form-submit"));

    expect(onSubmit).toHaveBeenCalledOnce();
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.ecology).toBe("Updated ecology text.");
    expect(payload.name).toBe("Kenku");
    expect(payload.ac).toBe(5);
  });

  it("filters variant parent dropdown to only parent monsters (variant_of_id === null) and excludes self", () => {
    const self = makeMonster({ id: "self-id", name: "Self" });
    const parent = makeMonster({ id: "parent-id", name: "Orc", variant_of_id: null });
    const child = makeMonster({ id: "child-id", name: "Orog", variant_of_id: "parent-id" });

    render(
      <MonsterForm
        mode="edit"
        initial={self}
        allMonsters={[self, parent, child]}
        onSubmit={noop}
        onCancel={noop}
      />
    );

    const select = screen.getByTestId("monster-form-variant-of-id") as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);
    // Empty "no variant" option + the parent, but NOT self and NOT the child
    expect(values).toContain("");
    expect(values).toContain("parent-id");
    expect(values).not.toContain("self-id");
    expect(values).not.toContain("child-id");
  });

  it("recomputes hit_dice_value when hit_dice changes", () => {
    const onSubmit = vi.fn();
    render(<MonsterForm mode="create" allMonsters={[]} onSubmit={onSubmit} onCancel={noop} />);
    fireEvent.change(screen.getByTestId("monster-form-name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByTestId("monster-form-hit-dice"), {
      target: { value: "3+3" },
    });
    fireEvent.click(screen.getByTestId("monster-form-submit"));
    expect(onSubmit).toHaveBeenCalledOnce();
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.hit_dice).toBe("3+3");
    expect(payload.hit_dice_value).toBe(3);
  });
});
