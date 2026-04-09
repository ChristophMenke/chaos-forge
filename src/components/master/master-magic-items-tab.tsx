"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Trash2, Pencil } from "lucide-react";
import { GlassCard } from "@/components/glass-card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { localized } from "@/lib/utils/localize";
import { MagicEffectBadges } from "@/components/shared/magic-effect-badges";
import { MagicItemForm, type MagicItemFormData } from "@/components/shared/magic-item-form";
import {
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
  search: string;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onToast: (message: string, type: "success" | "error") => void;
  onFilteredCountChange?: (count: number) => void;
}

export function MasterMagicItemsTab({
  magicItems,
  characters,
  distribution,
  bookmarkSet,
  userId,
  onBookmarkToggle,
  onMagicItemsChange,
  search,
  page,
  pageSize,
  onPageChange,
  onToast,
  onFilteredCountChange,
}: MasterMagicItemsTabProps) {
  const t = useTranslations("master");
  const locale = useLocale();
  const [injectingKey, setInjectingKey] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  useEffect(() => {
    onFilteredCountChange?.(filteredMagicItems.length);
  }, [filteredMagicItems.length, onFilteredCountChange]);

  const pagedMagicItems = filteredMagicItems.slice((page - 1) * pageSize, page * pageSize);

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
      onToast(t("injected"), "success");

      onMagicItemsChange();
    } else {
      onToast(t("injectFailed"), "error");
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
      onToast(t("injectedToParty"), "success");

      onMagicItemsChange();
    } else {
      onToast(t("injectFailed"), "error");
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
      onToast(t("saved"), "success");
      setEditingItemId(null);
      onMagicItemsChange();
    } else {
      onToast(t("saveFailed"), "error");
    }
  }

  async function handleDeleteItem(id: string) {
    const result = await deleteMagicItem(id);
    if (result.success) {
      onToast(t("magicItemDeleted"), "success");
      setDeleteConfirmId(null);
      onMagicItemsChange();
    } else {
      onToast(
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
            {t("injectToCharacter", { name: char.name })}
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
      {/* Magic Items List */}
      <div className="space-y-2">
        {pagedMagicItems.map((item) => (
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
    </div>
  );
}
