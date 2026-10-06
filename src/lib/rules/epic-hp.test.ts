import { describe, it, expect } from "vitest";
import { computeHpAfterConChange, computeHpDelta } from "./epic-hp";
import type { EpicItemRow } from "@/lib/supabase/types";

function condenser(damageLevel: number): EpicItemRow {
  return {
    id: "c",
    character_id: "sprocket",
    slug: "constitution_condenser",
    name: "Kondensator",
    name_en: "Condenser",
    description: "",
    description_en: "",
    icon: "heart-pulse",
    equipped: true,
    damage_level: damageLevel,
    max_damage_level: 8,
    damage_levels: {
      "0": { description: "", stat_overrides: { con: 18 } },
      "4": { description: "", stat_overrides: { con: 14 } },
    },
    simple_effects: {},
    notes: "",
    created_at: "",
    updated_at: "",
  } as EpicItemRow;
}

// Sprocket: angeborene KON 5 (TP −1), Dieb Stufe 5, gespeicherte Max-TP 20.
const character = { con: 5, hp_max: 20 };
const activeClasses = [{ class_id: "thief", level: 5 }];

describe("computeHpDelta", () => {
  it("deckelt den Bonus für Nicht-Krieger bei +2", () => {
    // KON 5 (−1) → KON 18 (+2): +3 je Stufe
    expect(computeHpDelta(2, -1, activeClasses)).toBe(15);
    // KON 20 bringt einem Dieb nicht mehr als KON 18
    expect(computeHpDelta(5, -1, activeClasses)).toBe(15);
  });
});

describe("computeHpAfterConChange", () => {
  it("kappt die aktuellen TP, wenn die KON sinkt", () => {
    // Max vorher 20 + 15 = 35, nachher (KON 14, ±0) 20 + 5 = 25
    expect(
      computeHpAfterConChange({
        itemsBefore: [condenser(0)],
        itemsAfter: [condenser(4)],
        character,
        activeClasses,
        hpCurrent: 30,
        characterLevel: 5,
      })
    ).toBe(25);
  });

  it("heilt nicht, wenn die KON steigt", () => {
    expect(
      computeHpAfterConChange({
        itemsBefore: [condenser(4)],
        itemsAfter: [condenser(0)],
        character,
        activeClasses,
        hpCurrent: 20,
        characterLevel: 5,
      })
    ).toBeNull();
  });

  it("schreibt nichts, wenn sich die KON nicht ändert", () => {
    expect(
      computeHpAfterConChange({
        itemsBefore: [condenser(0)],
        itemsAfter: [condenser(0)],
        character,
        activeClasses,
        hpCurrent: 30,
        characterLevel: 5,
      })
    ).toBeNull();
  });
});

describe("computeHpAfterConChange während der Übertaktung", () => {
  const overclock = { con_override: 20, heals_per_hour: 1 };
  const active = (level: number) => ({
    ...condenser(level),
    simple_effects: { overclock, overclock_active: true },
  });

  it("ändert keine TP, solange die KON durch Übertakten 20 bleibt", () => {
    expect(
      computeHpAfterConChange({
        itemsBefore: [active(0)],
        itemsAfter: [active(4)],
        character,
        activeClasses,
        hpCurrent: 30,
        characterLevel: 5,
      })
    ).toBeNull();
  });
});
