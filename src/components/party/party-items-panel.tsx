"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Sparkles, Plus, Trash2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { DistributeItemSheet } from "@/components/party/distribute-item-sheet";
import { AddToLootSheet } from "@/components/party/add-to-loot-sheet";
import { createClient } from "@/lib/supabase/client";
import { localized } from "@/lib/utils/localize";
import { MagicEffectBadges } from "@/components/shared/magic-effect-badges";
import type { PartyLootItemWithDetails } from "@/lib/supabase/types";
import type { OwnedItemGroup } from "@/lib/party-loot/types";

interface CharacterOption {
  id: string;
  name: string;
  user_id: string;
}

interface PartyItemsPanelProps {
  items: PartyLootItemWithDetails[];
  userId: string;
  characters: CharacterOption[];
  characterMap: Record<string, string>;
  ownedItemGroups: OwnedItemGroup[];
  activeCharacterId?: string;
  activeCharacterName?: string;
}

export function PartyItemsPanel({
  items,
  userId,
  characters,
  characterMap,
  ownedItemGroups,
  activeCharacterId,
  activeCharacterName = "",
}: PartyItemsPanelProps) {
  const t = useTranslations("party");
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();
  const [distributeItem, setDistributeItem] = useState<PartyLootItemWithDetails | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  function itemName(item: PartyLootItemWithDetails): string {
    if (item.custom_label) return item.custom_label;
    if (item.custom_name) return item.custom_name;
    if (item.item) return localized(item.item.name, item.item.name_en, locale);
    return "???";
  }

  function isMagicItem(item: PartyLootItemWithDetails): boolean {
    return !!(
      item.magic_item_id ||
      (item.magic_effects && Object.keys(item.magic_effects).length > 0)
    );
  }

  function sourceLabel(item: PartyLootItemWithDetails): string | null {
    if (!item.source_character_id) return null;
    return characterMap[item.source_character_id] ?? null;
  }

  async function removeItem(item: PartyLootItemWithDetails) {
    if (removingId) return;
    setRemovingId(item.id);
    const toastId = toast.loading(t("removeLoading"));
    try {
      const { error } = await supabase.from("party_loot_items").delete().eq("id", item.id);
      if (error) {
        toast.error(t("removeError"), { id: toastId });
        return;
      }
      await supabase.from("party_loot_log").insert({
        action: "remove_item",
        user_id: userId,
        details: {
          item_name: itemName(item),
          quantity: item.quantity,
          actor: activeCharacterName,
        },
      });
      toast.success(t("removeSuccess"), { id: toastId });
      router.refresh();
    } finally {
      setRemovingId(null);
    }
  }

  function handleDistributed() {
    setDistributeItem(null);
    router.refresh();
  }

  const canAdd = ownedItemGroups.some((g) => g.equipped.length > 0 || g.inventory.length > 0);

  return (
    <GlassCard hover={false} data-testid="party-items-panel">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("items")}
        </h3>
        <Button
          size="sm"
          onClick={() => setAddSheetOpen(true)}
          disabled={!canAdd}
          data-testid="party-items-add-btn"
        >
          <Plus className="mr-1 size-4" />
          {t("addItem")}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8" data-testid="party-items-empty">
          <Image
            src="/images/empty-states/treasure-chest.webp"
            alt=""
            width={160}
            height={120}
            className="opacity-50"
          />
          <p className="text-center text-sm text-muted-foreground">{t("noItems")}</p>
          {!canAdd && (
            <p className="text-center text-xs text-muted-foreground">{t("noOwnItemsHint")}</p>
          )}
        </div>
      ) : (
        <ul className="space-y-2" data-testid="party-items-list">
          {items.map((item) => {
            const name = itemName(item);
            const source = sourceLabel(item);
            const isLegacy = !item.source_character_id;
            return (
              <li
                key={item.id}
                className="rounded-lg border border-border bg-card/40 p-3 transition hover:bg-card/60"
                data-testid={`party-item-${item.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {isMagicItem(item) && (
                        <Sparkles className="size-3.5 shrink-0 text-amber-400" />
                      )}
                      <span className="truncate text-sm font-medium">{name}</span>
                      {item.quantity > 1 && (
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          ×{item.quantity}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {source && (
                        <span
                          className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary"
                          data-testid={`party-item-source-${item.id}`}
                        >
                          {t("fromCharacter", { name: source })}
                        </span>
                      )}
                      {isLegacy && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {t("legacyItem")}
                        </span>
                      )}
                    </div>
                    {isMagicItem(item) && item.magic_effects && (
                      <div className="mt-2">
                        <MagicEffectBadges effects={item.magic_effects} id={item.id} />
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDistributeItem(item)}
                      data-testid={`party-item-distribute-${item.id}`}
                      aria-label={t("distributeItemLabel", { item: name })}
                    >
                      <Send className="size-3.5" />
                      <span className="hidden sm:ml-1 sm:inline">{t("distributeItem")}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeItem(item)}
                      disabled={removingId === item.id}
                      aria-label={t("removeItem", { item: name })}
                      data-testid={`party-item-remove-${item.id}`}
                    >
                      {removingId === item.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AddToLootSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        ownedItemGroups={ownedItemGroups}
        defaultCharacterId={activeCharacterId}
      />

      {distributeItem && (
        <DistributeItemSheet
          item={distributeItem}
          characters={characters}
          userId={userId}
          activeCharacterName={activeCharacterName}
          onDistribute={handleDistributed}
          onClose={() => setDistributeItem(null)}
        />
      )}
    </GlassCard>
  );
}
