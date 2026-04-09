"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { localized } from "@/lib/utils/localize";
import { createNotification } from "@/lib/notifications";
import type { PartyLootItemWithDetails } from "@/lib/supabase/types";

interface CharacterOption {
  id: string;
  name: string;
  user_id: string;
}

interface DistributeItemDialogProps {
  item: PartyLootItemWithDetails;
  characters: CharacterOption[];
  userId: string;
  onDistribute: (itemId: string, quantity: number) => void;
  onClose: () => void;
}

export function DistributeItemDialog({
  item,
  characters,
  userId,
  onDistribute,
  onClose,
}: DistributeItemDialogProps) {
  const t = useTranslations("party");
  const locale = useLocale();
  const supabase = createClient();
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const name = item.custom_name
    ? item.custom_name
    : item.item
      ? localized(item.item.name, item.item.name_en, locale)
      : "???";

  async function handleDistribute() {
    if (!selectedCharacterId || quantity < 1 || quantity > item.quantity || isSaving) return;

    setIsSaving(true);
    setError("");

    try {
      // Update or delete party item
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

      // Magic item → goes to character_equipment (not inventory)
      const hasMagicEffects =
        item.magic_item_id || (item.magic_effects && Object.keys(item.magic_effects).length > 0);

      if (hasMagicEffects) {
        const label = item.custom_label || item.custom_name || name;
        const { error: insError } = await supabase.from("character_equipment").insert({
          character_id: selectedCharacterId,
          weapon_id: null,
          armor_id: null,
          quantity: 1,
          equipped: false,
          hit_bonus: 0,
          damage_bonus: 0,
          magic_effects: item.magic_effects || {},
          custom_label: label,
          magic_item_id: item.magic_item_id || null,
        });
        if (insError) {
          setError(insError.message);
          return;
        }
      } else if (item.item_id) {
        // Check if character already has this catalog item
        const { data: existing } = await supabase
          .from("character_inventory")
          .select("id, quantity")
          .eq("character_id", selectedCharacterId)
          .eq("item_id", item.item_id)
          .maybeSingle();

        if (existing) {
          // Atomic increment via RPC
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
        // Custom name item — null-safe check
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

      // Log
      await supabase.from("party_loot_log").insert({
        action: "distribute_item",
        user_id: userId,
        character_id: selectedCharacterId,
        details: { item_name: name, quantity },
      });

      // Notification for recipient
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="distribute-item-dialog-title"
      tabIndex={-1}
      data-testid="party-distribute-item-dialog"
    >
      <div
        className="mx-4 flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-card p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="distribute-item-dialog-title" className="font-heading text-lg text-primary">
          {t("distributeItemTitle", { item: name })}
        </h3>

        {/* Character selector */}
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t("toCharacter")}</label>
          <select
            value={selectedCharacterId}
            onChange={(e) => setSelectedCharacterId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
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

        {/* Quantity */}
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            {t("quantity")} — {t("available", { count: item.quantity })}
          </label>
          <input
            type="number"
            min="1"
            max={item.quantity}
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, Math.min(item.quantity, parseInt(e.target.value, 10) || 1)))
            }
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            data-testid="party-distribute-item-quantity"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={handleDistribute}
            disabled={!selectedCharacterId || quantity < 1 || isSaving}
            data-testid="party-distribute-item-confirm"
          >
            {isSaving ? t("saving") : t("distribute")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={onClose}
            data-testid="party-distribute-item-cancel"
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
