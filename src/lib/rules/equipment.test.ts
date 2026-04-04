import { describe, it, expect } from "vitest";
import {
  calculateAC,
  calculateEncumbrance,
  getMovementRate,
  getStartingGold,
  calculatePayment,
  purseTotalInCP,
  isShieldItem,
  getShieldProficiencyBonus,
} from "./equipment";

describe("EQUIP-001: AC Calculation", () => {
  it("should return base AC 10 with no armor and DEX 10 (adj 0)", () => {
    expect(calculateAC({ dexDefenseAdj: 0 })).toBe(10);
  });

  it("should return armor AC with no DEX modifier", () => {
    expect(calculateAC({ equippedArmorAC: 5, dexDefenseAdj: 0 })).toBe(5);
  });

  it("should apply DEX defensive adjustment to armor AC", () => {
    expect(calculateAC({ equippedArmorAC: 5, dexDefenseAdj: -2 })).toBe(3);
  });

  it("should subtract 1 for shield", () => {
    expect(calculateAC({ equippedArmorAC: 5, shieldEquipped: true, dexDefenseAdj: 0 })).toBe(4);
  });

  it("should apply both shield and DEX", () => {
    expect(calculateAC({ equippedArmorAC: 5, shieldEquipped: true, dexDefenseAdj: -2 })).toBe(2);
  });

  it("should handle no armor with shield", () => {
    expect(calculateAC({ shieldEquipped: true, dexDefenseAdj: 0 })).toBe(9);
  });

  it("should handle full plate", () => {
    expect(calculateAC({ equippedArmorAC: 1, shieldEquipped: true, dexDefenseAdj: -4 })).toBe(-4);
  });

  // ─── Unarmored Defense Bonus (Player's Option: Skills & Powers) ────────
  it("should apply -2 unarmored bonus for warrior class group (unencumbered)", () => {
    expect(
      calculateAC({ dexDefenseAdj: 0, classGroups: ["warrior"], encumbrance: "unencumbered" })
    ).toBe(8); // 10 - 2
  });

  it("should apply -2 unarmored bonus for rogue class group", () => {
    expect(
      calculateAC({ dexDefenseAdj: 0, classGroups: ["rogue"], encumbrance: "unencumbered" })
    ).toBe(8);
  });

  it("should NOT apply unarmored bonus for wizard class group", () => {
    expect(
      calculateAC({ dexDefenseAdj: 0, classGroups: ["wizard"], encumbrance: "unencumbered" })
    ).toBe(10);
  });

  it("should NOT apply unarmored bonus for priest class group", () => {
    expect(
      calculateAC({ dexDefenseAdj: 0, classGroups: ["priest"], encumbrance: "unencumbered" })
    ).toBe(10);
  });

  it("should NOT apply unarmored bonus when armor is equipped", () => {
    expect(
      calculateAC({
        equippedArmorAC: 5,
        dexDefenseAdj: 0,
        classGroups: ["warrior"],
        encumbrance: "unencumbered",
      })
    ).toBe(5);
  });

  it("should NOT apply unarmored bonus when encumbered (encumbrance relevant)", () => {
    expect(calculateAC({ dexDefenseAdj: 0, classGroups: ["warrior"], encumbrance: "heavy" })).toBe(
      10
    ); // No bonus when encumbered
  });

  it("should NOT apply unarmored bonus when lightly encumbered", () => {
    expect(calculateAC({ dexDefenseAdj: 0, classGroups: ["warrior"], encumbrance: "light" })).toBe(
      10
    );
  });

  it("should apply unarmored bonus with shield (shield is not armor)", () => {
    expect(
      calculateAC({
        shieldEquipped: true,
        dexDefenseAdj: 0,
        classGroups: ["warrior"],
        encumbrance: "unencumbered",
      })
    ).toBe(7); // 10 - 1 shield - 2 unarmored
  });

  it("should apply unarmored bonus regardless of encumbrance when ignoreEncumbrance=true", () => {
    expect(
      calculateAC({
        dexDefenseAdj: 0,
        classGroups: ["warrior"],
        encumbrance: "heavy",
        ignoreEncumbrance: true,
      })
    ).toBe(8); // Bonus applies because encumbrance is ignored
  });

  it("should apply unarmored bonus for multiclass with at least one warrior/rogue class", () => {
    expect(
      calculateAC({
        dexDefenseAdj: -4,
        classGroups: ["wizard", "rogue"],
        encumbrance: "unencumbered",
      })
    ).toBe(4); // 10 - 4 DEX - 2 rogue bonus
  });

  // ─── Additive Magic Items (House Rule) ─────────────────────────────────
  it("should apply magic item modifiers additively", () => {
    // Bracers of Defense +4 = -4 AC modifier
    expect(calculateAC({ dexDefenseAdj: 0, magicACModifier: -4 })).toBe(6); // 10 - 4
  });

  it("should stack magic items with DEX", () => {
    // Bracers +4 + DEX 18 (-4)
    expect(calculateAC({ dexDefenseAdj: -4, magicACModifier: -4 })).toBe(2); // 10 - 4 - 4
  });

  it("should stack magic items with unarmored bonus", () => {
    // Bracers +4 + DEX 18 (-4) + Rogue unarmored bonus (-2)
    expect(
      calculateAC({
        dexDefenseAdj: -4,
        magicACModifier: -4,
        classGroups: ["rogue"],
        encumbrance: "unencumbered",
      })
    ).toBe(0); // 10 - 4 DEX - 4 bracers - 2 rogue
  });

  // ─── Full Test Case from Requirements ──────────────────────────────────
  it("Illusionist 8 / Thief 7: Balance 18 + Bracers +4 + ignoreEncumbrance = AC 0", () => {
    // Balance 18 → defensiveAdj = -4
    // Bracers of Defense +4 → magicACModifier = -4
    // Thief is rogue group → unarmored bonus -2
    // ignoreEncumbrance = true
    expect(
      calculateAC({
        dexDefenseAdj: -4,
        magicACModifier: -4,
        classGroups: ["wizard", "rogue"],
        encumbrance: "heavy",
        ignoreEncumbrance: true,
      })
    ).toBe(0); // 10 - 4 - 4 - 2 = 0
  });

  // ─── Magical Protection (Bracers as Armor entry with isMagicalProtection) ──
  it("isMagicalProtection: Bracers +4 as armor entry → AC 6", () => {
    // Bracers stored as armor with ac=4, isMagicalProtection=true
    // baseAC = 10 - 4 = 6 (bonus, not replace)
    expect(
      calculateAC({
        equippedArmorAC: 4,
        dexDefenseAdj: 0,
        isMagicalProtection: true,
      })
    ).toBe(6); // 10 - 4 = 6
  });

  it("isMagicalProtection: Bracers +4 + DEX -4 + Rogue unarmored = AC 0", () => {
    expect(
      calculateAC({
        equippedArmorAC: 4,
        dexDefenseAdj: -4,
        isMagicalProtection: true,
        classGroups: ["wizard", "rogue"],
        ignoreEncumbrance: true,
      })
    ).toBe(0); // 10 - 4 bracers - 4 DEX - 2 unarmored = 0
  });

  it("isMagicalProtection: false → armor replaces base AC (normal behavior)", () => {
    // Chain Mail AC 5 → baseAC = 5
    expect(
      calculateAC({
        equippedArmorAC: 5,
        dexDefenseAdj: -1,
        isMagicalProtection: false,
      })
    ).toBe(4); // 5 - 1 = 4
  });

  // ─── Single-Weapon Style AC Bonus ─────────────────────────────────
  it("Single-Weapon Style: 1 slot → -1 AC", () => {
    expect(calculateAC({ dexDefenseAdj: 0, singleWeaponStyleBonus: 1 })).toBe(9);
  });

  it("Single-Weapon Style: 2 slots → -2 AC", () => {
    expect(calculateAC({ dexDefenseAdj: 0, singleWeaponStyleBonus: 2 })).toBe(8);
  });

  it("Single-Weapon Style stacks with armor + DEX (no shield)", () => {
    expect(
      calculateAC({
        equippedArmorAC: 5,
        dexDefenseAdj: -2,
        singleWeaponStyleBonus: 2,
      })
    ).toBe(1); // 5 - 2 DEX - 2 style = 1
  });

  it("Single-Weapon Style: suppressed when shield is equipped", () => {
    expect(
      calculateAC({
        dexDefenseAdj: 0,
        shieldEquipped: true,
        singleWeaponStyleBonus: 2,
      })
    ).toBe(9); // 10 - 1 shield, NO style bonus
  });

  // ─── Shield Proficiency Bonus (P.O: Skills & Powers) ────────────────
  it("Shield Proficiency: Medium Shield +3 bonus", () => {
    expect(
      calculateAC({
        equippedArmorAC: 5,
        shieldEquipped: true,
        dexDefenseAdj: 0,
        shieldProficiencyBonus: 3,
      })
    ).toBe(1); // 5 - 1 shield - 3 prof = 1
  });

  it("Shield Proficiency: ignored when no shield equipped", () => {
    expect(
      calculateAC({
        equippedArmorAC: 5,
        dexDefenseAdj: 0,
        shieldProficiencyBonus: 3,
      })
    ).toBe(5); // No shield → no prof bonus
  });

  it("Shield Proficiency: stacks with DEX and shield", () => {
    expect(
      calculateAC({
        equippedArmorAC: 5,
        shieldEquipped: true,
        dexDefenseAdj: -2,
        shieldProficiencyBonus: 2,
      })
    ).toBe(0); // 5 - 1 shield - 2 DEX - 2 prof = 0
  });

  it("Single-Weapon Style stacks with unarmored bonus", () => {
    expect(
      calculateAC({
        dexDefenseAdj: -2,
        classGroups: ["warrior"],
        encumbrance: "unencumbered",
        singleWeaponStyleBonus: 2,
      })
    ).toBe(4); // 10 - 2 DEX - 2 unarmored - 2 style = 4
  });
});

