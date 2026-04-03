"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { localized } from "@/lib/utils/localize";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  getWeaponProficiencySlots,
  getNonweaponProficiencySlots,
  getNonproficiencyPenalty,
  canSpecialize,
  isNonStandardSpecialization,
} from "@/lib/rules/proficiencies";
import type { ClassGroup, ClassId } from "@/lib/rules/types";
import { RACES } from "@/lib/rules/races";
import { getIntelligenceModifiers } from "@/lib/rules/abilities";
import type {
  CharacterWeaponProficiencyRow,
  CharacterNWPWithDetails,
  NonweaponProficiencyRow,
  CharacterLanguageRow,
  CharacterFightingStyleRow,
  WeaponRow,
} from "@/lib/supabase/types";
import {
  getFightingStyle,
  getAvailableFightingStyles,
  canLearnMoreFightingStyles,
} from "@/lib/rules/fighting-styles";
import { CLASSES } from "@/lib/rules/classes";

const NWP_GROUP_FILTER_KEYS = ["all", "general", "warrior", "priest", "rogue", "wizard"] as const;

const ABILITY_OPTIONS = [
  { value: "str", label: "STR" },
  { value: "dex", label: "DEX" },
  { value: "con", label: "CON" },
  { value: "int", label: "INT" },
  { value: "wis", label: "WIS" },
  { value: "cha", label: "CHA" },
] as const;

interface CustomNwpForm {
  name: string;
  ability: string;
  modifier: number;
  group_type: string;
  slots_required: number;
}

const emptyCustomNwpForm: CustomNwpForm = {
  name: "",
  ability: "int",
  modifier: 0,
  group_type: "general",
  slots_required: 1,
};

const LANGUAGE_SUGGESTIONS: Record<string, { de: string; en: string }> = {
  common: { de: "Common", en: "Common" },
  elvish: { de: "Elfisch", en: "Elvish" },
  dwarvish: { de: "Zwergisch", en: "Dwarvish" },
  gnomish: { de: "Gnomisch", en: "Gnomish" },
  halfling: { de: "Halblingisch", en: "Halfling" },
  orcish: { de: "Orkisch", en: "Orcish" },
  goblin: { de: "Goblinisch", en: "Goblin" },
  kobold: { de: "Koboldisch", en: "Kobold" },
  ogre: { de: "Ogerhaft", en: "Ogre" },
  giant: { de: "Riesisch", en: "Giant" },
  draconic: { de: "Drachisch", en: "Draconic" },
  sylvan: { de: "Sylvanisch", en: "Sylvan" },
  abyssal: { de: "Abyssal", en: "Abyssal" },
  infernal: { de: "Infernal", en: "Infernal" },
  celestial: { de: "Celestisch", en: "Celestial" },
};

interface TabProficienciesProps {
  characterId: string;
  userId: string;
  classId: string;
  classGroup: string;
  level: number;
  intScore: number;
  raceId: string;
  weaponProficiencies: CharacterWeaponProficiencyRow[];
  nonweaponProficiencies: CharacterNWPWithDetails[];
  allNonweaponProficiencies: NonweaponProficiencyRow[];
  allWeapons: WeaponRow[];
  languages: CharacterLanguageRow[];
  fightingStyles: CharacterFightingStyleRow[];
  weaponSlotsAdj: number;
  nwpSlotsAdj: number;
  languageSlotsAdj: number;
  readOnly?: boolean;
  onWeaponProfsChange: (profs: CharacterWeaponProficiencyRow[]) => void;
  onNwProfsChange: (profs: CharacterNWPWithDetails[]) => void;
  onLanguagesChange: (langs: CharacterLanguageRow[]) => void;
  onFightingStylesChange: (styles: CharacterFightingStyleRow[]) => void;
}

