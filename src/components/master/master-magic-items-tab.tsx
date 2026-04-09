"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search, Plus, ChevronDown, ChevronUp, Trash2, Pencil } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { localized } from "@/lib/utils/localize";
import { MagicEffectBadges } from "@/components/shared/magic-effect-badges";
import { MagicItemForm, type MagicItemFormData } from "@/components/shared/magic-item-form";
import {
  createMagicItem,
  updateMagicItem,
  deleteMagicItem,
  injectMagicItemToCharacter,
  injectMagicItemToParty,
} from "@/app/master/actions";
import type { CharacterRow, MagicItemRow, BookmarkEntityType } from "@/lib/supabase/types";
import { BookmarkToggle } from "./bookmark-toggle";

interface MagicItemDistribution {
  owners: { characterId: string; characterName: string; equipped: boolean }[];
  inPartyLoot: boolean;
}

interface MasterMagicItemsTabProps {
  magicItems: MagicItemRow[];
  characters: CharacterRow[];
  distribution: Map<string, MagicItemDistribution>;
  bookmarkSet: Set<string>;
  userId: string;
  onBookmarkToggle: (entityType: BookmarkEntityType, entityId: string) => void;
  onMagicItemsChange: () => void;
}

export function MasterMagicItemsTab({
  magicItems,
  characters,
  distribution,
  bookmarkSet,
  userId,
  onBookmarkToggle,
  onMagicItemsChange,
}: MasterMagicItemsTabProps) {
  const t = useTranslations("master");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [injectingKey, setInjectingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // After creating, show inject targets for this catalog item
  const [pendingInjectItem, setPendingInjectItem] = useState<MagicItemRow | null>(null);

  function showToastMsg(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const activeChars = useMemo(() => characters.filter((c) => c.is_active), [characters]);

  const filteredMagicItems = useMemo(() => {
    if (!search.trim()) return magicItems;
    const q = search.toLowerCase();
    return magicItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.name_en?.toLowerCase().includes(q) ?? false) ||
        (item.category?.toLowerCase().includes(q) ?? false)
    );
  }, [magicItems, search]);

  const handleCreateAndDistribute = useCallback(
    async (formData: MagicItemFormData) => {
      setCreating(true);
      const result = await createMagicItem({
        name: formData.name,
        name_en: formData.nameEn || undefined,
        category: formData.category || undefined,
        magic_effects: formData.effects,
      });
      setCreating(false);

      if (result.success && result.item) {
        showToastMsg(t("magicItemCreated"), "success");
        setPendingInjectItem(result.item);
        setShowCreate(false);
        onMagicItemsChange();
      } else {
        showToastMsg(t("injectFailed"), "error");
      }
    },
    [t, onMagicItemsChange]
  );

  async function handleInjectCatalogItem(item: MagicItemRow, characterId: string) {
    setInjectingKey(`${item.id}:${characterId}`);
    const result = await injectMagicItemToCharacter(characterId, {
      name: item.name,
      name_en: item.name_en ?? undefined,
      category: item.category ?? undefined,
      magic_effects: item.magic_effects,
      magic_item_id: item.id,
    });
    setInjectingKey(null);
    if (result.success) {
      showToastMsg(t("injected"), "success");
      setPendingInjectItem(null);
      onMagicItemsChange();
    } else {
      showToastMsg(t("injectFailed"), "error");
    }
  }

  async function handleInjectToParty(item: MagicItemRow) {
    setInjectingKey(`${item.id}:party`);
    const result = await injectMagicItemToParty({
      name: item.name,
      name_en: item.name_en ?? undefined,
      category: item.category ?? undefined,
      magic_effects: item.magic_effects,
      magic_item_id: item.id,
    });
    setInjectingKey(null);
    if (result.success) {
      showToastMsg(t("injectedToParty"), "success");
      setPendingInjectItem(null);
      onMagicItemsChange();
    } else {
      showToastMsg(t("injectFailed"), "error");
    }
  }

  async function handleUpdateItem(id: string, formData: MagicItemFormData) {
    const result = await updateMagicItem(id, {
      name: formData.name,
      name_en: formData.nameEn || undefined,
      category: formData.category || undefined,
      magic_effects: formData.effects,
    });
    if (result.success) {
      showToastMsg(t("saved"), "success");
      setEditingItemId(null);
      onMagicItemsChange();
    } else {
      showToastMsg(t("saveFailed"), "error");
    }
  }

  async function handleDeleteItem(id: string) {
    const result = await deleteMagicItem(id);
    if (result.success) {
      showToastMsg(t("magicItemDeleted"), "success");
      setDeleteConfirmId(null);
      onMagicItemsChange();
    } else {
      showToastMsg(
        result.error === "Item is still in use" ? t("magicItemInUse") : t("injectFailed"),
        "error"
      );
      setDeleteConfirmId(null);
    }
  }

  function renderInjectButtons(item: MagicItemRow) {
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {activeChars.map((char) => (
          <Button
            key={char.id}
            variant="outline"
            size="sm"
            disabled={injectingKey === `${item.id}:${char.id}`}
            onClick={() => handleInjectCatalogItem(item, char.id)}
            className="h-6 px-2 text-xs"
            data-testid={`gm-magic-inject-${item.id}-${char.id}`}
          >
            {t("injectTo", { name: char.name })}
          </Button>
        ))}
        <Button
          variant="secondary"
          size="sm"
          disabled={injectingKey === `${item.id}:party`}
          onClick={() => handleInjectToParty(item)}
          className="h-6 bg-amber-700/30 px-2 text-xs text-amber-300 hover:bg-amber-700/50"
          data-testid={`gm-magic-inject-party-${item.id}`}
        >
          {t("injectToParty")}
        </Button>
      </div>
    );
  }

  function renderOwnerInfo(item: MagicItemRow) {
    const dist = distribution.get(item.id);
    if (!dist || (dist.owners.length === 0 && !dist.inPartyLoot)) {
      return (
        <span className="text-xs text-muted-foreground" data-testid={`magic-owners-${item.id}`}>
          {t("magicItemNoOwners")}
        </span>
      );
    }
    return (
      <div className="flex flex-wrap gap-1" data-testid={`magic-owners-${item.id}`}>
        {dist.owners.map((o) => (
          <Badge key={o.characterId} variant="outline" className="text-xs">
            {o.characterName}
            {o.equipped ? " ✓" : ""}
          </Badge>
        ))}
        {dist.inPartyLoot && (
          <Badge variant="secondary" className="text-xs">
            {t("magicItemInParty")}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div data-testid="gm-magic-items-tab">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchMagicItems")}
          className="pl-9"
          data-testid="gm-magic-search"
        />
      </div>

      {/* Magic Items List */}
      <div className="space-y-2">
        {filteredMagicItems.map((item) => (
          <GlassCard
            key={item.id}
            hover={false}
            className="p-3"
            data-testid={`gm-magic-item-${item.id}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {localized(item.name, item.name_en, locale)}
                  </span>
                  {item.category && (
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  )}
                </div>
                <MagicEffectBadges effects={item.magic_effects} id={item.id} />
                <div className="mt-1">{renderOwnerInfo(item)}</div>
              </div>
              <div className="flex items-center gap-1">
                <BookmarkToggle
                  entityType="magic_item"
                  entityId={item.id}
                  isBookmarked={bookmarkSet.has(`magic_item:${item.id}`)}
                  userId={userId}
                  onToggle={onBookmarkToggle}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setEditingItemId(editingItemId === item.id ? null : item.id)}
                  data-testid={`gm-magic-edit-${item.id}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => setDeleteConfirmId(item.id)}
                  data-testid={`gm-magic-delete-${item.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Inline edit form */}
            {editingItemId === item.id && (
              <div className="mt-3 border-t border-border pt-3">
                <MagicItemForm
                  initialData={{
                    name: item.name,
                    nameEn: item.name_en ?? "",
                    category: item.category ?? "",
                    effects: item.magic_effects,
                  }}
                  onSubmit={(formData) => handleUpdateItem(item.id, formData)}
                  submitLabel={t("save")}
                  loading={false}
                />
              </div>
            )}

            {/* Inject buttons */}
            {renderInjectButtons(item)}
          </GlassCard>
        ))}

        {filteredMagicItems.length === 0 && (
          <p
            className="py-8 text-center text-sm text-muted-foreground"
            data-testid="gm-magic-no-results"
          >
            {search.trim() ? t("noResults") : t("noMagicItems")}
          </p>
        )}
      </div>

      {/* Pending inject after create */}
      {pendingInjectItem && (
        <GlassCard hover={false} className="mt-3 p-4" data-testid="gm-magic-inject-targets">
          <div className="mb-2 text-sm font-medium">
            {t("distributeItem")}: {pendingInjectItem.name}
            {pendingInjectItem.category ? ` (${pendingInjectItem.category})` : ""}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeChars.map((char) => (
              <Button
                key={char.id}
                variant="outline"
                size="sm"
                disabled={injectingKey === `${pendingInjectItem.id}:${char.id}`}
                onClick={() => handleInjectCatalogItem(pendingInjectItem, char.id)}
                data-testid={`gm-magic-pending-inject-${char.id}`}
              >
                {char.name}
              </Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              disabled={injectingKey === `${pendingInjectItem.id}:party`}
              onClick={() => handleInjectToParty(pendingInjectItem)}
              className="bg-amber-700/30 text-amber-300 hover:bg-amber-700/50"
              data-testid="gm-magic-pending-inject-party"
            >
              {t("injectToParty")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPendingInjectItem(null)}>
              {t("cancel")}
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Create new magic item */}
      <div className="mt-3">
        <Button
          variant="ghost"
          onClick={() => setShowCreate(!showCreate)}
          className="w-full justify-start gap-2 text-primary hover:text-primary"
          data-testid="gm-magic-create-toggle"
        >
          {showCreate ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {t("createMagicItem")}
        </Button>

        {showCreate && (
          <GlassCard hover={false} className="mt-2 p-4" data-testid="gm-magic-item-create">
            <MagicItemForm
              onSubmit={handleCreateAndDistribute}
              submitLabel={t("createAndDistribute")}
              loading={creating}
            />
          </GlassCard>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <ConfirmDialog
          open={true}
          title={t("deleteMagicItemTitle")}
          message={t("deleteMagicItemDesc")}
          onConfirm={() => handleDeleteItem(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
          confirmLabel={t("delete")}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-2 text-sm shadow-lg ${
            toast.type === "success"
              ? "bg-green-800/90 text-green-100"
              : "bg-red-800/90 text-red-100"
          }`}
          data-testid="gm-magic-toast"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
