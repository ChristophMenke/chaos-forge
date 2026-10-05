import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import { computeCharacterCombatData } from "@/lib/rules/character-computed";
import type { CharacterClassRow, CharacterEffectRow } from "@/lib/supabase/types";
import { baseCharacter, presetEffect } from "@/components/play-mode/effect-test-helpers";
import { MasterCharacterCard } from "./master-character-card";

afterEach(cleanup);

const classes = [
  { character_id: "char-1", class_id: "fighter", level: 3, is_active: true },
] as unknown as CharacterClassRow[];

function renderCard(effects: CharacterEffectRow[], liveHp?: { current: number; max: number }) {
  const combat = computeCharacterCombatData(baseCharacter, classes, [], [], [], [], effects);
  render(
    <NextIntlClientProvider locale="de" messages={messages}>
      <MasterCharacterCard
        character={baseCharacter}
        classes={classes}
        combat={combat}
        liveHp={liveHp}
        effects={effects}
      />
    </NextIntlClientProvider>
  );
  return combat;
}

describe("MasterCharacterCard with temporary effects", () => {
  it("shows the effective THAC0 and the effect chips read-only", () => {
    const combat = renderCard([presetEffect("curse")]);

    expect(combat.thac0Effective).toBe(combat.thac0 + 1);
    expect(screen.getByText(String(combat.thac0Effective))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fluch" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /beenden/i })).not.toBeInTheDocument();
  });

  it("applies the CON effect delta to live HP and shows temporary HP", () => {
    // Constitution 15 → 10: −1 HP per level for a fighter 3
    const weakened = {
      ...presetEffect("contagion"),
      modifiers: [{ target: "con" as const, op: "delta" as const, value: -5 }],
      temp_hp_remaining: 6,
    };
    const combat = renderCard([weakened], { current: 25, max: 30 });

    expect(combat.hpDelta).toBe(-3);
    expect(screen.getByText(/25\s*\/\s*27/)).toBeInTheDocument();
    expect(screen.getByTestId("gm-char-temp-hp-char-1")).toHaveTextContent("+6 temp.");
  });
});
