"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Swords, RotateCcw, Plus, Target, Ban, Trash2, Hammer, Check, X } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { localized } from "@/lib/utils/localize";
import { feetToMeters, lbsToKg } from "@/lib/utils/units";
import {
  loadBlade,
  throwBlade,
  collectBlade,
  loseBlade,
  forgeBlade,
  type Blade,
  type MixtureInfo,
  type BladeSystemData,
} from "@/lib/rules/blades";
import type { EpicItemRow } from "@/lib/supabase/types";
import type { UndoLabel } from "@/lib/undo/types";
import type { CoinPurse } from "@/lib/rules/equipment";
import type { StockChange, StockTarget } from "@/lib/rules/sprocket-devices";
import { RecipeChecklist, StockControls } from "./recipe-checklist";

const EMPTY_PURSE: CoinPurse = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };

interface BladeSystemCardProps {
  item: EpicItemRow;
  locale: string;
  isOwner: boolean;
  onToggleEquip: (itemId: string) => void;
  /** Saves blades/mixtures through the parent (state, rollback, undo). */
  onSimpleEffectsChange: (
    itemId: string,
    effects: Record<string, unknown>,
    label: UndoLabel
  ) => Promise<void>;
  /** Börse für Rezepte mit Kosten. */
  purse?: CoinPurse;
  /** Mixtur-Vorrat: Häkchen, Korrektur, Herstellen (Eltern-Komponente schreibt). */
  onStockChange?: (itemId: string, target: StockTarget, change: StockChange) => void;
}