describe("EQUIP-002: Encumbrance", () => {
  it("should return unencumbered when weight is under 1/3 of allowance", () => {
    expect(calculateEncumbrance(30, 110)).toBe("unencumbered"); // ~27%
  });

  it("should return light when weight is 1/3 to 1/2 of allowance", () => {
    expect(calculateEncumbrance(45, 110)).toBe("light"); // ~41%
  });

  it("should return moderate when weight is 1/2 to 2/3 of allowance", () => {
    expect(calculateEncumbrance(65, 110)).toBe("moderate"); // ~59%
  });

  it("should return heavy when weight is 2/3 to full allowance", () => {
    expect(calculateEncumbrance(90, 110)).toBe("heavy"); // ~82%
  });

  it("should return severe when over allowance", () => {
    expect(calculateEncumbrance(120, 110)).toBe("severe");
  });
});

describe("EQUIP-003: Movement Rate", () => {
  it("should return full movement when unencumbered", () => {
    expect(getMovementRate(12, "unencumbered")).toBe(12);
  });

  it("should reduce by 1/3 when light encumbered", () => {
    expect(getMovementRate(12, "light")).toBe(9);
  });

  it("should reduce by 1/2 when moderate encumbered", () => {
    expect(getMovementRate(12, "moderate")).toBe(6);
  });

  it("should reduce by 2/3 when heavy encumbered", () => {
    expect(getMovementRate(12, "heavy")).toBe(3); // floor(12 * 0.33)
  });

  it("should reduce to 1 when severe encumbered", () => {
    expect(getMovementRate(12, "severe")).toBe(1);
  });
});

