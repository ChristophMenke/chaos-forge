"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { createNotification } from "@/lib/notifications";
import { localized } from "@/lib/utils/localize";
import type { CharacterInventoryWithDetails } from "@/lib/supabase/types";

interface TradeCharacter {
  id: string;
  name: string;
  user_id: string;
}

interface SendItemDialogProps {
  item: CharacterInventoryWithDetails;
  senderCharacterId: string;
  senderCharacterName: string;
  characters: TradeCharacter[];
  onSend: (itemId: string, quantity: number) => void;
  onClose: () => void;
}

export function SendItemDialog({
  item,
  senderCharacterId,
  senderCharacterName,
  characters,
  onSend,
  onClose,
}: SendItemDialogProps) {
  const t = useTranslations("playMode");
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

  async function handleSend() {
    if (!selectedCharacterId || quantity < 1 || quantity > item.quantity || isSaving) return;

    setIsSaving(true);
    setError("");

    try {
      // Add to recipient FIRST (safer: duplicate item > lost item on partial failure)
      if (item.item_id) {
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

      // Remove/decrement from sender SECOND
      const remaining = item.quantity - quantity;
      if (remaining <= 0) {
        const { error: delError } = await supabase
          .from("character_inventory")
          .delete()
          .eq("id", item.id);
        if (delError) {
          setError(delError.message);
          return;
        }
      } else {
        const { error: updError } = await supabase
          .from("character_inventory")
          .update({ quantity: remaining })
          .eq("id", item.id);
        if (updError) {
          setError(updError.message);
          return;
        }
      }

      // Notification for recipient
      const recipient = characters.find((c) => c.id === selectedCharacterId);
      if (recipient) {
        await createNotification(supabase, {
          userId: recipient.user_id,
          characterId: selectedCharacterId,
          type: "trade_item_received",
          details: {
            item_name: name,
            quantity,
            from_character: senderCharacterName,
            character_name: recipient.name,
          },
        });
      }

      onSend(item.id, quantity);
    } finally {
      setIsSaving(false);
    }
  }

  // Filter out sender from character list
  const availableCharacters = characters.filter((c) => c.id !== senderCharacterId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-item-dialog-title"
      tabIndex={-1}
      data-testid="play-send-item-dialog"
    >
      <div
        className="mx-4 flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-card p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="send-item-dialog-title" className="font-heading text-lg text-primary">
          {t("sendItemTitle")}
        </h3>

        <p className="text-sm text-muted-foreground">
          {name} {item.quantity > 1 && `(${item.quantity})`}
        </p>

        {/* Character selector */}
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t("toCharacter")}</label>
          <select
            value={selectedCharacterId}
            onChange={(e) => setSelectedCharacterId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            data-testid="play-send-item-character"
          >
            <option value="">{t("selectCharacter")}</option>
            {availableCharacters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        {item.quantity > 1 && (
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              {t("quantity")} (max {item.quantity})
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
              data-testid="play-send-item-quantity"
            />
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={handleSend}
            disabled={!selectedCharacterId || quantity < 1 || isSaving}
            data-testid="play-send-item-confirm"
          >
            {isSaving ? t("saving") : t("sendConfirm")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={onClose}
            data-testid="play-send-item-cancel"
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
