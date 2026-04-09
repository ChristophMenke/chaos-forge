"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Search,
  Swords,
  ShieldIcon,
  Package,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
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
  createMagicItem,
  updateWeaponGm,
  deleteWeaponGm,
  updateArmorGm,
  deleteArmorGm,
  createGeneralItemGm,
  updateGeneralItemGm,
  deleteGeneralItemGm,
} from "@/app/master/actions";
import { MasterMagicItemsTab } from "./master-magic-items-tab";
import { MagicItemForm } from "@/components/shared/magic-item-form";
import { BookmarkToggle } from "./bookmark-toggle";
import type {
  CharacterRow,
  WeaponRow,
  ArmorRow,
  GeneralItemRow,
  MagicItemRow,
  BookmarkEntityType,
} from "@/lib/supabase/types";

interface MasterItemsPanelProps {
  weapons: WeaponRow[];
  armor: ArmorRow[];
  generalItems: GeneralItemRow[];
  characters: CharacterRow[];
  magicItems: MagicItemRow[];
  magicItemDistribution: Map<
    string,
    {
      owners: { characterId: string; characterName: string; equipped: boolean }[];
      inPartyLoot: boolean;
    }
  >;
  bookmarkSet: Set<string>;
  userId: string;
  onBookmarkToggle: (entityType: BookmarkEntityType, entityId: string) => void;
  onMagicItemsChange: () => void;
}

type ItemTab = "weapons" | "armor" | "items" | "magic";

const PAGE_SIZE = 10;

