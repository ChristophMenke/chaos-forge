"use client";

import { memo, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Snowflake, Swords } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  getAdjustedWeaponThac0,
  formatDamageWithBonus,
  getAttacksPerRound,
  getEffectiveWeaponSpeed,
} from "@/lib/rules/combat";
import { getClassGroup } from "@/lib/rules/classes";
import type { ClassId } from "@/lib/rules/types";
import { getNonproficiencyPenalty } from "@/lib/rules/proficiencies";
import { getEncumbranceLabel } from "@/lib/rules/equipment";
import type { EncumbranceLevel } from "@/lib/rules/equipment";
import type { ClassGroup, StrengthModifiers, DexterityModifiers } from "@/lib/rules/types";
import type {
  CharacterEquipmentWithDetails,
  CharacterWeaponProficiencyRow,
} from "@/lib/supabase/types";
import { localized } from "@/lib/utils/localize";
import { lbsToKg } from "@/lib/utils/units";
import { findWeaponProf } from "@/lib/utils/proficiency-match";
import type { EpicEffects } from "@/lib/rules/epic-items";
import { getKit, getKitArmorWarning } from "@/lib/rules/kits";
import { getMulticlassArmorWarnings } from "@/lib/rules/multiclass";

interface PlayCombatPanelProps {
  equipment: CharacterEquipmentWithDetails[];
  weaponProficiencies: CharacterWeaponProficiencyRow[];
  thac0: number;
  strMods: StrengthModifiers;
  dexMods: DexterityModifiers;
  classGroups: ClassGroup[];
  classEntries: { classId: string; level: number }[];
  equippedArmor: CharacterEquipmentWithDetails | null;
  equippedShield: boolean;
  dexDefenseAdj: number;
  ac: number;
  encumbrance: EncumbranceLevel;
  movementRate: number;
  backstabMultiplier: number | null;
  ignoreEncumbrance: boolean;
  isMagicalProtection: boolean;
  readOnly?: boolean;
  onEquipmentChange: (equipment: CharacterEquipmentWithDetails[]) => void;
  epicEffects?: EpicEffects;
  characterKit?: string | null;
  singleWeaponStyleBonus?: number;
  shieldProficiencyBonus?: number;
  equippedShieldName?: string | null;
}

