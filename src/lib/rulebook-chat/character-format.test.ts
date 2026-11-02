import { describe, it, expect } from "vitest";
import { formatCharacter, formatCharacterBlock, MAX_CHARACTER_LENGTH } from "./character-format";
import {
  learned,
  makeBundle,
  makeChainMail,
  makeCharacter,
  makeClass,
  makeEffect,
  makeEpicItem,
  makeRing,
  makeSpell,
  makeSword,
} from "./character-fixtures";

const lineStarting = (text: string, prefix: string) =>
  text.split("\n").find((l) => l.trimStart().startsWith(prefix)) ?? "";

describe("formatCharacter (full)", () => {
  const invoker = makeBundle({
    character: makeCharacter({
      name: "Elandril",
      race_id: "elf",
      int: 18,
      alignment: "chaotic_good",
    }),
    classes: [makeClass("invoker", 7)],
    spells: [
      learned(makeSpell("Magisches Geschoss", 1, { name_en: "Magic Missile" }), {
        prepared: true,
        expended: true,
      }),
      learned(makeSpell("Schild", 1, { name_en: "Shield" }), { prepared: true }),
      learned(makeSpell("Schlaf", 1, { name_en: "Sleep", school: "Enchantment/Charm" })),
      learned(makeSpell("Feuerball", 3, { name_en: "Fireball" })),
    ],
  });

  it("starts with name, race, class and alignment", () => {
    const text = formatCharacter(invoker, "full");
    expect(text.split("\n")[0]).toBe("## Elandril (Spieler-Charakter, aktiv)");
    expect(text).toContain("Elf · Anrufer 7");
    expect(text).toContain("Gesinnung: Chaotisch Gut");
  });

  it("lists the spellbook by level with school and memorized/cast state", () => {
    const text = formatCharacter(invoker, "full");
    expect(text).toContain("Zauberbuch:");
    expect(lineStarting(text, "Grad 1:")).toContain(
      "Magisches Geschoss (Magic Missile) – Invocation/Evocation [memoriert, gewirkt]"
    );
    expect(lineStarting(text, "Grad 1:")).toContain("Schlaf (Sleep) – Enchantment/Charm");
    expect(lineStarting(text, "Grad 3:")).toContain("Feuerball (Fireball)");
    expect(text).not.toContain("LANGE BESCHREIBUNG");
  });

  it("shows free slots and the opposition schools of a specialist", () => {
    const text = formatCharacter(invoker, "full");
    // Invoker 7: 4/3/2/1 + 1 specialist slot each; one level-1 spell cast
    expect(text).toContain(
      "Zauber (Slots): Grad 1: 4 von 5 frei · Grad 2: 4 von 4 frei · Grad 3: 3 von 3 frei · Grad 4: 2 von 2 frei"
    );
    expect(text).toContain("Oppositionsschulen: enchantment · conjuration");
  });

  it("describes a priest with spell points, faith and spheres, without the sphere catalog", () => {
    const priest = makeBundle({
      character: makeCharacter({
        name: "Bruder Tuck",
        wis: 16,
        spell_system: "points",
        spell_points_used: 4,
        deity: "Chauntea",
        priesthood: "agriculture",
      }),
      classes: [makeClass("cleric", 3)],
      spells: [
        learned(
          makeSpell("Leichte Wunden heilen", 1, {
            spell_type: "priest",
            school: null,
            sphere: "Healing",
          }),
          { prepared: true }
        ),
      ],
    });
    const text = formatCharacter(priest, "full");
    expect(text).toContain("Zauber (Zauberpunkte): 24 von 28 übrig");
    expect(text).toContain("Gottheit: Chauntea · Priesterschaft: Ackerbau");
    expect(lineStarting(text, "Sphären:")).toMatch(/Hauptzugang .*creation/);
    expect(text).toContain("Vorbereitete Priesterzauber:");
    expect(text).toContain("Leichte Wunden heilen – Healing");
    expect(text).not.toContain("Zauberbuch:");
  });

  it("lists weapons, armor, magic items and epic gear with their effects", () => {
    const warrior = makeBundle({
      character: makeCharacter({ name: "Thorin", gold_gp: 340, gold_pp: 12 }),
      equipment: [makeSword(), makeChainMail(), makeRing(-1, 1)],
      epicItems: [makeEpicItem()],
      weaponProficiencies: [
        {
          id: "wp-1",
          character_id: "char-1",
          weapon_name: "Long Sword",
          specialization: true,
        },
      ],
    });
    const text = formatCharacter(warrior, "full");
    expect(text).toContain(
      "Waffen: Langschwert (Long Sword) (1d8/1d12, Treffer +1, Schaden +1, angelegt)"
    );
    expect(text).toContain("Rüstung/Schild: Kettenhemd (Chain Mail) (RK 5, angelegt)");
    expect(text).toContain("Ring des Schutzes +1 (RK −1, alle RW +1, angelegt)");
    expect(text).toContain(
      "Klinge des Wassers (Blade of Water) (Schadensstufe 1/4, Leicht angeschlagen, angelegt)"
    );
    expect(text).toContain("Waffenfertigkeiten: Long Sword (spezialisiert)");
    expect(text).toContain("Börse: 12 PM · 340 GM");
    expect(text).toMatch(/Angriffe\/Runde 3\/2/);
  });

  it("shows stored and effective values when an effect changes them", () => {
    const hasted = makeBundle({
      character: makeCharacter({ int: 12 }),
      effects: [
        makeEffect(
          "Fuchslist",
          [
            { target: "int", op: "delta", value: 2 },
            { target: "attack", op: "delta", value: 1 },
          ],
          { duration_text: "1 Stunde", notes: "vom Druiden" }
        ),
      ],
    });
    const text = formatCharacter(hasted, "full");
    expect(text).toContain("IN 12 (effektiv 14)");
    expect(text).toMatch(/ETW0 16 \(effektiv 15\)/);
    expect(text).toContain(
      "Aktive Effekte: Fuchslist (Intelligenz +2, Angriff (ETW0) +1, Dauer: 1 Stunde, Notiz: vom Druiden)"
    );
  });

  it("marks a dormant dual class", () => {
    const dual = makeBundle({
      classes: [
        makeClass("fighter", 4, { is_active: false, switch_level: 4 }),
        makeClass("mage", 6),
      ],
    });
    expect(formatCharacter(dual, "full")).toContain("Kämpfer 4 (ruhend, Dual-Class) / Magier 6");
  });

  it("adds kit armor failure to the spell failure line", () => {
    const militant = makeBundle({
      character: makeCharacter({ kit: "militant_wizard" }),
      classes: [makeClass("mage", 5)],
      equipment: [makeChainMail()],
    });
    expect(formatCharacter(militant, "full")).toContain("Zauberpatzer: Kit in Rüstung 20 %");
  });

  it("never includes notes or personal details", () => {
    const text = formatCharacter(invoker, "full");
    for (const secret of ["GEHEIME NOTIZ", "Spielerin Anna", "132", "silbern", "violett"]) {
      expect(text).not.toContain(secret);
    }
  });

  it("caps the length of huge characters", () => {
    const spells = Array.from({ length: 400 }, (_, i) =>
      learned(makeSpell(`Sehr langer Zaubername Nummer ${i}`, (i % 9) + 1))
    );
    const text = formatCharacter(makeBundle({ classes: [makeClass("mage", 20)], spells }), "full");
    expect(text.length).toBeLessThanOrEqual(MAX_CHARACTER_LENGTH + 1);
  });
});

