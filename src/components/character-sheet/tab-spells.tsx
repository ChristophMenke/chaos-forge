"use client";

import { useState, useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getWizardSpellSlots,
  getSpecialistBonusSlots,
  getPriestSpellSlots,
  getPriestBonusSlots,
  getPriestSpellPoints,
  getPriestBonusSpellPoints,
  getPriestSpellCost,
  getWizardSpellPoints,
  getWizardSpecialistBonusPoints,
  getWizardBonusSpellPoints,
  getWizardSpellCost,
  canLearnSpell,
} from "@/lib/rules/spellslots";
import type { ClassId, MagicSchool, PriestSphere } from "@/lib/rules/types";
import { getBookAbbreviation } from "@/lib/utils/source-books";
import type { CharacterSpellWithDetails, SpellRow } from "@/lib/supabase/types";

const WIZARD_SCHOOLS = [
  "abjuration",
  "alteration",
  "conjuration",
  "divination",
  "enchantment",
  "illusion",
  "invocation",
  "necromancy",
] as const;

const PRIEST_SPHERES = [
  "all",
  "animal",
  "astral",
  "charm",
  "combat",
  "creation",
  "divination",
  "elemental",
  "guardian",
  "healing",
  "necromantic",
  "plant",
  "protection",
  "summoning",
  "sun",
  "weather",
] as const;

interface CustomSpellForm {
  name: string;
  level: number;
  schoolOrSphere: string;
  range: string;
  duration: string;
  area_of_effect: string;
  components: { V: boolean; S: boolean; M: boolean };
  description: string;
}

const emptyCustomSpellForm: CustomSpellForm = {
  name: "",
  level: 1,
  schoolOrSphere: "",
  range: "",
  duration: "",
  area_of_effect: "",
  components: { V: false, S: false, M: false },
  description: "",
};

interface TabSpellsProps {
  characterId: string;
  userId: string;
  classId: string;
  classGroup: string;
  level: number;
  intScore: number;
  wisScore: number;
  spells: CharacterSpellWithDetails[];
  allSpells: SpellRow[];
  spellSlotsAdj: Record<string, number>;
  spellSystem: "slots" | "points";
  readOnly?: boolean;
  onSpellsChange: (spells: CharacterSpellWithDetails[]) => void;
  onSpellSlotsAdjChange: (adj: Record<string, number>) => void;
  onSpellSystemChange: (system: string) => void;
  epicSpellFailure?: number;
  epicWildMagic?: number;
}

