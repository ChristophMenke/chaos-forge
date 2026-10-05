import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import { getEpicEffects } from "@/lib/rules/epic-items";
import { getMagicItemEffects } from "@/lib/rules/magic-items";
import { resolveEffectiveStats } from "@/lib/rules/effective-stats";
import { aggregateEffects } from "@/lib/rules/temporary-effects";
import { getSavingThrows } from "@/lib/rules/combat";
import type { CharacterEffectRow } from "@/lib/supabase/types";
import { PlayChecksPanel } from "./play-checks-panel";
import { baseCharacter, presetEffect } from "./effect-test-helpers";

afterEach(cleanup);

function renderPanel(effects: CharacterEffectRow[]) {
  const summary = aggregateEffects(effects);
  const stats = resolveEffectiveStats(
    baseCharacter,
    { epicEffects: getEpicEffects([]), magicEffects: getMagicItemEffects([]) },
    summary
  );
  const base = getSavingThrows("warrior", 3);
  const saves = {
    paralyzation: base.paralyzation - summary.saves.paralyzation,
    rod: base.rod - summary.saves.rod,
    petrification: base.petrification - summary.saves.petrification,
    breath: base.breath - summary.saves.breath,
    spell: base.spell - summary.saves.spell,
  };
  render(
    <NextIntlClientProvider locale="de" messages={messages}>
      <PlayChecksPanel
        saves={saves}
        character={baseCharacter}
        strMods={stats.mods.str}
        dexMods={stats.mods.dex}
        conMods={stats.mods.con}
        intMods={stats.mods.int}
        wisMods={stats.mods.wis}
        chaMods={stats.mods.cha}
        showThiefSkills={false}
        nonweaponProficiencies={[]}
        effective={stats}
        effectSummary={summary}
      />
    </NextIntlClientProvider>
  );
  return { base };
}

const abilityTile = (label: string) =>
  within(screen.getByTestId("play-ability-checks")).getByText(label).parentElement!;

describe("PlayChecksPanel with temporary effects", () => {
  it("shows the reduced Charisma under contagion together with its source", () => {
    renderPanel([presetEffect("contagion")]);

    expect(within(abilityTile("CHA")).getByText("11")).toBeInTheDocument();
    expect(screen.getByTestId("play-ability-effects")).toHaveTextContent(/Seuche: .*Charisma −2/);
  });

  it("lists '+2 vs. evil' as a hint and keeps the save numbers", () => {
    const { base } = renderPanel([presetEffect("protectionFromEvil")]);

    expect(
      within(screen.getByTestId("play-save-spell")).getByText(String(base.spell))
    ).toBeInTheDocument();
    expect(screen.getByTestId("play-save-effects")).toHaveTextContent(/\+2 gegen Böse/);
  });

  it("worsens all saves under an enemy prayer and names the effect", () => {
    const { base } = renderPanel([presetEffect("prayerEnemy")]);

    expect(
      within(screen.getByTestId("play-save-spell")).getByText(String(base.spell + 1))
    ).toBeInTheDocument();
    expect(screen.getByTestId("play-save-effects")).toHaveTextContent("Gebet (Gegner) −1");
  });
});
