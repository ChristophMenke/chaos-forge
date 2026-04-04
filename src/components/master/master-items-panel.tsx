"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search, Swords, ShieldIcon, Package } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { localized } from "@/lib/utils/localize";
import { lbsToKg } from "@/lib/utils/units";
import { injectItemToCharacter, injectItemToParty } from "@/app/master/actions";
import type { CharacterRow, WeaponRow, ArmorRow, GeneralItemRow } from "@/lib/supabase/types";

interface MasterItemsPanelProps {
  weapons: WeaponRow[];
  armor: ArmorRow[];
  generalItems: GeneralItemRow[];
  characters: CharacterRow[];
}

type ItemTab = "weapons" | "armor" | "items";

export function MasterItemsPanel({
  weapons,
  armor,
  generalItems,
  characters,
}: MasterItemsPanelProps) {
  const t = useTranslations("master");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [itemTab, setItemTab] = useState<ItemTab>("weapons");
  const [injectingKey, setInjectingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filter items by search
  const filteredWeapons = useMemo(() => {
    if (!search.trim()) return weapons.slice(0, 30);
    const q = search.toLowerCase();
    return weapons
      .filter(
        (w) => w.name.toLowerCase().includes(q) || (w.name_en?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 30);
  }, [weapons, search]);

  const filteredArmor = useMemo(() => {
    if (!search.trim()) return armor.slice(0, 30);
    const q = search.toLowerCase();
    return armor
      .filter(
        (a) => a.name.toLowerCase().includes(q) || (a.name_en?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 30);
  }, [armor, search]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return generalItems.slice(0, 30);
    const q = search.toLowerCase();
    return generalItems
      .filter(
        (i) => i.name.toLowerCase().includes(q) || (i.name_en?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 30);
  }, [generalItems, search]);

  async function handleInjectToCharacter(
    characterId: string,
    itemType: "weapon" | "armor" | "general",
    itemId: string
  ) {
    const key = `${itemId}:${characterId}`;
    setInjectingKey(key);
    const result = await injectItemToCharacter(characterId, itemType, itemId);
    setInjectingKey(null);
    showToast(
      result.success ? t("injected") : t("injectFailed"),
      result.success ? "success" : "error"
    );
  }

  async function handleInjectToParty(
    itemType: "weapon" | "armor" | "general",
    itemId: string,
    name: string
  ) {
    const key = `${itemId}:party`;
    setInjectingKey(key);
    const result = await injectItemToParty(itemType, itemId, name);
    setInjectingKey(null);
    showToast(
      result.success ? t("injected") : t("injectFailed"),
      result.success ? "success" : "error"
    );
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const itemTabs: { id: ItemTab; label: string; icon: React.ReactNode }[] = [
    { id: "weapons", label: t("weapons"), icon: <Swords className="h-3.5 w-3.5" /> },
    { id: "armor", label: t("armor"), icon: <ShieldIcon className="h-3.5 w-3.5" /> },
    { id: "items", label: t("items"), icon: <Package className="h-3.5 w-3.5" /> },
  ];

  function renderInjectButtons(
    itemType: "weapon" | "armor" | "general",
    itemId: string,
    name: string
  ) {
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {characters.map((char) => (
          <Button
            key={char.id}
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={injectingKey === `${itemId}:${char.id}`}
            onClick={() => handleInjectToCharacter(char.id, itemType, itemId)}
            data-testid={`gm-inject-${itemId}-${char.id}`}
          >
            {t("injectToCharacter", { name: char.name })}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-amber-500/30 text-xs text-amber-400"
          disabled={injectingKey === `${itemId}:party`}
          onClick={() => handleInjectToParty(itemType, itemId, name)}
          data-testid={`gm-inject-party-${itemId}`}
        >
          {t("injectToParty")}
        </Button>
      </div>
    );
  }

  return (
    <div data-testid="gm-items-panel">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchItems")}
          className="pl-10"
          data-testid="gm-item-search"
        />
      </div>

      {/* Sub-tabs */}
      <div className="mb-3 flex gap-1 rounded-lg bg-background/20 p-0.5" role="tablist">
        {itemTabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={itemTab === tab.id}
            onClick={() => setItemTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
              itemTab === tab.id
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`gm-item-tab-${tab.id}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Item List */}
      <div className="space-y-2">
        {itemTab === "weapons" &&
          filteredWeapons.map((w) => (
            <GlassCard key={w.id} hover={false} className="p-3" data-testid={`gm-weapon-${w.id}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-foreground">
                    {localized(w.name, w.name_en, locale)}
                  </span>
                  <div className="mt-0.5 flex gap-2 text-xs text-muted-foreground">
                    <span>
                      {t("damage")}: {w.damage_sm}/{w.damage_l}
                    </span>
                    <span>
                      {t("speed")}: {w.speed}
                    </span>
                    <span>
                      {t("weight")}: {lbsToKg(w.weight)}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {w.weapon_type}
                </Badge>
              </div>
              {renderInjectButtons("weapon", w.id, w.name)}
            </GlassCard>
          ))}

        {itemTab === "armor" &&
          filteredArmor.map((a) => (
            <GlassCard key={a.id} hover={false} className="p-3" data-testid={`gm-armor-${a.id}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-foreground">
                    {localized(a.name, a.name_en, locale)}
                  </span>
                  <div className="mt-0.5 flex gap-2 text-xs text-muted-foreground">
                    <span>
                      {t("ac")}: {a.ac}
                    </span>
                    <span>
                      {t("weight")}: {lbsToKg(a.weight)}
                    </span>
                  </div>
                </div>
                {a.is_shield && (
                  <Badge variant="outline" className="text-[10px]">
                    {a.shield_type ?? "shield"}
                  </Badge>
                )}
              </div>
              {renderInjectButtons("armor", a.id, a.name)}
            </GlassCard>
          ))}

        {itemTab === "items" &&
          filteredItems.map((item) => (
            <GlassCard
              key={item.id}
              hover={false}
              className="p-3"
              data-testid={`gm-item-${item.id}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  {localized(item.name, item.name_en, locale)}
                </span>
                <span className="text-xs text-muted-foreground">{lbsToKg(item.weight)}</span>
              </div>
              {renderInjectButtons("general", item.id, item.name)}
            </GlassCard>
          ))}

        {((itemTab === "weapons" && filteredWeapons.length === 0) ||
          (itemTab === "armor" && filteredArmor.length === 0) ||
          (itemTab === "items" && filteredItems.length === 0)) && (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("noResults")}</p>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg sm:bottom-4 ${
            toast.type === "success"
              ? "bg-green-900/90 text-green-200"
              : "bg-red-900/90 text-red-200"
          }`}
          data-testid="gm-toast"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