export function TabSpells({
  characterId,
  userId,
  classId,
  classGroup,
  level,
  intScore,
  wisScore,
  spells,
  allSpells,
  spellSlotsAdj: initialAdj,
  spellSystem: initialSpellSystem,
  readOnly = false,
  onSpellsChange,
  onSpellSlotsAdjChange,
  onSpellSystemChange,
  epicSpellFailure = 0,
  epicWildMagic = 0,
}: TabSpellsProps) {
  const t = useTranslations("spells");
  const te = useTranslations("epic");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotsAdj, setSlotsAdj] = useState<Record<string, number>>(initialAdj ?? {});

  // Lazy-loading for allSpells
  const [allSpellsLoaded, setAllSpellsLoaded] = useState<SpellRow[] | null>(
    allSpells.length > 0 ? allSpells : null
  );
  const [loadingSpells, setLoadingSpells] = useState(false);

  // Pagination for learn dialog
  const [displayCount, setDisplayCount] = useState(50);

  async function openLearnDialog() {
    setLearnDialogOpen(true);
    if (!allSpellsLoaded) {
      setLoadingSpells(true);
      const supabase = createClient();
      const { data } = await supabase.from("spells").select("*").order("level").order("name");
      setAllSpellsLoaded(data ?? []);
      setLoadingSpells(false);
    }
  }

  async function updateSlotAdj(spellLevel: number, delta: number) {
    const key = String(spellLevel);
    const newVal = (slotsAdj[key] ?? 0) + delta;
    const newAdj = { ...slotsAdj, [key]: newVal };
    setSlotsAdj(newAdj);
    const supabase = createClient();
    await supabase.from("characters").update({ spell_slots_adj: newAdj }).eq("id", characterId);
    onSpellSlotsAdjChange(newAdj);
  }

  const spellName = useCallback(
    (spell: SpellRow) => (locale === "en" && spell.name_en ? spell.name_en : spell.name),
    [locale]
  );
  const spellDesc = useCallback(
    (spell: SpellRow) =>
      locale === "en" && spell.description_en ? spell.description_en : spell.description,
    [locale]
  );
  const [learnDialogOpen, setLearnDialogOpen] = useState(false);
  const [expandedSpellId, setExpandedSpellId] = useState<string | null>(null);
  const [learnSearchQuery, setLearnSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [schoolSphereFilter, setSchoolSphereFilter] = useState<string | null>(null);
  const [bookFilter, setBookFilter] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customSpell, setCustomSpell] = useState<CustomSpellForm>(emptyCustomSpellForm);

  const [spellSystem, setSpellSystem] = useState(initialSpellSystem);
  const isWizard = classGroup === "wizard";
  const isPriest = classGroup === "priest";
  const maxSpellLevel = isWizard ? 9 : 7;
  const usePoints = spellSystem === "points";

  // Spell Points calculation
  const spellPointsTotal = useMemo(() => {
    if (!usePoints) return 0;
    if (isWizard) {
      const base = getWizardSpellPoints(level);
      const intBonus = getWizardBonusSpellPoints(intScore);
      return base + intBonus;
    }
    if (isPriest) {
      const base = getPriestSpellPoints(level);
      const wisBonus = getPriestBonusSpellPoints(wisScore);
      return base + wisBonus;
    }
    return 0;
  }, [usePoints, isWizard, isPriest, level, intScore, wisScore]);

  const specialistBonusPoints = useMemo(() => {
    if (!usePoints || !isWizard) return 0;
    return getWizardSpecialistBonusPoints(level);
  }, [usePoints, isWizard, level]);

  const spellPointsUsed = useMemo(() => {
    if (!usePoints) return 0;
    return spells
      .filter((cs) => cs.prepared)
      .reduce((sum, cs) => {
        if (isWizard) return sum + getWizardSpellCost(cs.spell.level);
        if (isPriest) return sum + getPriestSpellCost(cs.spell.level);
        return sum;
      }, 0);
  }, [usePoints, spells, isWizard, isPriest]);

  async function toggleSpellSystem() {
    const newSystem = spellSystem === "slots" ? "points" : "slots";
    setSpellSystem(newSystem);
    const supabase = createClient();
    await supabase.from("characters").update({ spell_system: newSystem }).eq("id", characterId);
    onSpellSystemChange(newSystem);
  }

  // Calculate spell slots
  const baseSlots = useMemo(() => {
    if (isWizard) return getWizardSpellSlots(level);
    if (isPriest) return getPriestSpellSlots(level);
    return [];
  }, [isWizard, isPriest, level]);

  const bonusSlots = useMemo(() => {
    if (isPriest) return getPriestBonusSlots(wisScore);
    return new Array(maxSpellLevel).fill(0);
  }, [isPriest, wisScore, maxSpellLevel]);

  const specialistBonus = useMemo(() => {
    if (isWizard) return getSpecialistBonusSlots(classId as ClassId, level);
    return new Array(maxSpellLevel).fill(0);
  }, [isWizard, classId, level, maxSpellLevel]);

  const totalSlots = useMemo(
    () =>
      baseSlots.map(
        (base, i) =>
          base + (bonusSlots[i] ?? 0) + (specialistBonus[i] ?? 0) + (slotsAdj[String(i + 1)] ?? 0)
      ),
    [baseSlots, bonusSlots, specialistBonus, slotsAdj]
  );

  // Group spells by level
  const spellsByLevel = useMemo(() => {
    const grouped: Record<number, CharacterSpellWithDetails[]> = {};
    for (let l = 1; l <= maxSpellLevel; l++) {
      grouped[l] = [];
    }
    for (const s of spells) {
      const lvl = s.spell.level;
      if (grouped[lvl]) {
        grouped[lvl].push(s);
      }
    }
    return grouped;
  }, [spells, maxSpellLevel]);

  // Count prepared spells per level
  const preparedCountByLevel = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let l = 1; l <= maxSpellLevel; l++) {
      counts[l] = (spellsByLevel[l] ?? []).filter((s) => s.prepared).length;
    }
    return counts;
  }, [spellsByLevel, maxSpellLevel]);

  // Learnable spells — show all, never block (house rule: only warn)
  const learnableSpells = useMemo(() => {
    const all = allSpellsLoaded ?? [];
    const knownIds = new Set(spells.map((s) => s.spell_id));
    return all.filter((spell) => {
      if (knownIds.has(spell.id)) return false;
      if (isWizard && spell.spell_type !== "wizard") return false;
      if (isPriest && spell.spell_type !== "priest") return false;
      return true;
    });
  }, [allSpellsLoaded, spells, isWizard, isPriest]);

  // Check which spells have restrictions (for warning display) — both known and learnable
  const spellWarnings = useMemo(() => {
    const warnings = new Map<string, string>();
    const allToCheck = [...learnableSpells, ...spells.map((cs) => cs.spell)];
    for (const spell of allToCheck) {
      const result = canLearnSpell(
        classId as ClassId,
        (spell.school as MagicSchool) ?? undefined,
        (spell.sphere as PriestSphere) ?? undefined,
        spell.level,
        intScore
      );
      if (!result.allowed && result.reason) {
        warnings.set(spell.id, result.reason);
      }
    }
    return warnings;
  }, [learnableSpells, spells, classId, intScore]);

  // Available source books for filter
  const availableBooks = useMemo(() => {
    const books = new Set(learnableSpells.map((s) => s.source_book).filter(Boolean));
    return Array.from(books).sort();
  }, [learnableSpells]);

  // Filtered learnable spells by search, level, school/sphere, and source book
  const filteredLearnableSpells = useMemo(() => {
    return learnableSpells.filter((s) => {
      // Level filter
      if (levelFilter !== null && s.level !== levelFilter) return false;
      // School/sphere filter
      if (schoolSphereFilter !== null) {
        const value = isWizard ? s.school : s.sphere;
        if (value !== schoolSphereFilter) return false;
      }
      // Source book filter
      if (bookFilter !== null && s.source_book !== bookFilter) return false;
      // Text search
      if (learnSearchQuery.trim()) {
        const q = learnSearchQuery.toLowerCase();
        if (
          !s.name.toLowerCase().includes(q) &&
          !(s.name_en && s.name_en.toLowerCase().includes(q)) &&
          !(s.school && s.school.toLowerCase().includes(q)) &&
          !(s.sphere && s.sphere.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
  }, [learnableSpells, learnSearchQuery, levelFilter, schoolSphereFilter, bookFilter, isWizard]);

  // Reset pagination when filters change — use a filter key to track changes
  const filterKey = `${learnSearchQuery}|${levelFilter}|${schoolSphereFilter}|${bookFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setDisplayCount(50);
  }

  async function handleCreateCustomSpell() {
    if (!customSpell.name.trim()) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const components: string[] = [];
    if (customSpell.components.V) components.push("V");
    if (customSpell.components.S) components.push("S");
    if (customSpell.components.M) components.push("M");

    const { data: newSpell, error } = await supabase
      .from("spells")
      .insert({
        name: customSpell.name,
        level: customSpell.level,
        spell_type: isWizard ? "wizard" : "priest",
        school: isWizard ? customSpell.schoolOrSphere : null,
        sphere: isPriest ? customSpell.schoolOrSphere : null,
        range: customSpell.range,
        duration: customSpell.duration,
        area_of_effect: customSpell.area_of_effect,
        components,
        description: customSpell.description,
        is_custom: true,
        created_by: userId,
      })
      .select("id")
      .single();

    if (!error && newSpell) {
      const { data: charSpell } = await supabase
        .from("character_spells")
        .insert({
          character_id: characterId,
          spell_id: newSpell.id,
          prepared: false,
        })
        .select("*, spell:spells(*)")
        .single();
      if (charSpell) {
        onSpellsChange([...spells, charSpell as CharacterSpellWithDetails]);
      }
    }

    setLoading(false);
    setShowCustomForm(false);
    setCustomSpell(emptyCustomSpellForm);
    setLearnDialogOpen(false);
    setLearnSearchQuery("");
    setLevelFilter(null);
    setSchoolSphereFilter(null);
    setBookFilter(null);
  }

  async function handleTogglePrepared(spellId: string, currentlyPrepared: boolean) {
    const spell = spells.find((s) => s.spell_id === spellId);
    if (!spell) return;

    // If trying to prepare, check slot availability
    if (!currentlyPrepared) {
      const spellLevel = spell.spell.level;
      const available = totalSlots[spellLevel - 1] ?? 0;
      const used = preparedCountByLevel[spellLevel] ?? 0;
      if (used >= available) return;
    }

    // Optimistic update
    onSpellsChange(
      spells.map((s) => (s.spell_id === spellId ? { ...s, prepared: !s.prepared } : s))
    );

    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("character_spells")
      .update({ prepared: !currentlyPrepared })
      .eq("character_id", characterId)
      .eq("spell_id", spellId);
    setLoading(false);
  }

  async function handleLearnSpell(spellId: string) {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: charSpell, error: insertError } = await supabase
      .from("character_spells")
      .insert({
        character_id: characterId,
        spell_id: spellId,
        prepared: false,
      })
      .select("*, spell:spells(*)")
      .single();
    if (insertError || !charSpell) {
      console.error("Failed to learn spell:", insertError);
      setError(t("learnSpellError"));
      setLoading(false);
      return;
    }
    onSpellsChange([...spells, charSpell as CharacterSpellWithDetails]);
    setLoading(false);
  }

  async function handleRemoveSpell(spellId: string) {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("character_spells")
      .delete()
      .eq("character_id", characterId)
      .eq("spell_id", spellId);
    onSpellsChange(spells.filter((s) => s.spell_id !== spellId));
    setLoading(false);
  }

  if (!isWizard && !isPriest) {
    return (
      <div className="py-8 text-center text-muted-foreground" data-testid="spells-no-magic">
        {t("notACaster")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" data-testid="tab-spells">
      {/* Epic Spell Failure Warnings */}
      {epicWildMagic > 0 && (
        <div
          className="rounded-lg border border-purple-500/50 bg-purple-500/10 p-3 text-sm text-purple-400"
          data-testid="wild-magic-warning"
        >
          {te("wildMagic", { percent: epicWildMagic })}
        </div>
      )}
      {epicSpellFailure > 0 && (
        <div
          className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-400"
          data-testid="spell-failure-warning"
        >
          {te("spellFailure", { percent: epicSpellFailure })}
        </div>
      )}

      {/* Spell System Toggle */}
      {!readOnly && (
        <div className="flex items-center gap-3" data-testid="spell-system-toggle">
          <span className="text-sm text-muted-foreground">{t("spellSystemLabel")}</span>
          <div className="flex rounded-md border border-border">
            <button
              className={`px-3 py-1 text-sm ${!usePoints ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              onClick={() => spellSystem !== "slots" && toggleSpellSystem()}
              data-testid="spell-system-slots"
            >
              {t("spellSlots")}
            </button>
            <button
              className={`px-3 py-1 text-sm ${usePoints ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              onClick={() => spellSystem !== "points" && toggleSpellSystem()}
              data-testid="spell-system-points"
            >
              {t("spellPoints")}
            </button>
          </div>
        </div>
      )}

      {/* Spell Points Display */}
      {usePoints ? (
        <div>
          <h3 className="mb-3 font-heading text-lg">{t("spellPoints")}</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3" data-testid="spell-points-grid">
            <div className="rounded-md border border-primary p-4 text-center">
              <div className="text-xs text-muted-foreground">{t("totalPoints")}</div>
              <div className="font-heading text-3xl text-primary" data-testid="spell-points-total">
                {spellPointsTotal}
              </div>
              <div className="text-xs text-muted-foreground">
                {isWizard
                  ? `${getWizardSpellPoints(level)} + ${getWizardBonusSpellPoints(intScore)} INT`
                  : `${getPriestSpellPoints(level)} + ${getPriestBonusSpellPoints(wisScore)} WIS`}
              </div>
            </div>
            <div className="rounded-md border border-border p-4 text-center">
              <div className="text-xs text-muted-foreground">{t("pointsUsed")}</div>
              <div
                className={`font-heading text-3xl ${spellPointsUsed > spellPointsTotal ? "text-destructive" : "text-foreground"}`}
                data-testid="spell-points-used"
              >
                {spellPointsUsed}
              </div>
              <div className="text-xs text-muted-foreground">
                {spellPointsTotal - spellPointsUsed} {t("pointsRemaining")}
              </div>
            </div>
            {isWizard && specialistBonusPoints > 0 && (
              <div className="rounded-md border border-amber-500/30 p-4 text-center">
                <div className="text-xs text-muted-foreground">{t("specialistBonus")}</div>
                <div className="font-heading text-3xl text-amber-400">{specialistBonusPoints}</div>
                <div className="text-xs text-muted-foreground">{t("schoolSpellsOnly")}</div>
              </div>
            )}
          </div>
          <div className="mt-2 rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">{t("spellCosts")}</div>
            <div className="mt-1 flex flex-wrap gap-1 text-xs">
              {Array.from({ length: maxSpellLevel }, (_, i) => i + 1).map((sl) => (
                <span key={sl} className="rounded bg-muted px-1.5 py-0.5 font-mono">
                  L{sl}={isWizard ? getWizardSpellCost(sl) : getPriestSpellCost(sl)}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="mb-3 font-heading text-lg">{t("spellSlots")}</h3>
          <div
            className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7"
            data-testid="spell-slots-grid"
          >
            {Array.from({ length: maxSpellLevel }, (_, i) => i + 1).map((spellLevel) => {
              const available = totalSlots[spellLevel - 1] ?? 0;
              const prepared = preparedCountByLevel[spellLevel] ?? 0;
              if (available === 0 && (spellsByLevel[spellLevel] ?? []).length === 0) return null;
              return (
                <div
                  key={spellLevel}
                  className="rounded-md border border-border p-3 text-center"
                  data-testid={`spell-slot-level-${spellLevel}`}
                >
                  <div className="text-xs text-muted-foreground">
                    {t("level")} {spellLevel}
                  </div>
                  <div className="font-mono text-xl">
                    <span
                      className={prepared >= available ? "text-destructive" : "text-primary"}
                      data-testid={`spell-slot-prepared-${spellLevel}`}
                    >
                      {prepared}
                    </span>
                    <span className="text-muted-foreground"> / </span>
                    <span data-testid={`spell-slot-available-${spellLevel}`}>{available}</span>
                  </div>
                  {!readOnly && (
                    <div className="mt-1 flex justify-center gap-1">
                      <button
                        className="rounded px-1.5 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => updateSlotAdj(spellLevel, -1)}
                      >
                        −
                      </button>
                      <button
                        className="rounded px-1.5 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => updateSlotAdj(spellLevel, 1)}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Learn Spell Button */}
      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={openLearnDialog} disabled={loading} data-testid="learn-spell-button">
            {t("learnSpellTitle")}
          </Button>
        </div>
      )}

      {/* Spells grouped by level */}
      {Array.from({ length: maxSpellLevel }, (_, i) => i + 1).map((spellLevel) => {
        const levelSpells = spellsByLevel[spellLevel] ?? [];
        if (levelSpells.length === 0) return null;
        const available = totalSlots[spellLevel - 1] ?? 0;
        const prepared = preparedCountByLevel[spellLevel] ?? 0;

        return (
          <div key={spellLevel} data-testid={`spell-group-level-${spellLevel}`}>
            <h3 className="mb-2 font-heading text-lg">
              {t("spellLevelGroup", { level: spellLevel })}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {t("preparedCount", { prepared, available })}
              </span>
            </h3>
            <div className="flex flex-col gap-2">
              {levelSpells.map((charSpell) => {
                const spell = charSpell.spell;
                const isExpanded = expandedSpellId === spell.id;
                const canPrepare = !charSpell.prepared && prepared < available;

                return (
                  <Card key={spell.id} size="sm" data-testid={`spell-card-${spell.id}`}>
                    <CardHeader className="flex-row items-center justify-between border-b pb-2">
                      <div
                        className="flex cursor-pointer items-center gap-2"
                        onClick={() => setExpandedSpellId(isExpanded ? null : spell.id)}
                        data-testid={`spell-toggle-details-${spell.id}`}
                      >
                        <CardTitle className="text-sm">{spellName(spell)}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {spell.school ?? spell.sphere}
                        </Badge>
                        {spellWarnings.has(spell.id) && (
                          <span
                            className="text-xs text-orange-400"
                            title={spellWarnings.get(spell.id)}
                            data-testid={`spell-warning-${spell.id}`}
                          >
                            ⚠
                          </span>
                        )}
                        {spell.source_book && (
                          <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">
                            {getBookAbbreviation(spell.source_book)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!readOnly && (
                          <>
                            <Button
                              variant={charSpell.prepared ? "default" : "outline"}
                              size="sm"
                              disabled={loading || (!charSpell.prepared && !canPrepare)}
                              onClick={() => handleTogglePrepared(spell.id, charSpell.prepared)}
                              data-testid={`spell-prepare-toggle-${spell.id}`}
                            >
                              {charSpell.prepared ? t("unprepareSpell") : t("prepareSpell")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={loading}
                              onClick={() => handleRemoveSpell(spell.id)}
                              className="text-destructive hover:text-destructive"
                              data-testid={`spell-remove-${spell.id}`}
                            >
                              {t("removeSpell")}
                            </Button>
                          </>
                        )}
                        {readOnly && charSpell.prepared && (
                          <Badge variant="default">{t("prepareSpell")}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent data-testid={`spell-details-${spell.id}`}>
                        <div className="mb-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>
                            {t("range")}: {spell.range}
                          </span>
                          <span>
                            {t("duration")}: {spell.duration}
                          </span>
                          <span>
                            {t("areaOfEffect")}: {spell.area_of_effect}
                          </span>
                          {spell.casting_time && (
                            <span>
                              {t("castingTime")}: {spell.casting_time}
                            </span>
                          )}
                          {spell.saving_throw && spell.saving_throw !== "None" && (
                            <span>
                              {t("savingThrow")}: {spell.saving_throw}
                            </span>
                          )}
                          {spell.components.length > 0 && (
                            <span>
                              {t("components")}: {spell.components.join(", ")}
                            </span>
                          )}
                        </div>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{spellDesc(spell)}</ReactMarkdown>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {spells.length === 0 && (
        <div className="py-8 text-center text-muted-foreground" data-testid="spells-empty">
          {t("noSpells")}
        </div>
      )}

      {/* Learn Spell Dialog (modal overlay) */}
      {learnDialogOpen && !readOnly && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          data-testid="learn-spell-dialog"
        >
          <div className="mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-card ring-1 ring-foreground/10">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="font-heading text-lg">{t("learnSpellTitle")}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLearnDialogOpen(false);
                  setLearnSearchQuery("");
                  setLevelFilter(null);
                  setSchoolSphereFilter(null);
                  setBookFilter(null);
                  setShowCustomForm(false);
                  setCustomSpell(emptyCustomSpellForm);
                }}
                data-testid="learn-spell-dialog-close"
              >
                {t("close")}
              </Button>
            </div>
            <div className="border-b p-4">
              <input
                type="text"
                placeholder={t("searchSpells")}
                value={learnSearchQuery}
                onChange={(e) => setLearnSearchQuery(e.target.value)}
                className="w-full rounded-md border border-input bg-input p-2 text-sm"
                data-testid="learn-spell-search"
              />

              {/* Level filter buttons */}
              <div className="mt-3 flex flex-wrap gap-1" data-testid="spell-level-filters">
                <Button
                  variant={levelFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLevelFilter(null)}
                  data-testid="spell-level-filter-all"
                  className="h-7 px-2 text-xs"
                >
                  {t("all")}
                </Button>
                {Array.from({ length: maxSpellLevel }, (_, i) => i + 1).map((n) => (
                  <Button
                    key={n}
                    variant={levelFilter === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLevelFilter(levelFilter === n ? null : n)}
                    data-testid={`spell-level-filter-${n}`}
                    className="h-7 w-7 px-0 text-xs"
                  >
                    {n}
                  </Button>
                ))}
              </div>

              {/* School / Sphere filter badges */}
              <div className="mt-2 flex flex-wrap gap-1" data-testid="spell-school-filters">
                <Badge
                  variant={schoolSphereFilter === null ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => setSchoolSphereFilter(null)}
                  data-testid="spell-school-filter-all"
                >
                  {t("all")}
                </Badge>
                {(isWizard ? WIZARD_SCHOOLS : PRIEST_SPHERES).map((s) => (
                  <Badge
                    key={s}
                    variant={schoolSphereFilter === s ? "default" : "outline"}
                    className="cursor-pointer text-xs capitalize"
                    onClick={() => setSchoolSphereFilter(schoolSphereFilter === s ? null : s)}
                    data-testid={`spell-school-filter-${s}`}
                  >
                    {s}
                  </Badge>
                ))}
              </div>

              {/* Source Book filter */}
              {availableBooks.length > 1 && (
                <div className="mt-2">
                  <select
                    value={bookFilter ?? ""}
                    onChange={(e) => setBookFilter(e.target.value || null)}
                    className="w-full rounded-md border border-input bg-input px-2 py-1 text-sm"
                    aria-label={t("allBooks")}
                    data-testid="spell-book-filter"
                  >
                    <option value="">{t("allBooks")}</option>
                    {availableBooks.map((book) => (
                      <option key={book} value={book}>
                        {getBookAbbreviation(book)} — {book}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {error && (
                <div
                  className="mb-3 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
                  data-testid="learn-spell-error"
                >
                  {error}
                </div>
              )}
              {loadingSpells ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : filteredLearnableSpells.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  {t("noLearnableSpells")}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-muted-foreground">
                    {filteredLearnableSpells.length} {t("spellsFound")}
                  </div>
                  {filteredLearnableSpells.slice(0, displayCount).map((spell) => (
                    <div
                      key={spell.id}
                      className="flex items-start justify-between rounded-md border border-border p-3"
                      data-testid={`learnable-spell-${spell.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{spellName(spell)}</span>
                          <Badge variant="outline" className="text-xs">
                            {t("level")} {spell.level}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {spell.school ?? spell.sphere}
                          </Badge>
                          {spellWarnings.has(spell.id) && (
                            <span
                              className="text-xs text-orange-400"
                              title={spellWarnings.get(spell.id)}
                              data-testid={`learnable-spell-warning-${spell.id}`}
                            >
                              ⚠ {spellWarnings.get(spell.id)}
                            </span>
                          )}
                          {spell.source_book && (
                            <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">
                              {getBookAbbreviation(spell.source_book)}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          <ReactMarkdown>{spellDesc(spell)}</ReactMarkdown>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={loading}
                        onClick={() => handleLearnSpell(spell.id)}
                        className="ml-2 shrink-0"
                        data-testid={`learn-spell-${spell.id}`}
                      >
                        {t("learn")}
                      </Button>
                    </div>
                  ))}
                  {displayCount < filteredLearnableSpells.length && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setDisplayCount((c) => c + 50)}
                      data-testid="learn-spell-show-more"
                    >
                      {t("showMore")} ({filteredLearnableSpells.length - displayCount})
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Custom spell creation */}
            <div className="border-t p-4">
              {!showCustomForm ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCustomForm(true)}
                  data-testid="create-custom-spell-button"
                >
                  {t("createCustomSpell")}
                </Button>
              ) : (
                <div className="flex flex-col gap-3" data-testid="custom-spell-form">
                  <h3 className="font-heading text-sm">{t("createCustomSpell")}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs text-muted-foreground">
                        {t("name")}
                      </label>
                      <input
                        type="text"
                        value={customSpell.name}
                        onChange={(e) => setCustomSpell({ ...customSpell, name: e.target.value })}
                        className="w-full rounded-md border border-input bg-input p-2 text-sm"
                        data-testid="custom-spell-name"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        {t("level")}
                      </label>
                      <select
                        value={customSpell.level}
                        onChange={(e) =>
                          setCustomSpell({ ...customSpell, level: Number(e.target.value) })
                        }
                        className="w-full rounded-md border border-input bg-input p-2 text-sm"
                        data-testid="custom-spell-level"
                      >
                        {Array.from({ length: maxSpellLevel }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        {isWizard ? t("school") : t("sphere")}
                      </label>
                      <select
                        value={customSpell.schoolOrSphere}
                        onChange={(e) =>
                          setCustomSpell({ ...customSpell, schoolOrSphere: e.target.value })
                        }
                        className="w-full rounded-md border border-input bg-input p-2 text-sm capitalize"
                        data-testid="custom-spell-school-sphere"
                      >
                        <option value="">{t("choose")}</option>
                        {(isWizard ? WIZARD_SCHOOLS : PRIEST_SPHERES).map((s) => (
                          <option key={s} value={s} className="capitalize">
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        {t("range")}
                      </label>
                      <input
                        type="text"
                        value={customSpell.range}
                        onChange={(e) => setCustomSpell({ ...customSpell, range: e.target.value })}
                        className="w-full rounded-md border border-input bg-input p-2 text-sm"
                        data-testid="custom-spell-range"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        {t("duration")}
                      </label>
                      <input
                        type="text"
                        value={customSpell.duration}
                        onChange={(e) =>
                          setCustomSpell({ ...customSpell, duration: e.target.value })
                        }
                        className="w-full rounded-md border border-input bg-input p-2 text-sm"
                        data-testid="custom-spell-duration"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs text-muted-foreground">
                        {t("areaOfEffect")}
                      </label>
                      <input
                        type="text"
                        value={customSpell.area_of_effect}
                        onChange={(e) =>
                          setCustomSpell({ ...customSpell, area_of_effect: e.target.value })
                        }
                        className="w-full rounded-md border border-input bg-input p-2 text-sm"
                        data-testid="custom-spell-area"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs text-muted-foreground">
                        {t("components")}
                      </label>
                      <div className="flex gap-4">
                        {(["V", "S", "M"] as const).map((comp) => (
                          <label key={comp} className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={customSpell.components[comp]}
                              onChange={(e) =>
                                setCustomSpell({
                                  ...customSpell,
                                  components: {
                                    ...customSpell.components,
                                    [comp]: e.target.checked,
                                  },
                                })
                              }
                              data-testid={`custom-spell-component-${comp}`}
                            />
                            {comp}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs text-muted-foreground">
                        {t("description")}
                      </label>
                      <textarea
                        value={customSpell.description}
                        onChange={(e) =>
                          setCustomSpell({ ...customSpell, description: e.target.value })
                        }
                        rows={3}
                        className="w-full rounded-md border border-input bg-input p-2 text-sm"
                        data-testid="custom-spell-description"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCustomForm(false);
                        setCustomSpell(emptyCustomSpellForm);
                      }}
                      data-testid="custom-spell-cancel"
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      size="sm"
                      disabled={loading || !customSpell.name.trim()}
                      onClick={handleCreateCustomSpell}
                      data-testid="custom-spell-submit"
                    >
                      {t("createAndLearn")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
