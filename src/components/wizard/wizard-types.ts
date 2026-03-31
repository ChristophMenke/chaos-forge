import type { RaceId, ClassId } from "@/lib/rules/types";
import type { AlignmentId } from "@/lib/rules/alignment";

export interface WizardState {
  // Step 1: Basics
  name: string;
  level: number;
  alignment: AlignmentId;
  // Step 2: Abilities
  str: number;
  strExceptional: number | null;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  // Step 3: Race
  raceId: RaceId | null;
  // Step 4: Class (supports multiclass)
  classIds: ClassId[];
  // Step 5: Kit (optional)
  kit: string | null;
  // Step 6: Deity & Priesthood (optional, for priest classes)
  deity: string;
  priesthood: string | null;
  // Step 7: Combat (calculated + HP input)
  hpMax: number;
}

export const INITIAL_WIZARD_STATE: WizardState = {
  name: "",
  level: 1,
  alignment: "true_neutral",
  str: 10,
  strExceptional: null,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
  raceId: null,
  classIds: [],
  kit: null,
  deity: "",
  priesthood: null,
  hpMax: 1,
};

export const WIZARD_STEPS = [
  { id: "basics", label: "Grunddaten" },
  { id: "abilities", label: "Attribute" },
  { id: "race", label: "Rasse" },
  { id: "class", label: "Klasse" },
  { id: "kit", label: "Kit" },
  { id: "priesthood", label: "Glaubensrichtung" },
  { id: "combat", label: "Kampfwerte" },
  { id: "summary", label: "Zusammenfassung" },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];