export function BladeSystemCard({
  item,
  locale,
  isOwner,
  onToggleEquip,
  onSimpleEffectsChange,
  purse = EMPTY_PURSE,
  onStockChange,
}: BladeSystemCardProps) {
  const t = useTranslations("epic");
  const tcom = useTranslations("common");
  const data = item.simple_effects as unknown as BladeSystemData;
  // Derived from the item, so undo/redo in the parent shows up here too.
  const blades: Blade[] = data.blades;
  const mixtures: Record<string, MixtureInfo> = data.mixtures;
  const [saving, setSaving] = useState(false);
  const [loadingBlade, setLoadingBlade] = useState<number | null>(null);
  const [collectingBlade, setCollectingBlade] = useState<number | null>(null);

  async function persistState(newBlades: Blade[], newMixtures: Record<string, MixtureInfo>) {
    setSaving(true);
    try {
      await onSimpleEffectsChange(
        item.id,
        { ...data, blades: newBlades, mixtures: newMixtures },
        { key: "blades", values: { name: localized(item.name, item.name_en, locale) } }
      );
    } finally {
      setSaving(false);
    }
  }

  function handleLoadBlade(bladeId: number, mixtureKey: string) {
    const result = loadBlade(blades, mixtures, bladeId, mixtureKey);
    setLoadingBlade(null);
    if (result.blades === blades && result.mixtures === mixtures) return;
    persistState(result.blades, result.mixtures);
  }

  function handleThrow(bladeId: number, outcome: "hit" | "miss") {
    const newBlades = throwBlade(blades, bladeId, outcome);
    persistState(newBlades, mixtures);
  }

  function handleCollect(bladeId: number, vialIntact: boolean) {
    const newBlades = collectBlade(blades, bladeId, vialIntact);
    setCollectingBlade(null);
    persistState(newBlades, mixtures);
  }

  function handleLose(bladeId: number) {
    const newBlades = loseBlade(blades, bladeId);
    persistState(newBlades, mixtures);
  }

  function handleForge() {
    const newBlades = forgeBlade(blades, data.max_prepared);
    if (newBlades === blades) return;
    persistState(newBlades, mixtures);
  }

  function changeMixture(key: string, change: StockChange) {
    onStockChange?.(item.id, { kind: "mixture", key }, change);
  }

  const thrownBlades = blades.filter((b) => b.status === "thrown");
  const canForge = blades.length < data.max_prepared;

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
              <span className="text-[10px] md:text-xs text-muted-foreground">{t("speed")}</span>
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
              <div className="font-mono text-sm font-bold">
                {lbsToKg(data.weapon_stats.weight)} kg
              </div>
            </div>
          </div>
        </>
      )}

      <Separator className="my-4" />

      {/* Prepared Blades */}
      <div data-testid="blade-slots">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            {t("bladesReady")} ({blades.length}/{data.max_prepared})
          </p>
          {isOwner && canForge && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleForge}
              disabled={saving}
              data-testid="blade-forge"
            >
              <Hammer className="mr-1 h-3 w-3" />
              {t("bladeForge")}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {blades.map((blade) => {
            const mix = blade.mixture ? mixtures[blade.mixture] : null;
            const isThrown = blade.status === "thrown";

            return (
              <div
                key={blade.id}
                className={`relative flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                  isThrown
                    ? "border-dashed border-muted-foreground/30 bg-muted/20 opacity-70"
                    : mix
                      ? "border-solid bg-background/50"
                      : "border-dashed border-muted-foreground/30 bg-background/20"
                }`}
                style={mix && !isThrown ? { borderColor: `${mix.color}50` } : undefined}
                data-testid={`blade-slot-${blade.id}`}
              >
                {/* Blade visual */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold"
                  style={{
                    backgroundColor: mix && !isThrown ? `${mix.color}20` : "transparent",
                    color: mix && !isThrown ? mix.color : "var(--muted-foreground)",
                    border: `2px solid ${mix && !isThrown ? mix.color : "var(--border)"}`,
                  }}
                >
                  {isThrown ? "—" : blade.id}
                </div>

                {/* Status label */}
                <span
                  className="text-xs font-medium"
                  style={{ color: mix && !isThrown ? mix.color : undefined }}
                >
                  {isThrown
                    ? blade.outcome === "hit"
                      ? t("bladeHit")
                      : t("bladeMiss")
                    : mix
                      ? localized(mix.name, mix.name_en, locale)
                      : t("bladeEmpty")}
                </span>

                {/* Actions */}
                {isOwner && !saving && (
                  <div className="flex flex-wrap justify-center gap-1">
                    {isThrown ? (
                      collectingBlade === blade.id ? (
                        // Fehlwurf: Phiole intakt oder zerbrochen?
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleCollect(blade.id, true)}
                            data-testid={`blade-vial-intact-${blade.id}`}
                          >
                            <Check className="mr-1 h-3 w-3" />
                            {t("bladeVialIntact")}
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleCollect(blade.id, false)}
                            data-testid={`blade-vial-broken-${blade.id}`}
                          >
                            <X className="mr-1 h-3 w-3" />
                            {t("bladeVialBroken")}
                          </Button>
                          <button
                            onClick={() => setCollectingBlade(null)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                            aria-label={tcom("cancel")}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() =>
                              blade.outcome === "hit"
                                ? handleCollect(blade.id, false)
                                : setCollectingBlade(blade.id)
                            }
                            data-testid={`blade-collect-${blade.id}`}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            {t("bladeCollect")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleLose(blade.id)}
                            data-testid={`blade-lose-${blade.id}`}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            {t("bladeLost")}
                          </Button>
                        </>
                      )
                    ) : mix ? (
                      // Bestückte Klinge: Treffer oder Fehlwurf werfen
                      <>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleThrow(blade.id, "hit")}
                          data-testid={`blade-throw-hit-${blade.id}`}
                        >
                          <Target className="mr-1 h-3 w-3" />
                          {t("bladeThrowHit")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleThrow(blade.id, "miss")}
                          data-testid={`blade-throw-miss-${blade.id}`}
                        >
                          <Ban className="mr-1 h-3 w-3" />
                          {t("bladeThrowMiss")}
                        </Button>
                      </>
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
                          aria-label={tcom("cancel")}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      // Leere Klinge: bestücken / nachladen
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
              className="flex items-start gap-3 rounded-md border border-border/50 px-3 py-2"
              data-testid={`mixture-${key}`}
            >
              <div
                className="mt-0.5 h-4 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: mix.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {localized(mix.name, mix.name_en, locale)}
                  </span>
                  <Badge variant="outline" className="text-xs" data-testid={`mixture-count-${key}`}>
                    {mix.count}×
                  </Badge>
                  {isOwner && (
                    <StockControls
                      testId={`mixture-${key}-stock`}
                      count={mix.count}
                      disabled={saving}
                      onAdjust={(delta) => changeMixture(key, { type: "adjust", delta })}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {localized(mix.effect, mix.effect_en, locale)}
                </p>
                <p className="text-xs text-primary/70">
                  ⏱ {localized(mix.duration, mix.duration_en, locale)}
                </p>
                <RecipeChecklist
                  testId={`mixture-${key}-recipe`}
                  stock={mix}
                  purse={purse}
                  locale={locale}
                  isOwner={isOwner}
                  disabled={saving}
                  onToggle={(componentKey) =>
                    changeMixture(key, { type: "toggle", key: componentKey })
                  }
                  onCraft={() => changeMixture(key, { type: "craft" })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
