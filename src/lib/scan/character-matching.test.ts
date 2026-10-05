import { describe, it, expect } from "vitest";
import {
  matchesName,
  parseItemName,
  parseImperialHeight,
  normalizeRaceId,
  resolveFightingStyleId,
  normalizeNwpName,
  matchNwp,
  matchSpell,
  normalizeWeaponProfName,
  VALID_CLASS_IDS,
  VALID_KIT_IDS,
} from "./character-matching";

describe("matchesName", () => {
  it("matches on a direct substring in either direction", () => {
    expect(matchesName("Long Sword", "long sword")).toBe(true);
    expect(matchesName("Sword", "long sword")).toBe(true);
    expect(matchesName("Long Sword +1", "long sword")).toBe(true);
  });

  it("is case-insensitive on both sides", () => {
    expect(matchesName("LONG SWORD", "Long Sword")).toBe(true);
  });

  it("matches via tokens when word order and separators differ", () => {
    // The DB name is "Hand Axe", the sheet says "Axe, hand/throwing".
    expect(matchesName("Hand Axe", "axe, hand/throwing")).toBe(true);
  });

  it("rejects unrelated names", () => {
    expect(matchesName("Long Sword", "dagger")).toBe(false);
    expect(matchesName("Ox", "cart")).toBe(false);
  });

  it("ignores tokens of three characters or fewer when token matching", () => {
    // "Ox" produces no usable tokens, so only the substring rule can apply.
    expect(matchesName("Ox", "wagon")).toBe(false);
  });

  it("does not match on an empty scanned name", () => {
    expect(matchesName("Long Sword", "")).toBe(false);
  });
});

describe("parseItemName", () => {
  it("strips a magic bonus from the base name", () => {
    expect(parseItemName("Long Sword +2")).toEqual({ baseName: "long sword", quantity: 1 });
  });

  it("extracts a trailing quantity", () => {
    expect(parseItemName("Torch x3")).toEqual({ baseName: "torch", quantity: 3 });
  });

  it("handles bonus and quantity together", () => {
    expect(parseItemName("Arrow +1 x20")).toEqual({ baseName: "arrow", quantity: 20 });
  });

  it("defaults to quantity 1 and lowercases", () => {
    expect(parseItemName("  Backpack  ")).toEqual({ baseName: "backpack", quantity: 1 });
  });

  it("returns an empty base name for blank input", () => {
    expect(parseItemName("   ")).toEqual({ baseName: "", quantity: 1 });
  });
});

describe("parseImperialHeight", () => {
  it("parses the foot-and-inch shorthand", () => {
    expect(parseImperialHeight("5'10\"")).toBeCloseTo(177.8, 1);
  });

  it("parses the shorthand without the inch marker", () => {
    expect(parseImperialHeight("5'10")).toBeCloseTo(177.8, 1);
  });

  it("parses spelled-out units", () => {
    expect(parseImperialHeight("5 ft 10 in")).toBeCloseTo(177.8, 1);
    expect(parseImperialHeight("6 feet 2 inches")).toBeCloseTo(187.96, 1);
  });

  it("treats a lone foot value as zero inches", () => {
    expect(parseImperialHeight("5 ft")).toBeCloseTo(152.4, 1);
  });

  it("returns 0 for unparsable input", () => {
    expect(parseImperialHeight("unbekannt")).toBe(0);
    expect(parseImperialHeight("")).toBe(0);
  });
});

describe("normalizeRaceId", () => {
  it("maps subraces onto their base race", () => {
    expect(normalizeRaceId("stout_halfling")).toBe("halfling");
    expect(normalizeRaceId("wood_elf")).toBe("elf");
    expect(normalizeRaceId("standard_half_elf")).toBe("half_elf");
    expect(normalizeRaceId("mountain_dwarf")).toBe("dwarf");
    expect(normalizeRaceId("deep_gnome")).toBe("gnome");
  });

  it("leaves base races untouched", () => {
    expect(normalizeRaceId("human")).toBe("human");
    expect(normalizeRaceId("kobold")).toBe("kobold");
  });

  it("passes unknown values through unchanged", () => {
    expect(normalizeRaceId("drow")).toBe("drow");
  });

  it("handles null", () => {
    expect(normalizeRaceId(null)).toBeNull();
  });
});