describe("EQUIP-004: getStartingGold", () => {
  it("fighter: 5d4 × 10 = range 50-200", () => {
    const g = getStartingGold("fighter");
    expect(g.diceCount).toBe(5);
    expect(g.diceSides).toBe(4);
    expect(g.multiplier).toBe(10);
  });

  it("mage: (1d4+1) × 10 = range 20-50", () => {
    const g = getStartingGold("mage");
    expect(g.diceCount).toBe(1);
    expect(g.diceSides).toBe(4);
    expect(g.bonus).toBe(1);
    expect(g.multiplier).toBe(10);
  });

  it("thief: 2d6 × 10 = range 20-120", () => {
    const g = getStartingGold("thief");
    expect(g.diceCount).toBe(2);
    expect(g.diceSides).toBe(6);
    expect(g.multiplier).toBe(10);
  });

  it("cleric: 3d6 × 10 = range 30-180", () => {
    const g = getStartingGold("cleric");
    expect(g.diceCount).toBe(3);
    expect(g.diceSides).toBe(6);
    expect(g.multiplier).toBe(10);
  });
});

describe("Payment System", () => {
  it("purseTotalInCP converts correctly", () => {
    expect(purseTotalInCP({ pp: 1, gp: 1, ep: 1, sp: 1, cp: 1 })).toBe(661);
  });

  it("exact GP payment", () => {
    const purse = { pp: 0, gp: 10, ep: 0, sp: 0, cp: 0 };
    const result = calculatePayment(purse, 500); // 5 GP
    expect(result.success).toBe(true);
    expect(result.remaining.gp).toBe(5);
  });

  it("payment with PP when no GP", () => {
    const purse = { pp: 2, gp: 0, ep: 0, sp: 0, cp: 0 };
    const result = calculatePayment(purse, 300); // 3 GP
    expect(result.success).toBe(true);
    expect(result.remaining.pp).toBe(1);
    // 1 PP broken = 5 GP, spent 3 GP worth, change = 2 GP
    expect(result.remaining.gp).toBe(2);
  });

  it("insufficient funds", () => {
    const purse = { pp: 0, gp: 1, ep: 0, sp: 0, cp: 0 };
    const result = calculatePayment(purse, 500); // 5 GP
    expect(result.success).toBe(false);
    expect(result.shortfall).toBe(400);
  });

  it("mixed coins payment", () => {
    const purse = { pp: 0, gp: 2, ep: 3, sp: 5, cp: 10 };
    const result = calculatePayment(purse, 100); // 1 GP
    expect(result.success).toBe(true);
    expect(result.remaining.gp).toBe(1); // spent 1 GP
  });

  it("zero cost returns purse unchanged", () => {
    const purse = { pp: 1, gp: 2, ep: 0, sp: 0, cp: 0 };
    const result = calculatePayment(purse, 0);
    expect(result.success).toBe(true);
    expect(result.remaining).toEqual(purse);
  });

  it("making change from SP", () => {
    const purse = { pp: 0, gp: 0, ep: 0, sp: 3, cp: 0 };
    const result = calculatePayment(purse, 5); // 0.5 SP = 5 CP
    expect(result.success).toBe(true);
    expect(result.remaining.sp).toBe(2);
    expect(result.remaining.cp).toBe(5);
  });
});

