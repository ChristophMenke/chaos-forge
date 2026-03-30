"use client";

import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { localized } from "@/lib/utils/localize";
import { EpicIcon } from "./epic-icon";
import type { EpicItemRow } from "@/lib/supabase/types";

interface SimpleEpicCardProps {
  item: EpicItemRow;
  locale: string;
  isOwner: boolean;
  onToggleEquip: (itemId: string) => void;
}

export function SimpleEpicCard({ item, locale, isOwner, onToggleEquip }: SimpleEpicCardProps) {
  const t = useTranslations("epic");

  const simpleEffects = item.simple_effects ?? {};
  const EXCLUDED_KEYS = [
    "weakness",
    "weakness_en",
    "description",
    "description_en",
    "repair_skill",
    "repair_skill_en",
    "repair_time",
    "repair_time_en",
    "elixir_bonus",
    "elixir_cost",
    "elixir_cost_gp",
    "base_con",
    "damage_trigger",
    "damage_trigger_en",
  ];
  const effectEntries = Object.entries(simpleEffects).filter(
    ([key]) => !EXCLUDED_KEYS.includes(key)
  );
  const weakness = simpleEffects.weakness as string | undefined;
  const weaknessEn = simpleEffects.weakness_en as string | undefined;

  return (
    <GlassCard glow="neutral" hover={false} data-testid={`epic-item-${item.slug}`}>
      {/* Header */}
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

      {/* Effects */}
      {effectEntries.length > 0 && (
        <>
          <Separator className="my-3" />
          <div data-testid={`epic-effects-${item.slug}`}>
            <p className="mb-2 text-sm font-medium text-muted-foreground">{t("activeEffects")}</p>
            <div className="flex flex-wrap gap-2">
              {/* Description effect as localized badge */}
              {typeof simpleEffects.description === "string" && (
                <Badge
                  variant="outline"
                  className="border-green-500/50 text-green-400"
                  data-testid={`epic-simple-effect-${item.slug}-desc`}
                >
                  {localized(
                    simpleEffects.description,
                    (simpleEffects.description_en as string) ?? null,
                    locale
                  )}
                </Badge>
              )}
              {effectEntries.map(([key, value]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className="border-green-500/50 text-green-400"
                  data-testid={`epic-simple-effect-${item.slug}-${key}`}
                >
                  {typeof value === "number" ? `+${value}` : String(value)}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Weakness */}
      {weakness && (
        <>
          <Separator className="my-3" />
          <div data-testid={`epic-weakness-${item.slug}`}>
            <p className="mb-1 text-sm font-medium text-red-400/80">{t("weakness")}</p>
            <p className="text-sm text-muted-foreground">
              {localized(weakness, weaknessEn, locale)}
            </p>
          </div>
        </>
      )}
    </GlassCard>
  );
}
