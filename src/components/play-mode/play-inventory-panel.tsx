"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Send } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SendItemDialog } from "./send-item-dialog";
import { createClient } from "@/lib/supabase/client";
import { getEncumbranceLabel } from "@/lib/rules/equipment";
import type { EncumbranceLevel } from "@/lib/rules/equipment";
import type { CharacterInventoryWithDetails } from "@/lib/supabase/types";
import { localized } from "@/lib/utils/localize";
import { lbsToKg } from "@/lib/utils/units";

interface TradeCharacter {
  id: string;
  name: string;
  user_id: string;
}

interface PlayInventoryPanelProps {
  characterId: string;
  characterName?: string;
  inventory: CharacterInventoryWithDetails[];
  totalWeight: number;
  encumbrance: EncumbranceLevel;
  ignoreEncumbrance: boolean;
  readOnly: boolean;
  tradeCharacters?: TradeCharacter[];
  onInventoryChange: (inventory: CharacterInventoryWithDetails[]) => void;
}

export function PlayInventoryPanel({
  characterId,
  characterName = "",
  inventory,
  totalWeight,
  encumbrance,
  ignoreEncumbrance,
  readOnly,
  tradeCharacters,
  onInventoryChange,
}: PlayInventoryPanelProps) {
  const t = useTranslations("playMode");
  const locale = useLocale();
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [sendingItem, setSendingItem] = useState<CharacterInventoryWithDetails | null>(null);

  async function addItem() {
    if (!newItemName.trim()) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("character_inventory")
      .insert({
        character_id: characterId,
        custom_name: newItemName.trim(),
        quantity: newItemQty,
        notes: "",
      })
      .select("*, item:general_items(*)")
      .single();

    if (data) {
      onInventoryChange([...inventory, data as CharacterInventoryWithDetails]);
      setNewItemName("");
      setNewItemQty(1);
    }
  }

  async function removeItem(itemId: string) {
    const supabase = createClient();
    await supabase.from("character_inventory").delete().eq("id", itemId);
    onInventoryChange(inventory.filter((i) => i.id !== itemId));
  }

  async function updateQuantity(itemId: string, newQty: number) {
    if (newQty < 1) return removeItem(itemId);
    const supabase = createClient();
    await supabase.from("character_inventory").update({ quantity: newQty }).eq("id", itemId);
    onInventoryChange(inventory.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i)));
  }

  function handleItemSent(itemId: string, qty: number) {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;
    const remaining = item.quantity - qty;
    if (remaining <= 0) {
      onInventoryChange(inventory.filter((i) => i.id !== itemId));
    } else {
      onInventoryChange(
        inventory.map((i) => (i.id === itemId ? { ...i, quantity: remaining } : i))
      );
    }
    setSendingItem(null);
  }

  const itemName = (item: CharacterInventoryWithDetails) => {
    if (item.custom_name) return item.custom_name;
    if (item.item) return localized(item.item.name, item.item.name_en, locale);
    return "???";
  };

  const canTrade = !readOnly && tradeCharacters && tradeCharacters.length > 0;

  return (
    <GlassCard hover={false} data-testid="play-inventory-panel">
      <h3 className="mb-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("inventory")}
      </h3>

      {/* Weight + Encumbrance info */}
      <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          {t("totalWeight")}:{" "}
          <span className="font-mono font-medium text-foreground">{lbsToKg(totalWeight)} kg</span>
        </span>
        {!ignoreEncumbrance && (
          <Badge variant="outline" className="text-[10px]">
            {getEncumbranceLabel(encumbrance)}
          </Badge>
        )}
      </div>

      {/* Quick add */}
      {!readOnly && (
        <div className="mb-3 flex gap-1.5" data-testid="play-inventory-add">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder={t("itemName")}
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm"
            data-testid="play-inventory-name-input"
          />
          <input
            type="number"
            min="1"
            value={newItemQty}
            onChange={(e) => setNewItemQty(parseInt(e.target.value, 10) || 1)}
            className="w-14 rounded-md border border-border bg-background px-2 py-1 text-center text-sm"
            aria-label={t("quantity")}
            data-testid="play-inventory-qty-input"
          />
          <Button
            size="sm"
            className="h-8 shrink-0"
            onClick={addItem}
            disabled={!newItemName.trim()}
            data-testid="play-inventory-add-btn"
          >
            {t("addItem")}
          </Button>
        </div>
      )}

      {/* Item list */}
      {inventory.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noItems")}</p>
      ) : (
        <div className="space-y-1">
          {inventory.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-md border border-border px-2 py-1"
              data-testid={`play-inventory-item-${item.id}`}
            >
              <span className="min-w-0 flex-1 truncate text-sm">{itemName(item)}</span>
              {item.item?.weight ? (
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {lbsToKg(item.item.weight * item.quantity)} kg
                </span>
              ) : null}
              {!readOnly && (
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-xs"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label={`${itemName(item)} −1`}
                    data-testid={`play-inventory-minus-${item.id}`}
                  >
                    −
                  </Button>
                  <span className="w-6 text-center font-mono text-sm">{item.quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-xs"
                    aria-label={`${itemName(item)} +1`}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    data-testid={`play-inventory-plus-${item.id}`}
                  >
                    +
                  </Button>
                  {canTrade && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-xs text-muted-foreground hover:text-primary"
                      onClick={() => setSendingItem(item)}
                      aria-label={`${itemName(item)} ${t("sendItem")}`}
                      data-testid={`play-inventory-send-${item.id}`}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Send item dialog */}
      {sendingItem && tradeCharacters && (
        <SendItemDialog
          item={sendingItem}
          senderCharacterId={characterId}
          senderCharacterName={characterName}
          characters={tradeCharacters}
          onSend={handleItemSent}
          onClose={() => setSendingItem(null)}
        />
      )}
    </GlassCard>
  );
}
