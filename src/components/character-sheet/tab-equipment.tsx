"use client";

import { useState, useRef, useMemo } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  calculateEncumbrance,
  calculateAC,
  getMovementRate,
  getShieldProficiencyBonus,
} from "@/lib/rules/equipment";
import { useTranslations, useLocale } from "next-intl";
import { localized } from "@/lib/utils/localize";
import { matchesWeaponProf, findWeaponProf } from "@/lib/utils/proficiency-match";
import { lbsToKg, feetToMeters } from "@/lib/utils/units";
import {
  getAdjustedWeaponThac0,
  formatDamageWithBonus,
  getAttacksPerRound,
  getEffectiveWeaponSpeed,
} from "@/lib/rules/combat";
import { getMulticlassThac0, getMulticlassArmorWarnings } from "@/lib/rules/multiclass";
import { getNonproficiencyPenalty } from "@/lib/rules/proficiencies";
import { CLASSES, getClassGroup } from "@/lib/rules/classes";
import { getKitArmorWarning } from "@/lib/rules/kits";
import { getBookAbbreviation } from "@/lib/utils/source-books";
import type { ClassId, ClassGroup } from "@/lib/rules/types";
import type {
  CharacterEquipmentWithDetails,
  WeaponRow,
  ArmorRow,
  CharacterInventoryWithDetails,
  GeneralItemRow,
  CharacterClassRow,
  CharacterWeaponProficiencyRow,
} from "@/lib/supabase/types";

interface TabEquipmentProps {
  characterId: string;
  userId: string;
  equipment: CharacterEquipmentWithDetails[];
  allWeapons: WeaponRow[];
  allArmor: ArmorRow[];
  strWeightAllow: number;
  dexDefenseAdj: number;
  inventory: CharacterInventoryWithDetails[];
  allGeneralItems: GeneralItemRow[];
  baseMovement: number;
  readOnly?: boolean;
  strHitAdj: number;
  strDmgAdj: number;
  dexMissileAdj: number;
  characterClasses: CharacterClassRow[];
  weaponProficiencies: CharacterWeaponProficiencyRow[];
  ignoreEncumbrance?: boolean;
  characterKit?: string | null;
  epicAcBonus?: number;
  onEquipmentChange: (equipment: CharacterEquipmentWithDetails[]) => void;
  onInventoryChange: (inventory: CharacterInventoryWithDetails[]) => void;
  onIgnoreEncumbranceChange: (value: boolean) => void;
}