export function MasterItemsPanel({
  weapons,
  armor,
  generalItems,
  characters,
  magicItems,
  magicItemDistribution,
  bookmarkSet,
  userId,
  onBookmarkToggle,
  onMagicItemsChange,
}: MasterItemsPanelProps) {
  const t = useTranslations("master");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [itemTab, setItemTab] = useState<ItemTab>("weapons");
  const [page, setPage] = useState(1);
  const [injectingKey, setInjectingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showMagicCreate, setShowMagicCreate] = useState(false);
  const [createType, setCreateType] = useState<"weapon" | "armor" | "item">("weapon");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string | number | boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    type: "weapon" | "armor" | "general";
    name: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<{
    usedBy: { name: string; id: string }[];
  } | null>(null);

  // Custom weapon form
  const INITIAL_WEAPON_FORM = {
    name: "",
    nameEn: "",
    weaponType: "melee" as "melee" | "ranged" | "both",
    damageSm: "",
    damageLg: "",
    speed: "",
    weight: "",
    magicBonus: 0,
    profSearch: "",
    profSelected: null as string | null,
  };
  const [weaponForm, setWeaponForm] = useState(INITIAL_WEAPON_FORM);
  const wf = weaponForm;
  const setWf = (patch: Partial<typeof INITIAL_WEAPON_FORM>) =>
    setWeaponForm((prev) => ({ ...prev, ...patch }));

  // Unique weapon proficiency entries (name + name_en for bilingual display/search)
  const proficiencyEntries = useMemo(() => {
    const seen = new Set<string>();
    const entries: { name: string; name_en: string | null; label: string }[] = [];
    for (const w of weapons) {
      if (!w.is_custom && !seen.has(w.name)) {
        seen.add(w.name);
        entries.push({
          name: w.name,
          name_en: w.name_en,
          label: localized(w.name, w.name_en, locale),
        });
      }
    }
    return entries.sort((a, b) => a.label.localeCompare(b.label));
  }, [weapons, locale]);

  const filteredProfEntries = useMemo(() => {
    if (!wf.profSearch.trim()) return proficiencyEntries.slice(0, 10);
    const q = wf.profSearch.toLowerCase();
    return proficiencyEntries
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.name_en?.toLowerCase().includes(q) ?? false) ||
          e.label.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [proficiencyEntries, wf.profSearch]);

  // Custom general item form
  const INITIAL_ITEM_FORM = { name: "", weight: "" };
  const [itemForm, setItemForm] = useState(INITIAL_ITEM_FORM);

  // Armor proficiency entries (bilingual)
  const armorProfEntries = useMemo(() => {
    const seen = new Set<string>();
    const entries: { name: string; name_en: string | null; label: string }[] = [];
    for (const a of armor) {
      if (!a.is_custom && !seen.has(a.name)) {
        seen.add(a.name);
        entries.push({
          name: a.name,
          name_en: a.name_en,
          label: localized(a.name, a.name_en, locale),
        });
      }
    }
    return entries.sort((a, b) => a.label.localeCompare(b.label));
  }, [armor, locale]);
  // Custom armor form
  const INITIAL_ARMOR_FORM = {
    name: "",
    ac: "",
    weight: "",
    isShield: false,
    shieldType: "small" as "buckler" | "small" | "medium" | "large",
    isMagical: false,
    profSearch: "",
    profSelected: null as string | null,
  };
  const [armorForm, setArmorForm] = useState(INITIAL_ARMOR_FORM);
  const af = armorForm;
  const setAf = (patch: Partial<typeof INITIAL_ARMOR_FORM>) =>
    setArmorForm((prev) => ({ ...prev, ...patch }));

  const filteredArmorProfEntries = useMemo(() => {
    if (!af.profSearch.trim()) return armorProfEntries.slice(0, 10);
    const q = af.profSearch.toLowerCase();
    return armorProfEntries
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.name_en?.toLowerCase().includes(q) ?? false) ||
          e.label.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [armorProfEntries, af.profSearch]);

  async function handleCreateWeapon() {
    if (!wf.name.trim() || !wf.profSelected) return;
    setCreating(true);
    const result = await createCustomWeaponGm({
      name: wf.profSelected,
      name_en: wf.nameEn.trim() || undefined,
      weapon_type: wf.weaponType,
      damage_sm: wf.damageSm || "1d4",
      damage_l: wf.damageLg || "1d4",
      speed: wf.speed ? Number(wf.speed) : 0,
      weight: wf.weight ? Number(wf.weight) : 0,
      hit_bonus: wf.magicBonus,
      damage_bonus: wf.magicBonus,
    });
    setCreating(false);
    if (result.success && result.weaponId) {
      showToastMsg(t("customWeaponCreated"), "success");
      setWeaponForm(INITIAL_WEAPON_FORM);
    } else {
      showToastMsg(t("injectFailed"), "error");
    }
  }

  async function handleCreateArmor() {
    if (!af.name.trim() || !af.profSelected) return;
    setCreating(true);
    const result = await createCustomArmorGm({
      name: af.profSelected,
      name_en: af.name.trim() !== af.profSelected ? af.name.trim() : undefined,
      ac: af.ac ? Number(af.ac) : 10,
      weight: af.weight ? Number(af.weight) : 0,
      is_shield: af.isShield,
      shield_type: af.isShield ? af.shieldType : null,
      is_magical_protection: af.isMagical,
    });
    setCreating(false);
    if (result.success) {
      showToastMsg(t("customArmorCreated"), "success");
      setArmorForm(INITIAL_ARMOR_FORM);
    } else {
      showToastMsg(t("injectFailed"), "error");
    }
  }

  // Filter items by search
  const filteredWeapons = useMemo(() => {
    if (!search.trim()) return weapons;
    const q = search.toLowerCase();
    return weapons.filter(
      (w) => w.name.toLowerCase().includes(q) || (w.name_en?.toLowerCase().includes(q) ?? false)
    );
  }, [weapons, search]);

  const filteredArmor = useMemo(() => {
    if (!search.trim()) return armor;
    const q = search.toLowerCase();
    return armor.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.name_en?.toLowerCase().includes(q) ?? false)
    );
  }, [armor, search]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return generalItems;
    const q = search.toLowerCase();
    return generalItems.filter(
      (i) => i.name.toLowerCase().includes(q) || (i.name_en?.toLowerCase().includes(q) ?? false)
    );
  }, [generalItems, search]);

  const [magicItemFilteredCount, setMagicItemFilteredCount] = useState(magicItems.length);

  // Current tab's total count for pagination
  const currentTabTotal =
    itemTab === "weapons"
      ? filteredWeapons.length
      : itemTab === "armor"
        ? filteredArmor.length
        : itemTab === "items"
          ? filteredItems.length
          : magicItemFilteredCount;
  const totalPages = Math.max(1, Math.ceil(currentTabTotal / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  // Paginated slices for non-magic tabs
  const pagedWeapons = filteredWeapons.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pagedArmor = filteredArmor.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pagedItems = filteredItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
    { id: "magic", label: t("magicItems"), icon: <Sparkles className="h-3.5 w-3.5" /> },
  ];

  async function handleDelete(id: string, type: "weapon" | "armor" | "general") {
    const deleteFn =
      type === "weapon" ? deleteWeaponGm : type === "armor" ? deleteArmorGm : deleteGeneralItemGm;
    const result = await deleteFn(id);
    if (result.success) {
      showToastMsg(t("itemDeleted"), "success");
      setDeleteConfirm(null);
      setDeleteError(null);
      // Trigger page refresh to get updated data
      window.location.reload();
    } else if (result.error === "item_in_use" && result.usedBy) {
      setDeleteError({ usedBy: result.usedBy });
    } else {
      showToastMsg(result.error ?? t("injectFailed"), "error");
    }
  }

  async function handleSaveEdit(id: string, type: "weapon" | "armor" | "general") {
    const updateFn =
      type === "weapon" ? updateWeaponGm : type === "armor" ? updateArmorGm : updateGeneralItemGm;
    const result = await updateFn(id, editForm);
    if (result.success) {
      showToastMsg(t("itemUpdated"), "success");
      setEditingId(null);
      setEditForm({});
      window.location.reload();
    } else {
      showToastMsg(result.error ?? t("injectFailed"), "error");
    }
  }

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
      {/* Create Buttons */}
      <div className="mb-3 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowCreate(!showCreate);
              setShowMagicCreate(false);
            }}
            className="flex flex-1 items-center justify-between rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            data-testid="gm-create-toggle"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("createCustom")}
            </span>
            {showCreate ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            onClick={() => {
              setShowMagicCreate(!showMagicCreate);
              setShowCreate(false);
            }}
            className="flex flex-1 items-center justify-between rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            data-testid="gm-magic-create-toggle"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t("createMagicItem")}
            </span>
            {showMagicCreate ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

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
                  value={wf.name}
                  onChange={(e) => setWf({ name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="gm-create-weapon-name"
                />
                {/* Proficiency selector — which existing weapon category does this belong to? */}
                <div className="relative">
                  <span className="mb-1 block text-[10px] md:text-xs text-muted-foreground">
                    {t("proficiency")}
                  </span>
                  <input
                    type="text"
                    placeholder={
                      wf.profSelected
                        ? (proficiencyEntries.find((e) => e.name === wf.profSelected)?.label ??
                          wf.profSelected)
                        : t("proficiencyPlaceholderWeapon")
                    }
                    value={wf.profSearch}
                    onChange={(e) => setWf({ profSearch: e.target.value, profSelected: null })}
                    className={`w-full rounded-md border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                      wf.profSelected ? "border-primary text-primary" : "border-border"
                    }`}
                    data-testid="gm-create-weapon-prof"
                  />
                  {wf.profSearch && !wf.profSelected && filteredProfEntries.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-background shadow-lg">
                      {filteredProfEntries.map((entry) => (
                        <button
                          key={entry.name}
                          type="button"
                          onClick={() => setWf({ profSelected: entry.name, profSearch: "" })}
                          className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent/50"
                          data-testid={`gm-prof-option-${entry.name}`}
                        >
                          {entry.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {wf.profSelected && (
                    <button
                      type="button"
                      onClick={() => setWf({ profSelected: null, profSearch: "" })}
                      className="absolute right-2 top-6 text-xs text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div>
                  <span className="mb-1 block text-[10px] md:text-xs text-muted-foreground">
                    {t("weaponType")}
                  </span>
                  <div className="flex gap-1">
                    {(["melee", "ranged", "both"] as const).map((wt) => (
                      <button
                        key={wt}
                        type="button"
                        onClick={() => setWf({ weaponType: wt })}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                          wf.weaponType === wt
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
                    value={wf.damageSm}
                    onChange={(e) => setWf({ damageSm: e.target.value })}
                    className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="gm-create-weapon-dmg-sm"
                  />
                  <input
                    type="text"
                    placeholder={t("damageLg")}
                    value={wf.damageLg}
                    onChange={(e) => setWf({ damageLg: e.target.value })}
                    className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="gm-create-weapon-dmg-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder={t("speed")}
                    value={wf.speed}
                    onChange={(e) => setWf({ speed: e.target.value })}
                    className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="gm-create-weapon-speed"
                  />
                  <input
                    type="number"
                    placeholder={t("weight")}
                    value={wf.weight}
                    onChange={(e) => setWf({ weight: e.target.value })}
                    className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="gm-create-weapon-weight"
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[10px] md:text-xs text-muted-foreground">
                    {t("magicBonus")}
                  </span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4, 5].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setWf({ magicBonus: b })}
                        className={`rounded-md px-2 py-1 text-xs font-medium ${wf.magicBonus === b ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                        data-testid={`gm-create-weapon-magic-${b}`}
                      >
                        {b === 0 ? "—" : `+${b}`}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  className="w-full"
                  disabled={creating || !wf.name.trim() || !wf.profSelected}
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
                  value={af.name}
                  onChange={(e) => setAf({ name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="gm-create-armor-name"
                />
                {/* Armor/Shield Proficiency selector */}
                <div className="relative">
                  <span className="mb-1 block text-[10px] md:text-xs text-muted-foreground">
                    {t("proficiency")}
                  </span>
                  <input
                    type="text"
                    placeholder={
                      af.profSelected
                        ? (armorProfEntries.find((e) => e.name === af.profSelected)?.label ??
                          af.profSelected)
                        : t("proficiencyPlaceholderArmor")
                    }
                    value={af.profSearch}
                    onChange={(e) => setAf({ profSearch: e.target.value, profSelected: null })}
                    className={`w-full rounded-md border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                      af.profSelected ? "border-primary text-primary" : "border-border"
                    }`}
                    data-testid="gm-create-armor-prof"
                  />
                  {af.profSearch && !af.profSelected && filteredArmorProfEntries.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-background shadow-lg">
                      {filteredArmorProfEntries.map((entry) => (
                        <button
                          key={entry.name}
                          type="button"
                          onClick={() => setAf({ profSelected: entry.name, profSearch: "" })}
                          className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent/50"
                        >
                          {entry.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {af.profSelected && (
                    <button
                      type="button"
                      onClick={() => setAf({ profSelected: null, profSearch: "" })}
                      className="absolute right-2 top-6 text-xs text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder={`${t("ac")} (10)`}
                    value={af.ac}
                    onChange={(e) => setAf({ ac: e.target.value })}
                    className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="gm-create-armor-ac"
                  />
                  <input
                    type="number"
                    placeholder={t("weight")}
                    value={af.weight}
                    onChange={(e) => setAf({ weight: e.target.value })}
                    className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="gm-create-armor-weight"
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={af.isMagical}
                    onChange={(e) => setAf({ isMagical: e.target.checked })}
                    data-testid="gm-create-armor-magical"
                  />
                  {t("isMagicalProtection")}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={af.isShield}
                    onChange={(e) =>
                      setAf({
                        isShield: e.target.checked,
                        ...(e.target.checked && !af.shieldType ? { shieldType: "small" } : {}),
                      })
                    }
                    data-testid="gm-create-armor-is-shield"
                  />
                  {t("isShield")}
                </label>
                {af.isShield && (
                  <div>
                    <span className="mb-1 block text-[10px] md:text-xs text-muted-foreground">
                      {t("shieldType")}
                    </span>
                    <div className="flex gap-1">
                      {(["buckler", "small", "medium", "large"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setAf({ shieldType: st })}
                          className={`rounded-md px-2 py-1 text-xs font-medium ${af.shieldType === st ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
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
                  disabled={creating || !af.name.trim() || !af.profSelected}
                  onClick={handleCreateArmor}
                  data-testid="gm-create-armor-submit"
                >
                  {t("createArmor")}
                </Button>
              </div>
            )}

            {/* General Item — just name, directly inject */}
            {createType === "item" && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={t("name")}
                  value={itemForm.name}
                  onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="gm-create-item-name"
                />
                <input
                  type="number"
                  placeholder={t("weight")}
                  value={itemForm.weight}
                  onChange={(e) => setItemForm((f) => ({ ...f, weight: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="gm-create-item-weight"
                />
                <Button
                  className="w-full"
                  disabled={creating || !itemForm.name.trim()}
                  onClick={async () => {
                    if (!itemForm.name.trim()) return;
                    setCreating(true);
                    const result = await injectItemToParty("general", "", itemForm.name.trim());
                    setCreating(false);
                    if (result.success) {
                      showToastMsg(t("customItemCreated"), "success");
                      setItemForm(INITIAL_ITEM_FORM);
                    } else {
                      showToastMsg(t("injectFailed"), "error");
                    }
                  }}
                  data-testid="gm-create-item-submit"
                >
                  {t("createItem")}
                </Button>
              </div>
            )}
          </GlassCard>
        )}

        {showMagicCreate && (
          <GlassCard hover={false} className="p-3" data-testid="gm-magic-item-create">
            <MagicItemForm
              onSubmit={async (formData) => {
                const result = await createMagicItem({
                  name: formData.name,
                  name_en: formData.nameEn || undefined,
                  category: formData.category || undefined,
                  magic_effects: formData.effects,
                });
                if (result.success) {
                  setShowMagicCreate(false);
                  onMagicItemsChange();
                }
              }}
              submitLabel={t("createAndDistribute")}
              loading={false}
            />
          </GlassCard>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
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
            onClick={() => {
              setItemTab(tab.id);
              setPage(1);
            }}
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
          pagedWeapons.map((w) => (
            <GlassCard key={w.id} hover={false} className="p-3" data-testid={`gm-weapon-${w.id}`}>
              {editingId === w.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    defaultValue={w.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm"
                    data-testid={`gm-edit-weapon-name-${w.id}`}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      defaultValue={w.damage_sm}
                      placeholder={t("damageSm")}
                      onChange={(e) => setEditForm((f) => ({ ...f, damage_sm: e.target.value }))}
                      className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm"
                    />
                    <input
                      type="text"
                      defaultValue={w.damage_l}
                      placeholder={t("damageLg")}
                      onChange={(e) => setEditForm((f) => ({ ...f, damage_l: e.target.value }))}
                      className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      defaultValue={w.speed}
                      placeholder={t("speed")}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, speed: Number(e.target.value) }))
                      }
                      className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm"
                    />
                    <input
                      type="number"
                      defaultValue={w.weight}
                      placeholder={t("weight")}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, weight: Number(e.target.value) }))
                      }
                      className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveEdit(w.id, "weapon")}>
                      {t("save")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setEditForm({});
                      }}
                    >
                      <X className="mr-1 h-3 w-3" />
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">
                        {localized(w.name, w.name_en, locale)}
                      </span>
                      <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
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
                      <div className="mt-1 text-[10px] md:text-xs text-blue-400">
                        Proficiency: {w.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingId(w.id);
                          setEditForm({
                            name: w.name,
                            damage_sm: w.damage_sm,
                            damage_l: w.damage_l,
                            speed: w.speed,
                            weight: w.weight,
                          });
                        }}
                        className="rounded p-1 text-muted-foreground hover:text-foreground"
                        data-testid={`gm-edit-weapon-${w.id}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ id: w.id, type: "weapon", name: w.name })}
                        className="rounded p-1 text-muted-foreground hover:text-red-400"
                        data-testid={`gm-delete-weapon-${w.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <BookmarkToggle
                        entityType="weapon"
                        entityId={w.id}
                        isBookmarked={bookmarkSet.has(`weapon:${w.id}`)}
                        userId={userId}
                        onToggle={onBookmarkToggle}
                      />
                      <Badge variant="outline" className="text-[10px] md:text-xs">
                        {w.weapon_type}
                      </Badge>
                    </div>
                  </div>
                  {renderInjectButtons("weapon", w.id, w.name)}
                </>
              )}
            </GlassCard>
          ))}

        {itemTab === "armor" &&
          pagedArmor.map((a) => (
            <GlassCard key={a.id} hover={false} className="p-3" data-testid={`gm-armor-${a.id}`}>
              {editingId === a.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    defaultValue={a.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      defaultValue={a.ac}
                      placeholder={t("ac")}
                      onChange={(e) => setEditForm((f) => ({ ...f, ac: Number(e.target.value) }))}
                      className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm"
                    />
                    <input
                      type="number"
                      defaultValue={a.weight}
                      placeholder={t("weight")}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, weight: Number(e.target.value) }))
                      }
                      className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveEdit(a.id, "armor")}>
                      {t("save")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setEditForm({});
                      }}
                    >
                      <X className="mr-1 h-3 w-3" />
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
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
                      {a.is_shield && (
                        <div className="mt-1 text-[10px] md:text-xs text-blue-400">
                          Proficiency: {a.name} ({a.shield_type})
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingId(a.id);
                          setEditForm({ name: a.name, ac: a.ac, weight: a.weight });
                        }}
                        className="rounded p-1 text-muted-foreground hover:text-foreground"
                        data-testid={`gm-edit-armor-${a.id}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ id: a.id, type: "armor", name: a.name })}
                        className="rounded p-1 text-muted-foreground hover:text-red-400"
                        data-testid={`gm-delete-armor-${a.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <BookmarkToggle
                        entityType="armor"
                        entityId={a.id}
                        isBookmarked={bookmarkSet.has(`armor:${a.id}`)}
                        userId={userId}
                        onToggle={onBookmarkToggle}
                      />
                      {a.is_shield && (
                        <Badge variant="outline" className="text-[10px] md:text-xs">
                          {a.shield_type ?? "shield"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {renderInjectButtons("armor", a.id, a.name)}
                </>
              )}
            </GlassCard>
          ))}

        {itemTab === "items" &&
          pagedItems.map((item) => (
            <GlassCard
              key={item.id}
              hover={false}
              className="p-3"
              data-testid={`gm-item-${item.id}`}
            >
              {editingId === item.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    defaultValue={item.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    defaultValue={item.weight}
                    placeholder={t("weight")}
                    onChange={(e) => setEditForm((f) => ({ ...f, weight: Number(e.target.value) }))}
                    className="w-full rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveEdit(item.id, "general")}>
                      {t("save")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setEditForm({});
                      }}
                    >
                      <X className="mr-1 h-3 w-3" />
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {localized(item.name, item.name_en, locale)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setEditForm({ name: item.name, weight: item.weight });
                        }}
                        className="rounded p-1 text-muted-foreground hover:text-foreground"
                        data-testid={`gm-edit-item-${item.id}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            id: item.id,
                            type: "general",
                            name: item.name,
                          })
                        }
                        className="rounded p-1 text-muted-foreground hover:text-red-400"
                        data-testid={`gm-delete-item-${item.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <BookmarkToggle
                        entityType="general_item"
                        entityId={item.id}
                        isBookmarked={bookmarkSet.has(`general_item:${item.id}`)}
                        userId={userId}
                        onToggle={onBookmarkToggle}
                      />
                      <span className="text-xs text-muted-foreground">{lbsToKg(item.weight)}</span>
                    </div>
                  </div>
                  {renderInjectButtons("general", item.id, item.name)}
                </>
              )}
            </GlassCard>
          ))}

        {itemTab === "magic" && (
          <MasterMagicItemsTab
            magicItems={magicItems}
            characters={characters}
            distribution={magicItemDistribution}
            bookmarkSet={bookmarkSet}
            userId={userId}
            onBookmarkToggle={onBookmarkToggle}
            onMagicItemsChange={onMagicItemsChange}
            search={search}
            page={safePage}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            onToast={showToastMsg}
            onFilteredCountChange={setMagicItemFilteredCount}
          />
        )}

        {((itemTab === "weapons" && filteredWeapons.length === 0) ||
          (itemTab === "armor" && filteredArmor.length === 0) ||
          (itemTab === "items" && filteredItems.length === 0)) && (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("noResults")}</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="mt-3 flex items-center justify-center gap-2"
          data-testid="gm-items-pagination"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            data-testid="gm-items-page-prev"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {safePage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            data-testid="gm-items-page-next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-xl">
            <h3 className="mb-2 font-heading text-lg text-foreground">{t("confirmDelete")}</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              {t("confirmDeleteItem", { name: deleteConfirm.name })}
            </p>
            {deleteError && (
              <div className="mb-3 rounded-md bg-red-900/30 p-2 text-sm text-red-300">
                <p className="font-medium">{t("itemInUse")}</p>
                <ul className="mt-1 list-inside list-disc text-xs">
                  {deleteError.usedBy.map((u) => (
                    <li key={u.id}>{u.name}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2">
              {!deleteError && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.type)}
                  data-testid="gm-confirm-delete"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  {t("deleteItem")}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteError(null);
                }}
                data-testid="gm-cancel-delete"
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}

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
