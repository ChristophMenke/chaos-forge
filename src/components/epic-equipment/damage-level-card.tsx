"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Minus, Plus, Wrench, Zap } from "lucide-react";
import { EpicIcon } from "./epic-icon";
import { GlassCard } from "@/components/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { localized } from "@/lib/utils/localize";
import { getCurrentDamageLevelEffect, getAutoUnlockedLevel } from "@/lib/rules/epic-items";
import type { EpicItemRow, DamageLevelEffect } from "@/lib/supabase/types";

interface DamageLevelCardProps {
  item: EpicItemRow;
  locale: string;
  isOwner: boolean;
  characterLevel?: number;
  onToggleEquip: (itemId: string) => void;
  onDamageLevelChange: (itemId: string, newLevel: number) => void;
  onOverclockToggle?: (itemId: string, active: boolean, endTime: number | null) => void;
}

function getGlowForDamage(level: number, max: number): "neutral" | "warrior" {
  if (max === 0) return "neutral";
  const ratio = level / max;
  return ratio >= 0.5 ? "warrior" : "neutral";
}

function getEffectBadges(effects: string[], t: ReturnType<typeof useTranslations>) {
  const badges: { label: string; variant: "amber" | "red" | "blue" | "default" }[] = [];

  for (const effect of effects) {
    if (effect === "spell_failure_10") {
      badges.push({ label: t("spellFailure", { percent: 10 }), variant: "amber" });
    } else if (effect === "wild_magic_50") {
      badges.push({ label: t("wildMagic", { percent: 50 }), variant: "amber" });
    } else if (effect === "thief_penalty_10") {
      badges.push({ label: t("thiefPenalty", { penalty: -10 }), variant: "amber" });
    } else if (effect === "thief_disabled") {
      badges.push({ label: t("thiefDisabled"), variant: "red" });
    } else if (effect === "electric_damage_1") {
      badges.push({ label: t("electricDamage"), variant: "red" });
    } else if (effect === "save_vs_death") {
      badges.push({ label: t("saveVsDeath"), variant: "red" });
    } else if (effect === "device_offline") {
      badges.push({ label: t("deviceOffline"), variant: "red" });
    }
  }

  return badges;
}

