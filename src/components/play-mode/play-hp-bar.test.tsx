import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import { PlayHpBar } from "./play-hp-bar";

afterEach(cleanup);

function renderBar(extra: Partial<React.ComponentProps<typeof PlayHpBar>> = {}) {
  const onHpChange = vi.fn();
  render(
    <NextIntlClientProvider locale="de" messages={messages}>
      <PlayHpBar
        characterId="c1"
        name="Isolde"
        avatarUrl={null}
        hpCurrent={14}
        hpMax={31}
        ac={4}
        thac0={16}
        classGroup="rogue"
        onHpChange={onHpChange}
        {...extra}
      />
    </NextIntlClientProvider>
  );
  return onHpChange;
}

function damage(amount: string) {
  fireEvent.click(screen.getByTestId("play-damage-btn"));
  fireEvent.change(screen.getByTestId("play-hp-input-field"), { target: { value: amount } });
  fireEvent.keyDown(screen.getByTestId("play-hp-input-field"), { key: "Enter" });
}

describe("PlayHpBar temporary hit points", () => {
  it("shows the temporary hit points next to the HP", () => {
    renderBar({ tempHp: 6 });
    expect(screen.getByTestId("play-hp-text")).toHaveTextContent("14/31");
    expect(screen.getByTestId("play-temp-hp")).toHaveTextContent("+6 temp.");
  });

  it("reports the damage amount when the play mode handles temporary hit points", () => {
    const onDamage = vi.fn();
    const onHpChange = renderBar({ tempHp: 6, onDamage });
    damage("8");
    expect(onDamage).toHaveBeenCalledWith(8);
    expect(onHpChange).not.toHaveBeenCalled();
  });

  it("keeps applying damage directly without a damage handler", () => {
    const onHpChange = renderBar();
    damage("4");
    expect(onHpChange).toHaveBeenCalledWith(10);
  });
});