export function TabProficiencies({
  characterId,
  userId,
  classId,
  classGroup,
  level,
  intScore,
  raceId,
  weaponProficiencies,
  nonweaponProficiencies,
  allNonweaponProficiencies,
  allWeapons,
  languages,
  fightingStyles,
  weaponSlotsAdj: initialWeaponSlotsAdj,
  nwpSlotsAdj: initialNwpSlotsAdj,
  languageSlotsAdj: initialLanguageSlotsAdj,
  readOnly = false,
  onWeaponProfsChange,
  onNwProfsChange,
  onLanguagesChange,
  onFightingStylesChange,
}: TabProficienciesProps) {
  const t = useTranslations("proficiencies");
  const tcom = useTranslations("common");
  const tg = useTranslations("nwpGroups");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fsDeleteId, setFsDeleteId] = useState<string | null>(null);
  const [newWeaponName, setNewWeaponName] = useState("");
  const [newWeaponSpecialized, setNewWeaponSpecialized] = useState(false);
  const [weaponDropdownOpen, setWeaponDropdownOpen] = useState(false);
  const [nwpSearchQuery, setNwpSearchQuery] = useState("");
  const [nwpGroupFilter, setNwpGroupFilter] = useState<string>("all");
  const [showCustomNwpForm, setShowCustomNwpForm] = useState(false);
  const [customNwp, setCustomNwp] = useState<CustomNwpForm>(emptyCustomNwpForm);
  const [newLanguage, setNewLanguage] = useState("");
  const [expandedNwpId, setExpandedNwpId] = useState<string | null>(null);

  const group = classGroup as ClassGroup;
  const baseWeaponSlots = getWeaponProficiencySlots(group, level);
  const baseNwpSlots = getNonweaponProficiencySlots(group, level, intScore);
  const [weaponSlotsAdj, setWeaponSlotsAdj] = useState(initialWeaponSlotsAdj);
  const [nwpSlotsAdj, setNwpSlotsAdj] = useState(initialNwpSlotsAdj);
  const [languageSlotsAdj, setLanguageSlotsAdj] = useState(initialLanguageSlotsAdj);
  const weaponSlots = baseWeaponSlots + weaponSlotsAdj;
  const nwpSlots = baseNwpSlots + nwpSlotsAdj;

  async function updateSlotAdj(field: string, value: number) {
    const supabase = createClient();
    await supabase
      .from("characters")
      .update({ [field]: value })
      .eq("id", characterId);
  }
  const penalty = getNonproficiencyPenalty(group);
  const showSpecialization = canSpecialize(classId as ClassId);
  const showSpecWarning = isNonStandardSpecialization(classId as ClassId);

  // Lookup weapon name → localized display name
  const weaponNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of allWeapons) {
      map.set(w.name.toLowerCase(), localized(w.name, w.name_en, locale));
      if (w.name_en) map.set(w.name_en.toLowerCase(), localized(w.name, w.name_en, locale));
    }
    return map;
  }, [allWeapons, locale]);

  function localizeWeaponName(weaponName: string): string {
    return weaponNameMap.get(weaponName.toLowerCase()) ?? weaponName;
  }

  const fightingStyleSlots = fightingStyles.reduce((sum, fs) => sum + fs.slots_invested, 0);

  const usedWeaponSlots =
    weaponProficiencies.reduce((sum, wp) => sum + (wp.specialization ? 2 : 1), 0) +
    fightingStyleSlots;

  const usedNwpSlots = nonweaponProficiencies.reduce(
    (sum, nwp) => sum + nwp.proficiency.slots_required,
    0
  );

  // All NWP groups accessible (house rule: no restrictions, only warnings)
  const availableNwps = useMemo(() => {
    return allNonweaponProficiencies.filter(
      (nwp) => !nonweaponProficiencies.some((existing) => existing.proficiency_id === nwp.id)
    );
  }, [allNonweaponProficiencies, nonweaponProficiencies]);

  // Filtered weapons for autocomplete dropdown
  const filteredWeapons = useMemo(() => {
    const q = newWeaponName.trim().toLowerCase();
    if (!q) return allWeapons;
    return allWeapons.filter(
      (w) => w.name.toLowerCase().includes(q) || (w.name_en ?? "").toLowerCase().includes(q)
    );
  }, [allWeapons, newWeaponName]);

  // Filtered NWPs by search query and group filter
  const filteredAvailableNwps = useMemo(() => {
    return availableNwps.filter((nwp) => {
      // Group filter
      if (nwpGroupFilter !== "all" && nwp.group_type !== nwpGroupFilter) return false;
      // Text search
      if (nwpSearchQuery.trim()) {
        const q = nwpSearchQuery.toLowerCase();
        if (!nwp.name.toLowerCase().includes(q) && !(nwp.name_en ?? "").toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [availableNwps, nwpSearchQuery, nwpGroupFilter]);

  async function addWeaponProficiency() {
    const trimmed = newWeaponName.trim();
    if (!trimmed) return;

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("character_weapon_proficiencies")
      .insert({
        character_id: characterId,
        weapon_name: trimmed,
        specialization: newWeaponSpecialized,
      })
      .select("*")
      .single();
    if (error || !data) {
      console.error("Failed to add weapon proficiency:", error);
      setLoading(false);
      return;
    }
    onWeaponProfsChange([...weaponProficiencies, data]);
    setNewWeaponName("");
    setNewWeaponSpecialized(false);
    setLoading(false);
  }

  async function removeWeaponProficiency(id: string) {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("character_weapon_proficiencies").delete().eq("id", id);
    onWeaponProfsChange(weaponProficiencies.filter((wp) => wp.id !== id));
    setLoading(false);
  }

  async function toggleSpecialization(wp: CharacterWeaponProficiencyRow) {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("character_weapon_proficiencies")
      .update({ specialization: !wp.specialization })
      .eq("id", wp.id);
    onWeaponProfsChange(
      weaponProficiencies.map((w) =>
        w.id === wp.id ? { ...w, specialization: !w.specialization } : w
      )
    );
    setLoading(false);
  }

  async function addNonweaponProficiency(nwpId: string) {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("character_nonweapon_proficiencies")
      .insert({
        character_id: characterId,
        proficiency_id: nwpId,
      })
      .select("*, proficiency:nonweapon_proficiencies(*)")
      .single();
    if (error || !data) {
      console.error("Failed to add NWP:", error);
      setLoading(false);
      return;
    }
    onNwProfsChange([...nonweaponProficiencies, data as CharacterNWPWithDetails]);
    setLoading(false);
  }

  async function removeNonweaponProficiency(id: string) {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("character_nonweapon_proficiencies").delete().eq("id", id);
    onNwProfsChange(nonweaponProficiencies.filter((n) => n.id !== id));
    setLoading(false);
  }

  async function createCustomNwp() {
    const trimmed = customNwp.name.trim();
    if (!trimmed) return;

    setLoading(true);
    const supabase = createClient();

    // Insert custom NWP into nonweapon_proficiencies table
    const { data: newNwp } = await supabase
      .from("nonweapon_proficiencies")
      .insert({
        name: trimmed,
        ability: customNwp.ability,
        modifier: customNwp.modifier,
        group_type: customNwp.group_type,
        slots_required: customNwp.slots_required,
        is_custom: true,
        created_by: userId,
      })
      .select("id")
      .single();

    if (newNwp) {
      // Also add it to the character
      const { data } = await supabase
        .from("character_nonweapon_proficiencies")
        .insert({
          character_id: characterId,
          proficiency_id: newNwp.id,
        })
        .select("*, proficiency:nonweapon_proficiencies(*)")
        .single();

      if (data) {
        onNwProfsChange([...nonweaponProficiencies, data as CharacterNWPWithDetails]);
      }
    }

    setCustomNwp(emptyCustomNwpForm);
    setShowCustomNwpForm(false);
    setLoading(false);
  }

  // Fighting styles
  const classDef = CLASSES[classId as keyof typeof CLASSES];
  const classGroupForStyles = (classDef?.group ?? classGroup) as ClassGroup;
  const availableFightingStyles = useMemo(() => {
    const all = getAvailableFightingStyles(classGroupForStyles);
    return all.filter((s) => !fightingStyles.some((fs) => fs.style_id === s.id));
  }, [classGroupForStyles, fightingStyles]);
  const canAddMore = canLearnMoreFightingStyles(classGroupForStyles, fightingStyles.length);

  async function addFightingStyle(styleId: string) {
    setLoading(true);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("character_fighting_styles")
      .insert({
        character_id: characterId,
        style_id: styleId,
        slots_invested: 1,
      })
      .select("*")
      .single();
    if (insertError || !data) {
      console.error("Failed to add fighting style:", insertError);
      setLoading(false);
      return;
    }
    onFightingStylesChange([...fightingStyles, data]);
    setLoading(false);
  }

  async function removeFightingStyle(id: string) {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("character_fighting_styles").delete().eq("id", id);
    onFightingStylesChange(fightingStyles.filter((f) => f.id !== id));
    setLoading(false);
  }

  async function upgradeFightingStyle(fs: CharacterFightingStyleRow) {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("character_fighting_styles")
      .update({ slots_invested: fs.slots_invested + 1 })
      .eq("id", fs.id);
    onFightingStylesChange(
      fightingStyles.map((f) =>
        f.id === fs.id ? { ...f, slots_invested: f.slots_invested + 1 } : f
      )
    );
    setLoading(false);
  }

  async function downgradeFightingStyle(fs: CharacterFightingStyleRow) {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("character_fighting_styles")
      .update({ slots_invested: Math.max(1, fs.slots_invested - 1) })
      .eq("id", fs.id);
    onFightingStylesChange(
      fightingStyles.map((f) =>
        f.id === fs.id ? { ...f, slots_invested: Math.max(1, f.slots_invested - 1) } : f
      )
    );
    setLoading(false);
  }

  const raceData = RACES[raceId as keyof typeof RACES];
  const defaultLanguages = raceData?.defaultLanguages ?? [];
  const maxLanguages = getIntelligenceModifiers(intScore).numberOfLanguages;
  const allLanguageNames = [...defaultLanguages, ...languages.map((l) => l.language_name)];
  const languageSuggestionEntries = Object.entries(LANGUAGE_SUGGESTIONS).map(([key, val]) => ({
    key,
    label: locale === "en" ? val.en : val.de,
  }));
  const availableSuggestions = languageSuggestionEntries.filter(
    (entry) => !allLanguageNames.includes(entry.label)
  );

  async function addLanguage(languageName: string) {
    const trimmed = languageName.trim();
    if (!trimmed) return;
    if (allLanguageNames.includes(trimmed)) return;

    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("character_languages")
      .insert({
        character_id: characterId,
        language_name: trimmed,
      })
      .select("*")
      .single();
    if (insertError || !data) {
      console.error("Failed to add language:", insertError);
      setError(t("addLanguageError"));
      setLoading(false);
      return;
    }
    onLanguagesChange([...languages, data]);
    setNewLanguage("");
    setLoading(false);
  }

  async function removeLanguage(id: string) {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("character_languages").delete().eq("id", id);
    onLanguagesChange(languages.filter((l) => l.id !== id));
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-6" data-testid="tab-proficiencies">
      {error && (
        <div
          className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
          data-testid="proficiencies-error"
        >
          {error}
        </div>
      )}
      {/* Weapon Proficiencies */}
      <div data-testid="weapon-proficiencies-section">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg">{t("weaponProf")}</h3>
          <div className="flex items-center gap-1" data-testid="weapon-slots-counter">
            {!readOnly && (
              <button
                className="rounded px-1.5 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const v = weaponSlotsAdj - 1;
                  setWeaponSlotsAdj(v);
                  updateSlotAdj("weapon_slots_adj", v);
                }}
                aria-label="Slot entfernen"
              >
                −
              </button>
            )}
            <Badge
              variant="outline"
              className={usedWeaponSlots > weaponSlots ? "border-red-500 text-red-400" : ""}
            >
              {t("slotsUsed", { used: usedWeaponSlots, total: weaponSlots })}
            </Badge>
            {!readOnly && (
              <button
                className="rounded px-1.5 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const v = weaponSlotsAdj + 1;
                  setWeaponSlotsAdj(v);
                  updateSlotAdj("weapon_slots_adj", v);
                }}
                aria-label="Slot hinzufügen"
              >
                +
              </button>
            )}
          </div>
        </div>

        <p className="mb-3 text-sm text-muted-foreground" data-testid="nonproficiency-penalty">
          {t("nonProfPenalty")}: {penalty}
        </p>

        {/* Weapon list */}
        {weaponProficiencies.length > 0 && (
          <div className="mb-4 flex flex-col gap-2" data-testid="weapon-proficiency-list">
            {weaponProficiencies.map((wp) => (
              <div
                key={wp.id}
                className="flex items-center justify-between rounded-md border border-border p-2"
                data-testid={`weapon-proficiency-${wp.id}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{localizeWeaponName(wp.weapon_name)}</span>
                  {wp.specialization && (
                    <Badge data-testid={`weapon-specialized-${wp.id}`}>{t("specialization")}</Badge>
                  )}
                  {showSpecWarning && wp.specialization && (
                    <span
                      className="text-xs text-amber-400"
                      data-testid={`weapon-spec-warning-${wp.id}`}
                    >
                      {t("specNonFighterWarning")}
                    </span>
                  )}
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-2">
                    {showSpecialization && (
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={wp.specialization}
                          onChange={() => toggleSpecialization(wp)}
                          disabled={loading}
                          data-testid={`weapon-specialization-toggle-${wp.id}`}
                        />
                        {t("specialization")}
                      </label>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWeaponProficiency(wp.id)}
                      disabled={loading}
                      data-testid={`weapon-remove-${wp.id}`}
                    >
                      {tcom("remove")}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add weapon */}
        {!readOnly && (
          <div className="flex items-center gap-2" data-testid="add-weapon-proficiency">
            <div className="relative flex-1">
              <Input
                placeholder={t("weaponName")}
                value={newWeaponName}
                onChange={(e) => {
                  setNewWeaponName(e.target.value);
                  setWeaponDropdownOpen(true);
                }}
                onFocus={() => setWeaponDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setWeaponDropdownOpen(false);
                    addWeaponProficiency();
                  }
                  if (e.key === "Escape") setWeaponDropdownOpen(false);
                }}
                className="w-full"
                data-testid="weapon-name-input"
                autoComplete="off"
              />
              {weaponDropdownOpen && filteredWeapons.length > 0 && (
                <div
                  className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-background shadow-lg"
                  data-testid="weapon-dropdown"
                >
                  {filteredWeapons.map((weapon) => (
                    <button
                      key={weapon.id}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setNewWeaponName(localized(weapon.name, weapon.name_en, locale));
                        setWeaponDropdownOpen(false);
                      }}
                      data-testid={`weapon-option-${weapon.id}`}
                    >
                      <span className="font-medium">
                        {localized(weapon.name, weapon.name_en, locale)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {weapon.damage_sm}/{weapon.damage_l}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {showSpecialization && (
              <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={newWeaponSpecialized}
                  onChange={(e) => setNewWeaponSpecialized(e.target.checked)}
                  data-testid="weapon-specialization-checkbox"
                />
                {t("specialization")}
              </label>
            )}
            <Button
              onClick={() => {
                setWeaponDropdownOpen(false);
                addWeaponProficiency();
              }}
              disabled={loading || !newWeaponName.trim()}
              data-testid="weapon-add-button"
            >
              {tcom("add")}
            </Button>
          </div>
        )}
      </div>

      {/* Fighting Styles */}
      <div data-testid="fighting-styles-section">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg">{t("fightingStyles")}</h3>
          <Badge variant="outline" data-testid="fighting-style-slots-counter">
            {t("slotsUsed", { used: fightingStyleSlots, total: fightingStyleSlots })}
          </Badge>
        </div>

        {/* Fighting styles list */}
        {fightingStyles.length > 0 && (
          <div className="mb-4 flex flex-col gap-2" data-testid="fighting-style-list">
            {fightingStyles.map((fs) => {
              const style = getFightingStyle(fs.style_id);
              if (!style) return null;
              const benefit = style.benefits.find((b) => b.slots === fs.slots_invested);
              const canUpgrade = fs.slots_invested < style.maxSlots;
              return (
                <div
                  key={fs.id}
                  className="flex items-center justify-between rounded-md border border-border p-2"
                  data-testid={`fighting-style-${fs.id}`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {localized(style.name, style.name_en, locale)}
                      </span>
                      <Badge variant="outline" data-testid={`fighting-style-slots-${fs.id}`}>
                        {t("slotsInvested", { slots: fs.slots_invested })}
                      </Badge>
                    </div>
                    {benefit && (
                      <span
                        className="text-xs text-muted-foreground"
                        data-testid={`fighting-style-benefit-${fs.id}`}
                      >
                        {localized(benefit.description, benefit.description_en, locale)}
                      </span>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-2">
                      {fs.slots_invested > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downgradeFightingStyle(fs)}
                          disabled={loading}
                          data-testid={`fighting-style-downgrade-${fs.id}`}
                        >
                          −
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => upgradeFightingStyle(fs)}
                        disabled={loading}
                        data-testid={`fighting-style-upgrade-${fs.id}`}
                      >
                        +
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                        onClick={() => setFsDeleteId(fs.id)}
                        data-testid={`fighting-style-remove-${fs.id}`}
                      >
                        {tcom("remove")}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add fighting style */}
        {!readOnly && availableFightingStyles.length > 0 && (
          <div data-testid="add-fighting-style">
            <div className="flex flex-wrap gap-2">
              {availableFightingStyles.map((style) => (
                <Button
                  key={style.id}
                  variant="outline"
                  size="sm"
                  onClick={() => addFightingStyle(style.id)}
                  disabled={loading}
                  data-testid={`fighting-style-add-${style.id}`}
                >
                  + {localized(style.name, style.name_en, locale)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Non-Weapon Proficiencies */}
      <div data-testid="nwp-section">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg">{t("nonweaponProf")}</h3>
          <div className="flex items-center gap-1" data-testid="nwp-slots-counter">
            {!readOnly && (
              <button
                className="rounded px-1.5 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const v = nwpSlotsAdj - 1;
                  setNwpSlotsAdj(v);
                  updateSlotAdj("nwp_slots_adj", v);
                }}
                aria-label="Slot entfernen"
              >
                −
              </button>
            )}
            <Badge
              variant="outline"
              className={usedNwpSlots > nwpSlots ? "border-red-500 text-red-400" : ""}
            >
              {t("slotsUsed", { used: usedNwpSlots, total: nwpSlots })}
            </Badge>
            {!readOnly && (
              <button
                className="rounded px-1.5 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const v = nwpSlotsAdj + 1;
                  setNwpSlotsAdj(v);
                  updateSlotAdj("nwp_slots_adj", v);
                }}
                aria-label="Slot hinzufügen"
              >
                +
              </button>
            )}
          </div>
        </div>

        {/* NWP list */}
        {nonweaponProficiencies.length > 0 && (
          <div className="mb-4 flex flex-col gap-2" data-testid="nwp-list">
            {nonweaponProficiencies.map((nwp) => {
              const abilityTarget = intScore + nwp.proficiency.modifier;
              const isExpanded = expandedNwpId === nwp.id;
              const desc = nwp.proficiency.description
                ? localized(nwp.proficiency.description, nwp.proficiency.description_en, locale)
                : null;
              return (
                <div
                  key={nwp.id}
                  className={`rounded-md border border-border p-2 ${desc ? "cursor-pointer" : ""}`}
                  data-testid={`nwp-${nwp.id}`}
                  onClick={desc ? () => setExpandedNwpId(isExpanded ? null : nwp.id) : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {localized(nwp.proficiency.name, nwp.proficiency.name_en, locale)}
                      </span>
                      <Badge variant="outline" data-testid={`nwp-ability-${nwp.id}`}>
                        {nwp.proficiency.ability}{" "}
                        {nwp.proficiency.modifier >= 0
                          ? `+${nwp.proficiency.modifier}`
                          : nwp.proficiency.modifier}
                      </Badge>
                      <span
                        className="text-xs text-muted-foreground"
                        data-testid={`nwp-check-${nwp.id}`}
                      >
                        {t("abilityCheck")}: {abilityTarget}
                      </span>
                    </div>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNonweaponProficiency(nwp.id);
                        }}
                        disabled={loading}
                        data-testid={`nwp-remove-${nwp.id}`}
                      >
                        {tcom("remove")}
                      </Button>
                    )}
                  </div>
                  {isExpanded && desc && (
                    <p
                      className="mt-1.5 text-xs text-muted-foreground"
                      data-testid={`nwp-description-${nwp.id}`}
                    >
                      {desc}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add NWP - searchable list */}
        {!readOnly && (
          <div data-testid="add-nwp">
            {/* Search input */}
            <input
              type="text"
              placeholder={tcom("search")}
              value={nwpSearchQuery}
              onChange={(e) => setNwpSearchQuery(e.target.value)}
              className="mb-3 w-full rounded-md border border-input bg-input p-2 text-sm"
              data-testid="nwp-search"
            />

            {/* Group filter buttons */}
            <div className="mb-3 flex flex-wrap gap-2">
              {NWP_GROUP_FILTER_KEYS.map((key) => (
                <Button
                  key={key}
                  variant={nwpGroupFilter === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNwpGroupFilter(key)}
                  data-testid={`nwp-filter-${key}`}
                >
                  {key === "all" ? tcom("all") : tg(key)}
                </Button>
              ))}
            </div>

            {/* Scrollable NWP list */}
            <div className="max-h-64 overflow-y-auto rounded-md border border-border">
              {filteredAvailableNwps.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  {t("noMatchingNwp")}
                </div>
              ) : (
                <div className="flex flex-col gap-0">
                  {filteredAvailableNwps.map((nwp) => {
                    const nwpDesc = nwp.description
                      ? localized(nwp.description, nwp.description_en, locale)
                      : null;
                    return (
                      <div
                        key={nwp.id}
                        className="border-b border-border p-3 last:border-b-0"
                        data-testid={`nwp-option-${nwp.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {localized(nwp.name, nwp.name_en, locale)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {nwp.ability} {nwp.modifier >= 0 ? `+${nwp.modifier}` : nwp.modifier}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {t("slots")}: {nwp.slots_required}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            disabled={loading}
                            onClick={() => addNonweaponProficiency(nwp.id)}
                            data-testid={`nwp-add-${nwp.id}`}
                          >
                            {tcom("add")}
                          </Button>
                        </div>
                        {nwpDesc && (
                          <p
                            className="mt-1 text-xs text-muted-foreground"
                            data-testid={`nwp-option-desc-${nwp.id}`}
                          >
                            {nwpDesc}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom NWP creation */}
            <div className="mt-4">
              {!showCustomNwpForm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowCustomNwpForm(true)}
                  data-testid="nwp-custom-create-button"
                >
                  {t("createCustomNWP")}
                </Button>
              ) : (
                <div className="rounded-md border border-border p-4" data-testid="nwp-custom-form">
                  <h4 className="mb-3 font-heading text-sm">{t("createCustomNWP")}</h4>
                  <div className="flex flex-col gap-3">
                    <Input
                      placeholder={t("nwpNamePlaceholder")}
                      value={customNwp.name}
                      onChange={(e) => setCustomNwp((prev) => ({ ...prev, name: e.target.value }))}
                      data-testid="nwp-custom-name"
                    />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          {t("ability")}
                        </label>
                        <select
                          value={customNwp.ability}
                          onChange={(e) =>
                            setCustomNwp((prev) => ({ ...prev, ability: e.target.value }))
                          }
                          className="w-full rounded-md border border-input bg-input p-2 text-sm"
                          data-testid="nwp-custom-ability"
                        >
                          {ABILITY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          {t("modifier")}
                        </label>
                        <Input
                          type="number"
                          value={customNwp.modifier}
                          onChange={(e) =>
                            setCustomNwp((prev) => ({
                              ...prev,
                              modifier: parseInt(e.target.value, 10) || 0,
                            }))
                          }
                          data-testid="nwp-custom-modifier"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          {t("group")}
                        </label>
                        <select
                          value={customNwp.group_type}
                          onChange={(e) =>
                            setCustomNwp((prev) => ({ ...prev, group_type: e.target.value }))
                          }
                          className="w-full rounded-md border border-input bg-input p-2 text-sm"
                          data-testid="nwp-custom-group"
                        >
                          <option value="general">{tg("general")}</option>
                          <option value="warrior">{tg("warrior")}</option>
                          <option value="priest">{tg("priest")}</option>
                          <option value="rogue">{tg("rogue")}</option>
                          <option value="wizard">{tg("wizard")}</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          {t("slots")}
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={customNwp.slots_required}
                          onChange={(e) =>
                            setCustomNwp((prev) => ({
                              ...prev,
                              slots_required: Math.max(1, parseInt(e.target.value, 10) || 1),
                            }))
                          }
                          data-testid="nwp-custom-slots"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={createCustomNwp}
                        disabled={loading || !customNwp.name.trim()}
                        data-testid="nwp-custom-submit"
                      >
                        {t("createAndAdd")}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowCustomNwpForm(false);
                          setCustomNwp(emptyCustomNwpForm);
                        }}
                        data-testid="nwp-custom-cancel"
                      >
                        {tcom("cancel")}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Languages */}
      <div data-testid="languages-section">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg">{t("languages")}</h3>
          <div className="flex items-center gap-1" data-testid="languages-counter">
            {!readOnly && (
              <button
                className="rounded px-1.5 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const v = languageSlotsAdj - 1;
                  setLanguageSlotsAdj(v);
                  updateSlotAdj("language_slots_adj", v);
                }}
                aria-label="Sprache entfernen"
              >
                −
              </button>
            )}
            <Badge
              variant="outline"
              className={
                allLanguageNames.length > defaultLanguages.length + maxLanguages + languageSlotsAdj
                  ? "border-red-500 text-red-400"
                  : ""
              }
            >
              {allLanguageNames.length}/{defaultLanguages.length + maxLanguages + languageSlotsAdj}{" "}
              {t("languages")}
            </Badge>
            {!readOnly && (
              <button
                className="rounded px-1.5 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const v = languageSlotsAdj + 1;
                  setLanguageSlotsAdj(v);
                  updateSlotAdj("language_slots_adj", v);
                }}
                aria-label="Sprache hinzufügen"
              >
                +
              </button>
            )}
          </div>
        </div>

        <p className="mb-3 text-sm text-muted-foreground" data-testid="languages-max-info">
          {t("maxLanguages")}: {maxLanguages}
        </p>

        {/* Language list */}
        {allLanguageNames.length > 0 && (
          <div className="mb-4 flex flex-col gap-2" data-testid="language-list">
            {/* Default race languages */}
            {defaultLanguages.map((lang) => (
              <div
                key={`default-${lang}`}
                className="flex items-center justify-between rounded-md border border-border p-2"
                data-testid={`language-${lang}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{lang}</span>
                  <Badge variant="secondary" data-testid={`language-race-badge-${lang}`}>
                    ({t("racialLanguage")})
                  </Badge>
                </div>
              </div>
            ))}

            {/* Character-added languages */}
            {languages.map((lang) => (
              <div
                key={lang.id}
                className="flex items-center justify-between rounded-md border border-border p-2"
                data-testid={`language-${lang.language_name}`}
              >
                <span className="text-sm font-medium">{lang.language_name}</span>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLanguage(lang.id)}
                    disabled={loading}
                    data-testid={`language-remove-${lang.language_name}`}
                  >
                    {tcom("remove")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add language */}
        {!readOnly && (
          <div data-testid="add-language">
            <div className="mb-3 flex items-center gap-2">
              <Input
                placeholder={t("addLanguage")}
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addLanguage(newLanguage);
                }}
                className="flex-1"
                data-testid="language-name-input"
              />
              <Button
                onClick={() => addLanguage(newLanguage)}
                disabled={loading || !newLanguage.trim()}
                data-testid="language-add-button"
              >
                {tcom("add")}
              </Button>
            </div>

            {/* Suggested languages */}
            {availableSuggestions.length > 0 && (
              <div data-testid="language-suggestions">
                <p className="mb-2 text-xs text-muted-foreground">{t("suggestedLanguages")}:</p>
                <div className="flex flex-wrap gap-2">
                  {availableSuggestions.map((entry) => (
                    <Button
                      key={entry.key}
                      variant="outline"
                      size="sm"
                      onClick={() => addLanguage(entry.label)}
                      disabled={loading}
                      data-testid={`language-suggest-${entry.key}`}
                    >
                      {entry.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {fsDeleteId && (
        <ConfirmDialog
          open={true}
          title={tcom("remove")}
          message={t("confirmRemoveStyle")}
          onConfirm={async () => {
            await removeFightingStyle(fsDeleteId);
            setFsDeleteId(null);
          }}
          onCancel={() => setFsDeleteId(null)}
        />
      )}
    </div>
  );
}