describe("resolveFightingStyleId", () => {
  it("resolves all four styles", () => {
    expect(resolveFightingStyleId("Fighting Style: Two Weapon")).toBe("two_weapon");
    expect(resolveFightingStyleId("Fighting Style: Two-Hander")).toBe("two_hander");
    expect(resolveFightingStyleId("Fighting Style: Two Handed")).toBe("two_hander");
    expect(resolveFightingStyleId("Fighting Style: Weapon and Shield")).toBe("weapon_and_shield");
    expect(resolveFightingStyleId("Fighting Style: Single Weapon")).toBe("single_weapon");
  });

  it("returns null for anything it cannot classify", () => {
    expect(resolveFightingStyleId("Fighting Style: Mounted")).toBeNull();
    expect(resolveFightingStyleId("Long Sword")).toBeNull();
  });
});

describe("normalizeNwpName", () => {
  it("strips the native-languages prefix", () => {
    expect(normalizeNwpName("Native Languages: Elvish")).toBe("elvish");
    expect(normalizeNwpName("Native Language: Dwarvish")).toBe("dwarvish");
  });

  it("returns null for entries that should be skipped", () => {
    expect(normalizeNwpName("Common")).toBeNull();
    expect(normalizeNwpName("Native Languages: Common")).toBeNull();
    expect(normalizeNwpName("native tongue")).toBeNull();
  });

  it("lowercases and trims regular entries", () => {
    expect(normalizeNwpName("  Rope Use  ")).toBe("rope use");
  });

  it("returns null for blank input", () => {
    expect(normalizeNwpName("   ")).toBeNull();
  });
});

describe("matchNwp", () => {
  const catalog = [
    { id: "rope_use", name: "Seilkunde", name_en: "Rope Use" },
    { id: "swimming", name: "Schwimmen", name_en: "Swimming" },
  ];

  it("matches the English name", () => {
    expect(matchNwp("rope use", catalog)?.id).toBe("rope_use");
  });

  it("matches the German name", () => {
    expect(matchNwp("schwimmen", catalog)?.id).toBe("swimming");
  });

  it("matches on a partial name", () => {
    expect(matchNwp("rope", catalog)?.id).toBe("rope_use");
  });

  it("returns null when nothing matches", () => {
    expect(matchNwp("juggling", catalog)).toBeNull();
  });
});

describe("matchSpell", () => {
  const catalog = [
    { id: "s1", name: "Magisches Geschoss", name_en: "Magic Missile", level: 1 },
    { id: "s2", name: "Unsichtbarkeit", name_en: "Invisibility", level: 2 },
    { id: "s3", name: "Unsichtbarkeit, 3 m Radius", name_en: "Invisibility, 10' Radius", level: 3 },
  ];

  it("matches the English name at the right level", () => {
    expect(matchSpell({ name: "Magic Missile", level: 1 }, catalog)?.id).toBe("s1");
  });

  it("matches the German name", () => {
    expect(matchSpell({ name: "Magisches Geschoss", level: 1 }, catalog)?.id).toBe("s1");
  });

  it("requires the level to match", () => {
    expect(matchSpell({ name: "Magic Missile", level: 2 }, catalog)).toBeNull();
  });

  it("does not confuse spells that share a name prefix across levels", () => {
    expect(matchSpell({ name: "Invisibility", level: 2 }, catalog)?.id).toBe("s2");
    expect(matchSpell({ name: "Invisibility, 10' Radius", level: 3 }, catalog)?.id).toBe("s3");
  });

  it("returns null for an unknown spell", () => {
    expect(matchSpell({ name: "Wunschzauber", level: 9 }, catalog)).toBeNull();
  });

  it("returns null for a blank name", () => {
    expect(matchSpell({ name: "  ", level: 1 }, catalog)).toBeNull();
  });
});

describe("normalizeWeaponProfName", () => {
  const weapons = [
    { id: "w1", name: "Langschwert", name_en: "Long Sword" },
    { id: "w2", name: "Dolch", name_en: "Dagger" },
  ];

  it("normalizes an English proficiency name to the canonical German one", () => {
    expect(normalizeWeaponProfName("Long Sword", weapons)).toBe("Langschwert");
  });

  it("keeps an already-canonical name", () => {
    expect(normalizeWeaponProfName("Langschwert", weapons)).toBe("Langschwert");
  });

  it("falls back to the raw name when the weapon is unknown", () => {
    expect(normalizeWeaponProfName("Krassreißer", weapons)).toBe("Krassreißer");
  });
});

describe("id whitelists", () => {
  it("covers the 16 playable classes", () => {
    expect(VALID_CLASS_IDS).toHaveLength(16);
    expect(VALID_CLASS_IDS).toContain("fighter");
    expect(VALID_CLASS_IDS).toContain("bard");
  });

  it("covers the 20 kits", () => {
    expect(VALID_KIT_IDS).toHaveLength(20);
    expect(VALID_KIT_IDS).toContain("swashbuckler");
    expect(VALID_KIT_IDS).toContain("blade");
  });
});