export function DamageLevelCard({
  item,
  locale,
  isOwner,
  characterLevel,
  onToggleEquip,
  onDamageLevelChange,
  onOverclockToggle,
}: DamageLevelCardProps) {
  const t = useTranslations("epic");
  const [expanded, setExpanded] = useState(false);

  // Auto-unlock: if item has level_thresholds, compute effective level from character level
  const hasAutoUnlock = !!(item.simple_effects as Record<string, unknown>)?.level_thresholds;
  const effectiveLevel =
    hasAutoUnlock && characterLevel != null
      ? getAutoUnlockedLevel(item, characterLevel)
      : item.damage_level;
  const effectiveItem = hasAutoUnlock ? { ...item, damage_level: effectiveLevel } : item;

  const currentEffect = getCurrentDamageLevelEffect(effectiveItem);
  const glow = getGlowForDamage(effectiveLevel, item.max_damage_level);

  const statOverrides = currentEffect?.stat_overrides ?? {};
  const effectsList = currentEffect?.effects ?? [];
  const badges = getEffectBadges(effectsList, t);

  // Repair info from simple_effects
  const se = item.simple_effects ?? {};
  const repairSkill = (
    locale === "en" && se.repair_skill_en ? se.repair_skill_en : se.repair_skill
  ) as string | undefined;
  const elixirBonus = se.elixir_bonus as number | undefined;
  const elixirCost = se.elixir_cost_gp as number | undefined;

  return (
    <GlassCard glow={glow} hover={false} data-testid={`epic-item-${item.slug}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <EpicIcon name={item.icon} className="h-7 w-7 text-primary" />
          <div>
            <h3 className="font-heading text-lg text-primary">
              {localized(item.name, item.name_en, locale)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {localized(item.description, item.description_en, locale)}
            </p>
          </div>
        </div>

        {isOwner && (
          <Button
            variant={item.equipped ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleEquip(item.id)}
            data-testid={`epic-equip-toggle-${item.slug}`}
          >
            {item.equipped ? t("equipped") : t("unequipped")}
          </Button>
        )}
      </div>

      <Separator className="my-3" />

      {/* Damage level indicator */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {hasAutoUnlock
              ? t("damageLevelOf", { current: effectiveLevel, max: item.max_damage_level })
              : t("damageLevelOf", { current: item.damage_level, max: item.max_damage_level })}
          </span>
          {isOwner && !hasAutoUnlock && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={item.damage_level <= 0}
                onClick={() => onDamageLevelChange(item.id, item.damage_level - 1)}
                data-testid={`epic-damage-decrease-${item.slug}`}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={item.damage_level >= item.max_damage_level}
                onClick={() => onDamageLevelChange(item.id, item.damage_level + 1)}
                data-testid={`epic-damage-increase-${item.slug}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Dots indicator */}
        <div className="flex gap-1.5" data-testid={`epic-damage-dots-${item.slug}`}>
          {Array.from({ length: item.max_damage_level }, (_, i) => {
            const level = i + 1;
            const isFilled = level <= effectiveLevel;
            return (
              <div
                key={level}
                className={`h-3 w-3 rounded-full border transition-colors ${
                  isFilled
                    ? level >= item.max_damage_level - 1
                      ? "border-red-500 bg-red-500"
                      : level >= item.max_damage_level / 2
                        ? "border-amber-500 bg-amber-500"
                        : "border-yellow-500 bg-yellow-500"
                    : "border-muted-foreground/30 bg-transparent"
                }`}
                data-testid={`epic-damage-dot-${item.slug}-${level}`}
              />
            );
          })}
        </div>

        {/* Current effect description */}
        {currentEffect && (
          <div className="rounded-lg bg-background/30 p-3">
            <p className="text-sm font-medium text-muted-foreground">{t("currentEffects")}</p>
            <p className="mt-1 text-sm">
              {localized(currentEffect.description, currentEffect.description_en, locale)}
            </p>

            {/* Stat overrides */}
            {Object.keys(statOverrides).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(statOverrides).map(([stat, value]) => {
                  const isHigh = (value as number) >= 15;
                  return (
                    <Badge
                      key={stat}
                      variant="outline"
                      className={
                        isHigh
                          ? "border-green-500/50 text-green-400"
                          : "border-red-500/50 text-red-400"
                      }
                      data-testid={`epic-stat-override-${item.slug}-${stat}`}
                    >
                      {stat.toUpperCase()}: {value as number}
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Misc effect badges */}
            {badges.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {badges.map((badge, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={
                      badge.variant === "red"
                        ? "border-red-500/50 text-red-400"
                        : badge.variant === "amber"
                          ? "border-amber-500/50 text-amber-400"
                          : "border-blue-500/50 text-blue-400"
                    }
                    data-testid={`epic-effect-badge-${item.slug}-${i}`}
                  >
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* No damage = functional */}
        {effectiveLevel === 0 && <p className="text-sm text-green-400">{t("functional")}</p>}
      </div>

      {/* Expandable all levels table */}
      <div className="mt-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          data-testid={`epic-expand-levels-${item.slug}`}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {t("allLevels")}
        </button>

        {expanded && (
          <div
            className="mt-2 overflow-x-auto rounded-lg bg-background/20 p-3"
            data-testid={`epic-levels-table-${item.slug}`}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-muted-foreground/20 text-left">
                  <th className="pb-2 pr-4">{t("damageLevel")}</th>
                  <th className="pb-2">{locale === "de" ? "Beschreibung" : "Description"}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: item.max_damage_level + 1 }, (_, i) => {
                  const effect = item.damage_levels[String(i)] as DamageLevelEffect | undefined;
                  if (!effect) return null;
                  const isCurrent = i === effectiveLevel;
                  return (
                    <tr
                      key={i}
                      className={`border-b border-muted-foreground/10 ${
                        isCurrent ? "bg-primary/10" : ""
                      }`}
                    >
                      <td className="py-1.5 pr-4 font-mono">{i}</td>
                      <td className="py-1.5">
                        {localized(effect.description, effect.description_en, locale)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Overclock */}
      {!!se.overclock && !effectsList.includes("device_offline") && (
        <OverclockPanel
          overclock={se.overclock as Record<string, unknown>}
          isActive={!!(se.overclock_active as boolean)}
          endTime={(se.overclock_end_time as number | null) ?? null}
          locale={locale}
          isOwner={isOwner}
          onToggle={(active, endTime) => onOverclockToggle?.(item.id, active, endTime)}
        />
      )}

      {/* Repair info */}
      {repairSkill && (
        <>
          <Separator className="my-3" />
          <div
            className="flex items-start gap-2 text-sm text-muted-foreground"
            data-testid={`epic-repair-info-${item.slug}`}
          >
            <Wrench className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{t("repair")}</p>
              <p>
                {t("repairInfo", {
                  skill: repairSkill,
                  level: effectiveLevel,
                })}
              </p>
              {elixirBonus != null && elixirCost != null && (
                <p className="mt-1 text-amber-400/80">
                  {t("elixirInfo", {
                    bonus: elixirBonus,
                    cost: `${elixirCost}`,
                  })}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );
}

function OverclockPanel({
  overclock,
  isActive,
  endTime,
  locale,
  isOwner,
  onToggle,
}: {
  overclock: Record<string, unknown>;
  isActive: boolean;
  endTime: number | null;
  locale: string;
  isOwner: boolean;
  onToggle: (active: boolean, endTime: number | null) => void;
}) {
  const t = useTranslations("epic");
  const name = locale === "en" && overclock.name_en ? overclock.name_en : overclock.name;
  const description =
    locale === "en" && overclock.description_en ? overclock.description_en : overclock.description;
  const requiresCheck =
    locale === "en" && overclock.requires_check_en
      ? overclock.requires_check_en
      : overclock.requires_check;
  const durationHours = (overclock.duration_hours as number) ?? 1;

  // Timer — update only via interval/rAF callbacks (React Compiler safe)
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!isActive || !endTime) return;
    const tick = () => {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        onToggle(false, null);
      } else {
        setMinutesLeft(Math.ceil(remaining / 60000));
      }
    };
    const raf = requestAnimationFrame(tick);
    const interval = setInterval(tick, 30000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, [isActive, endTime, onToggle]);

  function handleToggle() {
    if (isActive) {
      onToggle(false, null);
    } else {
      onToggle(true, Date.now() + durationHours * 60 * 60 * 1000);
    }
  }

  return (
    <>
      <Separator className="my-3" />
      <div
        className={`rounded-lg border p-3 ${
          isActive ? "border-amber-500/50 bg-amber-500/10" : "border-amber-500/20 bg-amber-500/5"
        }`}
        data-testid="epic-overclock-panel"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="font-medium text-amber-400">{name as string}</span>
            {isActive && minutesLeft != null && (
              <Badge
                variant="outline"
                className="border-amber-500/50 text-amber-400"
                data-testid="overclock-timer"
              >
                {t("overclockTimer", { minutes: minutesLeft })}
              </Badge>
            )}
          </div>
          {isOwner && (
            <Button
              variant={isActive ? "destructive" : "default"}
              size="sm"
              onClick={handleToggle}
              data-testid="overclock-toggle"
            >
              {isActive ? t("overclockDeactivate") : t("overclockActivate")}
            </Button>
          )}
        </div>

        {isActive ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="outline" className="border-amber-500/50 text-amber-400">
              CON → {overclock.con_override as number}
            </Badge>
            <Badge variant="outline" className="border-red-500/50 text-red-400">
              {t("overclockPoisonPenalty", { penalty: overclock.poison_save_penalty as number })}
            </Badge>
            <Badge variant="outline" className="border-green-500/50 text-green-400">
              {t("overclockHealing", { hp: overclock.heals_per_hour as number })}
            </Badge>
          </div>
        ) : (
          <div className="mt-1.5">
            <p className="text-sm text-muted-foreground">{description as string}</p>
            <p className="mt-1 text-xs text-amber-400/70">
              {t("overclockRequiresCheck", { skill: requiresCheck as string })}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
