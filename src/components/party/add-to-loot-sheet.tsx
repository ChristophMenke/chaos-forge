"use client";

import { useState, useMemo, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Shield, AlertTriangle, Minus, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { localized } from "@/lib/utils/localize";
import type { OwnedItem, OwnedItemGroup } from "@/lib/party-loot/types";

interface AddToLootSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownedItemGroups: OwnedItemGroup[];
  defaultCharacterId?: string;
}

type Step = "character" | "item" | "quantity";

export function AddToLootSheet({
  open,
  onOpenChange,
  ownedItemGroups,
  defaultCharacterId,
}: AddToLootSheetProps) {
  const t = useTranslations("party");
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const initialCharId =
    defaultCharacterId && ownedItemGroups.some((g) => g.character.id === defaultCharacterId)
      ? defaultCharacterId
      : ownedItemGroups.length === 1
        ? ownedItemGroups[0]!.character.id
        : "";

  const [step, setStep] = useState<Step>(initialCharId ? "item" : "character");
  const [characterId, setCharacterId] = useState(initialCharId);
  const [selectedItem, setSelectedItem] = useState<OwnedItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const busy = isSaving || isPending;

  const selectedGroup = useMemo(
    () => ownedItemGroups.find((g) => g.character.id === characterId),
    [ownedItemGroups, characterId]
  );

  const displayName = (item: OwnedItem) => localized(item.name, item.nameEn, locale);

  const filtered = useMemo(() => {
    if (!selectedGroup) return { equipped: [], inventory: [] };
    const q = search.trim().toLowerCase();
    if (!q) return { equipped: selectedGroup.equipped, inventory: selectedGroup.inventory };
    const match = (item: OwnedItem) =>
      item.name.toLowerCase().includes(q) || (item.nameEn?.toLowerCase().includes(q) ?? false);
    return {
      equipped: selectedGroup.equipped.filter(match),
      inventory: selectedGroup.inventory.filter(match),
    };
  }, [selectedGroup, search]);

  function reset() {
    const char =
      defaultCharacterId ?? (ownedItemGroups.length === 1 ? ownedItemGroups[0]!.character.id : "");
    setStep(char ? "item" : "character");
    setCharacterId(char);
    setSelectedItem(null);
    setQuantity(1);
    setSearch("");
    setError("");
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  function pickCharacter(id: string) {
    setCharacterId(id);
    setStep("item");
  }

  function pickItem(item: OwnedItem) {
    setSelectedItem(item);
    setQuantity(1);
    setStep("quantity");
  }

  async function handleConfirm() {
    if (!selectedItem || busy) return;
    setIsSaving(true);
    setError("");

    const toastId = toast.loading(t("moveLoading"));
    try {
      const { error: rpcError } = await supabase.rpc("move_to_party_loot", {
        p_character_id: selectedItem.characterId,
        p_source_type: selectedItem.sourceType,
        p_source_row_id: selectedItem.sourceRowId,
        p_quantity: quantity,
      });

      if (rpcError) {
        toast.error(t("moveError"), { id: toastId });
        setError(rpcError.message);
        return;
      }

      toast.success(t("moveSuccess"), { id: toastId });
      startTransition(() => {
        router.refresh();
      });
      handleClose(false);
    } finally {
      setIsSaving(false);
    }
  }

  const maxQty = selectedItem?.stackable ? selectedItem.quantity : 1;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 rounded-none p-0 sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-xl"
        data-testid="add-to-loot-sheet"
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          {step !== "character" && ownedItemGroups.length > 1 && step === "item" && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setStep("character")}
              data-testid="add-loot-back"
              aria-label={t("back")}
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          {step === "quantity" && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setStep("item")}
              data-testid="add-loot-back"
              aria-label={t("back")}
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <div className="flex-1">
            <DialogTitle className="text-base">{t("addToLoot")}</DialogTitle>
            <DialogDescription className="text-xs">
              {step === "character" && t("pickCharacter")}
              {step === "item" && selectedGroup && selectedGroup.character.name}
              {step === "quantity" && selectedItem && displayName(selectedItem)}
            </DialogDescription>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {step === "character" && (
            <ul className="space-y-2" data-testid="add-loot-character-list">
              {ownedItemGroups.map((group) => (
                <li key={group.character.id}>
                  <button
                    type="button"
                    onClick={() => pickCharacter(group.character.id)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-card/50 p-3 text-left transition hover:border-primary hover:bg-card"
                    data-testid={`add-loot-character-${group.character.id}`}
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-sm">
                      {group.character.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{group.character.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {t("itemCount", {
                          count: group.equipped.length + group.inventory.length,
                        })}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
              {ownedItemGroups.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t("noOwnCharacters")}
                </p>
              )}
            </ul>
          )}

          {step === "item" && selectedGroup && (
            <div className="space-y-4">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchItems")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                data-testid="add-loot-search"
              />

              {filtered.equipped.length > 0 && (
                <section>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Shield className="size-3.5" /> {t("equipped")}
                  </h4>
                  <ul className="space-y-1.5">
                    {filtered.equipped.map((item) => (
                      <ItemRow
                        key={`eq-${item.sourceRowId}`}
                        item={item}
                        onSelect={pickItem}
                        label={displayName(item)}
                      />
                    ))}
                  </ul>
                </section>
              )}

              {filtered.inventory.length > 0 && (
                <section>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Package className="size-3.5" /> {t("inventory")}
                  </h4>
                  <ul className="space-y-1.5">
                    {filtered.inventory.map((item) => (
                      <ItemRow
                        key={`inv-${item.sourceRowId}`}
                        item={item}
                        onSelect={pickItem}
                        label={displayName(item)}
                      />
                    ))}
                  </ul>
                </section>
              )}

              {filtered.equipped.length === 0 && filtered.inventory.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {search ? t("noItemsFound") : t("noItemsAvailable")}
                </p>
              )}
            </div>
          )}

          {step === "quantity" && selectedItem && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card/50 p-3">
                <div className="font-medium">{displayName(selectedItem)}</div>
                <div className="text-xs text-muted-foreground">
                  {t("availableCount", { count: selectedItem.quantity })}
                </div>
              </div>

              {selectedItem.equipped && (
                <div
                  className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-200"
                  data-testid="add-loot-equipped-warning"
                >
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  <span>{t("equippedWarning")}</span>
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs text-muted-foreground">{t("quantity")}</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || !selectedItem.stackable}
                    data-testid="add-loot-qty-minus"
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
                    disabled={!selectedItem.stackable}
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-center text-sm"
                    data-testid="add-loot-qty-input"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    disabled={quantity >= maxQty || !selectedItem.stackable}
                    data-testid="add-loot-qty-plus"
                    aria-label={t("increase")}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400" data-testid="add-loot-error">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "quantity" && (
          <div className="flex gap-2 border-t border-border px-4 py-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => handleClose(false)}
              data-testid="add-loot-cancel"
            >
              {t("cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={busy}
              data-testid="add-loot-confirm"
            >
              {busy && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              {busy ? t("saving") : t("confirm")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ItemRowProps {
  item: OwnedItem;
  onSelect: (item: OwnedItem) => void;
  label: string;
}

function ItemRow({ item, onSelect, label }: ItemRowProps) {
  const t = useTranslations("party");
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-card/30 px-3 py-2 text-left text-sm transition hover:border-primary hover:bg-card"
        data-testid={`add-loot-item-${item.sourceType}-${item.sourceRowId}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate">{label}</span>
          {item.equipped && (
            <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
              {t("equippedBadge")}
            </span>
          )}
        </span>
        {item.stackable && item.quantity > 1 && (
          <span className="shrink-0 text-xs text-muted-foreground">×{item.quantity}</span>
        )}
      </button>
    </li>
  );
}
