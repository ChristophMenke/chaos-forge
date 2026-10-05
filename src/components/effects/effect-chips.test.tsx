import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/de.json";
import type { CharacterEffectRow } from "@/lib/supabase/types";
import { EffectChips } from "./effect-chips";
import { EffectWarnings } from "./effect-warnings";
import { formatModifier } from "./effect-format";

afterEach(cleanup);

const fx = (id: string, extra: Partial<CharacterEffectRow> = {}) =>
  ({
    id,
    character_id: "c1",
    name: `Effekt ${id}`,
    notes: "",
    duration_text: "",
    preset_key: null,
    modifiers: [],
    flags: [],
    temp_hp_remaining: 0,
    created_by: null,
    created_at: "2026-10-05T10:00:00Z",
    ended_at: null,
    ...extra,
  }) as CharacterEffectRow;

const wrap = (ui: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="de" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );

describe("EffectChips", () => {
  it("ends an effect after confirmation and opens details on click", () => {
    const onEnd = vi.fn();
    const onOpen = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    wrap(
      <EffectChips
        effects={[fx("a", { preset_key: "bless", name: "Segen" })]}
        onEnd={onEnd}
        onOpen={onOpen}
        onAdd={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Segen" }));
    expect(onOpen).toHaveBeenCalled();

    const end = screen.getByRole("button", { name: "Beenden: Segen" });
    fireEvent.click(end);
    expect(onEnd).not.toHaveBeenCalled();
    fireEvent.click(end);
    expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
  });

  it("shows remaining temporary hit points on the chip", () => {
    wrap(
      <EffectChips effects={[fx("a", { name: "Hilfe", temp_hp_remaining: 6 })]} onOpen={vi.fn()} />
    );
    expect(screen.getByText("+6 temp.")).toBeInTheDocument();
  });

  it("is read-only without end and add buttons and folds long lists", () => {
    wrap(
      <EffectChips
        readOnly
        maxVisible={3}
        effects={["a", "b", "c", "d", "e"].map((id) => fx(id))}
        onOpen={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: /Beenden/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Effekt" })).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });
});

describe("EffectWarnings", () => {
  it("lists threshold and stacking warnings", () => {
    wrap(
      <EffectWarnings
        effects={[
          fx("a", { preset_key: "bless", name: "Segen" }),
          fx("b", { preset_key: "bless", name: "Segen" }),
        ]}
        values={{ str: 10, dex: 10, con: 2, int: 10, wis: 10, cha: 1 }}
      />
    );
    expect(screen.getByText("Konstitution 2: bewusstlos")).toBeInTheDocument();
    expect(screen.getByText("Charisma 1: handlungsunfähig")).toBeInTheDocument();
    expect(screen.getByText(/„Segen“ ist mehrfach aktiv/)).toBeInTheDocument();
  });

  it("renders nothing without warnings", () => {
    const { container } = wrap(
      <EffectWarnings
        effects={[]}
        values={{ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("formatModifier", () => {
  const t = (key: string, values?: Record<string, unknown>) => {
    const labels: Record<string, string> = {
      "targets.attack": "Angriff",
      "targets.movement": "Bewegung",
      "targets.str": "Stärke",
      "targets.savesAll": "Alle Rettungswürfe",
    };
    return key === "conditional"
      ? `${values!.value} gegen ${values!.condition}`
      : (labels[key] ?? key);
  };

  it("formats each kind of change compactly", () => {
    expect(formatModifier({ target: "attack", op: "delta", value: -2 }, t)).toBe("Angriff −2");
    expect(formatModifier({ target: "attack", op: "delta", value: 1 }, t)).toBe("Angriff +1");
    expect(formatModifier({ target: "movement", op: "factor", value: 0.5 }, t)).toBe("Bewegung ×½");
    expect(formatModifier({ target: "str", op: "set", value: 5 }, t)).toBe("Stärke → 5");
    expect(
      formatModifier({ target: "savesAll", op: "delta", value: 2, condition: "Böse" }, t)
    ).toBe("Alle Rettungswürfe +2 gegen Böse");
  });
});