describe("formatCharacter (compact)", () => {
  it("keeps only identity, abilities, combat values and saves", () => {
    const text = formatCharacter(
      makeBundle({
        character: makeCharacter({ name: "Thorin" }),
        equipment: [makeSword()],
        spells: [learned(makeSpell("Feuerball", 3))],
      }),
      "compact"
    );
    expect(text).toContain("## Thorin");
    expect(text).toContain("Rettungswürfe:");
    expect(text).toMatch(/RK \d+/);
    expect(text).not.toContain("Waffen:");
    expect(text).not.toContain("Feuerball");
    expect(text.split("\n").length).toBeLessThanOrEqual(6);
  });
});

describe("formatCharacterBlock", () => {
  it("is empty without characters", () => {
    expect(formatCharacterBlock([], [])).toBe("");
  });

  it("puts compact party members under their own heading", () => {
    const block = formatCharacterBlock(
      [makeBundle({ character: makeCharacter({ name: "Elandril" }) })],
      [makeBundle({ character: makeCharacter({ name: "Thorin" }) })]
    );
    expect(block.indexOf("## Elandril")).toBeLessThan(block.indexOf("Weitere aktive Helden"));
    expect(block.indexOf("Weitere aktive Helden")).toBeLessThan(block.indexOf("## Thorin"));
  });
});
