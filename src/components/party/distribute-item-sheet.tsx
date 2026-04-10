"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { localized } from "@/lib/utils/localize";
import { createNotification } from "@/lib/notifications";
import type { PartyLootItemWithDetails } from "@/lib/supabase/types";

interface CharacterOption {
  id: string;
  name: string;
  user_id: string;
}

interface DistributeItemSheetProps {
  item: PartyLootItemWithDetails;
  characters: CharacterOption[];
  userId: string;
  activeCharacterName?: string;
  onDistribute: (itemId: string, quantity: number) => void;
  onClose: () => void;
}

export function DistributeItemSheet({
  item,
  characters,
  userId,
  activeCharacterName = "",
  onDistribute,
  onClose,
}: DistributeItemSheetProps) {
  const t = useTranslations("party");
  const locale = useLocale();
  const supabase = createClient();
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const name = item.custom_label
    ? item.custom_label
    : item.custom_name
      ? item.custom_name
      : item.item
        ? localized(item.item.name, item.item.name_en, locale)
        : "???";

  const isEquipmentSource = item.source_type === "equipment" || !!item.weapon_id || !!item.armor_id;
  const maxQty = isEquipmentSource ? 1 : item.quantity;

  async function handleDistribute() {
    if (!selectedCharacterId || quantity < 1 || quantity > item.quantity || isSaving) return;

    setIsSaving(true);
    setError("");

    try {
      // Step 1: Grant item to recipient. Do this BEFORE touching party_loot_items
      // so that a failure here leaves the loot pool intact (no data loss).
      const hasMagicEffects =
        item.magic_item_id || (item.magic_effects && Object.keys(item.magic_effects).length > 0);

      if (isEquipmentSource || hasMagicEffects) {
        const { error: insError } = await supabase.from("character_equipment").insert({
          character_id: selectedCharacterId,
          weapon_id: item.weapon_id ?? null,
          armor_id: item.armor_id ?? null,
          quantity: 1,
          equipped: false,
          hit_bonus: item.hit_bonus ?? 0,
          damage_bonus: item.damage_bonus ?? 0,
          magic_effects: item.magic_effects ?? {},
          custom_label: item.custom_label ?? (!item.weapon_id && !item.armor_id ? name : null),
          magic_item_id: item.magic_item_id ?? null,
        });
        if (insError) {
          setError(insError.message);
          return;
        }
      } else if (item.item_id) {
        const { data: existing } = await supabase
          .from("character_inventory")
          .select("id, quantity")
          .eq("character_id", selectedCharacterId)
          .eq("item_id", item.item_id)
          .maybeSingle();

        if (existing) {
          const { error: incError } = await supabase.rpc("increment_inventory_quantity", {
            p_inventory_id: existing.id,
            p_delta: quantity,
          });
          if (incError) {
            setError(incError.message);
            return;
          }
        } else {
          const { error: insError } = await supabase.from("character_inventory").insert({
            character_id: selectedCharacterId,
            item_id: item.item_id,
            quantity,
            notes: "",
          });
          if (insError) {
            setError(insError.message);
            return;
          }
        }
      } else if (item.custom_name) {
        const { data: existing } = await supabase
          .from("character_inventory")
          .select("id, quantity")
          .eq("character_id", selectedCharacterId)
          .eq("custom_name", item.custom_name)
          .maybeSingle();

        if (existing) {
          const { error: incError } = await supabase.rpc("increment_inventory_quantity", {
            p_inventory_id: existing.id,
            p_delta: quantity,
          });
          if (incError) {
            setError(incError.message);
            return;
          }
        } else {
          const { error: insError } = await supabase.from("character_inventory").insert({
            character_id: selectedCharacterId,
            custom_name: item.custom_name,
            quantity,
            notes: "",
          });
          if (insError) {
            setError(insError.message);
            return;
          }
        }
      }

      // Step 2: Deduct from loot pool. Item is already with the recipient at
      // this point, so a failure here is a duplicate-grant risk rather than
      // data loss — far less harmful and recoverable via the log.
      const remaining = item.quantity - quantity;
      if (remaining <= 0) {
        const { error: delError } = await supabase
          .from("party_loot_items")
          .delete()
          .eq("id", item.id);
        if (delError) {
          setError(delError.message);
          return;
        }
      } else {
        const { error: updError } = await supabase
          .from("party_loot_items")
          .update({ quantity: remaining })
          .eq("id", item.id);
        if (updError) {
          setError(updError.message);
          return;
        }
      }

      await supabase.from("party_loot_log").insert({
        action: "distribute_item",
        user_id: userId,
        character_id: selectedCharacterId,
        details: {
          item_name: name,
          quantity,
          ...(activeCharacterName ? { actor: activeCharacterName } : {}),
        },
      });

      const recipient = characters.find((c) => c.id === selectedCharacterId);
      if (recipient) {
        await createNotification(supabase, {
          userId: recipient.user_id,
          characterId: selectedCharacterId,
          type: "party_item_received",
          details: { item_name: name, quantity, character_name: recipient.name },
        });
      }

      onDistribute(item.id, quantity);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 rounded-none p-0 sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-xl"
        data-testid="party-distribute-item-dialog"
      >
        <div className="border-b border-border px-4 py-3">
          <DialogTitle className="text-base">
            {t("distributeItemTitle", { item: name })}
          </DialogTitle>
          <DialogDescription className="text-xs">{t("selectRecipient")}</DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div>
            <label
              htmlFor="distribute-character"
              className="mb-2 block text-xs text-muted-foreground"
            >
              {t("toCharacter")}
            </label>
            <select
              id="distribute-character"
              value={selectedCharacterId}
              onChange={(e) => setSelectedCharacterId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              data-testid="party-distribute-item-character"
            >
              <option value="">{t("selectCharacter")}</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs text-muted-foreground">
              {t("quantity")} — {t("available", { count: item.quantity })}
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || isEquipmentSource}
                aria-label={t("decrease")}
              >
                <Minus className="size-4" />
              </Button>
              <input
                type="number"
                min={1}
                max={maxQty}
                value={quantity}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10) || 1;
                  setQuantity(Math.max(1, Math.min(maxQty, n)));
                }}
                disabled={isEquipmentSource}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-center text-sm"
                data-testid="party-distribute-item-quantity"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty || isEquipmentSource}
                aria-label={t("increase")}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex gap-2 border-t border-border px-4 py-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={onClose}
            data-testid="party-distribute-item-cancel"
          >
            {t("cancel")}
          </Button>
          <Button
            className="flex-1"
            onClick={handleDistribute}
            disabled={!selectedCharacterId || quantity < 1 || isSaving}
            data-testid="party-distribute-item-confirm"
          >
            {isSaving ? t("saving") : t("distribute")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
