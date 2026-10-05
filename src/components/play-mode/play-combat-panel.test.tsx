import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import { getDexterityModifiers, getStrengthModifiers } from "@/lib/rules/abilities";
import { calculateAC } from "@/lib/rules/equipment";
import { aggregateEffects } from "@/lib/rules/temporary-effects";
import type {
  CharacterEffectRow,
  CharacterEquipmentWithDetails,
  WeaponRow,
} from "@/lib/supabase/types";
import { PlayCombatPanel } from "./play-combat-panel";
import { presetEffect } from "./effect-test-helpers";

vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));

afterEach(cleanup);

const longSword = {
  id: "eq-sword",
  character_id: "char-1",
  weapon_id: "w-1",
  armor_id: null,
  quantity: 1,
  equipped: true,
  hit_bonus: 0,
  damage_bonus: 0,
  magic_effects: {},
  custom_label: null,
  weapon: {
    id: "w-1",
    name: "Langschwert",
    name_en: "Long Sword",
    damage_sm: "1d8",
    damage_l: "1d12",
    weapon_type: "melee",
    speed: 5,
    weight: 4,
  } as WeaponRow,
  armor: null,
} as unknown as CharacterEquipmentWithDetails;

// DEX 16 → −2 AC, so "no Dex bonus" visibly removes a line.
const dexMods = getDexterityModifiers(16);

function renderPanel(effects: CharacterEffectRow[]) {
  const summary = aggregateEffects(effects);
  const ac = calculateAC({
    dexDefenseAdj: dexMods.defensiveAdj,
    classGroups: ["warrior"],
    effectAcBonus: summary.acBonus,
    effectAcSet: summary.acSet,
    noDexBonus: summary.noDexAc,
    noShield: summary.noShield,
  });
  render(
    <NextIntlClientProvider locale="de" messages={messages}>
      <PlayCombatPanel
        equipment={[longSword]}
        weaponProficiencies={[]}
        thac0={18 - summary.attack}
        strMods={getStrengthModifiers(16)}
        dexMods={dexMods}
        classGroups={["warrior"]}
        classEntries={[{ classId: "fighter", level: 3 }]}
        equippedArmor={null}
        equippedShield={false}
        dexDefenseAdj={dexMods.defensiveAdj}
        ac={ac}
        encumbrance="unencumbered"
        movementRate={12}
        backstabMultiplier={null}
        ignoreEncumbrance={false}
        isMagicalProtection={false}
        onEquipmentChange={() => {}}
        effectSummary={summary}
      />
    </NextIntlClientProvider>
  );
  return { ac };
}

/** Breakdown lines as signed numbers, e.g. ["Basis-RK", 10], ["Verlangsamen", 4]. */
function breakdownLines(): [string, number][] {
  fireEvent.click(screen.getByTestId("play-ac-toggle"));
  const row = screen.getByTestId("play-ac-breakdown").children[1];
  const parts = [...row.children].slice(2); // skip "AC n" and "="
  return parts.map((part, i) => {
    const text = part.textContent ?? "";
    const [, sign, label, value] = text.match(/^([−+]?)(.*) \((\d+)\)$/)!;
    return [label, (i > 0 && sign === "−" ? -1 : 1) * Number(value)];
  });
}

describe("PlayCombatPanel with temporary effects", () => {
  it("halves attacks under Slow and explains the AC with a matching sum", () => {
    const { ac } = renderPanel([presetEffect("slow")]);

    // Fighter 3: 1 attack → ½
    expect(screen.getByTestId("play-weapon-apr-eq-sword")).toHaveTextContent("1/2");

    const lines = breakdownLines();
    expect(lines).toContainEqual(["Verlangsamen", 4]);
    expect(lines.reduce((sum, [, value]) => sum + value, 0)).toBe(ac);
  });

  it("removes the Dex line when the Dex bonus is lost", () => {
    renderPanel([presetEffect("slow")]);
    const labels = breakdownLines().map(([label]) => label);
    expect(labels).not.toContain(messages.playMode.dexBonus);
  });

  it("keeps the Dex line without effects", () => {
    const { ac } = renderPanel([]);
    const lines = breakdownLines();
    expect(lines).toContainEqual([messages.playMode.dexBonus, -2]);
    expect(lines.reduce((sum, [, value]) => sum + value, 0)).toBe(ac);
  });

  it("shows no attacks under a stinking cloud", () => {
    renderPanel([presetEffect("stinkingCloud")]);
    expect(screen.getByTestId("play-weapon-apr-eq-sword")).toHaveTextContent(
      messages.effects.noAttacks
    );
  });

  it("adds effect damage to the weapon damage", () => {
    renderPanel([presetEffect("prayerEnemy")]);
    // STR 16: +1 damage, prayer (enemy) −1 → plain 1d8
    expect(screen.getByTestId("play-weapon-eq-sword")).toHaveTextContent("1d8 / 1d12");
  });
});
