import { describe, it, expect } from "vitest";
import {
  FIGHTING_STYLES,
  getAllFightingStyles,
  getAvailableFightingStyles,
  getSpecializableFightingStyles,
  canLearnMoreFightingStyles,
  getFightingStyle,
  getSingleWeaponStyleBonus,
} from "./fighting-styles";

describe("Fighting Styles (PHBR01)", () => {
  it("should have exactly 4 fighting styles", () => {
    expect(getAllFightingStyles()).toHaveLength(4);
  });

  it("all styles should have bilingual names and descriptions", () => {
    for (const style of getAllFightingStyles()) {
      expect(style.name).toBeTruthy();
      expect(style.name_en).toBeTruthy();
      expect(style.description).toBeTruthy();
      expect(style.description_en).toBeTruthy();
      expect(style.benefits.length).toBeGreaterThan(0);
      for (const benefit of style.benefits) {
        expect(benefit.description).toBeTruthy();
        expect(benefit.description_en).toBeTruthy();
      }
    }
  });

  describe("Class Access", () => {
    it("warriors know all 4 styles", () => {
      expect(getAvailableFightingStyles("warrior")).toHaveLength(4);
    });

    it("priests know 3 styles (no Two-Weapon)", () => {
      const styles = getAvailableFightingStyles("priest");
      expect(styles).toHaveLength(3);
      expect(styles.map((s) => s.id)).not.toContain("two_weapon");
    });

    it("rogues know 3 styles (no Weapon & Shield)", () => {
      const styles = getAvailableFightingStyles("rogue");
      expect(styles).toHaveLength(3);
      expect(styles.map((s) => s.id)).not.toContain("weapon_and_shield");
    });

    it("wizards know only 2 styles (Single + Two-Hander)", () => {
      const styles = getAvailableFightingStyles("wizard");
      expect(styles).toHaveLength(2);
      expect(styles.map((s) => s.id).sort()).toEqual(["single_weapon", "two_hander"]);
    });
  });

  describe("Specialization Access", () => {
    it("warriors can specialize in all 4 styles", () => {
      expect(getSpecializableFightingStyles("warrior")).toHaveLength(4);
    });

    it("wizards cannot specialize in any style", () => {
      expect(getSpecializableFightingStyles("wizard")).toHaveLength(0);
    });

    it("priests can specialize in 3 styles", () => {
      expect(getSpecializableFightingStyles("priest")).toHaveLength(3);
    });

    it("rogues can specialize in 3 styles", () => {
      expect(getSpecializableFightingStyles("rogue")).toHaveLength(3);
    });
  });

  describe("Learning Limits", () => {
    it("warriors can always learn more styles", () => {
      expect(canLearnMoreFightingStyles("warrior", 0)).toBe(true);
      expect(canLearnMoreFightingStyles("warrior", 3)).toBe(true);
    });

    it("priests can learn max 1 style", () => {
      expect(canLearnMoreFightingStyles("priest", 0)).toBe(true);
      expect(canLearnMoreFightingStyles("priest", 1)).toBe(false);
    });

    it("rogues can learn max 1 style", () => {
      expect(canLearnMoreFightingStyles("rogue", 0)).toBe(true);
      expect(canLearnMoreFightingStyles("rogue", 1)).toBe(false);
    });

    it("wizards cannot learn any styles", () => {
      expect(canLearnMoreFightingStyles("wizard", 0)).toBe(false);
    });
  });

  describe("Style Properties", () => {
    it("Single-Weapon allows up to 2 slots", () => {
      expect(FIGHTING_STYLES.single_weapon.maxSlots).toBe(2);
    });

    it("Two-Hander allows only 1 slot", () => {
      expect(FIGHTING_STYLES.two_hander.maxSlots).toBe(1);
    });

    it("Weapon & Shield allows up to 2 slots", () => {
      expect(FIGHTING_STYLES.weapon_and_shield.maxSlots).toBe(2);
    });

    it("Two-Weapon allows only 1 slot", () => {
      expect(FIGHTING_STYLES.two_weapon.maxSlots).toBe(1);
    });
  });

  describe("getFightingStyle", () => {
    it("returns style for known id", () => {
      expect(getFightingStyle("two_weapon")).not.toBeNull();
      expect(getFightingStyle("two_weapon")!.name_en).toBe("Two-Weapon Style");
    });

    it("returns null for unknown id", () => {
      expect(getFightingStyle("unknown")).toBeNull();
    });
  });

  describe("getSingleWeaponStyleBonus", () => {
    it("returns 0 when no fighting styles", () => {
      expect(getSingleWeaponStyleBonus([])).toBe(0);
    });

    it("returns 0 when no single-weapon style", () => {
      expect(getSingleWeaponStyleBonus([{ style_id: "two_weapon", slots_invested: 1 }])).toBe(0);
    });

    it("returns 1 for 1 slot invested", () => {
      expect(getSingleWeaponStyleBonus([{ style_id: "single_weapon", slots_invested: 1 }])).toBe(1);
    });

    it("returns 2 for 2 slots invested", () => {
      expect(getSingleWeaponStyleBonus([{ style_id: "single_weapon", slots_invested: 2 }])).toBe(2);
    });

    it("caps at 2 even with more slots", () => {
      expect(getSingleWeaponStyleBonus([{ style_id: "single_weapon", slots_invested: 5 }])).toBe(2);
    });

    it("works alongside other fighting styles", () => {
      expect(
        getSingleWeaponStyleBonus([
          { style_id: "two_weapon", slots_invested: 1 },
          { style_id: "single_weapon", slots_invested: 2 },
        ])
      ).toBe(2);
    });
  });
});