describe("isShieldItem", () => {
  it("detects Schild", () => expect(isShieldItem("Schild")).toBe(true));
  it("detects Shield", () => expect(isShieldItem("Shield")).toBe(true));
  it("detects Buckler", () => expect(isShieldItem("Buckler")).toBe(true));
  it("detects Großer Schild", () => expect(isShieldItem("Großer Schild")).toBe(true));
  it("detects Large Shield", () => expect(isShieldItem("Large Shield")).toBe(true));
  it("detects Mittlerer Schild", () => expect(isShieldItem("Mittlerer Schild")).toBe(true));
  it("detects Medium Shield", () => expect(isShieldItem("Medium Shield")).toBe(true));
  it("rejects Kettenhemd", () => expect(isShieldItem("Kettenhemd")).toBe(false));
  it("rejects Chain Mail", () => expect(isShieldItem("Chain Mail")).toBe(false));
});

describe("getShieldProficiencyBonus", () => {
  // With DB shield_type (preferred path)
  it("DB shield_type 'buckler' + proficiency → +1", () => {
    expect(getShieldProficiencyBonus("buckler", "Buckler", [{ weapon_name: "Buckler" }])).toBe(1);
  });

  it("DB shield_type 'medium' + proficiency → +3", () => {
    expect(
      getShieldProficiencyBonus("medium", "Mittlerer Schild", [{ weapon_name: "Shield (medium)" }])
    ).toBe(3);
  });

  it("DB shield_type 'small' + proficiency → +2", () => {
    expect(getShieldProficiencyBonus("small", "Schild", [{ weapon_name: "Schild" }])).toBe(2);
  });

  // Fallback: no DB shield_type, derive from name
  it("no DB type, name 'Mittlerer Schild' → +3 (name fallback)", () => {
    expect(
      getShieldProficiencyBonus(null, "Mittlerer Schild", [{ weapon_name: "Mittlerer Schild" }])
    ).toBe(3);
  });

  it("no DB type, name 'Großer Schild' → +3 (name fallback)", () => {
    expect(
      getShieldProficiencyBonus(null, "Großer Schild", [{ weapon_name: "Großer Schild" }])
    ).toBe(3);
  });

  it("no proficiency → 0", () => {
    expect(getShieldProficiencyBonus("small", "Schild", [{ weapon_name: "Langschwert" }])).toBe(0);
  });

  it("null shield → 0", () => {
    expect(getShieldProficiencyBonus(null, null, [{ weapon_name: "Schild" }])).toBe(0);
  });

  it("cross-format: DB type 'medium' + proficiency 'Shield (medium)' → +3", () => {
    expect(
      getShieldProficiencyBonus("medium", "Mittlerer Schild", [{ weapon_name: "Shield (medium)" }])
    ).toBe(3);
  });

  it("custom shield with DB type but unrecognized proficiency name → 0", () => {
    // Proficiency name "Aegis" can't be mapped to a shield type
    expect(
      getShieldProficiencyBonus("large", "Aegis des Schutzes", [{ weapon_name: "Aegis" }])
    ).toBe(0);
  });

  it("custom shield with matching standard proficiency → works", () => {
    // Custom shield with DB type 'large', proficiency matches via "Großer Schild"
    expect(
      getShieldProficiencyBonus("large", "Aegis des Schutzes", [{ weapon_name: "Großer Schild" }])
    ).toBe(3);
  });
});