function PlayCombatPanelInner({
  equipment,
  weaponProficiencies,
  thac0,
  strMods,
  dexMods,
  classGroups,
  classEntries,
  equippedArmor,
  equippedShield,
  dexDefenseAdj,
  ac,
  encumbrance,
  movementRate,
  backstabMultiplier,
  ignoreEncumbrance,
  isMagicalProtection,
  readOnly = false,
  onEquipmentChange,
  epicEffects,
  characterKit,
  singleWeaponStyleBonus = 0,
  shieldProficiencyBonus = 0,
  equippedShieldName,
}: PlayCombatPanelProps) {
  const t = useTranslations("playMode");
  const locale = useLocale();

  // Shapeshift & special attack client state
  const [activeShape, setActiveShape] = useState<string | null>(null);
  const [usedAbilities, setUsedAbilities] = useState<Set<string>>(new Set());

  const equippedWeapons = useMemo(
    () => equipment.filter((e) => e.equipped && e.weapon),
    [equipment]
  );

  const unequippedWeapons = useMemo(
    () => equipment.filter((e) => !e.equipped && e.weapon),
    [equipment]
  );

  // Proficiency matching is handled by findWeaponProf (bilingual DE/EN lookup)

  // AC Breakdown — always starts from Base AC 10, armor shown as modifier
  const acBreakdown = (() => {
    const parts: { label: string; value: number }[] = [];
    // Base AC 10 is always the starting point
    parts.push({ label: t("baseAC"), value: 10 });
    if (equippedArmor?.armor) {
      if (isMagicalProtection) {
        // Magical protection: value is a bonus (e.g. Bracers +4 → -4)
        parts.push({
          label: localized(equippedArmor.armor.name, equippedArmor.armor.name_en, locale),
          value: -equippedArmor.armor.ac,
        });
      } else {
        // Regular armor replaces base AC (e.g. Chain Mail AC 5 → modifier is 5-10 = -5)
        const armorMod = equippedArmor.armor.ac - 10;
        if (armorMod !== 0) {
          parts.push({
            label: localized(equippedArmor.armor.name, equippedArmor.armor.name_en, locale),
            value: armorMod,
          });
        }
      }
    }
    if (equippedShield) {
      parts.push({ label: t("shield"), value: -1 });
    }
    if (shieldProficiencyBonus > 0 && equippedShield) {
      parts.push({
        label: t("shieldProficiency", { shield: equippedShieldName ?? "" }),
        value: -shieldProficiencyBonus,
      });
    }
    if (dexDefenseAdj !== 0) {
      parts.push({ label: t("dexBonus"), value: dexDefenseAdj });
    }
    // Check for unarmored bonus (also applies with magical protection like Bracers)
    const isEffectivelyUnarmored = !equippedArmor?.armor || isMagicalProtection;
    if (isEffectivelyUnarmored) {
      const hasWarriorOrRogue = classGroups.some((g) => g === "warrior" || g === "rogue");
      const isUnencumbered = ignoreEncumbrance || encumbrance === "unencumbered";
      if (hasWarriorOrRogue && isUnencumbered) {
        parts.push({ label: t("unarmoredBonus"), value: -2 });
      }
    }
    // Single-Weapon Style AC bonus — only applies without a shield
    if (singleWeaponStyleBonus > 0 && !equippedShield) {
      parts.push({
        label: t("singleWeaponStyleBonus"),
        value: -singleWeaponStyleBonus,
      });
    }
    // Epic AC bonus (e.g. Totem Tattoo +2)
    if (epicEffects?.acBonus) {
      parts.push({
        label: t("epicAcBonus", { bonus: epicEffects.acBonus }),
        value: -epicEffects.acBonus,
      });
    }
    return parts;
  })();

  const [showAcBreakdown, setShowAcBreakdown] = useState(false);
  const [expandedBreakdown, setExpandedBreakdown] = useState<string | null>(null);

  // Attacks per round from first warrior class
  const warriorEntry = classEntries.find(
    (ce) => getClassGroup(ce.classId as ClassId) === "warrior"
  );

  function renderWeaponCard(eq: CharacterEquipmentWithDetails, isEquipped: boolean) {
    const weapon = eq.weapon!;
    const weaponName = eq.custom_label || localized(weapon.name, weapon.name_en, locale);
    const isEpicWeapon = !!eq.custom_label;
    const matchingProf = findWeaponProf(weaponProficiencies, weapon.name, weapon.name_en);
    const isProficient = !!matchingProf;
    const isSpecialized = matchingProf?.specialization ?? false;
    const firstGroup = classGroups[0] ?? "warrior";
    const profPenalty = isProficient ? 0 : getNonproficiencyPenalty(firstGroup);

    const specHitBonus = isSpecialized ? 1 : 0;
    const specDmgBonus = isSpecialized ? 2 : 0;

    const adjusted = getAdjustedWeaponThac0(
      thac0,
      strMods.hitAdj + specHitBonus,
      dexMods.missileAdj + specHitBonus,
      weapon.weapon_type,
      profPenalty,
      eq.hit_bonus
    );

    const damageSM = formatDamageWithBonus(
      weapon.damage_sm,
      strMods.dmgAdj + specDmgBonus,
      eq.damage_bonus
    );
    const damageL = formatDamageWithBonus(
      weapon.damage_l,
      strMods.dmgAdj + specDmgBonus,
      eq.damage_bonus
    );

    // Warriors: PHB APR table, Non-warriors with S&P spec: +1/2 APR (1 → 3/2)
    let apr: string;
    let baseApr: string;
    let hasSpecAprBonus = false;
    if (warriorEntry) {
      apr = getAttacksPerRound("warrior", warriorEntry.level, isSpecialized);
      baseApr = getAttacksPerRound("warrior", warriorEntry.level, false);
      hasSpecAprBonus = isSpecialized && apr !== baseApr;
    } else if (isSpecialized) {
      apr = "3/2";
      baseApr = "1";
      hasSpecAprBonus = true;
    } else {
      apr = "1";
      baseApr = "1";
    }

    return (
      <div
        key={eq.id}
        className={`rounded-lg border p-3 ${isEquipped ? "border-border bg-card/50" : "border-dashed border-border/50 bg-card/20"}`}
        data-testid={`play-weapon-${eq.id}`}
      >
        <div className="mb-1.5 flex items-center gap-2">
          <span className="font-medium">{weaponName}</span>
          <Badge variant="outline" className="text-[10px] md:text-xs">
            {weapon.weapon_type === "melee"
              ? t("melee")
              : weapon.weapon_type === "ranged"
                ? t("ranged")
                : `${t("melee")}/${t("ranged")}`}
          </Badge>
          {isSpecialized && (
            <Badge className="bg-primary/20 text-[10px] md:text-xs text-primary">★</Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          <div>
            <span className="text-xs text-muted-foreground">THAC0 {t("melee")}: </span>
            <span className="font-mono font-bold">{adjusted.melee}</span>
          </div>
          {adjusted.ranged !== null && (
            <div>
              <span className="text-xs text-muted-foreground">THAC0 {t("ranged")}: </span>
              <span className="font-mono font-bold">{adjusted.ranged}</span>
            </div>
          )}
          <div>
            <span className="text-xs text-muted-foreground">{t("damage")}: </span>
            <span className="font-mono">{damageSM}</span>
            <span className="text-muted-foreground"> / {damageL}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">{t("weaponSpeed")}: </span>
            <span className="font-mono">
              {getEffectiveWeaponSpeed(weapon.speed, eq.hit_bonus, eq.damage_bonus)}
            </span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">{t("attacksPerRound")}: </span>
            <span className="font-mono">{apr}</span>
            {hasSpecAprBonus && (
              <span className="ml-1 text-[10px] md:text-xs text-amber-400">★</span>
            )}
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {eq.hit_bonus > 0 && (
            <span
              className={`text-xs ${isEpicWeapon ? "text-purple-400" : "text-muted-foreground"}`}
              data-testid={`play-weapon-bonus-${eq.id}`}
            >
              {isEpicWeapon && <Swords className="mr-0.5 inline h-3 w-3" aria-hidden="true" />}+
              {eq.hit_bonus} {isEpicWeapon ? t("epicHitBonus") : t("magicBonus")}
            </span>
          )}
          {isEpicWeapon && epicEffects?.miscEffects.includes("cold_damage_1d6") && (
            <span className="text-xs text-purple-400" data-testid={`play-weapon-cold-dmg-${eq.id}`}>
              <Snowflake className="mr-0.5 inline h-3 w-3" aria-hidden="true" />
              {t("epicColdDamage")}
            </span>
          )}
          {isSpecialized && (
            <span
              className="text-xs text-amber-400"
              data-testid={`play-weapon-spec-bonus-${eq.id}`}
            >
              ★ {t("specBonus")}
            </span>
          )}
          <Button
            variant="default"
            size="sm"
            className="h-8 shrink-0 px-2.5 text-xs"
            onClick={() => setExpandedBreakdown((prev) => (prev === eq.id ? null : eq.id))}
            data-testid={`play-weapon-breakdown-toggle-${eq.id}`}
          >
            {expandedBreakdown === eq.id ? t("hideBreakdown") : t("showBreakdown")}
          </Button>
          {!readOnly && (
            <Button
              variant="default"
              size="sm"
              className="ml-auto h-6 shrink-0 px-2 text-[10px] md:text-xs"
              onClick={() => toggleEquip(eq.id, isEquipped)}
              data-testid={`play-${isEquipped ? "unequip" : "equip"}-${eq.id}`}
            >
              {isEquipped ? t("unequip") : t("equip")}
            </Button>
          )}
        </div>
        {expandedBreakdown === eq.id && (
          <div
            className="mt-2 space-y-2 border-t border-border/50 pt-2 text-xs"
            data-testid={`play-weapon-breakdown-${eq.id}`}
          >
            {/* THAC0 Melee Breakdown */}
            {weapon.weapon_type !== "ranged" && (
              <div>
                <div className="mb-1 font-medium text-muted-foreground">THAC0 {t("melee")}</div>
                <div className="space-y-0.5 pl-2 font-mono text-[11px] md:text-sm">
                  <div className="flex justify-between">
                    <span>{t("baseThac0")}</span>
                    <span>{thac0}</span>
                  </div>
                  {strMods.hitAdj !== 0 && (
                    <div className="flex justify-between">
                      <span>{t("strHitAdj")}</span>
                      <span>
                        {strMods.hitAdj > 0 ? `-${strMods.hitAdj}` : `+${-strMods.hitAdj}`}
                      </span>
                    </div>
                  )}
                  {specHitBonus > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span>★ {t("specHitBonus")}</span>
                      <span>-{specHitBonus}</span>
                    </div>
                  )}
                  {profPenalty !== 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>
                        {t("notProficient")} ({t("profPenalty")})
                      </span>
                      <span>+{-profPenalty}</span>
                    </div>
                  )}
                  {eq.hit_bonus !== 0 && (
                    <div
                      className={`flex justify-between ${isEpicWeapon ? "text-purple-400" : eq.hit_bonus > 0 ? "text-blue-400" : "text-red-400"}`}
                    >
                      <span>
                        {isEpicWeapon && (
                          <Swords className="mr-0.5 inline h-3 w-3" aria-hidden="true" />
                        )}
                        {isEpicWeapon ? t("epicHitBonus") : t("magicHitBonus")}
                      </span>
                      <span>{eq.hit_bonus > 0 ? `-${eq.hit_bonus}` : `+${-eq.hit_bonus}`}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border/30 pt-0.5 font-bold">
                    <span>= THAC0</span>
                    <span>{adjusted.melee}</span>
                  </div>
                </div>
              </div>
            )}

            {/* THAC0 Ranged Breakdown */}
            {adjusted.ranged !== null && (
              <div>
                <div className="mb-1 font-medium text-muted-foreground">THAC0 {t("ranged")}</div>
                <div className="space-y-0.5 pl-2 font-mono text-[11px] md:text-sm">
                  <div className="flex justify-between">
                    <span>{t("baseThac0")}</span>
                    <span>{thac0}</span>
                  </div>
                  {dexMods.missileAdj !== 0 && (
                    <div className="flex justify-between">
                      <span>{t("dexMissileAdj")}</span>
                      <span>
                        {dexMods.missileAdj > 0
                          ? `-${dexMods.missileAdj}`
                          : `+${-dexMods.missileAdj}`}
                      </span>
                    </div>
                  )}
                  {specHitBonus > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span>★ {t("specHitBonus")}</span>
                      <span>-{specHitBonus}</span>
                    </div>
                  )}
                  {profPenalty !== 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>
                        {t("notProficient")} ({t("profPenalty")})
                      </span>
                      <span>+{-profPenalty}</span>
                    </div>
                  )}
                  {eq.hit_bonus !== 0 && (
                    <div
                      className={`flex justify-between ${isEpicWeapon ? "text-purple-400" : eq.hit_bonus > 0 ? "text-blue-400" : "text-red-400"}`}
                    >
                      <span>
                        {isEpicWeapon && (
                          <Swords className="mr-0.5 inline h-3 w-3" aria-hidden="true" />
                        )}
                        {isEpicWeapon ? t("epicHitBonus") : t("magicHitBonus")}
                      </span>
                      <span>{eq.hit_bonus > 0 ? `-${eq.hit_bonus}` : `+${-eq.hit_bonus}`}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border/30 pt-0.5 font-bold">
                    <span>= THAC0</span>
                    <span>{adjusted.ranged}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Damage Breakdown */}
            <div>
              <div className="mb-1 font-medium text-muted-foreground">{t("damage")}</div>
              <div className="space-y-0.5 pl-2 font-mono text-[11px] md:text-sm">
                <div className="flex justify-between">
                  <span>{t("baseDamage")} (SM/L)</span>
                  <span>
                    {weapon.damage_sm} / {weapon.damage_l}
                  </span>
                </div>
                {strMods.dmgAdj !== 0 && (
                  <div className="flex justify-between">
                    <span>{t("strDmgAdj")}</span>
                    <span>{strMods.dmgAdj > 0 ? `+${strMods.dmgAdj}` : strMods.dmgAdj}</span>
                  </div>
                )}
                {specDmgBonus > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>★ {t("specDmgBonus")}</span>
                    <span>+{specDmgBonus}</span>
                  </div>
                )}
                {eq.damage_bonus !== 0 && (
                  <div
                    className={`flex justify-between ${isEpicWeapon ? "text-purple-400" : eq.damage_bonus > 0 ? "text-blue-400" : "text-red-400"}`}
                  >
                    <span>
                      {isEpicWeapon && (
                        <Swords className="mr-0.5 inline h-3 w-3" aria-hidden="true" />
                      )}
                      {isEpicWeapon ? t("epicDmgBonus") : t("magicDmgBonus")}
                    </span>
                    <span>{eq.damage_bonus > 0 ? `+${eq.damage_bonus}` : eq.damage_bonus}</span>
                  </div>
                )}
                {isEpicWeapon && epicEffects?.miscEffects.includes("cold_damage_1d6") && (
                  <div className="flex justify-between text-purple-400">
                    <span>
                      <Snowflake className="mr-0.5 inline h-3 w-3" aria-hidden="true" />
                      {t("epicColdDamage")}
                    </span>
                    <span>+1d6</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border/30 pt-0.5 font-bold">
                  <span>= {t("damage")}</span>
                  <span>
                    {damageSM} / {damageL}
                    {isEpicWeapon && epicEffects?.miscEffects.includes("cold_damage_1d6")
                      ? " +1d6"
                      : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* APR Breakdown */}
            <div>
              <div className="mb-1 font-medium text-muted-foreground">{t("attacksPerRound")}</div>
              <div className="space-y-0.5 pl-2 font-mono text-[11px] md:text-sm">
                <div className="flex justify-between">
                  <span>{t("levelApr")}</span>
                  <span>{baseApr}</span>
                </div>
                {hasSpecAprBonus && (
                  <div className="flex justify-between text-amber-400">
                    <span>★ {t("specAprBonus")}</span>
                    <span>+1/2</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border/30 pt-0.5 font-bold">
                  <span>= {t("attacksPerRound")}</span>
                  <span>{apr}</span>
                </div>
              </div>
            </div>

            {/* Speed */}
            <div>
              <div className="mb-1 font-medium text-muted-foreground">{t("weaponSpeed")}</div>
              <div className="space-y-0.5 pl-2 font-mono text-[11px] md:text-sm">
                <div className="flex justify-between">
                  <span>{t("baseDamage").replace(/\(.*/, "").trim() || "Base"}</span>
                  <span>{weapon.speed}</span>
                </div>
                {Math.max(0, Math.min(eq.hit_bonus, eq.damage_bonus || eq.hit_bonus)) > 0 && (
                  <div className="flex justify-between text-blue-400">
                    <span>{t("magicHitBonus")}</span>
                    <span>-{Math.min(eq.hit_bonus, eq.damage_bonus || eq.hit_bonus)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border/30 pt-0.5 font-bold">
                  <span>= {t("weaponSpeed")}</span>
                  <span>
                    {getEffectiveWeaponSpeed(weapon.speed, eq.hit_bonus, eq.damage_bonus)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  async function toggleEquip(equipmentId: string, currentlyEquipped: boolean) {
    if (readOnly) return;
    const supabase = createClient();
    await supabase
      .from("character_equipment")
      .update({ equipped: !currentlyEquipped })
      .eq("id", equipmentId);
    onEquipmentChange(
      equipment.map((e) => (e.id === equipmentId ? { ...e, equipped: !currentlyEquipped } : e))
    );
  }

  return (
    <GlassCard hover={false} data-testid="play-combat-panel">
      <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("combat")}
      </h3>

      {/* AC — clickable to toggle breakdown */}
      {showAcBreakdown && (
        <div
          className="mb-3 rounded-lg bg-black/10 p-2 dark:bg-white/5"
          data-testid="play-ac-breakdown"
        >
          <div className="mb-1 text-xs text-muted-foreground">{t("acBreakdown")}</div>
          <div className="flex flex-wrap items-center gap-1 text-sm">
            <span className="font-heading text-lg font-bold">AC {ac}</span>
            <span className="text-muted-foreground">=</span>
            {acBreakdown.map((part, i) => (
              <span key={i} className="flex items-center gap-0.5">
                {i > 0 && (
                  <span className="text-muted-foreground">{part.value < 0 ? "−" : "+"}</span>
                )}
                {i === 0 ? (
                  <span>
                    {part.label} ({part.value})
                  </span>
                ) : (
                  <span>
                    {part.label} ({Math.abs(part.value)})
                  </span>
                )}
              </span>
            ))}
          </div>
          {(() => {
            const armorWarning = getKitArmorWarning(
              characterKit ?? null,
              equippedArmor?.armor?.ac ?? null
            );
            if (!armorWarning) return null;
            return (
              <div className="mt-1 text-xs text-yellow-400" data-testid="play-kit-armor-warning">
                {t("kitArmorWarning", {
                  kitName: localized(armorWarning.kitName, armorWarning.kitNameEn, locale),
                  maxAC: armorWarning.maxAC,
                })}
              </div>
            );
          })()}
          {(() => {
            if (classEntries.length <= 1) return null;
            const classIds = classEntries.map((c) => c.classId as ClassId);
            const warnings = getMulticlassArmorWarnings(
              classIds,
              !!equippedArmor,
              equippedArmor?.armor?.ac ?? null,
              isMagicalProtection
            );
            if (warnings.length === 0) return null;
            return (
              <>
                {warnings.map((w) => (
                  <div
                    key={w.type}
                    role="alert"
                    className="mt-1 text-xs text-yellow-400"
                    data-testid={`play-multiclass-${w.type}-warning`}
                  >
                    {t(w.type === "wizard" ? "multiclassWizardArmor" : "multiclassThiefArmor")}
                  </div>
                ))}
              </>
            );
          })()}
        </div>
      )}

      {/* Movement + AC toggle + Backstab */}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <button
          onClick={() => setShowAcBreakdown(!showAcBreakdown)}
          className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs transition-colors hover:bg-accent"
          data-testid="play-ac-toggle"
        >
          AC <span className="font-mono font-bold">{ac}</span>
          <span className="text-[10px] md:text-xs text-muted-foreground">
            {showAcBreakdown ? "▲" : "▼"}
          </span>
        </button>
        <div>
          <span className="text-xs text-muted-foreground">{t("movementRate")}: </span>
          <span className="font-mono font-medium">{movementRate}</span>
        </div>
        {!ignoreEncumbrance && (
          <div>
            <span className="text-xs text-muted-foreground">{t("encumbrance")}: </span>
            <Badge variant="outline" className="text-xs">
              {getEncumbranceLabel(encumbrance)}
            </Badge>
          </div>
        )}
        {backstabMultiplier && (
          <Tooltip>
            <TooltipTrigger>
              <div className="cursor-help" data-testid="play-backstab">
                <span className="text-xs text-muted-foreground">{t("backstabMultiplier")}: </span>
                <span className="font-mono font-bold text-primary">x{backstabMultiplier}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{t("backstabTooltip")}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Shield toggle */}
      {(() => {
        const shields = equipment.filter((e) => e.armor && e.armor.is_shield);
        if (shields.length === 0) return null;
        return (
          <div className="mb-3 flex flex-wrap gap-2" data-testid="play-shields">
            {shields.map((s) => {
              const name = localized(s.armor!.name, s.armor!.name_en, locale);
              return readOnly ? (
                <Badge
                  key={s.id}
                  variant={s.equipped ? "default" : "outline"}
                  className="h-7 text-xs"
                  data-testid={`play-shield-toggle-${s.id}`}
                >
                  🛡 {name}
                </Badge>
              ) : (
                <Button
                  key={s.id}
                  variant={s.equipped ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => toggleEquip(s.id, s.equipped)}
                  data-testid={`play-shield-toggle-${s.id}`}
                >
                  🛡 {name}
                  {s.equipped ? ` — ${t("unequip")}` : ` — ${t("equip")}`}
                </Button>
              );
            })}
          </div>
        );
      })()}

      {/* Weapon cards */}
      {equippedWeapons.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noWeapons")}</p>
      ) : (
        <div className="space-y-2">{equippedWeapons.map((eq) => renderWeaponCard(eq, true))}</div>
      )}

      {/* Unequipped weapons — same card layout with Equip button */}
      {unequippedWeapons.length > 0 && (
        <div className="mt-3" data-testid="play-unequipped-weapons">
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">
            {t("availableWeapons")}
          </div>
          <div className="space-y-2">
            {unequippedWeapons.map((eq) => renderWeaponCard(eq, false))}
          </div>
        </div>
      )}

      {/* ── Shapeshift Forms ──────────────────────────── */}
      {epicEffects && epicEffects.shapeshiftForms.length > 0 && (
        <div className="mt-4 border-t border-border pt-3" data-testid="play-shapeshift">
          <p className="mb-2 text-sm font-medium text-muted-foreground">{t("shapeshift")}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeShape === null ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveShape(null)}
              data-testid="shapeshift-normal"
            >
              {t("normalForm")}
            </Button>
            {epicEffects.shapeshiftForms.map((form) => (
              <Button
                key={form.key}
                variant={activeShape === form.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveShape(activeShape === form.key ? null : form.key)}
                data-testid={`shapeshift-${form.key}`}
              >
                {localized(form.name, form.name_en, locale)}
                {form.usesPerDay > 0 && (
                  <span className="ml-1 text-xs opacity-70">
                    ({form.usesPerDay}×/{t("day")})
                  </span>
                )}
              </Button>
            ))}
          </div>
          {activeShape &&
            (() => {
              const form = epicEffects.shapeshiftForms.find((f) => f.key === activeShape);
              if (!form) return null;
              const shapeAC = form.baseAC + dexDefenseAdj;
              return (
                <div
                  className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-3"
                  data-testid="shapeshift-stats"
                >
                  <p className="mb-2 text-sm font-bold text-primary">
                    {localized(form.name, form.name_en, locale)}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">AC</span>
                      <div className="font-mono font-bold">{shapeAC}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Mov</span>
                      <div className="font-mono font-bold">{form.movement}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">THAC0</span>
                      <div className="font-mono font-bold">{thac0}</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">{t("attacks")}: </span>
                    <span className="text-sm font-medium">
                      {localized(form.attacks, form.attacks_en, locale)}
                    </span>
                  </div>
                  {form.hugRule && (
                    <p className="mt-1 text-xs text-amber-400">
                      ⚡ {localized(form.hugRule, form.hugRule_en, locale)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {localized(form.requiresCheck, form.requiresCheck_en, locale)}
                  </p>
                </div>
              );
            })()}
        </div>
      )}

      {/* ── Kit Abilities ──────────────────────────── */}
      {characterKit &&
        (() => {
          const kitDef = getKit(characterKit);
          if (!kitDef?.abilities?.length) return null;
          return (
            <div className="mt-4 border-t border-border pt-3" data-testid="play-kit-abilities">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                {t("kitAbilities")} — {localized(kitDef.name, kitDef.name_en, locale)}
              </p>
              <div className="flex flex-col gap-1">
                {kitDef.abilities.map((ability, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-medium">
                      {localized(ability.name, ability.name_en, locale)}
                    </span>
                    <span className="text-muted-foreground">
                      {" — "}
                      {localized(ability.description, ability.description_en, locale)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      {/* ── Special Attacks ──────────────────────────── */}
      {epicEffects && epicEffects.specialAttacks.length > 0 && (
        <div className="mt-4 border-t border-border pt-3" data-testid="play-special-attacks">
          <p className="mb-2 text-sm font-medium text-muted-foreground">{t("specialAttacks")}</p>
          <div className="flex flex-col gap-2">
            {epicEffects.specialAttacks.map((atk) => {
              const isUsed = usedAbilities.has(atk.key);
              return (
                <div
                  key={atk.key}
                  className={`flex items-start justify-between rounded-md border px-3 py-2 ${
                    isUsed
                      ? "border-muted bg-muted/30 opacity-50"
                      : "border-primary/30 bg-primary/5"
                  }`}
                  data-testid={`special-attack-${atk.key}`}
                >
                  <div>
                    <span className="text-sm font-bold">
                      {localized(atk.name, atk.name_en, locale)}
                    </span>
                    {atk.usesPerDay > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({atk.usesPerDay}×/{t("day")})
                      </span>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {localized(atk.effect, atk.effect_en, locale)}
                    </p>
                  </div>
                  <Button
                    variant={isUsed ? "outline" : "default"}
                    size="xs"
                    onClick={() => {
                      const next = new Set(usedAbilities);
                      if (isUsed) next.delete(atk.key);
                      else next.add(atk.key);
                      setUsedAbilities(next);
                    }}
                    data-testid={`special-attack-toggle-${atk.key}`}
                  >
                    {isUsed ? t("available") : t("used")}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

export const PlayCombatPanel = memo(PlayCombatPanelInner);
