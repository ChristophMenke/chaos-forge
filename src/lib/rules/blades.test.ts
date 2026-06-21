import { describe, it, expect } from "vitest";
import {
  loadBlade,
  throwBlade,
  collectBlade,
  loseBlade,
  forgeBlade,
  type Blade,
  type MixtureInfo,
} from "./blades";

function mix(count: number): MixtureInfo {
  return {
    count,
    name: "Gefrierbrand",
    name_en: "Frostburn",
    color: "#3b82f6",
    effect: "",
    effect_en: "",
    duration: "1 Runde",
    duration_en: "1 round",
  };
}

function blade(id: number, overrides: Partial<Blade> = {}): Blade {
  return { id, mixture: null, status: "ready", ...overrides };
}

describe("loadBlade", () => {
  it("setzt die Mixtur und reduziert den Vorrat um 1", () => {
    const { blades, mixtures } = loadBlade([blade(1)], { blue: mix(5) }, 1, "blue");
    expect(blades[0]).toEqual({ id: 1, mixture: "blue", status: "ready" });
    expect(mixtures.blue.count).toBe(4);
  });

  it("blockt, wenn der Vorrat leer ist (count 0)", () => {
    const input = [blade(1)];
    const mixtures = { blue: mix(0) };
    const result = loadBlade(input, mixtures, 1, "blue");
    expect(result.blades).toBe(input);
    expect(result.mixtures).toBe(mixtures);
  });

  it("blockt bei unbekannter Mixtur", () => {
    const result = loadBlade([blade(1)], { blue: mix(5) }, 1, "unknown");
    expect(result.mixtures.blue.count).toBe(5);
  });

  it("entfernt ein altes outcome beim Nachladen einer verbrauchten Klinge", () => {
    const spent = blade(1, { status: "ready", outcome: "hit" });
    const { blades } = loadBlade([spent], { blue: mix(2) }, 1, "blue");
    expect(blades[0]).toEqual({ id: 1, mixture: "blue", status: "ready" });
    expect(blades[0].outcome).toBeUndefined();
  });
});

describe("throwBlade", () => {
  it("merkt einen Treffer", () => {
    const result = throwBlade([blade(1, { mixture: "blue" })], 1, "hit");
    expect(result[0]).toMatchObject({ status: "thrown", outcome: "hit", mixture: "blue" });
  });

  it("merkt einen Fehlwurf", () => {
    const result = throwBlade([blade(1, { mixture: "blue" })], 1, "miss");
    expect(result[0]).toMatchObject({ status: "thrown", outcome: "miss" });
  });
});

describe("collectBlade", () => {
  it("bei Treffer kommt die Klinge leer zurück (Phiole verbraucht)", () => {
    const thrown = blade(1, { mixture: "blue", status: "thrown", outcome: "hit" });
    const result = collectBlade([thrown], 1, /* vialIntact ignoriert */ true);
    expect(result[0]).toEqual({ id: 1, mixture: null, status: "ready" });
  });

  it("bei Fehlwurf + intakter Phiole bleibt die Klinge bestückt", () => {
    const thrown = blade(1, { mixture: "blue", status: "thrown", outcome: "miss" });
    const result = collectBlade([thrown], 1, true);
    expect(result[0]).toEqual({ id: 1, mixture: "blue", status: "ready" });
  });

  it("bei Fehlwurf + zerbrochener Phiole kommt die Klinge leer zurück", () => {
    const thrown = blade(1, { mixture: "blue", status: "thrown", outcome: "miss" });
    const result = collectBlade([thrown], 1, false);
    expect(result[0]).toEqual({ id: 1, mixture: null, status: "ready" });
  });

  it("behandelt fehlendes outcome (Altdaten) wie einen Fehlwurf", () => {
    const legacy = blade(1, { mixture: "blue", status: "thrown" });
    expect(collectBlade([legacy], 1, true)[0].mixture).toBe("blue");
    expect(collectBlade([legacy], 1, false)[0].mixture).toBeNull();
  });
});

describe("loseBlade", () => {
  it("entfernt die Klinge aus dem Set", () => {
    const result = loseBlade([blade(1), blade(2)], 1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });
});

describe("forgeBlade", () => {
  it("ergänzt eine leere Klinge mit eindeutiger neuer id", () => {
    const result = forgeBlade([blade(2), blade(4)], 4);
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({ id: 5, mixture: null, status: "ready" });
  });

  it("ergänzt nicht über das Maximum hinaus", () => {
    const full = [blade(1), blade(2), blade(3), blade(4)];
    expect(forgeBlade(full, 4)).toBe(full);
  });

  it("startet bei id 1, wenn keine Klingen vorhanden sind", () => {
    expect(forgeBlade([], 4)).toEqual([{ id: 1, mixture: null, status: "ready" }]);
  });
});
