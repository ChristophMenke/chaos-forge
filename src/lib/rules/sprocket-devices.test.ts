import { describe, it, expect } from "vitest";
import {
  getCoolingModifier,
  readOverclockState,
  nextCoolingModifier,
  startOverclock,
  passOverclockHour,
  stopOverclock,
  endCooldown,
  healOneHour,
  resolveRepair,
  toggleComponent,
  isRecipeComplete,
  adjustStock,
  craft,
  findOverclockItem,
  withDamageLevel,
  readStock,
  writeStock,
  type CraftableStock,
  type Recipe,
} from "./sprocket-devices";
import type { CoinPurse } from "./equipment";
import type { DamageLevelEffect } from "@/lib/supabase/types";

const OVERCLOCK = { name: "Übertakten", con_override: 20 };

function recipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    components: [
      { key: "salt", name: "Salz", name_en: "Salt", source: "Krämer", source_en: "Grocer" },
      { key: "vinegar", name: "Essig", name_en: "Vinegar", source: "Markt", source_en: "Market" },
    ],
    yield: 2,
    duration: "ca. 1 Stunde",
    duration_en: "about 1 hour",
    ...overrides,
  };
}

function purse(overrides: Partial<CoinPurse> = {}): CoinPurse {
  return { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0, ...overrides };
}

describe("getCoolingModifier", () => {
  it("wird jede zweite Stunde um eins schwerer (Stunde 1–2 ±0, 3–4 −1, 5–6 −2)", () => {
    expect([1, 2, 3, 4, 5, 6].map(getCoolingModifier)).toEqual([0, 0, -1, -1, -2, -2]);
  });
});

describe("readOverclockState", () => {
  it("liest aktiv, Stunden und Sperre", () => {
    expect(
      readOverclockState({ overclock_active: true, overclock_hours: 3, overclock_cooldown: true })
    ).toEqual({ active: true, hours: 3, cooldown: true });
  });

  it("ignoriert die alte Timer-Endzeit und setzt fehlende Stunden auf 0", () => {
    expect(readOverclockState({ overclock_active: true, overclock_end_time: 123 })).toEqual({
      active: true,
      hours: 0,
      cooldown: false,
    });
  });
});

describe("nextCoolingModifier", () => {
  it("gilt für die laufende Stunde: nach zwei vergangenen Stunden −1", () => {
    expect(nextCoolingModifier({ active: true, hours: 2, cooldown: false })).toBe(-1);
    expect(nextCoolingModifier({ active: true, hours: 0, cooldown: false })).toBe(0);
  });
});

describe("startOverclock", () => {
  it("aktiviert bei Erfolg, setzt die Stunden zurück und entfernt die alte Endzeit", () => {
    const result = startOverclock(
      { overclock: OVERCLOCK, overclock_hours: 5, overclock_end_time: 1 },
      true
    );
    expect(result).toEqual({
      effects: { overclock: OVERCLOCK, overclock_active: true, overclock_hours: 0 },
      damageLevelDelta: 0,
    });
  });

  it("nimmt bei Fehlschlag eine Schadensstufe und bleibt aus", () => {
    const se = { overclock: OVERCLOCK };
    expect(startOverclock(se, false)).toEqual({ effects: se, damageLevelDelta: 1 });
  });

  it("geht während der Abkühlsperre nicht", () => {
    expect(startOverclock({ overclock: OVERCLOCK, overclock_cooldown: true }, true)).toBeNull();
  });

  it("geht nicht, wenn bereits übertaktet", () => {
    expect(startOverclock({ overclock: OVERCLOCK, overclock_active: true }, true)).toBeNull();
  });
});

describe("passOverclockHour", () => {
  const active = { overclock: OVERCLOCK, overclock_active: true, overclock_hours: 2 };

  it("zählt bei gelungenem Kühlungswurf eine Stunde weiter", () => {
    expect(passOverclockHour(active, true)).toEqual({ ...active, overclock_hours: 3 });
  });

  it("schaltet bei misslungenem Kühlungswurf ab und sperrt für einen Tag", () => {
    expect(passOverclockHour(active, false)).toEqual({
      ...active,
      overclock_hours: 3,
      overclock_active: false,
      overclock_cooldown: true,
    });
  });

  it("ändert nichts, wenn nicht übertaktet", () => {
    const inactive = { overclock: OVERCLOCK };
    expect(passOverclockHour(inactive, true)).toBe(inactive);
  });
});

describe("stopOverclock / endCooldown", () => {
  it("beendet freiwillig ohne Sperre", () => {
    expect(stopOverclock({ overclock_active: true, overclock_hours: 4 })).toEqual({
      overclock_active: false,
      overclock_hours: 4,
    });
  });

  it("hebt die Abkühlsperre auf", () => {
    expect(endCooldown({ overclock_cooldown: true })).toEqual({ overclock_cooldown: false });
  });
});

describe("healOneHour", () => {
  it("heilt bis zum Maximum", () => {
    expect(healOneHour(10, 20, 1)).toBe(11);
    expect(healOneHour(20, 20, 1)).toBe(20);
  });

  it("senkt nie TP, auch wenn sie über dem Maximum liegen", () => {
    expect(healOneHour(22, 20, 1)).toBe(22);
  });
});

