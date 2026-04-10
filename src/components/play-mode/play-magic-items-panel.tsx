"use client";

import { memo, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MagicEffectBadges } from "@/components/shared/magic-effect-badges";
import { UseConsumableDialog } from "@/components/character-sheet/use-consumable-dialog";
import { isMagicItem, isDepleted } from "@/lib/rules/magic-items";
import { canUseConsumable, getConsumableType } from "@/lib/rules/consumables";
import { createClient } from "@/lib/supabase/client";
import type { CharacterEquipmentWithDetails } from "@/lib/supabase/types";

interface PlayMagicItemsPanelProps {
  equipment: CharacterEquipmentWithDetails[];
  hpCurrent: number;
  hpMax: number;
  readOnly: boolean;
  onEquipmentChange: (equipment: CharacterEquipmentWithDetails[]) => void;
  onHpChange: (newHp: number) => void;
}

function PlayMagicItemsPanelInner({
  equipment,
  hpCurrent,
  hpMax,
  readOnly,
  onEquipmentChange,
  onHpChange,
}: PlayMagicItemsPanelProps) {
  const t = useTranslations("playMode");
  const [loading, setLoading] = useState(false);
  const [usingItem, setUsingItem] = useState<CharacterEquipmentWithDetails | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const magicItems = useMemo(() => {
    return equipment.filter(isMagicItem).sort((a, b) => {
      if (a.equipped !== b.equipped) return a.equipped ? -1 : 1;
      return (a.custom_label ?? "").localeCompare(b.custom_label ?? "");
    });
  }, [equipment]);

  function getDisplayName(item: CharacterEquipmentWithDetails): string {
    return item.custom_label?.replace(/\s*\([^)]+\)\s*$/, "") ?? "";
  }

  async function toggleEquip(itemId: string, currentlyEquipped: boolean) {
    if (readOnly) return;
    setLoading(true);
    const supabase = createClient();
    try {
      await supabase
        .from("character_equipment")
        .update({ equipped: !currentlyEquipped })
        .eq("id", itemId);
      onEquipmentChange(
        equipment.map((e) => (e.id === itemId ? { ...e, equipped: !currentlyEquipped } : e))
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUseConsumable(
    item: CharacterEquipmentWithDetails,
    result: { hpHealed?: number; chargesUsed?: number }
  ) {
    const consumableType = getConsumableType(item);
    if (!consumableType) return;

    setLoading(true);
    const supabase = createClient();
    try {
      if (consumableType === "potion") {
        if (result.hpHealed) {
          onHpChange(Math.min(hpMax, hpCurrent + result.hpHealed));
        }
        await supabase.from("character_equipment").delete().eq("id", item.id);
        onEquipmentChange(equipment.filter((e) => e.id !== item.id));
      } else if (consumableType === "scroll") {
        await supabase.from("character_equipment").delete().eq("id", item.id);
        onEquipmentChange(equipment.filter((e) => e.id !== item.id));
      } else if (consumableType === "charged" && result.chargesUsed) {
        const newCharges = Math.max(
          0,
          (item.magic_effects?.current_charges ?? 0) - result.chargesUsed
        );
        const updatedEffects = { ...item.magic_effects, current_charges: newCharges };
        await supabase
          .from("character_equipment")
          .update({ magic_effects: updatedEffects })
          .eq("id", item.id);
        onEquipmentChange(
          equipment.map((e) => (e.id === item.id ? { ...e, magic_effects: updatedEffects } : e))
        );
      }
    } finally {
      setUsingItem(null);
      setLoading(false);
    }
  }

  async function removeItem(itemId: string) {
    setLoading(true);
    const supabase = createClient();
    try {
      await supabase.from("character_equipment").delete().eq("id", itemId);
      onEquipmentChange(equipment.filter((e) => e.id !== itemId));
      setRemoveConfirm(null);
    } finally {
      setLoading(false);
    }
  }

  if (magicItems.length === 0) {
    return (
      <GlassCard hover={false} data-testid="play-magic-items-panel">
        <h3 className="mb-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground md:mb-3">
          {t("magicItems")}
        </h3>
        <p className="text-sm text-muted-foreground">{t("noMagicItems")}</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard hover={false} data-testid="play-magic-items-panel">
      <h3 className="mb-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground md:mb-3">
        {t("magicItems")}
      </h3>

      <div className="flex flex-col gap-2">
        {magicItems.map((item) => {
          const name = getDisplayName(item);
          const fx = item.magic_effects;
          const itemDepleted = fx ? isDepleted(fx) : false;
          const hasCharges = fx?.max_charges != null && fx.max_charges > 0;

          return (
            <div
              key={item.id}
              className={`rounded-md border p-3 ${
                item.equipped ? "border-border" : "border-dashed border-border/50"
              }`}
              data-testid={`play-magic-item-${item.id}`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{name}</span>
                    <Badge variant={item.equipped ? "default" : "outline"} className="text-[10px]">
                      {item.equipped ? t("equipped") : t("unequipped")}
                    </Badge>
                    {itemDepleted && (
                      <Badge variant="destructive" className="text-[10px]">
                        {t("depleted")}
                      </Badge>
                    )}
                    {hasCharges && !itemDepleted && (
                      <span className="text-xs text-muted-foreground">
                        {t("charges", {
                          current: fx?.current_charges ?? 0,
                          max: fx?.max_charges ?? 0,
                        })}
                      </span>
                    )}
                  </div>
                  <MagicEffectBadges effects={fx ?? {}} />
                </div>

                {/* Action buttons */}
                {!readOnly && (
                  <div className="flex shrink-0 items-center gap-1">
                    {canUseConsumable(item) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={loading}
                        onClick={() => setUsingItem(item)}
                        data-testid={`play-magic-use-${item.id}`}
                      >
                        {t("use")}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      onClick={() => toggleEquip(item.id, item.equipped)}
                      data-testid={`play-magic-equip-${item.id}`}
                    >
                      {item.equipped ? t("unequip") : t("equip")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loading}
                      onClick={() => setRemoveConfirm({ id: item.id, name })}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      aria-label={t("remove")}
                      data-testid={`play-magic-remove-${item.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Use Consumable Dialog */}
      {usingItem &&
        (() => {
          const consumableType = getConsumableType(usingItem);
          if (!consumableType) return null;
          return (
            <UseConsumableDialog
              item={usingItem}
              consumableType={consumableType}
              hpCurrent={hpCurrent}
              hpMax={hpMax}
              onUse={(result) => handleUseConsumable(usingItem, result)}
              onCancel={() => setUsingItem(null)}
            />
          );
        })()}

      {/* Remove Confirm Dialog */}
      {removeConfirm && (
        <ConfirmDialog
          open={true}
          title={t("removeItemTitle")}
          message={t("removeItemMessage", { name: removeConfirm.name })}
          confirmLabel={t("remove")}
          onConfirm={() => removeItem(removeConfirm.id)}
          onCancel={() => setRemoveConfirm(null)}
        />
      )}
    </GlassCard>
  );
}

export const PlayMagicItemsPanel = memo(PlayMagicItemsPanelInner);