export function TabEquipment({
  characterId,
  userId,
  equipment,
  allWeapons,
  allArmor,
  strWeightAllow,
  dexDefenseAdj,
  inventory,
  allGeneralItems,
  baseMovement,
  readOnly = false,
  strHitAdj,
  strDmgAdj,
  dexMissileAdj,
  characterClasses,
  weaponProficiencies,
  ignoreEncumbrance = true,
  characterKit,
  epicAcBonus = 0,
  onEquipmentChange,
  onInventoryChange,
  onIgnoreEncumbranceChange,
}: TabEquipmentProps) {
  const t = useTranslations("equipment");
  const ts = useTranslations("sheet");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addTab, setAddTab] = useState<"weapons" | "armor" | "magic">("weapons");
  const [searchQuery, setSearchQuery] = useState("");
  const [weaponCategoryFilter, setWeaponCategoryFilter] = useState<
    "all" | "melee" | "ranged" | "both"
  >("all");
  const [magicBonus, setMagicBonus] = useState(0);
  const [addQuantity, setAddQuantity] = useState(1);
  const [showCustomWeaponForm, setShowCustomWeaponForm] = useState(false);
  const [showCustomArmorForm, setShowCustomArmorForm] = useState(false);

  // Proficiency autocomplete for custom items
  const [weaponProfSearch, setWeaponProfSearch] = useState("");
  const [weaponProfSelected, setWeaponProfSelected] = useState<string | null>(null);
  const [armorProfSearch, setArmorProfSearch] = useState("");
  const [armorProfSelected, setArmorProfSelected] = useState<string | null>(null);

  const weaponProfEntries = useMemo(() => {
    const seen = new Set<string>();
    const entries: { name: string; name_en: string | null; label: string }[] = [];
    for (const w of allWeapons) {
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
  }, [allWeapons, locale]);

  const armorProfEntries = useMemo(() => {
    const seen = new Set<string>();
    const entries: { name: string; name_en: string | null; label: string }[] = [];
    for (const a of allArmor) {
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
  }, [allArmor, locale]);

  const filteredWeaponProfs = useMemo(() => {
    if (!weaponProfSearch.trim()) return weaponProfEntries.slice(0, 10);
    const q = weaponProfSearch.toLowerCase();
    return weaponProfEntries
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.name_en?.toLowerCase().includes(q) ?? false) ||
          e.label.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [weaponProfEntries, weaponProfSearch]);

  const filteredArmorProfs = useMemo(() => {
    if (!armorProfSearch.trim()) return armorProfEntries.slice(0, 10);
    const q = armorProfSearch.toLowerCase();
    return armorProfEntries
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.name_en?.toLowerCase().includes(q) ?? false) ||
          e.label.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [armorProfEntries, armorProfSearch]);
  const [customWeapon, setCustomWeapon] = useState({
    name: "",
    name_en: "",
    damage_sm: "",
    damage_l: "",
    weapon_type: "melee" as "melee" | "ranged" | "both",
    speed: "",
    weight: "",
    cost_gp: "",
    magic_bonus: 0,
    quantity: 1,
  });
  const [customArmor, setCustomArmor] = useState({
    name: "",
    name_en: "",
    ac: "",
    weight: "",
    cost_gp: "",
    is_magical_protection: false,
    is_shield: false,
    shield_type: "" as "" | "buckler" | "small" | "medium" | "large",
  });

  const [magicItem, setMagicItem] = useState({
    name: "",
    category: "" as string,
    effects: {} as Record<string, number>,
  });

  const [showAddInventory, setShowAddInventory] = useState(false);
  const inventorySearchRef = useRef<HTMLInputElement>(null);
  const [inventorySearch, setInventorySearch] = useState("");
  const [customItemName, setCustomItemName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "equipment" | "inventory";
    id: string;
    name: string;
  } | null>(null);

  const equipmentWeight = equipment.reduce((sum, item) => {
    const weight = item.weapon?.weight ?? item.armor?.weight ?? 0;
    return sum + weight * item.quantity;
  }, 0);

  const inventoryWeight = inventory.reduce((sum, item) => {
    const weight = item.item?.weight ?? 0;
    return sum + weight * item.quantity;
  }, 0);

  const totalWeight = equipmentWeight + inventoryWeight;

  const encumbranceLevel = calculateEncumbrance(totalWeight, strWeightAllow);
  const encumbranceLabelMap: Record<string, string> = {
    unencumbered: t("encUnencumbered"),
    light: t("encLight"),
    moderate: t("encModerate"),
    heavy: t("encHeavy"),
    severe: t("encSevere"),
  };
  const encumbranceLabel = encumbranceLabelMap[encumbranceLevel];

  const equippedArmor = equipment.find((e) => e.armor && e.equipped && !e.armor.is_shield);
  const shieldEquipped = equipment.some((e) => e.armor && e.equipped && e.armor.is_shield);
  const classGroups = characterClasses
    .filter((cc) => cc.is_active)
    .map((cc) => getClassGroup(cc.class_id as ClassId));
  const equippedShieldItem = equipment.find((e) => e.armor && e.equipped && e.armor.is_shield);
  const shieldProfBonus = getShieldProficiencyBonus(
    equippedShieldItem?.armor?.shield_type ?? null,
    equippedShieldItem?.armor?.name ?? null,
    weaponProficiencies
  );
  const currentAC = calculateAC({
    equippedArmorAC: equippedArmor?.armor?.ac ?? null,
    shieldEquipped,
    dexDefenseAdj,
    classGroups,
    encumbrance: encumbranceLevel,
    ignoreEncumbrance,
    isMagicalProtection: equippedArmor?.armor?.is_magical_protection ?? false,
    epicAcBonus,
    shieldProficiencyBonus: shieldProfBonus,
  });

  const equippedItems = equipment.filter((e) => e.equipped);
  const inventoryItems = equipment;

  async function toggleEquip(item: CharacterEquipmentWithDetails) {
    setLoading(true);
    const supabase = createClient();
    const newEquipped = !item.equipped;

    // If equipping armor (non-shield), unequip any currently equipped armor first
    const armorsToUnequip: string[] = [];
    if (newEquipped && item.armor && !item.armor.is_shield) {
      const currentArmors = equipment.filter(
        (e) => e.armor && e.equipped && e.id !== item.id && !e.armor.is_shield
      );
      for (const a of currentArmors) {
        await supabase.from("character_equipment").update({ equipped: false }).eq("id", a.id);
        armorsToUnequip.push(a.id);
      }
    }

    await supabase.from("character_equipment").update({ equipped: newEquipped }).eq("id", item.id);

    const updatedEquipment = equipment.map((e) => {
      if (e.id === item.id) return { ...e, equipped: newEquipped };
      if (armorsToUnequip.includes(e.id)) return { ...e, equipped: false };
      return e;
    });
    onEquipmentChange(updatedEquipment);
    setLoading(false);
  }

  async function removeItem(itemId: string) {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("character_equipment").delete().eq("id", itemId);
    onEquipmentChange(equipment.filter((e) => e.id !== itemId));
    setLoading(false);
  }

  async function addItem(type: "weapon" | "armor", id: string) {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("character_equipment")
      .insert({
        character_id: characterId,
        weapon_id: type === "weapon" ? id : null,
        armor_id: type === "armor" ? id : null,
        quantity: addQuantity,
        equipped: false,
        hit_bonus: magicBonus,
        damage_bonus: magicBonus,
      })
      .select("*, weapon:weapons(*), armor:armor(*)")
      .single();
    if (data) {
      onEquipmentChange([...equipment, data as CharacterEquipmentWithDetails]);
    }
    setLoading(false);
    setShowAddDialog(false);
    setMagicBonus(0);
    setAddQuantity(1);
  }

  const filteredWeapons = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return allWeapons.filter((w) => {
      const matchesSearch =
        w.name.toLowerCase().includes(q) || (w.name_en ?? "").toLowerCase().includes(q);
      const matchesCategory =
        weaponCategoryFilter === "all" || w.weapon_type === weaponCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allWeapons, searchQuery, weaponCategoryFilter]);

  const filteredArmor = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return allArmor.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.name_en ?? "").toLowerCase().includes(q)
    );
  }, [allArmor, searchQuery]);

  async function createCustomWeapon() {
    if (!customWeapon.name.trim() || !weaponProfSelected) return;
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("weapons")
      .insert({
        name: weaponProfSelected,
        name_en: customWeapon.name_en.trim() || null,
        damage_sm: customWeapon.damage_sm.trim() || "1d4",
        damage_l: customWeapon.damage_l.trim() || "1d4",
        weapon_type: customWeapon.weapon_type,
        speed: customWeapon.speed ? Number(customWeapon.speed) : 0,
        weight: customWeapon.weight ? Number(customWeapon.weight) : 0,
        cost_gp: customWeapon.cost_gp ? Number(customWeapon.cost_gp) : 0,
        is_custom: true,
        created_by: userId,
      })
      .select()
      .single();

    if (!error && data) {
      // Add to character equipment with custom weapon's magic bonus and quantity
      const { data: eqData } = await supabase
        .from("character_equipment")
        .insert({
          character_id: characterId,
          weapon_id: data.id,
          armor_id: null,
          quantity: customWeapon.quantity,
          equipped: false,
          hit_bonus: customWeapon.magic_bonus,
          damage_bonus: customWeapon.magic_bonus,
          custom_label:
            customWeapon.name.trim() !== weaponProfSelected ? customWeapon.name.trim() : null,
        })
        .select("*, weapon:weapons(*), armor:armor(*)")
        .single();
      if (eqData) {
        onEquipmentChange([...equipment, eqData as CharacterEquipmentWithDetails]);
      }
      setCustomWeapon({
        name: "",
        name_en: "",
        damage_sm: "",
        damage_l: "",
        weapon_type: "melee",
        speed: "",
        weight: "",
        cost_gp: "",
        magic_bonus: 0,
        quantity: 1,
      });
      setWeaponProfSearch("");
      setWeaponProfSelected(null);
      setShowCustomWeaponForm(false);
    }
    setLoading(false);
  }

  async function createCustomArmor() {
    if (!customArmor.name.trim() || !armorProfSelected) return;
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("armor")
      .insert({
        name: armorProfSelected,
        name_en: customArmor.name_en.trim() || null,
        ac: customArmor.ac ? Number(customArmor.ac) : 10,
        weight: customArmor.weight ? Number(customArmor.weight) : 0,
        cost_gp: customArmor.cost_gp ? Number(customArmor.cost_gp) : 0,
        max_movement: 12,
        is_custom: true,
        is_magical_protection: customArmor.is_magical_protection,
        is_shield: customArmor.is_shield,
        shield_type:
          customArmor.is_shield && customArmor.shield_type ? customArmor.shield_type : null,
        created_by: userId,
      })
      .select()
      .single();

    if (!error && data) {
      await addItem("armor", data.id);
      setCustomArmor({
        name: "",
        name_en: "",
        ac: "",
        weight: "",
        cost_gp: "",
        is_magical_protection: false,
        is_shield: false,
        shield_type: "",
      });
      setArmorProfSearch("");
      setArmorProfSelected(null);
      setShowCustomArmorForm(false);
    }
    setLoading(false);
  }

  async function createMagicItem() {
    if (!magicItem.name.trim()) return;
    setLoading(true);
    const supabase = createClient();
    // Magic items are stored as character_equipment without weapon/armor reference
    const { data, error } = await supabase
      .from("character_equipment")
      .insert({
        character_id: characterId,
        weapon_id: null,
        armor_id: null,
        quantity: 1,
        equipped: true,
        hit_bonus: 0,
        damage_bonus: 0,
        magic_effects: magicItem.effects,
        custom_label: magicItem.category
          ? `${magicItem.name.trim()} (${magicItem.category})`
          : magicItem.name.trim(),
      })
      .select("*, weapon:weapons(*), armor:armor(*)")
      .single();
    if (error) {
      console.error("Failed to create magic item:", error);
      setLoading(false);
      return;
    }
    if (data) {
      onEquipmentChange([...equipment, data as CharacterEquipmentWithDetails]);
    }
    setMagicItem({ name: "", category: "", effects: {} });
    setShowAddDialog(false);
    setLoading(false);
  }

  function getEncumbranceBadgeVariant(level: string) {
    switch (level) {
      case "unencumbered":
        return "secondary" as const;
      case "light":
        return "outline" as const;
      case "moderate":
        return "outline" as const;
      case "heavy":
        return "destructive" as const;
      case "severe":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  }

  const movementRate = getMovementRate(baseMovement, encumbranceLevel);

  async function addInventoryItem(itemId: string | null, name: string | null) {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("character_inventory")
      .insert({
        character_id: characterId,
        item_id: itemId,
        custom_name: name,
        quantity: 1,
      })
      .select("*, item:general_items(*)")
      .single();
    if (data) {
      onInventoryChange([...inventory, data as CharacterInventoryWithDetails]);
    }
    setLoading(false);
    setShowAddInventory(false);
    setInventorySearch("");
    setCustomItemName("");
  }

  async function removeInventoryItem(id: string) {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("character_inventory").delete().eq("id", id);
    onInventoryChange(inventory.filter((i) => i.id !== id));
    setLoading(false);
  }

  async function updateInventoryQuantity(id: string, quantity: number) {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("character_inventory").update({ quantity }).eq("id", id);
    onInventoryChange(inventory.map((i) => (i.id === id ? { ...i, quantity } : i)));
    setLoading(false);
  }

  async function updateEquipmentBonus(
    id: string,
    field: "hit_bonus" | "damage_bonus",
    value: number
  ) {
    const supabase = createClient();
    await supabase
      .from("character_equipment")
      .update({ [field]: value })
      .eq("id", id);
    onEquipmentChange(equipment.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  function getItemName(item: CharacterEquipmentWithDetails): string {
    if (item.custom_label) return item.custom_label;
    if (item.weapon) return localized(item.weapon.name, item.weapon.name_en, locale);
    if (item.armor) return localized(item.armor.name, item.armor.name_en, locale);
    return "—";
  }

  function getItemWeight(item: CharacterEquipmentWithDetails): number {
    return item.weapon?.weight ?? item.armor?.weight ?? 0;
  }

  function getItemType(item: CharacterEquipmentWithDetails): string {
    if (item.weapon) {
      switch (item.weapon.weapon_type) {
        case "melee":
          return t("melee");
        case "ranged":
          return t("ranged");
        case "both":
          return t("meleAndRanged");
      }
    }
    if (item.armor) return t("armor");
    return "";
  }

  // ── Combat calculations for weapon display ──
  const activeClasses = useMemo(
    () => characterClasses.filter((cc) => cc.is_active),
    [characterClasses]
  );
  const classEntries = useMemo(
    () => activeClasses.map((cc) => ({ classId: cc.class_id as ClassId, level: cc.level })),
    [activeClasses]
  );
  const baseThac0 = useMemo(
    () => (classEntries.length > 0 ? getMulticlassThac0(classEntries) : 20),
    [classEntries]
  );

  // Determine warrior class for APR progression (best warrior level wins)
  const warriorEntry = classEntries.find((ce) => getClassGroup(ce.classId) === "warrior");
  // Primary class group for proficiency penalty (best = warrior > priest/rogue > wizard)
  const primaryClassGroup = (() => {
    const groups = classEntries.map((ce) => getClassGroup(ce.classId));
    if (groups.includes("warrior")) return "warrior" as const;
    if (groups.includes("priest")) return "priest" as const;
    if (groups.includes("rogue")) return "rogue" as const;
    return (groups[0] ?? "warrior") as ClassGroup;
  })();

  function getWeaponSpecialized(weaponName: string, weaponNameEn: string | null): boolean {
    return weaponProficiencies.some(
      (wp) => matchesWeaponProf(wp, weaponName, weaponNameEn) && wp.specialization
    );
  }

  function getWeaponAttacksPerRound(weaponName: string, weaponNameEn: string | null): string {
    const isSpec = getWeaponSpecialized(weaponName, weaponNameEn);
    if (warriorEntry) {
      return getAttacksPerRound("warrior", warriorEntry.level, isSpec);
    }
    // S&P: non-warrior specialization grants +1/2 APR (1 → 3/2)
    return isSpec ? "3/2" : "1";
  }

  function getWeaponProficiencyPenalty(weaponName: string, weaponNameEn: string | null): number {
    const isProficient = weaponProficiencies.some((wp) =>
      matchesWeaponProf(wp, weaponName, weaponNameEn)
    );
    if (isProficient) return 0;
    return getNonproficiencyPenalty(primaryClassGroup);
  }

  function getWeaponThac0(weapon: WeaponRow, hitBonus = 0) {
    const penalty = getWeaponProficiencyPenalty(weapon.name, weapon.name_en);
    const isSpec = getWeaponSpecialized(weapon.name, weapon.name_en);
    const specHitBonus = isSpec ? 1 : 0;
    return getAdjustedWeaponThac0(
      baseThac0,
      strHitAdj + specHitBonus,
      dexMissileAdj + specHitBonus,
      weapon.weapon_type,
      penalty,
      hitBonus
    );
  }

  function resolveWeaponCombatData(item: CharacterEquipmentWithDetails) {
    const weapon = item.weapon!;
    const hitBonus = item.hit_bonus ?? 0;
    const dmgBonus = item.damage_bonus ?? 0;
    const isSpec = getWeaponSpecialized(weapon.name, weapon.name_en);
    const specDmgBonus = isSpec ? 2 : 0;
    const thac0s = getWeaponThac0(weapon, hitBonus);
    const isProficient = !!findWeaponProf(weaponProficiencies, weapon.name, weapon.name_en);
    const apr = getWeaponAttacksPerRound(weapon.name, weapon.name_en);
    return { weapon, hitBonus, dmgBonus, isSpec, specDmgBonus, thac0s, isProficient, apr };
  }

  return (
    <div className="flex flex-col gap-6" data-testid="tab-equipment">
      {/* Summary Row: AC + Encumbrance */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-border p-4 text-center">
          <div className="text-xs text-muted-foreground">{t("acBreakdown")}</div>
          <div className="font-heading text-3xl text-primary" data-testid="equipment-ac">
            {currentAC}
          </div>
          <div className="text-xs text-muted-foreground">
            {equippedArmor
              ? localized(equippedArmor.armor!.name, equippedArmor.armor!.name_en, locale)
              : t("noArmor")}
            {shieldEquipped ? ` + ${t("shield")}` : ""}
          </div>
          {(() => {
            const armorWarning = getKitArmorWarning(
              characterKit ?? null,
              equippedArmor?.armor?.ac ?? null
            );
            if (!armorWarning) return null;
            return (
              <div
                className="mt-1 text-xs text-yellow-400"
                data-testid="equipment-kit-armor-warning"
              >
                {ts("kitArmorWarning", {
                  kitName: localized(armorWarning.kitName, armorWarning.kitNameEn, locale),
                  maxAC: armorWarning.maxAC,
                })}
              </div>
            );
          })()}
          {activeClasses.length > 1 &&
            (() => {
              const classIds = activeClasses.map((cc) => cc.class_id as ClassId);
              const warnings = getMulticlassArmorWarnings(
                classIds,
                !!equippedArmor,
                equippedArmor?.armor?.ac ?? null,
                equippedArmor?.armor?.is_magical_protection ?? false
              );
              if (warnings.length === 0) return null;
              return (
                <>
                  {warnings.map((w) => (
                    <div
                      key={w.type}
                      role="alert"
                      className="mt-1 text-xs text-yellow-400"
                      data-testid={`equipment-multiclass-${w.type}-warning`}
                    >
                      {ts(w.type === "wizard" ? "multiclassWizardArmor" : "multiclassThiefArmor")}
                    </div>
                  ))}
                </>
              );
            })()}
        </div>
        <div className="rounded-md border border-border p-4 text-center">
          <div className="text-xs text-muted-foreground">{t("totalWeight")}</div>
          <div className="font-heading text-3xl text-primary" data-testid="equipment-total-weight">
            {lbsToKg(totalWeight)}
          </div>
          <div className="text-xs text-muted-foreground">kg</div>
        </div>
        <div className="rounded-md border border-border p-4 text-center">
          <div className="text-xs text-muted-foreground">{t("encumbrance")}</div>
          <div className="mt-1" data-testid="equipment-encumbrance">
            <Badge variant={getEncumbranceBadgeVariant(encumbranceLevel)}>{encumbranceLabel}</Badge>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t("maxWeight", { weight: lbsToKg(strWeightAllow) })}
          </div>
          {!readOnly && (
            <label className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={ignoreEncumbrance}
                onChange={() => onIgnoreEncumbranceChange(!ignoreEncumbrance)}
                className="h-3.5 w-3.5 rounded"
                data-testid="toggle-ignore-encumbrance"
              />
              {t("ignoreEncumbrance")}
            </label>
          )}
        </div>
      </div>

      {/* Equipped Items */}
      <div>
        <h3 className="mb-3 font-heading text-lg">{t("equipped")}</h3>
        {equippedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noEquipped")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {equippedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border border-border p-3"
                data-testid={`equipped-item-${item.id}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getItemName(item)}</span>
                  <Badge variant="outline">{getItemType(item)}</Badge>
                  {item.weapon && (
                    <span className="text-xs text-muted-foreground">
                      {t("damage")}: {item.weapon.damage_sm}/{item.weapon.damage_l} | {t("speed")}:{" "}
                      {item.weapon.speed}
                    </span>
                  )}
                  {item.armor && (
                    <span className="text-xs text-muted-foreground">
                      {t("acValue")}: {item.armor.ac}
                    </span>
                  )}
                </div>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={() => toggleEquip(item)}
                    data-testid={`unequip-btn-${item.id}`}
                  >
                    {t("unequip")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inventory */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg">{t("inventory")}</h3>
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog(true)}
              data-testid="add-item-btn"
            >
              {t("addItem")}
            </Button>
          )}
        </div>
        {inventoryItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noItems")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="inventory-table">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">{t("itemLabel")}</th>
                  <th className="pb-2 pr-4">{t("typeLabel")}</th>
                  <th className="pb-2 pr-4 text-right">{t("weight")}</th>
                  <th className="pb-2 pr-4 text-right">{t("quantity")}</th>
                  <th className="pb-2 pr-4 text-center">{t("statusLabel")}</th>
                  <th className="pb-2 text-right">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/50"
                    data-testid={`inventory-row-${item.id}`}
                  >
                    <td className="py-2 pr-4 font-medium">
                      {getItemName(item)}
                      {item.hit_bonus > 0 && (
                        <span className="ml-1 font-bold text-primary">+{item.hit_bonus}</span>
                      )}
                      {item.armor && (
                        <span
                          className="ml-1 text-xs text-muted-foreground"
                          data-testid={`armor-ac-${item.id}`}
                        >
                          (AC {item.armor.ac})
                        </span>
                      )}
                      {item.weapon?.source_book && (
                        <span className="ml-1 text-[9px] text-muted-foreground">
                          ({getBookAbbreviation(item.weapon.source_book)})
                        </span>
                      )}
                      {item.armor?.source_book && (
                        <span className="ml-1 text-[9px] text-muted-foreground">
                          ({getBookAbbreviation(item.armor.source_book)})
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant="outline">{getItemType(item)}</Badge>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {lbsToKg(getItemWeight(item))} kg
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">{item.quantity}</td>
                    <td className="py-2 pr-4 text-center">
                      {!readOnly ? (
                        <Button
                          variant={item.equipped ? "default" : "outline"}
                          size="xs"
                          disabled={loading}
                          onClick={() => toggleEquip(item)}
                          data-testid={`equip-toggle-${item.id}`}
                        >
                          {item.equipped ? t("equipped") : t("equip")}
                        </Button>
                      ) : (
                        <Badge variant={item.equipped ? "default" : "outline"}>
                          {item.equipped ? t("equipped") : "—"}
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {!readOnly && (
                        <Button
                          variant="destructive"
                          size="xs"
                          disabled={loading}
                          onClick={() =>
                            setDeleteConfirm({
                              type: "equipment",
                              id: item.id,
                              name: getItemName(item),
                            })
                          }
                          data-testid={`remove-item-${item.id}`}
                        >
                          {t("remove")}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Item Dialog (simple overlay) */}
      {showAddDialog && !readOnly && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          data-testid="add-item-dialog"
        >
          <div className="mx-4 max-h-[80vh] w-full max-w-lg overflow-hidden rounded-lg border border-border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="font-heading text-lg">{t("addItem")}</h3>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowAddDialog(false)}
                data-testid="close-add-dialog-btn"
              >
                &times;
              </Button>
            </div>

            {/* Tab switcher */}
            <div className="flex border-b border-border">
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  addTab === "weapons"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setAddTab("weapons")}
                data-testid="add-dialog-tab-weapons"
              >
                {t("weapons")}
              </button>
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  addTab === "armor"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setAddTab("armor")}
                data-testid="add-dialog-tab-armor"
              >
                {t("armor")}
              </button>
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  addTab === "magic"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setAddTab("magic")}
                data-testid="add-dialog-tab-magic"
              >
                {t("magicItems")}
              </button>
            </div>

            {/* Search field */}
            <div className="border-b border-border p-4 pb-3">
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="equipment-search"
              />

              {/* Category filter for weapons */}
              {addTab === "weapons" && (
                <div className="mt-2 flex gap-1">
                  {(
                    [
                      { key: "all", label: t("filterAll") },
                      { key: "melee", label: t("melee") },
                      { key: "ranged", label: t("ranged") },
                      { key: "both", label: t("both") },
                    ] as const
                  ).map((filter) => (
                    <button
                      key={filter.key}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        weaponCategoryFilter === filter.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setWeaponCategoryFilter(filter.key)}
                      data-testid={`equipment-filter-${filter.key}`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Magic bonus selector */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t("magicBonus")}:</span>
                {[0, 1, 2, 3, 4, 5].map((b) => (
                  <button
                    key={b}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                      magicBonus === b
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setMagicBonus(b)}
                    data-testid={`magic-bonus-${b}`}
                  >
                    {b === 0 ? "—" : `+${b}`}
                  </button>
                ))}
                <span className="ml-3 text-xs text-muted-foreground">{t("quantity")}:</span>
                <input
                  type="number"
                  min={1}
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-14 rounded-md border border-border bg-background px-2 py-1 text-center text-xs"
                  data-testid="add-item-quantity"
                />
              </div>
            </div>

            {/* Item list */}
            <div className="max-h-[50vh] overflow-y-auto p-4">
              {addTab === "weapons" && (
                <div className="flex flex-col gap-2">
                  {filteredWeapons.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("noWeapons")}</p>
                  ) : (
                    filteredWeapons.map((weapon) => (
                      <div
                        key={weapon.id}
                        className="flex items-center justify-between rounded-md border border-border p-3"
                        data-testid={`add-weapon-${weapon.id}`}
                      >
                        <div>
                          <div className="font-medium">
                            {localized(weapon.name, weapon.name_en, locale)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("damage")}: {weapon.damage_sm}/{weapon.damage_l} | {t("speed")}:{" "}
                            {weapon.speed} | {t("weight")}: {lbsToKg(weapon.weight)} kg |{" "}
                            {t("cost")}: {weapon.cost_gp} GP
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={loading}
                          onClick={() => addItem("weapon", weapon.id)}
                          data-testid={`add-weapon-btn-${weapon.id}`}
                        >
                          {t("addItem")}
                        </Button>
                      </div>
                    ))
                  )}

                  {/* Custom weapon creation */}
                  <div className="mt-2 border-t border-border pt-3">
                    {!showCustomWeaponForm ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowCustomWeaponForm(true)}
                        data-testid="create-custom-weapon-toggle"
                      >
                        {t("createCustomWeapon")}
                      </Button>
                    ) : (
                      <div
                        className="flex flex-col gap-2 rounded-md border border-border p-3"
                        data-testid="custom-weapon-form"
                      >
                        <div className="text-sm font-medium">{t("createCustomWeapon")}</div>
                        <input
                          type="text"
                          placeholder={t("name")}
                          value={customWeapon.name}
                          onChange={(e) =>
                            setCustomWeapon({ ...customWeapon, name: e.target.value })
                          }
                          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          data-testid="custom-weapon-name"
                        />
                        {/* Proficiency Autocomplete */}
                        <div className="relative">
                          <span className="mb-1 block text-xs text-muted-foreground">
                            Proficiency
                          </span>
                          <input
                            type="text"
                            placeholder={
                              weaponProfSelected
                                ? (weaponProfEntries.find((e) => e.name === weaponProfSelected)
                                    ?.label ?? weaponProfSelected)
                                : locale === "de"
                                  ? "z.B. Langschwert..."
                                  : "e.g. Long Sword..."
                            }
                            value={weaponProfSearch}
                            onChange={(e) => {
                              setWeaponProfSearch(e.target.value);
                              setWeaponProfSelected(null);
                            }}
                            className={`w-full rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                              weaponProfSelected ? "border-primary text-primary" : "border-border"
                            }`}
                            data-testid="custom-weapon-prof"
                          />
                          {weaponProfSearch &&
                            !weaponProfSelected &&
                            filteredWeaponProfs.length > 0 && (
                              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-background shadow-lg">
                                {filteredWeaponProfs.map((entry) => (
                                  <button
                                    key={entry.name}
                                    type="button"
                                    onClick={() => {
                                      setWeaponProfSelected(entry.name);
                                      setWeaponProfSearch("");
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent/50"
                                  >
                                    {entry.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          {weaponProfSelected && (
                            <button
                              type="button"
                              onClick={() => {
                                setWeaponProfSelected(null);
                                setWeaponProfSearch("");
                              }}
                              className="absolute right-2 top-7 text-xs text-muted-foreground hover:text-foreground"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder={t("nameEn")}
                          value={customWeapon.name_en}
                          onChange={(e) =>
                            setCustomWeapon({ ...customWeapon, name_en: e.target.value })
                          }
                          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          data-testid="custom-weapon-name-en"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder={t("damageSM")}
                            value={customWeapon.damage_sm}
                            onChange={(e) =>
                              setCustomWeapon({ ...customWeapon, damage_sm: e.target.value })
                            }
                            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            data-testid="custom-weapon-damage-sm"
                          />
                          <input
                            type="text"
                            placeholder={t("damageL")}
                            value={customWeapon.damage_l}
                            onChange={(e) =>
                              setCustomWeapon({ ...customWeapon, damage_l: e.target.value })
                            }
                            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            data-testid="custom-weapon-damage-l"
                          />
                        </div>
                        <div>
                          <span className="mb-1 block text-xs text-muted-foreground">
                            {t("weaponTypeLabel")}
                          </span>
                          <div className="flex gap-1">
                            {(["melee", "ranged", "both"] as const).map((wt) => (
                              <button
                                key={wt}
                                type="button"
                                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                  customWeapon.weapon_type === wt
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                                onClick={() =>
                                  setCustomWeapon({ ...customWeapon, weapon_type: wt })
                                }
                                data-testid={`custom-weapon-type-${wt}`}
                              >
                                {t(wt)}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          <input
                            type="number"
                            placeholder={t("speed")}
                            value={customWeapon.speed}
                            onChange={(e) =>
                              setCustomWeapon({ ...customWeapon, speed: e.target.value })
                            }
                            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            data-testid="custom-weapon-speed"
                          />
                          <input
                            type="number"
                            placeholder={t("weight")}
                            value={customWeapon.weight}
                            onChange={(e) =>
                              setCustomWeapon({ ...customWeapon, weight: e.target.value })
                            }
                            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            data-testid="custom-weapon-weight"
                          />
                          <input
                            type="number"
                            placeholder={t("cost")}
                            value={customWeapon.cost_gp}
                            onChange={(e) =>
                              setCustomWeapon({ ...customWeapon, cost_gp: e.target.value })
                            }
                            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            data-testid="custom-weapon-cost"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="mb-1 block text-xs text-muted-foreground">
                              {t("magicBonus")}
                            </span>
                            <div className="flex gap-1">
                              {[0, 1, 2, 3, 4, 5].map((b) => (
                                <button
                                  key={b}
                                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                    customWeapon.magic_bonus === b
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-muted-foreground hover:text-foreground"
                                  }`}
                                  onClick={() =>
                                    setCustomWeapon({ ...customWeapon, magic_bonus: b })
                                  }
                                  data-testid={`custom-weapon-magic-${b}`}
                                >
                                  {b === 0 ? "—" : `+${b}`}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="mb-1 block text-xs text-muted-foreground">
                              {t("quantity")}
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={customWeapon.quantity}
                              onChange={(e) =>
                                setCustomWeapon({
                                  ...customWeapon,
                                  quantity: Math.max(1, Number(e.target.value)),
                                })
                              }
                              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                              data-testid="custom-weapon-quantity"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            disabled={loading || !customWeapon.name.trim() || !weaponProfSelected}
                            onClick={createCustomWeapon}
                            data-testid="custom-weapon-submit"
                          >
                            {t("createAndAdd")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowCustomWeaponForm(false);
                              setCustomWeapon({
                                name: "",
                                name_en: "",
                                damage_sm: "",
                                damage_l: "",
                                weapon_type: "melee",
                                speed: "",
                                weight: "",
                                cost_gp: "",
                                magic_bonus: 0,
                                quantity: 1,
                              });
                              setWeaponProfSearch("");
                              setWeaponProfSelected(null);
                            }}
                            data-testid="custom-weapon-cancel"
                          >
                            {t("cancel")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {addTab === "armor" && (
                <div className="flex flex-col gap-2">
                  {filteredArmor.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("noArmorAvailable")}</p>
                  ) : (
                    filteredArmor.map((armor) => (
                      <div
                        key={armor.id}
                        className="flex items-center justify-between rounded-md border border-border p-3"
                        data-testid={`add-armor-${armor.id}`}
                      >
                        <div>
                          <div className="font-medium">
                            {localized(armor.name, armor.name_en, locale)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("acValue")}: {armor.ac} | {t("weight")}: {lbsToKg(armor.weight)} kg |{" "}
                            {t("cost")}: {armor.cost_gp} GP
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={loading}
                          onClick={() => addItem("armor", armor.id)}
                          data-testid={`add-armor-btn-${armor.id}`}
                        >
                          {t("addItem")}
                        </Button>
                      </div>
                    ))
                  )}

                  {/* Custom armor creation */}
                  <div className="mt-2 border-t border-border pt-3">
                    {!showCustomArmorForm ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowCustomArmorForm(true)}
                        data-testid="create-custom-armor-toggle"
                      >
                        {t("createCustomArmor")}
                      </Button>
                    ) : (
                      <div
                        className="flex flex-col gap-2 rounded-md border border-border p-3"
                        data-testid="custom-armor-form"
                      >
                        <div className="text-sm font-medium">{t("createCustomArmor")}</div>
                        <input
                          type="text"
                          placeholder={t("name")}
                          value={customArmor.name}
                          onChange={(e) => setCustomArmor({ ...customArmor, name: e.target.value })}
                          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          data-testid="custom-armor-name"
                        />
                        {/* Armor/Shield Proficiency Autocomplete */}
                        <div className="relative">
                          <span className="mb-1 block text-xs text-muted-foreground">
                            Proficiency
                          </span>
                          <input
                            type="text"
                            placeholder={
                              armorProfSelected
                                ? (armorProfEntries.find((e) => e.name === armorProfSelected)
                                    ?.label ?? armorProfSelected)
                                : locale === "de"
                                  ? "z.B. Kettenpanzer..."
                                  : "e.g. Chain Mail..."
                            }
                            value={armorProfSearch}
                            onChange={(e) => {
                              setArmorProfSearch(e.target.value);
                              setArmorProfSelected(null);
                            }}
                            className={`w-full rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                              armorProfSelected ? "border-primary text-primary" : "border-border"
                            }`}
                            data-testid="custom-armor-prof"
                          />
                          {armorProfSearch &&
                            !armorProfSelected &&
                            filteredArmorProfs.length > 0 && (
                              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-background shadow-lg">
                                {filteredArmorProfs.map((entry) => (
                                  <button
                                    key={entry.name}
                                    type="button"
                                    onClick={() => {
                                      setArmorProfSelected(entry.name);
                                      setArmorProfSearch("");
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent/50"
                                  >
                                    {entry.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          {armorProfSelected && (
                            <button
                              type="button"
                              onClick={() => {
                                setArmorProfSelected(null);
                                setArmorProfSearch("");
                              }}
                              className="absolute right-2 top-7 text-xs text-muted-foreground hover:text-foreground"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder={t("nameEn")}
                          value={customArmor.name_en}
                          onChange={(e) =>
                            setCustomArmor({ ...customArmor, name_en: e.target.value })
                          }
                          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          data-testid="custom-armor-name-en"
                        />
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          <input
                            type="number"
                            placeholder={t("acValue")}
                            value={customArmor.ac}
                            onChange={(e) => setCustomArmor({ ...customArmor, ac: e.target.value })}
                            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            data-testid="custom-armor-ac"
                          />
                          <input
                            type="number"
                            placeholder={t("weight")}
                            value={customArmor.weight}
                            onChange={(e) =>
                              setCustomArmor({ ...customArmor, weight: e.target.value })
                            }
                            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            data-testid="custom-armor-weight"
                          />
                          <input
                            type="number"
                            placeholder={t("cost")}
                            value={customArmor.cost_gp}
                            onChange={(e) =>
                              setCustomArmor({ ...customArmor, cost_gp: e.target.value })
                            }
                            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            data-testid="custom-armor-cost"
                          />
                        </div>
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={customArmor.is_magical_protection}
                            onChange={(e) =>
                              setCustomArmor({
                                ...customArmor,
                                is_magical_protection: e.target.checked,
                              })
                            }
                            data-testid="custom-armor-magical-protection"
                          />
                          {t("magicalProtection")}
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={customArmor.is_shield}
                            onChange={(e) =>
                              setCustomArmor({
                                ...customArmor,
                                is_shield: e.target.checked,
                                shield_type: e.target.checked
                                  ? customArmor.shield_type || "small"
                                  : "",
                              })
                            }
                            data-testid="custom-armor-is-shield"
                          />
                          {t("isShieldLabel")}
                        </label>
                        {customArmor.is_shield && (
                          <div>
                            <span className="mb-1 block text-xs text-muted-foreground">
                              {t("shieldTypeLabel")}
                            </span>
                            <div className="flex gap-1">
                              {(["buckler", "small", "medium", "large"] as const).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                    customArmor.shield_type === st
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-muted-foreground hover:text-foreground"
                                  }`}
                                  onClick={() =>
                                    setCustomArmor({ ...customArmor, shield_type: st })
                                  }
                                  data-testid={`custom-armor-shield-type-${st}`}
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
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            disabled={loading || !customArmor.name.trim() || !armorProfSelected}
                            onClick={createCustomArmor}
                            data-testid="custom-armor-submit"
                          >
                            {t("createAndAdd")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowCustomArmorForm(false);
                              setCustomArmor({
                                name: "",
                                name_en: "",
                                ac: "",
                                weight: "",
                                cost_gp: "",
                                is_magical_protection: false,
                                is_shield: false,
                                shield_type: "",
                              });
                              setArmorProfSearch("");
                              setArmorProfSelected(null);
                            }}
                            data-testid="custom-armor-cancel"
                          >
                            {t("cancel")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {addTab === "magic" && (
                <div className="flex flex-col gap-3 p-2" data-testid="magic-item-form">
                  <div className="text-sm font-medium">{t("createMagicItem")}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={t("magicItemName")}
                      value={magicItem.name}
                      onChange={(e) => setMagicItem({ ...magicItem, name: e.target.value })}
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      data-testid="magic-item-name"
                    />
                    <select
                      value={magicItem.category}
                      onChange={(e) => setMagicItem({ ...magicItem, category: e.target.value })}
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                      data-testid="magic-item-category"
                    >
                      <option value="">{t("magicItemCategoryNone")}</option>
                      <option value="Ring">{t("magicItemRing")}</option>
                      <option value="Amulet">{t("magicItemAmulet")}</option>
                      <option value="Cloak">{t("magicItemCloak")}</option>
                      <option value="Belt">{t("magicItemBelt")}</option>
                      <option value="Boots">{t("magicItemBoots")}</option>
                      <option value="Bracers">{t("magicItemBracers")}</option>
                      <option value="Gauntlets">{t("magicItemGauntlets")}</option>
                      <option value="Helm">{t("magicItemHelm")}</option>
                      <option value="Robe">{t("magicItemRobe")}</option>
                      <option value="Girdle">{t("magicItemGirdle")}</option>
                      <option value="Wand/Staff/Rod">{t("magicItemWandStaffRod")}</option>
                      <option value="Potion">{t("magicItemPotion")}</option>
                      <option value="Scroll">{t("magicItemScroll")}</option>
                      <option value="Miscellaneous">{t("magicItemMisc")}</option>
                    </select>
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {t("magicItemEffects")}
                  </div>
                  <div className="flex flex-col gap-1">
                    {[
                      "str",
                      "dex",
                      "con",
                      "int",
                      "wis",
                      "cha",
                      "ac_bonus",
                      "hide_in_shadows",
                      "move_silently",
                    ].map((attr) => (
                      <div key={attr} className="flex items-center gap-2">
                        <span className="w-28 text-xs uppercase">{attr.replace("_", " ")}</span>
                        <input
                          type="number"
                          value={magicItem.effects[attr] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const effects = { ...magicItem.effects };
                            if (val === "" || val === "0") {
                              delete effects[attr];
                            } else {
                              effects[attr] = Number(val);
                            }
                            setMagicItem({ ...magicItem, effects });
                          }}
                          placeholder="—"
                          className="w-20 rounded-md border border-border bg-background px-2 py-1 text-center text-sm"
                          data-testid={`magic-item-effect-${attr}`}
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={loading || !magicItem.name.trim()}
                    onClick={createMagicItem}
                    data-testid="magic-item-submit"
                  >
                    {t("createMagicItem")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Weapon Details (Equipped Weapons) ──────────────────── */}
      {equippedItems.filter((e) => e.weapon).length > 0 && (
        <div data-testid="weapon-details-section">
          <h3 className="mb-3 font-heading text-lg">{t("weapons")}</h3>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm" data-testid="weapon-details-table">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2">{t("name")}</th>
                  <th className="py-2 text-center">{t("weaponType")}</th>
                  <th className="py-2 text-center">{t("hitMod")}</th>
                  <th className="py-2 text-center">{t("dmgMod")}</th>
                  <th className="py-2 text-center">{t("thac0Melee")}</th>
                  <th className="py-2 text-center">{t("thac0Ranged")}</th>
                  <th className="py-2 text-center">{t("damageSMWithStr")}</th>
                  <th className="py-2 text-center">{t("damageLWithStr")}</th>
                  <th className="py-2 text-center">{t("speed")}</th>
                  <th className="py-2 text-center">{t("range")}</th>
                  <th className="py-2 text-center">{t("attacksPerRound")}</th>
                  <th className="py-2 text-center">{t("weight")}</th>
                </tr>
              </thead>
              <tbody>
                {equippedItems
                  .filter((e) => e.weapon)
                  .map((item) => {
                    const { weapon, hitBonus, dmgBonus, specDmgBonus, thac0s, isProficient, apr } =
                      resolveWeaponCombatData(item);
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border/50"
                        data-testid={`weapon-row-${item.id}`}
                      >
                        <td className="py-2 font-medium" data-testid={`weapon-name-${item.id}`}>
                          {localized(weapon.name, weapon.name_en, locale)}
                          {item.hit_bonus > 0 && (
                            <span className="ml-1 text-sm font-bold text-primary">
                              +{item.hit_bonus}
                            </span>
                          )}
                          {weapon.source_book && (
                            <span className="ml-1 rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">
                              {getBookAbbreviation(weapon.source_book)}
                            </span>
                          )}
                          {!isProficient && (
                            <Badge
                              variant="outline"
                              className="ml-1 text-xs"
                              data-testid={`weapon-nonprof-${item.id}`}
                            >
                              {t("notProficient")}
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 text-center" data-testid={`weapon-type-${item.id}`}>
                          <Badge variant="outline">{getItemType(item)}</Badge>
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="number"
                            value={hitBonus}
                            onChange={(e) =>
                              updateEquipmentBonus(
                                item.id,
                                "hit_bonus",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-12 rounded border border-input bg-input text-center text-sm"
                            data-testid={`weapon-hit-bonus-${item.id}`}
                          />
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="number"
                            value={dmgBonus}
                            onChange={(e) =>
                              updateEquipmentBonus(
                                item.id,
                                "damage_bonus",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-12 rounded border border-input bg-input text-center text-sm"
                            data-testid={`weapon-dmg-bonus-${item.id}`}
                          />
                        </td>
                        <td
                          className="py-2 text-center font-mono"
                          data-testid={`weapon-thac0-melee-${item.id}`}
                        >
                          {thac0s.melee}
                        </td>
                        <td
                          className="py-2 text-center font-mono"
                          data-testid={`weapon-thac0-ranged-${item.id}`}
                        >
                          {thac0s.ranged !== null ? thac0s.ranged : "—"}
                        </td>
                        <td
                          className="py-2 text-center font-mono"
                          data-testid={`weapon-damage-sm-${item.id}`}
                        >
                          {formatDamageWithBonus(
                            weapon.damage_sm,
                            strDmgAdj + specDmgBonus,
                            dmgBonus
                          )}
                        </td>
                        <td
                          className="py-2 text-center font-mono"
                          data-testid={`weapon-damage-l-${item.id}`}
                        >
                          {formatDamageWithBonus(
                            weapon.damage_l,
                            strDmgAdj + specDmgBonus,
                            dmgBonus
                          )}
                        </td>
                        <td
                          className="py-2 text-center font-mono"
                          data-testid={`weapon-speed-${item.id}`}
                        >
                          {getEffectiveWeaponSpeed(weapon.speed, hitBonus, dmgBonus)}
                        </td>
                        <td
                          className="py-2 text-center font-mono"
                          data-testid={`weapon-range-${item.id}`}
                        >
                          {weapon.weapon_type !== "melee" &&
                          weapon.range_short != null &&
                          weapon.range_medium != null &&
                          weapon.range_long != null
                            ? `${feetToMeters(weapon.range_short)}/${feetToMeters(weapon.range_medium)}/${feetToMeters(weapon.range_long)}`
                            : "—"}
                        </td>
                        <td
                          className="py-2 text-center font-mono"
                          data-testid={`weapon-apr-${item.id}`}
                        >
                          {apr}
                        </td>
                        <td
                          className="py-2 text-center font-mono"
                          data-testid={`weapon-weight-${item.id}`}
                        >
                          {lbsToKg(weapon.weight)} kg
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden" data-testid="weapon-details-cards">
            {equippedItems
              .filter((e) => e.weapon)
              .map((item) => {
                const { weapon, hitBonus, dmgBonus, specDmgBonus, thac0s, isProficient, apr } =
                  resolveWeaponCombatData(item);
                return (
                  <div
                    key={item.id}
                    className="rounded-md border border-border p-3"
                    data-testid={`weapon-card-${item.id}`}
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                      <span className="font-medium" data-testid={`weapon-card-name-${item.id}`}>
                        {localized(weapon.name, weapon.name_en, locale)}
                        {item.hit_bonus > 0 && (
                          <span className="ml-1 text-sm font-bold text-primary">
                            +{item.hit_bonus}
                          </span>
                        )}
                        {weapon.source_book && (
                          <span className="ml-1 rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">
                            {getBookAbbreviation(weapon.source_book)}
                          </span>
                        )}
                      </span>
                      <div className="flex gap-1">
                        <Badge variant="outline">{getItemType(item)}</Badge>
                        {!isProficient && (
                          <Badge
                            variant="outline"
                            className="text-xs"
                            data-testid={`weapon-card-nonprof-${item.id}`}
                          >
                            {t("notProficient")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {/* Modifier inputs */}
                    <div className="mb-2 flex gap-3">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-muted-foreground">{t("hitMod")}:</span>
                        <input
                          type="number"
                          value={hitBonus}
                          onChange={(e) =>
                            updateEquipmentBonus(
                              item.id,
                              "hit_bonus",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-10 rounded border border-input bg-input text-center text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-muted-foreground">{t("dmgMod")}:</span>
                        <input
                          type="number"
                          value={dmgBonus}
                          onChange={(e) =>
                            updateEquipmentBonus(
                              item.id,
                              "damage_bonus",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-10 rounded border border-input bg-input text-center text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div data-testid={`weapon-card-thac0-melee-${item.id}`}>
                        <span className="text-xs text-muted-foreground">{t("thac0Melee")}:</span>{" "}
                        <span className="font-mono">{thac0s.melee}</span>
                      </div>
                      <div data-testid={`weapon-card-thac0-ranged-${item.id}`}>
                        <span className="text-xs text-muted-foreground">{t("thac0Ranged")}:</span>{" "}
                        <span className="font-mono">
                          {thac0s.ranged !== null ? thac0s.ranged : "—"}
                        </span>
                      </div>
                      <div data-testid={`weapon-card-damage-sm-${item.id}`}>
                        <span className="text-xs text-muted-foreground">
                          {t("damageSMWithStr")}:
                        </span>{" "}
                        <span className="font-mono">
                          {formatDamageWithBonus(
                            weapon.damage_sm,
                            strDmgAdj + specDmgBonus,
                            dmgBonus
                          )}
                        </span>
                      </div>
                      <div data-testid={`weapon-card-damage-l-${item.id}`}>
                        <span className="text-xs text-muted-foreground">
                          {t("damageLWithStr")}:
                        </span>{" "}
                        <span className="font-mono">
                          {formatDamageWithBonus(
                            weapon.damage_l,
                            strDmgAdj + specDmgBonus,
                            dmgBonus
                          )}
                        </span>
                      </div>
                      <div data-testid={`weapon-card-speed-${item.id}`}>
                        <span className="text-xs text-muted-foreground">{t("speed")}:</span>{" "}
                        <span className="font-mono">
                          {getEffectiveWeaponSpeed(weapon.speed, hitBonus, dmgBonus)}
                        </span>
                      </div>
                      <div data-testid={`weapon-card-apr-${item.id}`}>
                        <span className="text-xs text-muted-foreground">
                          {t("attacksPerRound")}:
                        </span>{" "}
                        <span className="font-mono">{apr}</span>
                      </div>
                      <div data-testid={`weapon-card-weight-${item.id}`}>
                        <span className="text-xs text-muted-foreground">{t("weight")}:</span>{" "}
                        <span className="font-mono">{lbsToKg(weapon.weight)} kg</span>
                      </div>
                      <div data-testid={`weapon-card-range-${item.id}`}>
                        <span className="text-xs text-muted-foreground">{t("range")}:</span>{" "}
                        <span className="font-mono">
                          {weapon.weapon_type !== "melee" &&
                          weapon.range_short != null &&
                          weapon.range_medium != null &&
                          weapon.range_long != null
                            ? `${feetToMeters(weapon.range_short)}/${feetToMeters(weapon.range_medium)}/${feetToMeters(weapon.range_long)}`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── AC Breakdown ──────────────────────────────────────── */}
      <div>
        <h3 className="mb-3 font-heading text-lg">{t("acBreakdown")}</h3>
        <div className="grid grid-cols-5 gap-2 text-center text-sm">
          <div className="rounded-md border border-border p-2">
            <div className="text-xs text-muted-foreground">{t("base")}</div>
            <div className="font-mono text-lg">10</div>
          </div>
          <div className="rounded-md border border-border p-2">
            <div className="text-xs text-muted-foreground">{t("armor")}</div>
            <div className="font-mono text-lg">
              {equippedArmor ? `${-(10 - equippedArmor.armor!.ac)}` : "—"}
            </div>
            {equippedArmor && (
              <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                {localized(equippedArmor.armor!.name, equippedArmor.armor!.name_en, locale)}
              </div>
            )}
          </div>
          <div className="rounded-md border border-border p-2">
            <div className="text-xs text-muted-foreground">{t("shield")}</div>
            <div className="font-mono text-lg">{shieldEquipped ? "-1" : "—"}</div>
          </div>
          <div className="rounded-md border border-border p-2">
            <div className="text-xs text-muted-foreground">DEX</div>
            <div className="font-mono text-lg">
              {dexDefenseAdj !== 0 ? `${dexDefenseAdj >= 0 ? "+" : ""}${dexDefenseAdj}` : "—"}
            </div>
          </div>
          <div className="rounded-md border border-primary p-2">
            <div className="text-xs text-muted-foreground">{t("acValue")}</div>
            <div className="font-heading text-lg text-primary">{currentAC}</div>
          </div>
        </div>
      </div>

      {/* ── Movement & Encumbrance ────────────────────────────── */}
      <div>
        <h3 className="mb-3 font-heading text-lg">{t("movement")}</h3>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">{t("baseMovement")}</div>
            <div className="font-heading text-2xl text-primary">{baseMovement}</div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">{t("currentMovement")}</div>
            <div className="font-heading text-2xl text-primary" data-testid="equipment-movement">
              {movementRate}
            </div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">{t("encumbrance")}</div>
            <Badge variant={getEncumbranceBadgeVariant(encumbranceLevel)}>{encumbranceLabel}</Badge>
          </div>
        </div>
      </div>

      {/* ── General Inventory ─────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg">{t("inventoryTitle")}</h3>
          {!readOnly && (
            <Button
              size="sm"
              onClick={() => {
                setShowAddInventory(true);
                setTimeout(() => {
                  inventorySearchRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  inventorySearchRef.current?.focus();
                }, 50);
              }}
              data-testid="add-inventory-btn"
            >
              {t("addItem")}
            </Button>
          )}
        </div>

        {inventory.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noInventory")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {inventory.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-md border border-border p-2"
                data-testid={`inventory-item-${inv.id}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    {inv.item
                      ? localized(inv.item.name, inv.item.name_en, locale)
                      : (inv.custom_name ?? "—")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {inv.item ? `${lbsToKg(inv.item.weight)} kg` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!readOnly ? (
                    <>
                      <input
                        type="number"
                        min={1}
                        value={inv.quantity}
                        onChange={(e) =>
                          updateInventoryQuantity(
                            inv.id,
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        className="w-14 rounded border border-input bg-input px-2 py-1 text-center text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDeleteConfirm({
                            type: "inventory",
                            id: inv.id,
                            name: inv.item
                              ? localized(inv.item.name, inv.item.name_en, locale)
                              : (inv.custom_name ?? "—"),
                          })
                        }
                      >
                        ✕
                      </Button>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">x{inv.quantity}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Inventory Dialog */}
        {showAddInventory && !readOnly && (
          <div className="mt-3 rounded-md border border-border p-4">
            <input
              ref={inventorySearchRef}
              type="text"
              placeholder={t("searchPlaceholder")}
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="mb-3 w-full rounded-md border border-input bg-input px-3 py-2 text-sm"
              data-testid="inventory-search"
            />
            <div className="mb-3 max-h-48 overflow-y-auto">
              {allGeneralItems
                .filter(
                  (item) =>
                    item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                    (item.name_en ?? "").toLowerCase().includes(inventorySearch.toLowerCase())
                )
                .map((item) => (
                  <button
                    key={item.id}
                    className="flex w-full items-center justify-between px-2 py-1 text-left text-sm hover:bg-muted"
                    onClick={() => addInventoryItem(item.id, null)}
                    data-testid={`inventory-option-${item.id}`}
                  >
                    <span>{localized(item.name, item.name_en, locale)}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.weight > 0 ? `${lbsToKg(item.weight)} kg` : ""}{" "}
                      {item.cost_gp > 0 ? `${item.cost_gp} GP` : ""}
                    </span>
                  </button>
                ))}
            </div>
            <div className="flex gap-2 border-t border-border pt-3">
              <input
                type="text"
                placeholder={t("customItemPlaceholder")}
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                className="flex-1 rounded-md border border-input bg-input px-3 py-2 text-sm"
                data-testid="custom-item-name"
              />
              <Button
                size="sm"
                disabled={!customItemName.trim()}
                onClick={() => addInventoryItem(null, customItemName.trim())}
                data-testid="add-custom-item-btn"
              >
                {t("addItem")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddInventory(false);
                  setInventorySearch("");
                  setCustomItemName("");
                }}
              >
                ✕
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirm !== null}
        title={t("confirmRemoveTitle")}
        message={t("confirmRemoveMessage", { name: deleteConfirm?.name ?? "" })}
        confirmLabel={t("remove")}
        onConfirm={async () => {
          if (deleteConfirm) {
            if (deleteConfirm.type === "equipment") {
              await removeItem(deleteConfirm.id);
            } else {
              await removeInventoryItem(deleteConfirm.id);
            }
            setDeleteConfirm(null);
          }
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
