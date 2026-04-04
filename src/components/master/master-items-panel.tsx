"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search, Swords, ShieldIcon, Package, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { localized } from "@/lib/utils/localize";
import { lbsToKg } from "@/lib/utils/units";
import {
  injectItemToCharacter,
  injectItemToParty,
  createCustomWeaponGm,
  createCustomArmorGm,
} from "@/app/master/actions";
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
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<"weapon" | "armor" | "item">("weapon");
  const [creating, setCreating] = useState(false);

  // Custom weapon form
  const [cwName, setCwName] = useState("");
  const [cwWeaponType, setCwWeaponType] = useState<"melee" | "ranged" | "both">("melee");
  const [cwDamageSm, setCwDamageSm] = useState("");
  const [cwDamageLg, setCwDamageLg] = useState("");
  const [cwSpeed, setCwSpeed] = useState("");
  const [cwWeight, setCwWeight] = useState("");
  const [cwMagicBonus, setCwMagicBonus] = useState(0);

  // Custom armor form
  const [caName, setCaName] = useState("");
  const [caAc, setCaAc] = useState("");
  const [caWeight, setCaWeight] = useState("");
  const [caIsShield, setCaIsShield] = useState(false);
  const [caShieldType, setCaShieldType] = useState<"buckler" | "small" | "medium" | "large">(
    "small"
  );
  const [caIsMagical, setCaIsMagical] = useState(false);

  async function handleCreateWeapon() {
    if (!cwName.trim()) return;
    setCreating(true);
    const result = await createCustomWeaponGm({
      name: cwName.trim(),
      weapon_type: cwWeaponType,
      damage_sm: cwDamageSm || "1d4",
      damage_l: cwDamageLg || "1d4",
      speed: cwSpeed ? Number(cwSpeed) : 0,
      weight: cwWeight ? Number(cwWeight) : 0,
      hit_bonus: cwMagicBonus,
      damage_bonus: cwMagicBonus,
    });
    setCreating(false);
    if (result.success && result.weaponId) {
      showToastMsg(t("customWeaponCreated"), "success");
      setCwName("");
      setCwDamageSm("");
      setCwDamageLg("");
      setCwSpeed("");
      setCwWeight("");
      setCwMagicBonus(0);
      setCwWeaponType("melee");
    } else {
      showToastMsg(t("injectFailed"), "error");
    }
  }

  async function handleCreateArmor() {
    if (!caName.trim()) return;
    setCreating(true);
    const result = await createCustomArmorGm({
      name: caName.trim(),
      ac: caAc ? Number(caAc) : 10,
      weight: caWeight ? Number(caWeight) : 0,
      is_shield: caIsShield,
      shield_type: caIsShield ? caShieldType : null,
      is_magical_protection: caIsMagical,
    });
    setCreating(false);
    if (result.success) {
      showToastMsg(t("customArmorCreated"), "success");
      setCaName("");
      setCaAc("");
      setCaWeight("");
      setCaIsShield(false);
      setCaIsMagical(false);
    } else {
      showToastMsg(t("injectFailed"), "error");
    }
  }

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
    showToastMsg(
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
    showToastMsg(
      result.success ? t("injected") : t("injectFailed"),
      result.success ? "success" : "error"
    );
  }

  function showToastMsg(message: string, type: "success" | "error") {
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
      {/* Create Custom Item */}
      <div className="mb-3">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex w-full items-center justify-between rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          data-testid="gm-create-toggle"
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("createCustom")}
          </span>
          {showCreate ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showCreate && (
          <GlassCard hover={false} className="mt-2 p-3" data-testid="gm-create-form">
            {/* Create Type Tabs */}
            <div className="mb-3 flex gap-1 rounded-lg bg-background/20 p-0.5" role="tablist">
              {(["weapon", "armor", "item"] as const).map((ct) => (
                <button
                  key={ct}
                  role="tab"
                  aria-selected={createType === ct}
                  onClick={() => setCreateType(ct)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    createType === ct
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`gm-create-type-${ct}`}
                >
                  {ct === "weapon" ? t("weapons") : ct === "armor" ? t("armor") : t("items")}
                </button>
              ))}
            </div>

            {/* Weapon Form */}
            {createType === "weapon" && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={t("name")}
                  value={cwName}
                  onChange={(e) => setCwName(e.target.value)}
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="gm-create-weapon-name"
                />
                <div>
                  <span className="mb-1 block text-[10px] text-muted-foreground">
                    {t("weaponType")}
                  </span>
                  <div className="flex gap-1">
                    {(["melee", "ranged", "both"] as const).map((wt) => (
                      <button
                        key={wt}
                        type="button"
                        onClick={() => setCwWeaponType(wt)}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                          cwWeaponType === wt
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                        data-testid={`gm-create-weapon-type-${wt}`}
                      >
                        {t(wt)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={t("damageSm")}
                    value={cwDamageSm}
                    onChange={(e) => setCwDamageSm(e.target.value)}
                    className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="gm-create-weapon-dmg-sm"
                  />
                  <input
                    type="text"
                    placeholder={t("damageLg")}
                    value={cwDamageLg}
                    onChange={(e) => setCwDamageLg(e.target.value)}
                    className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="gm-create-weapon-dmg-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder={t("speed")}
                    value={cwSpeed}
                    onChange={(e) => setCwSpeed(e.target.value)}
                    className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="gm-create-weapon-speed"
                  />
                  <input
                    type="number"
                    placeholder={t("weight")}
                    value={cwWeight}
                    onChange={(e) => setCwWeight(e.target.value)}
                    className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="gm-create-weapon-weight"
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[10px] text-muted-foreground">
                    {t("magicBonus")}
                  </span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4, 5].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setCwMagicBonus(b)}
                        className={`rounded-md px-2 py-1 text-xs font-medium ${cwMagicBonus === b ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                        data-testid={`gm-create-weapon-magic-${b}`}
                      >
                        {b === 0 ? "—" : `+${b}`}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  className="w-full"
                  disabled={creating || !cwName.trim()}
                  onClick={handleCreateWeapon}
                  data-testid="gm-create-weapon-submit"
                >
                  {t("createWeapon")}
                </Button>
              </div>
            )}

            {/* Armor Form */}
            {createType === "armor" && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={t("name")}
                  value={caName}
                  onChange={(e) => setCaName(e.target.value)}
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="gm-create-armor-name"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder={`${t("ac")} (10)`}
                    value={caAc}
                    onChange={(e) => setCaAc(e.target.value)}
                    className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="gm-create-armor-ac"
                  />
                  <input
                    type="number"
                    placeholder={t("weight")}
                    value={caWeight}
                    onChange={(e) => setCaWeight(e.target.value)}
                    className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="gm-create-armor-weight"
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={caIsMagical}
                    onChange={(e) => setCaIsMagical(e.target.checked)}
                    data-testid="gm-create-armor-magical"
                  />
                  {t("isMagicalProtection")}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={caIsShield}
                    onChange={(e) => {
                      setCaIsShield(e.target.checked);
                      if (e.target.checked && !caShieldType) setCaShieldType("small");
                    }}
                    data-testid="gm-create-armor-is-shield"
                  />
                  {t("isShield")}
                </label>
                {caIsShield && (
                  <div>
                    <span className="mb-1 block text-[10px] text-muted-foreground">
                      {t("shieldType")}
                    </span>
                    <div className="flex gap-1">
                      {(["buckler", "small", "medium", "large"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setCaShieldType(st)}
                          className={`rounded-md px-2 py-1 text-xs font-medium ${caShieldType === st ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                          data-testid={`gm-create-armor-shield-${st}`}
                        >
                          {t(
                            st === "buckler"
                              ? "buckler"
                              : st === "small"
                                ? "smallShield"
                                : st === "medium"
                                  ? "mediumShield"
                                  : "largeShield"
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  className="w-full"
                  disabled={creating || !caName.trim()}
                  onClick={handleCreateArmor}
                  data-testid="gm-create-armor-submit"
                >
                  {t("createArmor")}
                </Button>
              </div>
            )}

            {/* General Item — just name, directly inject */}
            {createType === "item" && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                {t("items")} — {t("searchItems")}
              </p>
            )}
          </GlassCard>
        )}
      </div>

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
