"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  getAdjustedWeaponThac0,
  formatDamageWithBonus,
  getAttacksPerRound,
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
import type { EpicEffects } from "@/lib/rules/epic-items";
import { getKit, getKitArmorWarning } from "@/lib/rules/kits";

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
  onEquipmentChange: (equipment: CharacterEquipmentWithDetails[]) => void;
  epicEffects?: EpicEffects;
  characterKit?: string | null;
}

export function PlayCombatPanel({
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
  onEquipmentChange,
  epicEffects,
  characterKit,
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

  const profMap = useMemo(() => {
    const map = new Map<string, { proficient: boolean; specialized: boolean }>();
    for (const wp of weaponProficiencies) {
      map.set(wp.weapon_name.toLowerCase(), {
        proficient: true,
        specialized: wp.specialization,
      });
    }
    return map;
  }, [weaponProficiencies]);

  // AC Breakdown — always starts from Base AC 10, armor shown as modifier
  const acBreakdown = useMemo(() => {
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
    // Epic AC bonus (e.g. Totem Tattoo +2)
    if (epicEffects?.acBonus) {
      parts.push({
        label: t("epicAcBonus", { bonus: epicEffects.acBonus }),
        value: -epicEffects.acBonus,
      });
    }
    return parts;
  }, [
    equippedArmor,
    equippedShield,
    dexDefenseAdj,
    classGroups,
    encumbrance,
    ignoreEncumbrance,
    isMagicalProtection,
    epicEffects?.acBonus,
    t,
    locale,
  ]);

  const [showAcBreakdown, setShowAcBreakdown] = useState(false);

  // Attacks per round from first warrior class
  const warriorEntry = classEntries.find(
    (ce) => getClassGroup(ce.classId as ClassId) === "warrior"
  );

  function renderWeaponCard(eq: CharacterEquipmentWithDetails, isEquipped: boolean) {
    const weapon = eq.weapon!;
    const weaponName = localized(weapon.name, weapon.name_en, locale);
    const prof = profMap.get(weapon.name.toLowerCase());
    const isProficient = prof?.proficient ?? false;
    const isSpecialized = prof?.specialized ?? false;
    const firstGroup = classGroups[0] ?? "warrior";
    const profPenalty = isProficient ? 0 : getNonproficiencyPenalty(firstGroup);

    const adjusted = getAdjustedWeaponThac0(
      thac0,
      strMods.hitAdj,
      dexMods.missileAdj,
      weapon.weapon_type,
      profPenalty,
      eq.hit_bonus
    );

    const damageSM = formatDamageWithBonus(weapon.damage_sm, strMods.dmgAdj, eq.damage_bonus);
    const damageL = formatDamageWithBonus(weapon.damage_l, strMods.dmgAdj, eq.damage_bonus);

    const apr = warriorEntry
      ? getAttacksPerRound("warrior", warriorEntry.level, isSpecialized)
      : "1";

    return (
      <div
        key={eq.id}
        className={`rounded-lg border p-3 ${isEquipped ? "border-border bg-card/50" : "border-dashed border-border/50 bg-card/20"}`}
        data-testid={`play-weapon-${eq.id}`}
      >
        <div className="mb-1.5 flex items-center gap-2">
          <span className="font-medium">{weaponName}</span>
          <Badge variant="outline" className="text-[10px]">
            {weapon.weapon_type === "melee"
              ? t("melee")
              : weapon.weapon_type === "ranged"
                ? t("ranged")
                : `${t("melee")}/${t("ranged")}`}
          </Badge>
          {isSpecialized && <Badge className="bg-primary/20 text-[10px] text-primary">★</Badge>}
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
            <span className="font-mono">{weapon.speed}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">{t("attacksPerRound")}: </span>
            <span className="font-mono">{apr}</span>
          </div>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          {eq.hit_bonus > 0 && (
            <span className="text-xs text-muted-foreground">
              +{eq.hit_bonus} {t("magicBonus")}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 text-xs text-muted-foreground"
            onClick={() => toggleEquip(eq.id, isEquipped)}
            data-testid={`play-${isEquipped ? "unequip" : "equip"}-${eq.id}`}
          >
            {isEquipped ? t("unequip") : t("equip")}
          </Button>
        </div>
      </div>
    );
  }

  async function toggleEquip(equipmentId: string, currentlyEquipped: boolean) {
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
          <span className="text-[10px] text-muted-foreground">{showAcBreakdown ? "▲" : "▼"}</span>
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
          <div data-testid="play-backstab">
            <span className="text-xs text-muted-foreground">{t("backstabMultiplier")}: </span>
            <span className="font-mono font-bold text-primary">x{backstabMultiplier}</span>
          </div>
        )}
      </div>

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