describe("resolveRepair", () => {
  it("senkt die Schadensstufe bei Erfolg und verbraucht das Elixier", () => {
    expect(
      resolveRepair({ damageLevel: 3, elixirCount: 4, useElixir: true, success: true })
    ).toEqual({ damageLevel: 2, elixirCount: 3 });
  });

  it("verbraucht das Elixier auch bei Fehlschlag", () => {
    expect(
      resolveRepair({ damageLevel: 3, elixirCount: 4, useElixir: true, success: false })
    ).toEqual({ damageLevel: 3, elixirCount: 3 });
  });

  it("ohne Elixier bleibt der Bestand", () => {
    expect(
      resolveRepair({ damageLevel: 3, elixirCount: 4, useElixir: false, success: true })
    ).toEqual({ damageLevel: 2, elixirCount: 4 });
  });

  it("geht nicht unter 0 (Stufe und Bestand)", () => {
    expect(
      resolveRepair({ damageLevel: 0, elixirCount: 0, useElixir: true, success: true })
    ).toEqual({ damageLevel: 0, elixirCount: 0 });
  });
});

describe("Komponenten-Checkliste", () => {
  it("hakt eine Komponente an und wieder ab", () => {
    const stock: CraftableStock = { count: 0, recipe: recipe(), collected: [] };
    const checked = toggleComponent(stock, "salt");
    expect(checked.collected).toEqual(["salt"]);
    expect(toggleComponent(checked, "salt").collected).toEqual([]);
  });

  it("ist erst vollständig, wenn alle Komponenten da sind", () => {
    expect(isRecipeComplete({ count: 0, recipe: recipe(), collected: ["salt"] })).toBe(false);
    expect(isRecipeComplete({ count: 0, recipe: recipe(), collected: ["vinegar", "salt"] })).toBe(
      true
    );
  });

  it("ohne Rezept ist nichts herstellbar", () => {
    expect(isRecipeComplete({ count: 0 })).toBe(false);
  });

  it("korrigiert den Bestand, aber nie unter 0", () => {
    expect(adjustStock({ count: 1 }, 1).count).toBe(2);
    expect(adjustStock({ count: 0 }, -1).count).toBe(0);
  });
});

describe("craft", () => {
  const complete: CraftableStock = { count: 5, recipe: recipe(), collected: ["salt", "vinegar"] };

  it("erhöht um den Ertrag, leert die Liste und lässt die Börse ohne Kosten unverändert", () => {
    const money = purse({ gp: 3 });
    expect(craft(complete, money)).toEqual({
      stock: { ...complete, count: 7, collected: [] },
      purse: money,
    });
  });

  it("bezahlt die Kosten aus der Börse, mit Wechselgeld", () => {
    const stock = { ...complete, recipe: recipe({ yield: 1, cost_gp: 100 }) };
    const result = craft(stock, purse({ pp: 21 }));
    expect(result?.stock.count).toBe(6);
    expect(result?.purse).toEqual(purse({ pp: 1 }));
  });

  it("geht nicht bei zu wenig Geld", () => {
    const stock = { ...complete, recipe: recipe({ cost_gp: 100 }) };
    expect(craft(stock, purse({ gp: 99 }))).toBeNull();
  });

  it("geht nicht bei unvollständiger Liste", () => {
    expect(craft({ ...complete, collected: ["salt"] }, purse())).toBeNull();
  });
});

describe("findOverclockItem", () => {
  const condenser = { id: "c", equipped: true, simple_effects: { overclock: OVERCLOCK } };

  it("findet den angelegten Gegenstand mit Übertakten", () => {
    const other = { id: "o", equipped: true, simple_effects: {} };
    expect(findOverclockItem([other, condenser])).toBe(condenser);
  });

  it("ignoriert abgelegte Gegenstände und solche ohne Fähigkeit", () => {
    expect(findOverclockItem([{ ...condenser, equipped: false }])).toBeNull();
    expect(findOverclockItem([{ id: "x", equipped: true, simple_effects: {} }])).toBeNull();
  });
});

describe("withDamageLevel", () => {
  const damageLevels: Record<string, DamageLevelEffect> = {
    "7": { description: "", effects: ["save_vs_death"] },
    "8": { description: "", effects: ["thief_disabled", "device_offline"] },
  };
  const se = { overclock: OVERCLOCK, overclock_active: true };

  it("beendet die Übertaktung, wenn das Gerät ausfällt", () => {
    expect(withDamageLevel({ damage_levels: damageLevels, simple_effects: se }, 8)).toEqual({
      damage_level: 8,
      simple_effects: { ...se, overclock_active: false },
    });
  });

  it("lässt die Übertaktung bei anderen Stufen laufen", () => {
    expect(withDamageLevel({ damage_levels: damageLevels, simple_effects: se }, 7)).toEqual({
      damage_level: 7,
      simple_effects: se,
    });
  });
});

describe("readStock / writeStock", () => {
  const elixir = { count: 4, name: "Kupferelixier", name_en: "Copper Elixir" };
  const red = { count: 5, name: "Rauchbombe", name_en: "Smoke Bomb" };
  const se = { elixir, mixtures: { red }, other: 1 };

  it("liest Elixier und Mixtur", () => {
    expect(readStock(se, { kind: "elixir" })).toBe(elixir);
    expect(readStock(se, { kind: "mixture", key: "red" })).toBe(red);
    expect(readStock(se, { kind: "mixture", key: "blue" })).toBeNull();
    expect(readStock({}, { kind: "elixir" })).toBeNull();
  });

  it("schreibt, ohne andere Felder anzufassen", () => {
    expect(writeStock(se, { kind: "elixir" }, { ...elixir, count: 3 })).toEqual({
      ...se,
      elixir: { ...elixir, count: 3 },
    });
    expect(writeStock(se, { kind: "mixture", key: "red" }, { ...red, count: 7 })).toEqual({
      ...se,
      mixtures: { red: { ...red, count: 7 } },
    });
  });
});
