"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { localized } from "@/lib/utils/localize";
import { DamageLevelCard } from "./damage-level-card";
import { SimpleEpicCard } from "./simple-epic-card";
import type { CharacterRow, EpicItemRow } from "@/lib/supabase/types";

interface EpicEquipmentViewProps {
  character: Pick<CharacterRow, "id" | "name" | "avatar_url" | "user_id">;
  epicItems: EpicItemRow[];
  isOwner: boolean;
}

export function EpicEquipmentView({ character, epicItems, isOwner }: EpicEquipmentViewProps) {
  const t = useTranslations("epic");
  const locale = useLocale();
  const [items, setItems] = useState<EpicItemRow[]>(epicItems);

  async function handleToggleEquip(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item || !isOwner) return;

    const newEquipped = !item.equipped;

    // Optimistic update
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, equipped: newEquipped } : i)));

    const supabase = createClient();
    const { error } = await supabase
      .from("epic_items")
      .update({ equipped: newEquipped })
      .eq("id", itemId);

    if (error) {
      // Rollback on error
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, equipped: !newEquipped } : i)));
    }
  }

  async function handleDamageLevelChange(itemId: string, newLevel: number) {
    const item = items.find((i) => i.id === itemId);
    if (!item || !isOwner) return;

    const oldLevel = item.damage_level;

    // Optimistic update
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, damage_level: newLevel } : i)));

    const supabase = createClient();
    const { error } = await supabase
      .from("epic_items")
      .update({ damage_level: newLevel })
      .eq("id", itemId);

    if (error) {
      // Rollback
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, damage_level: oldLevel } : i)));
    }
  }

  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6"
      data-testid="epic-equipment-page"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/characters/${character.id}`}
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          data-testid="epic-back-link"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {character.avatar_url ? (
          <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-primary/30">
            <Image
              src={character.avatar_url}
              alt={character.name}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/30 bg-muted font-heading text-lg">
            {character.name.charAt(0)}
          </div>
        )}
        <div>
          <h1
            className="flex items-center gap-2 font-heading text-2xl text-primary"
            data-testid="epic-title"
          >
            <Sparkles className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{character.name}</p>
        </div>
      </div>

      {/* Item list */}
      {items.length === 0 ? (
        <div
          className="glass rounded-xl p-8 text-center text-muted-foreground"
          data-testid="epic-no-items"
        >
          {t("noItems")}
        </div>
      ) : (
        <div className="flex flex-col gap-4" data-testid="epic-items-list">
          {items.map((item) =>
            item.max_damage_level > 0 ? (
              <DamageLevelCard
                key={item.id}
                item={item}
                locale={locale}
                isOwner={isOwner}
                onToggleEquip={handleToggleEquip}
                onDamageLevelChange={handleDamageLevelChange}
              />
            ) : (
              <SimpleEpicCard
                key={item.id}
                item={item}
                locale={locale}
                isOwner={isOwner}
                onToggleEquip={handleToggleEquip}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
