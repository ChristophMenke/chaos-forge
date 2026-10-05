import { describe, it, expect } from "vitest";
import {
  EFFECT_PRESETS,
  EFFECT_PRESET_GROUPS,
  getEffectPreset,
  presetToDraft,
} from "./effect-presets";
import { validateModifier } from "./temporary-effects";

describe("effect presets", () => {
  it("are valid, bilingual, grouped and sourced", () => {
    expect(EFFECT_PRESETS.length).toBeGreaterThanOrEqual(30);
    for (const preset of EFFECT_PRESETS) {
      expect(preset.name, preset.key).not.toBe("");
      expect(preset.name_en, preset.key).not.toBe("");
      expect(preset.source, preset.key).not.toBe("");
      expect(EFFECT_PRESET_GROUPS).toContain(preset.group);
      for (const m of preset.modifiers) {
        expect(
          validateModifier({ ...m, condition: m.condition?.de }),
          `${preset.key} ${m.target}`
        ).toBe(true);
      }
    }
  });

  it("has unique keys", () => {
    const keys = EFFECT_PRESETS.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("fills the form in the chosen language", () => {
    const pfe = getEffectPreset("protectionFromEvil")!;
    expect(presetToDraft(pfe, "de")).toMatchObject({
      name: "Schutz vor Bösem",
      preset_key: "protectionFromEvil",
      modifiers: [
        { target: "ac", op: "delta", value: 2, condition: "Böse" },
        { target: "savesAll", op: "delta", value: 2, condition: "Böse" },
      ],
    });
    expect(presetToDraft(pfe, "en").modifiers[0].condition).toBe("evil");
  });

  it("covers losses of every ability across the presets", () => {
    const targets = new Set(EFFECT_PRESETS.flatMap((p) => p.modifiers.map((m) => m.target)));
    for (const t of ["str", "dex", "cha", "allAbilities", "savesAll", "attack", "ac", "movement"]) {
      expect(targets, t).toContain(t);
    }
  });
});
