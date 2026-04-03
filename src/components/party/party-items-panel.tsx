"use client";

import { useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { DistributeItemDialog } from "@/components/party/distribute-item-dialog";
import { createClient } from "@/lib/supabase/client";
import { localized } from "@/lib/utils/localize";
import type { PartyLootItemWithDetails, GeneralItemRow } from "@/lib/supabase/types";

interface CharacterOption {
  id: string;
  name: string;
  user_id: string;
}

interface PartyItemsPanelProps {
  items: PartyLootItemWithDetails[];
  userId: string;
  characters: CharacterOption[];
  allGeneralItems: GeneralItemRow[];
  activeCharacterName?: string;
}

export function PartyItemsPanel({
  items: initialItems,
  userId,
  characters,
  allGeneralItems,
  activeCharacterName = "",
}: PartyItemsPanelProps) {
  const t = useTranslations("party");
  const locale = useLocale();
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [customName, setCustomName] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [distributeItem, setDistributeItem] = useState<PartyLootItemWithDetails | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredGeneralItems = searchQuery.trim()
    ? allGeneralItems
        .filter(
          (gi) =>
            gi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (gi.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
        )
        .slice(0, 10)
    : [];

  function itemName(item: PartyLootItemWithDetails): string {
    if (item.custom_name) return item.custom_name;
    if (item.item) return localized(item.item.name, item.item.name_en, locale);
    return "???";
  }

  async function addFromCatalog(generalItem: GeneralItemRow) {
    if (savingId) return;
    setSavingId("add");

    const { data, error } = await supabase
      .from("party_loot_items")
      .insert({
        item_id: generalItem.id,
        quantity: 1,
        added_by: userId,
      })
      .select("*, item:general_items(*)")
      .single();

    setSavingId(null);
    if (error || !data) return;

    const name = localized(generalItem.name, generalItem.name_en, locale);
    await supabase.from("party_loot_log").insert({
      action: "add_item",
      user_id: userId,
      details: { item_name: name, quantity: 1, actor: activeCharacterName },
    });
    setItems([data as PartyLootItemWithDetails, ...items]);
    setSearchQuery("");
    setShowSearch(false);
  }

  async function addCustomItem() {
    if (!customName.trim() || savingId) return;
    setSavingId("add");

    const { data, error } = await supabase
      .from("party_loot_items")
      .insert({
        custom_name: customName.trim(),
        quantity: 1,
        added_by: userId,
      })
      .select("*, item:general_items(*)")
      .single();

    setSavingId(null);
    if (error || !data) return;

    await supabase.from("party_loot_log").insert({
      action: "add_item",
      user_id: userId,
      details: {
        item_name: customName.trim(),
        custom_name: customName.trim(),
        quantity: 1,
        actor: activeCharacterName,
      },
    });
    setItems([data as PartyLootItemWithDetails, ...items]);
    setCustomName("");
    setShowSearch(false);
  }

  async function removeItem(item: PartyLootItemWithDetails) {
    if (savingId === item.id) return;
    setSavingId(item.id);

    await supabase.from("party_loot_items").delete().eq("id", item.id);
    await supabase.from("party_loot_log").insert({
      action: "remove_item",
      user_id: userId,
      details: { item_name: itemName(item), quantity: item.quantity, actor: activeCharacterName },
    });
    setItems(items.filter((i) => i.id !== item.id));
    setSavingId(null);
  }

  async function updateQuantity(itemId: string, newQty: number) {
    if (savingId === itemId) return;
    if (newQty < 1) {
      const item = items.find((i) => i.id === itemId);
      if (item) return removeItem(item);
      return;
    }
    setSavingId(itemId);
    await supabase.from("party_loot_items").update({ quantity: newQty }).eq("id", itemId);
    setItems(items.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i)));
    setSavingId(null);
  }

  function handleDistributed(itemId: string, distributedQty: number) {
    setItems((prev) => {
      const item = prev.find((i) => i.id === itemId);
      if (!item) return prev;
      const remaining = item.quantity - distributedQty;
      if (remaining <= 0) return prev.filter((i) => i.id !== itemId);
      return prev.map((i) => (i.id === itemId ? { ...i, quantity: remaining } : i));
    });
    setDistributeItem(null);
  }

  return (
    <GlassCard hover={false} data-testid="party-items-panel">
      <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("items")}
      </h3>

      {/* Add item controls */}
      <div className="mb-3 space-y-2" data-testid="party-items-add">
        <div className="flex gap-1.5">
          <input
            ref={searchRef}
            type="text"
            value={showSearch ? searchQuery : customName}
            onChange={(e) => {
              if (showSearch) {
                setSearchQuery(e.target.value);
              } else {
                setCustomName(e.target.value);
              }
            }}
            onFocus={() => setShowSearch(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !showSearch) addCustomItem();
            }}
            placeholder={showSearch ? t("searchItems") : t("itemName")}
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm"
            data-testid="party-items-search-input"
          />
          <Button
            size="sm"
            className="h-8 shrink-0"
            onClick={() => {
              if (showSearch && searchQuery.trim()) {
                setCustomName(searchQuery);
                setShowSearch(false);
                setSearchQuery("");
              } else if (!showSearch) {
                addCustomItem();
              }
            }}
            disabled={(showSearch ? false : !customName.trim()) || savingId === "add"}
            data-testid="party-items-add-btn"
          >
            {t("addItem")}
          </Button>
        </div>

        {/* Search results dropdown */}
        {showSearch && searchQuery.trim() && (
          <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-background">
            {filteredGeneralItems.length > 0 ? (
              filteredGeneralItems.map((gi) => (
                <button
                  key={gi.id}
                  type="button"
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => addFromCatalog(gi)}
                  data-testid={`party-items-catalog-${gi.id}`}
                >
                  {localized(gi.name, gi.name_en, locale)}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    setCustomName(searchQuery);
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                >
                  {t("customItem")}: &quot;{searchQuery}&quot;
                </button>
              </div>
            )}
            {filteredGeneralItems.length > 0 && (
              <div className="border-t border-border px-3 py-1.5">
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    setCustomName(searchQuery);
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                >
                  {t("customItem")}: &quot;{searchQuery}&quot;
                </button>
              </div>
            )}
          </div>
        )}

        {/* Custom name input (when search dismissed) */}
        {!showSearch && customName && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t("customItem")}:</span>
            <span className="font-medium text-foreground">{customName}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1 text-xs"
              onClick={() => {
                setCustomName("");
                setShowSearch(true);
                setTimeout(() => searchRef.current?.focus(), 0);
              }}
            >
              ×
            </Button>
          </div>
        )}
      </div>

      {/* Item list */}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="party-items-empty">
          {t("noItems")}
        </p>
      ) : (
        <div className="space-y-1" data-testid="party-items-list">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-md border border-border px-2 py-1"
              data-testid={`party-item-${item.id}`}
            >
              <span className="min-w-0 flex-1 truncate text-sm">{itemName(item)}</span>

              {/* Quantity controls */}
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-xs"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={savingId === item.id}
                  aria-label={`${itemName(item)} −1`}
                  data-testid={`party-item-minus-${item.id}`}
                >
                  −
                </Button>
                <span className="w-6 text-center font-mono text-sm">{item.quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-xs"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={savingId === item.id}
                  aria-label={`${itemName(item)} +1`}
                  data-testid={`party-item-plus-${item.id}`}
                >
                  +
                </Button>
              </div>

              {/* Distribute button */}
              <Button
                variant="outline"
                size="sm"
                className="h-6 shrink-0 px-2 text-xs"
                onClick={() => setDistributeItem(item)}
                data-testid={`party-item-distribute-${item.id}`}
              >
                {t("distributeItem")}
              </Button>

              {/* Remove button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 shrink-0 p-0 text-xs text-muted-foreground hover:text-red-400"
                onClick={() => removeItem(item)}
                disabled={savingId === item.id}
                aria-label={t("removeItem", { item: itemName(item) })}
                data-testid={`party-item-remove-${item.id}`}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Distribute Item dialog */}
      {distributeItem && (
        <DistributeItemDialog
          item={distributeItem}
          characters={characters}
          userId={userId}
          onDistribute={handleDistributed}
          onClose={() => setDistributeItem(null)}
        />
      )}
    </GlassCard>
  );
}
