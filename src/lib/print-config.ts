export const PRINT_SECTION_IDS = [
  "personal",
  "abilities",
  "combat",
  "saves",
  "racialClassAbilities",
  "thiefSkills",
  "acBreakdown",
  "weapons",
  "equipment",
  "generalInventory",
  "spells",
  "spellsMemorized",
  "proficiencies",
  "notes",
] as const;

export type PrintSectionId = (typeof PRINT_SECTION_IDS)[number];

export interface PrintSectionConfig {
  id: PrintSectionId;
  visible: boolean;
}

export interface PrintPreferences {
  sections: PrintSectionConfig[];
}

export const DEFAULT_PRINT_PREFERENCES: PrintPreferences = {
  sections: PRINT_SECTION_IDS.map((id) => ({ id, visible: true })),
};

const STORAGE_KEY_PREFIX = "chaos-forge-print-";

export function loadPrintPreferences(characterId: string): PrintPreferences {
  if (typeof window === "undefined") return DEFAULT_PRINT_PREFERENCES;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + characterId);
    if (!raw) return DEFAULT_PRINT_PREFERENCES;

    const stored = JSON.parse(raw) as PrintPreferences;
    if (!stored.sections || !Array.isArray(stored.sections)) {
      return DEFAULT_PRINT_PREFERENCES;
    }

    // Migrate: keep only known IDs, append missing ones
    const knownIds = new Set<string>(PRINT_SECTION_IDS);
    const validSections = stored.sections.filter((s) => knownIds.has(s.id));
    const presentIds = new Set(validSections.map((s) => s.id));

    for (const id of PRINT_SECTION_IDS) {
      if (!presentIds.has(id)) {
        validSections.push({ id, visible: true });
      }
    }

    return { sections: validSections };
  } catch {
    return DEFAULT_PRINT_PREFERENCES;
  }
}

export function savePrintPreferences(characterId: string, prefs: PrintPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_PREFIX + characterId, JSON.stringify(prefs));
}

/**
 * Determine which sections have data for a given character.
 * Uses minimal type to avoid circular imports with print-sheet.
 */
export function computeSectionDataPresence(props: {
  character: { notes?: string | null };
  characterClasses: { is_active: boolean; class_id: string }[];
  equipment: { equipped: boolean; weapon?: unknown; armor?: unknown }[];
  spells: { prepared: boolean }[];
  weaponProficiencies: unknown[];
  nonweaponProficiencies: unknown[];
  languages: unknown[];
  fightingStyles: unknown[];
  inventory: unknown[];
  hasThiefSkills: boolean;
  hasRacialClassAbilities: boolean;
  hasSaves: boolean;
}): Record<PrintSectionId, boolean> {
  const equippedWeapons = props.equipment.filter((e) => e.weapon && e.equipped);
  const hasEquipment = props.equipment.some((e) => e.armor || (e.weapon && !e.equipped));

  return {
    personal: true,
    abilities: true,
    combat: true,
    saves: props.hasSaves,
    racialClassAbilities: props.hasRacialClassAbilities,
    thiefSkills: props.hasThiefSkills,
    acBreakdown: true,
    weapons: equippedWeapons.length > 0,
    equipment: hasEquipment,
    generalInventory: props.inventory.length > 0,
    spells: props.spells.length > 0,
    spellsMemorized: props.spells.some((s) => s.prepared),
    proficiencies:
      props.weaponProficiencies.length > 0 ||
      props.nonweaponProficiencies.length > 0 ||
      props.fightingStyles.length > 0,
    notes: !!props.character.notes,
  };
}
