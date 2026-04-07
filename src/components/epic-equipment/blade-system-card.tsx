"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Swords, RotateCcw, Plus, Target, PackagePlus } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { localized } from "@/lib/utils/localize";
import { feetToMeters } from "@/lib/utils/units";
import type { EpicItemRow } from "@/lib/supabase/types";

interface Blade {
  id: number;
  mixture: string | null;
  status: "ready" | "thrown";
}

interface MixtureInfo {
  count: number;
  name: string;
  name_en: string;
  color: string;
  effect: string;
  effect_en: string;
  duration: string;
  duration_en: string;
}

interface WeaponStats {
  damage_sm: string;
  damage_l: string;
  weapon_type: string;
  speed: number;
  weight: number;
  range_short: number;
  range_medium: number;
  range_long: number;
}

interface BladeSystemData {
  type: "blade_system";
  max_prepared: number;
  blades: Blade[];
  mixtures: Record<string, MixtureInfo>;
  weapon_stats?: WeaponStats;
}

interface BladeSystemCardProps {
  item: EpicItemRow;
  locale: string;
  isOwner: boolean;
  onToggleEquip: (itemId: string) => void;
}

export function BladeSystemCard({ item, locale, isOwner, onToggleEquip }: BladeSystemCardProps) {
  const t = useTranslations("epic");
  const data = item.simple_effects as unknown as BladeSystemData;
  const [blades, setBlades] = useState<Blade[]>(data.blades);
  const [mixtures, setMixtures] = useState<Record<string, MixtureInfo>>(data.mixtures);
  const [saving, setSaving] = useState(false);
  const [loadingBlade, setLoadingBlade] = useState<number | null>(null);

  async function persistState(newBlades: Blade[], newMixtures: Record<string, MixtureInfo>) {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("epic_items")
      .update({
        simple_effects: { ...data, blades: newBlades, mixtures: newMixtures },
      })
      .eq("id", item.id);
    setSaving(false);
  }

  function handleLoadBlade(bladeId: number, mixtureKey: string) {
    const mix = mixtures[mixtureKey];
    if (!mix || mix.count <= 0) return;

    const newBlades = blades.map((b) => (b.id === bladeId ? { ...b, mixture: mixtureKey } : b));
    const newMixtures = {
      ...mixtures,
      [mixtureKey]: { ...mix, count: mix.count - 1 },
    };
    setBlades(newBlades);
    setMixtures(newMixtures);
    setLoadingBlade(null);
    persistState(newBlades, newMixtures);
  }

  function handleThrow(bladeId: number) {
    const newBlades = blades.map((b) =>
      b.id === bladeId ? { ...b, status: "thrown" as const } : b
    );
    setBlades(newBlades);
    persistState(newBlades, mixtures);
  }

  function handleCollect(bladeId: number) {
    const newBlades = blades.map((b) =>
      b.id === bladeId ? { ...b, mixture: null, status: "ready" as const } : b
    );
    setBlades(newBlades);
    persistState(newBlades, mixtures);
  }

  function handleCraft(mixtureKey: string) {
    const mix = mixtures[mixtureKey];
    if (!mix) return;
    const newMixtures = {
      ...mixtures,
      [mixtureKey]: { ...mix, count: mix.count + 1 },
    };
    setMixtures(newMixtures);
    persistState(blades, newMixtures);
  }

  const readyBlades = blades.filter((b) => b.status === "ready");
  const thrownBlades = blades.filter((b) => b.status === "thrown");

  return (
    <GlassCard glow="neutral" hover={false} data-testid={`epic-item-${item.slug}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Swords className="h-7 w-7 text-primary" />
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

      {/* Weapon Stats */}
      {data.weapon_stats && (
        <>
          <Separator className="my-4" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6" data-testid="blade-weapon-stats">
            <div>
              <span className="text-[10px] md:text-xs text-muted-foreground">
                {t("damage")} (S/M)
              </span>
              <div className="font-mono text-sm font-bold">{data.weapon_stats.damage_sm}</div>
            </div>
            <div>
              <span className="text-[10px] md:text-xs text-muted-foreground">
                {t("damage")} (L)
              </span>
              <div className="font-mono text-sm font-bold">{data.weapon_stats.damage_l}</div>
            </div>
            <div>
              <span className="text-[10px] md:text-xs text-muted-foreground">Speed</span>
              <div className="font-mono text-sm font-bold">{data.weapon_stats.speed}</div>
            </div>
            <div>
              <span className="text-[10px] md:text-xs text-muted-foreground">{t("type")}</span>
              <div className="text-sm font-medium capitalize">{data.weapon_stats.weapon_type}</div>
            </div>
            <div>
              <span className="text-[10px] md:text-xs text-muted-foreground">{t("range")}</span>
              <div className="font-mono text-sm font-bold">
                {feetToMeters(data.weapon_stats.range_short)}/
                {feetToMeters(data.weapon_stats.range_medium)}/
                {feetToMeters(data.weapon_stats.range_long)}
              </div>
            </div>
            <div>
              <span className="text-[10px] md:text-xs text-muted-foreground">{t("weight")}</span>
              <div className="font-mono text-sm font-bold">{data.weapon_stats.weight} lbs</div>
            </div>
          </div>
        </>
      )}

      <Separator className="my-4" />

      {/* Prepared Blades */}
      <div data-testid="blade-slots">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          {t("bladesReady")} ({readyBlades.length}/{data.max_prepared})
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {blades.map((blade) => {
            const mix = blade.mixture ? mixtures[blade.mixture] : null;
            const isThrown = blade.status === "thrown";

            return (
              <div
                key={blade.id}
                className={`relative flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                  isThrown
                    ? "border-dashed border-muted-foreground/30 bg-muted/20 opacity-50"
                    : mix
                      ? "border-solid bg-background/50"
                      : "border-dashed border-muted-foreground/30 bg-background/20"
                }`}
                style={mix ? { borderColor: `${mix.color}50` } : undefined}
                data-testid={`blade-slot-${blade.id}`}
              >
                {/* Blade visual */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold"
                  style={{
                    backgroundColor: mix ? `${mix.color}20` : "transparent",
                    color: mix ? mix.color : "var(--muted-foreground)",
                    border: `2px solid ${mix ? mix.color : "var(--border)"}`,
                  }}
                >
                  {isThrown ? "—" : blade.id}
                </div>

                {/* Status label */}
                <span className="text-xs font-medium" style={{ color: mix?.color }}>
                  {isThrown
                    ? t("bladeThrown")
                    : mix
                      ? localized(mix.name, mix.name_en, locale)
                      : t("bladeEmpty")}
                </span>

                {/* Actions */}
                {isOwner && !saving && (
                  <div className="flex gap-1">
                    {isThrown ? (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleCollect(blade.id)}
                        data-testid={`blade-collect-${blade.id}`}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        {t("bladeCollect")}
                      </Button>
                    ) : mix ? (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleThrow(blade.id)}
                        data-testid={`blade-throw-${blade.id}`}
                      >
                        <Target className="mr-1 h-3 w-3" />
                        {t("bladeThrow")}
                      </Button>
                    ) : loadingBlade === blade.id ? (
                      <div className="flex flex-wrap justify-center gap-1">
                        {Object.entries(mixtures).map(([key, m]) => (
                          <button
                            key={key}
                            disabled={m.count <= 0}
                            onClick={() => handleLoadBlade(blade.id, key)}
                            className="rounded-full px-2 py-0.5 text-[10px] md:text-xs font-bold text-white transition-opacity disabled:opacity-30"
                            style={{ backgroundColor: m.color }}
                            data-testid={`blade-load-${blade.id}-${key}`}
                          >
                            {localized(m.name, m.name_en, locale)} ({m.count})
                          </button>
                        ))}
                        <button
                          onClick={() => setLoadingBlade(null)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setLoadingBlade(blade.id)}
                        data-testid={`blade-load-btn-${blade.id}`}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        {t("bladeLoad")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {thrownBlades.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("bladesThrown", { count: thrownBlades.length })}
          </p>
        )}
      </div>

      <Separator className="my-4" />

      {/* Mixture Inventory */}
      <div data-testid="mixture-inventory">
        <p className="mb-3 text-sm font-medium text-muted-foreground">{t("mixtureInventory")}</p>
        <div className="flex flex-col gap-2">
          {Object.entries(mixtures).map(([key, mix]) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-md border border-border/50 px-3 py-2"
              data-testid={`mixture-${key}`}
            >
              <div
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: mix.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {localized(mix.name, mix.name_en, locale)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {mix.count}×
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {localized(mix.effect, mix.effect_en, locale)}
                </p>
                <p className="text-xs text-primary/70">
                  ⏱ {localized(mix.duration, mix.duration_en, locale)}
                </p>
              </div>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleCraft(key)}
                  disabled={saving}
                  data-testid={`mixture-craft-${key}`}
                >
                  <PackagePlus className="mr-1 h-3.5 w-3.5" />
                  {t("mixtureCraft")}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
