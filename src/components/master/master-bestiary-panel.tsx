"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import {
  Search,
  Plus,
  X,
  Shield,
  Skull,
  Zap,
  Upload,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Heart,
  Crosshair,
  ArrowUpDown,
  Eye,
  Pencil,
  Trash2,
  FileUp,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { localized } from "@/lib/utils/localize";
import { monsterAvatar } from "@/lib/utils/svg-avatar";
import { uploadMonsterImage, createMonsterGm, deleteMonsterGm } from "@/app/master/actions";
import { compressImageIfNeeded } from "@/lib/utils/image-compression";
import { BookmarkToggle } from "./bookmark-toggle";
import type { MonsterRow } from "@/lib/supabase/types";

const SIZE_ORDER = ["T", "S", "M", "L", "H", "G"] as const;

/** Parse AD&D hit dice notation: "3+3" → 3, "1/2" → 0.5, "1/4" → 0.25, "8" → 8 */
function parseHitDiceValue(hd: string): number {
  const trimmed = hd.trim();
  if (!trimmed) return 1;
  // Fractional notation: "1/2" → 0.5, "1/4" → 0.25
  if (trimmed.includes("/")) {
    const [num, denom] = trimmed.split("/").map(Number);
    if (num && denom) return num / denom;
    return 0.5;
  }
  // Leading numeric part: "3+3" → 3, "8+8" → 8
  const match = trimmed.match(/^(\d+(?:\.\d+)?)/);
  if (match) {
    const val = parseFloat(match[1]);
    return val > 0 ? val : 1;
  }
  return 1;
}

const HD_RANGES = [
  { key: "1", min: 0, max: 1 },
  { key: "2", min: 2, max: 4 },
  { key: "3", min: 5, max: 8 },
  { key: "4", min: 9, max: 12 },
  { key: "5", min: 13, max: Infinity },
] as const;

type SortKey = "name" | "ac" | "hd" | "thac0" | "xp";
type SortDir = "asc" | "desc";

function getSortValue(m: MonsterRow, key: SortKey): string | number {
  switch (key) {
    case "name":
      return m.name.toLowerCase();
    case "ac":
      return m.ac;
    case "hd":
      return m.hit_dice_value;
    case "thac0":
      return m.thac0;
    case "xp":
      return m.xp_value;
  }
}

// Keys promoted to the core/combat stat grids — excluded from the secondary table
const PROMOTED_KEYS = new Set([
  "ac",
  "movement",
  "hd",
  "thac0",
  "attacks",
  "damage",
  "specialAttacks",
  "specialDefenses",
]);

interface MasterBestiaryPanelProps {
  monsters: MonsterRow[];
  onAddToCombat?: (monster: MonsterRow, count: number) => void;
  bookmarkSet?: Set<string>;
  userId?: string;
  onBookmarkToggle?: (
    entityType: import("@/lib/supabase/types").BookmarkEntityType,
    entityId: string
  ) => void;
  onMonstersChange?: () => void;
}

const PAGE_SIZE = 24;

export function MasterBestiaryPanel({
  monsters,
  onAddToCombat,
  bookmarkSet,
  userId,
  onBookmarkToggle,
  onMonstersChange,
}: MasterBestiaryPanelProps) {
  const t = useTranslations("master");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState<string>("");
  const [hdRange, setHdRange] = useState<string>("");
  const [selectedMonster, setSelectedMonster] = useState<MonsterRow | null>(null);
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<"manual" | "ai">("manual");
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [preciseMode, setPreciseMode] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [monsterForm, setMonsterForm] = useState<Partial<MonsterRow>>({
    name: "",
    name_en: "",
    ac: 10,
    hit_dice: "1",
    hit_dice_value: 1,
    thac0: 20,
    attacks_per_round: "1",
    damage: "1d4",
    size: "M",
    morale_value: 10,
    xp_value: 0,
    movement: "12",
  });

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleCreateMonster() {
    if (!monsterForm.name?.trim()) return;
    const result = await createMonsterGm(monsterForm);
    if (result.success && result.id) {
      // Upload pending image if user selected one
      if (pendingImageFile) {
        try {
          const compressed = await compressImageIfNeeded(pendingImageFile);
          const imgFormData = new FormData();
          imgFormData.append("file", compressed);
          await uploadMonsterImage(result.id, imgFormData);
        } catch {
          // Image upload failed but monster was created — log but don't block
        }
      }
      showToast(t("monsterCreated"), "success");
      setShowCreate(false);
      setPendingImageFile(null);
      setPendingImagePreview(null);
      setMonsterForm({
        name: "",
        ac: 10,
        hit_dice: "1",
        hit_dice_value: 1,
        thac0: 20,
        attacks_per_round: "1",
        damage: "1d4",
        size: "M",
        morale_value: 10,
        xp_value: 0,
        movement: "12",
      });
      onMonstersChange?.();
    } else {
      showToast(result.error ?? t("monsterImportFailed"), "error");
    }
  }

  function handleSelectImage(file: File) {
    setPendingImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setPendingImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleAIImport(files: FileList) {
    setImporting(true);
    try {
      // Client-side compression for large iPhone photos
      const compressedFiles = await Promise.all(
        Array.from(files).map((file) => compressImageIfNeeded(file))
      );
      const formData = new FormData();
      for (const file of compressedFiles) {
        formData.append("files", file);
      }
      if (preciseMode) formData.append("precise", "true");
      const res = await fetch("/api/scan-monster", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error ?? t("monsterImportFailed"), "error");
        setImporting(false);
        return;
      }
      const data = await res.json();
      setMonsterForm({
        name: data.name ?? "",
        name_en: data.name_en ?? "",
        ac: data.ac ?? 10,
        movement: data.movement ?? "12",
        hit_dice: data.hit_dice ?? "1",
        hit_dice_value: data.hit_dice_value ?? 1,
        thac0: data.thac0 ?? 20,
        attacks_per_round: String(data.attacks_per_round ?? 1),
        damage: data.damage ?? "1d4",
        special_attacks: data.special_attacks ?? null,
        special_defenses: data.special_defenses ?? null,
        magic_resistance: data.magic_resistance ?? null,
        size: data.size ?? "M",
        morale: data.morale ?? null,
        morale_value: data.morale_value ?? 10,
        xp_value: data.xp_value ?? 0,
        description: data.description ?? null,
        climate_terrain: data.climate_terrain ?? null,
        frequency: data.frequency ?? null,
        organization: data.organization ?? null,
        intelligence: data.intelligence ?? null,
        alignment: data.alignment ?? null,
        has_ranged_attack: data.has_ranged_attack ?? false,
        default_zone: data.default_zone ?? "melee",
      });
      setCreateMode("manual"); // Switch to manual so user can review/edit
      showToast(t("monsterImportSuccess"), "success");
    } catch {
      showToast(t("monsterImportFailed"), "error");
    } finally {
      setImporting(false);
    }
  }

  async function handleDeleteMonster(id: string) {
    const result = await deleteMonsterGm(id);
    if (result.success) {
      showToast(t("monsterDeleted"), "success");
      setDeleteConfirmId(null);
      onMonstersChange?.();
    } else {
      showToast(result.error ?? t("monsterImportFailed"), "error");
    }
  }

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey]
  );

  const filtered = useMemo(() => {
    let result = monsters;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) => m.name.toLowerCase().includes(q) || (m.name_en?.toLowerCase().includes(q) ?? false)
      );
    }
    if (sizeFilter) {
      result = result.filter((m) => m.size === sizeFilter);
    }
    if (hdRange) {
      const range = HD_RANGES.find((r) => r.key === hdRange);
      if (range) {
        result = result.filter(
          (m) => m.hit_dice_value >= range.min && m.hit_dice_value <= range.max
        );
      }
    }
    // Sort
    result = [...result].sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [monsters, search, sizeFilter, hdRange, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4" data-testid="gm-bestiary-panel">
      {/* Create Monster */}
      <div className="space-y-2">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex w-full items-center justify-between rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          data-testid="gm-monster-create-toggle"
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("createMonster")}
          </span>
          {showCreate ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showCreate && (
          <GlassCard hover={false} className="p-3" data-testid="gm-monster-create-form">
            {/* Mode Toggle */}
            <div className="mb-3 flex gap-1 rounded-lg bg-background/20 p-0.5">
              <button
                onClick={() => setCreateMode("manual")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${createMode === "manual" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="gm-monster-mode-manual"
              >
                <Pencil className="h-3 w-3" />
                {t("monsterManualEntry")}
              </button>
              <button
                onClick={() => setCreateMode("ai")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${createMode === "ai" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="gm-monster-mode-ai"
              >
                <FileUp className="h-3 w-3" />
                {t("monsterAIImport")}
              </button>
            </div>

            {createMode === "ai" && (
              <div className="mb-3 space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={preciseMode}
                    onChange={(e) => setPreciseMode(e.target.checked)}
                    className="h-3.5 w-3.5"
                    data-testid="gm-monster-precise-mode"
                  />
                  {t("preciseMode")}
                  <span className="text-[10px] text-muted-foreground/60">
                    ({t("preciseModeDesc")})
                  </span>
                </label>
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border/50 bg-background/20 p-6 transition-colors hover:border-primary/50">
                  {importing ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">{t("monsterImporting")}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t("monsterAIImport")}</span>
                      <span className="text-xs text-muted-foreground/60">PDF, JPG, PNG</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleAIImport(e.target.files)}
                    disabled={importing}
                    data-testid="gm-monster-ai-upload"
                  />
                </label>
              </div>
            )}

            {/* Monster Form (Manual or post-AI-import review) */}
            {(createMode === "manual" || monsterForm.name) && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={t("monsterName")}
                    value={monsterForm.name ?? ""}
                    onChange={(e) => setMonsterForm((f) => ({ ...f, name: e.target.value }))}
                    className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm"
                    data-testid="gm-monster-name"
                  />
                  <input
                    type="text"
                    placeholder={t("monsterNameEn")}
                    value={monsterForm.name_en ?? ""}
                    onChange={(e) => setMonsterForm((f) => ({ ...f, name_en: e.target.value }))}
                    className="rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="mb-0.5 block text-[10px] text-muted-foreground">
                      {t("monsterAC")}
                    </span>
                    <input
                      type="number"
                      value={monsterForm.ac ?? 10}
                      onChange={(e) =>
                        setMonsterForm((f) => ({ ...f, ac: Number(e.target.value) }))
                      }
                      className="w-full rounded-md border border-border bg-background/50 px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <span className="mb-0.5 block text-[10px] text-muted-foreground">
                      {t("monsterTHAC0")}
                    </span>
                    <input
                      type="number"
                      value={monsterForm.thac0 ?? 20}
                      onChange={(e) =>
                        setMonsterForm((f) => ({ ...f, thac0: Number(e.target.value) }))
                      }
                      className="w-full rounded-md border border-border bg-background/50 px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <span className="mb-0.5 block text-[10px] text-muted-foreground">
                      {t("monsterHD")}
                    </span>
                    <input
                      type="text"
                      value={monsterForm.hit_dice ?? "1"}
                      onChange={(e) =>
                        setMonsterForm((f) => ({
                          ...f,
                          hit_dice: e.target.value,
                          hit_dice_value: parseHitDiceValue(e.target.value),
                        }))
                      }
                      className="w-full rounded-md border border-border bg-background/50 px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <span className="mb-0.5 block text-[10px] text-muted-foreground">
                      {t("monsterXP")}
                    </span>
                    <input
                      type="number"
                      value={monsterForm.xp_value ?? 0}
                      onChange={(e) =>
                        setMonsterForm((f) => ({ ...f, xp_value: Number(e.target.value) }))
                      }
                      className="w-full rounded-md border border-border bg-background/50 px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="mb-0.5 block text-[10px] text-muted-foreground">
                      {t("monsterMovement")}
                    </span>
                    <input
                      type="text"
                      value={monsterForm.movement ?? ""}
                      onChange={(e) => setMonsterForm((f) => ({ ...f, movement: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background/50 px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <span className="mb-0.5 block text-[10px] text-muted-foreground">
                      {t("monsterAttacks")}
                    </span>
                    <input
                      type="text"
                      value={monsterForm.attacks_per_round ?? "1"}
                      onChange={(e) =>
                        setMonsterForm((f) => ({ ...f, attacks_per_round: e.target.value }))
                      }
                      className="w-full rounded-md border border-border bg-background/50 px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <span className="mb-0.5 block text-[10px] text-muted-foreground">
                      {t("monsterDamage")}
                    </span>
                    <input
                      type="text"
                      value={monsterForm.damage ?? ""}
                      onChange={(e) => setMonsterForm((f) => ({ ...f, damage: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background/50 px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="mb-0.5 block text-[10px] text-muted-foreground">
                      {t("monsterSize")}
                    </span>
                    <select
                      value={monsterForm.size ?? "M"}
                      onChange={(e) =>
                        setMonsterForm((f) => ({
                          ...f,
                          size: e.target.value as MonsterRow["size"],
                        }))
                      }
                      className="w-full rounded-md border border-border bg-background/50 px-2 py-1 text-sm"
                    >
                      {SIZE_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {t(`size${s}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="mb-0.5 block text-[10px] text-muted-foreground">
                      {t("monsterMoralValue")}
                    </span>
                    <input
                      type="number"
                      value={monsterForm.morale_value ?? 10}
                      onChange={(e) =>
                        setMonsterForm((f) => ({ ...f, morale_value: Number(e.target.value) }))
                      }
                      className="w-full rounded-md border border-border bg-background/50 px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={t("monsterSpecialAttacks")}
                    value={monsterForm.special_attacks ?? ""}
                    onChange={(e) =>
                      setMonsterForm((f) => ({ ...f, special_attacks: e.target.value || null }))
                    }
                    className="rounded-md border border-border bg-background/50 px-2 py-1 text-sm"
                  />
                  <input
                    type="text"
                    placeholder={t("monsterSpecialDefenses")}
                    value={monsterForm.special_defenses ?? ""}
                    onChange={(e) =>
                      setMonsterForm((f) => ({ ...f, special_defenses: e.target.value || null }))
                    }
                    className="rounded-md border border-border bg-background/50 px-2 py-1 text-sm"
                  />
                </div>
                <textarea
                  placeholder={t("monsterDescription")}
                  value={monsterForm.description ?? ""}
                  onChange={(e) =>
                    setMonsterForm((f) => ({ ...f, description: e.target.value || null }))
                  }
                  rows={2}
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm"
                />

                {/* Monster Image Upload */}
                <div>
                  <span className="mb-1 block text-[10px] text-muted-foreground">
                    {t("monsterUploadImage")}
                  </span>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border/50 bg-background/20 p-2 transition-colors hover:border-primary/50">
                    {pendingImagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pendingImagePreview}
                        alt=""
                        className="h-16 w-16 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded bg-background/40">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="flex-1 text-xs text-muted-foreground">
                      {pendingImageFile?.name ?? t("monsterUploadImage")}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSelectImage(file);
                      }}
                      data-testid="gm-monster-image-upload"
                    />
                  </label>
                </div>

                <Button
                  className="w-full"
                  disabled={!monsterForm.name?.trim()}
                  onClick={handleCreateMonster}
                  data-testid="gm-monster-create-submit"
                >
                  {t("monsterSave")}
                </Button>
              </div>
            )}
          </GlassCard>
        )}
      </div>

      {/* Search, Filters & View Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={t("monsterSearch")}
            className="w-full rounded-lg border border-border bg-background/50 py-2 pl-10 pr-3 text-sm"
            data-testid="gm-bestiary-search"
          />
        </div>
        <select
          value={sizeFilter}
          onChange={(e) => {
            setSizeFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border border-border bg-background/50 px-3 py-2 text-sm"
          data-testid="gm-bestiary-size-filter"
        >
          <option value="">{t("monsterSize")}</option>
          {SIZE_ORDER.map((s) => (
            <option key={s} value={s}>
              {t(`size${s}`)}
            </option>
          ))}
        </select>
        <select
          value={hdRange}
          onChange={(e) => {
            setHdRange(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border border-border bg-background/50 px-3 py-2 text-sm"
          data-testid="gm-bestiary-hd-filter"
        >
          <option value="">{t("monsterHDRange")}</option>
          {HD_RANGES.map((r) => (
            <option key={r.key} value={r.key}>
              {t(`monsterHDRange${r.key}`)}
            </option>
          ))}
        </select>

        {/* Sort dropdown (both views) */}
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={`${sortKey}-${sortDir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split("-") as [SortKey, SortDir];
              setSortKey(k);
              setSortDir(d);
            }}
            className="rounded-lg border border-border bg-background/50 px-2 py-2 text-sm"
            data-testid="gm-bestiary-sort"
          >
            <option value="name-asc">{t("monsterSortName")} ↑</option>
            <option value="name-desc">{t("monsterSortName")} ↓</option>
            <option value="ac-asc">{t("monsterSortAC")} ↑</option>
            <option value="ac-desc">{t("monsterSortAC")} ↓</option>
            <option value="hd-asc">{t("monsterSortHD")} ↑</option>
            <option value="hd-desc">{t("monsterSortHD")} ↓</option>
            <option value="thac0-asc">{t("monsterSortTHAC0")} ↑</option>
            <option value="thac0-desc">{t("monsterSortTHAC0")} ↓</option>
            <option value="xp-asc">{t("monsterSortXP")} ↑</option>
            <option value="xp-desc">{t("monsterSortXP")} ↓</option>
          </select>
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border border-border">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-l-lg p-2 ${viewMode === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-accent/30"}`}
            title={t("monsterViewGrid")}
            aria-label={t("monsterViewGrid")}
            aria-pressed={viewMode === "grid"}
            data-testid="gm-bestiary-view-grid"
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-r-lg p-2 ${viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-accent/30"}`}
            title={t("monsterViewList")}
            aria-label={t("monsterViewList")}
            aria-pressed={viewMode === "list"}
            data-testid="gm-bestiary-view-list"
          >
            <List className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length > PAGE_SIZE
          ? `${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} / ${filtered.length}`
          : `${filtered.length} / ${monsters.length}`}
      </p>

      {/* Monster Grid / List */}
      {filtered.length === 0 ? (
        <p
          className="py-8 text-center text-sm text-muted-foreground"
          data-testid="gm-bestiary-empty"
        >
          {t("monsterNoResults")}
        </p>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {paged.map((m) => (
                <MonsterCard
                  key={m.id}
                  monster={m}
                  locale={locale}
                  onSelect={() => setSelectedMonster(m)}
                  onAddToCombat={onAddToCombat}
                  isBookmarked={bookmarkSet?.has(`monster:${m.id}`)}
                  userId={userId}
                  onBookmarkToggle={onBookmarkToggle}
                />
              ))}
            </div>
          ) : (
            <MonsterListView
              monsters={paged}
              locale={locale}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              onSelect={setSelectedMonster}
              onAddToCombat={onAddToCombat}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-center gap-3 pt-2"
              data-testid="gm-bestiary-pagination"
            >
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 disabled:opacity-30"
                data-testid="gm-bestiary-prev"
              >
                <ChevronLeft className="h-4 w-4" />
                {t("paginationPrev")}
              </button>
              <span className="text-xs text-muted-foreground" data-testid="gm-bestiary-page-info">
                {t("paginationPage", { current: safePage + 1, total: totalPages })}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 disabled:opacity-30"
                data-testid="gm-bestiary-next"
              >
                {t("paginationNext")}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedMonster && (
        <MonsterDetailModal
          monster={selectedMonster}
          locale={locale}
          onClose={() => setSelectedMonster(null)}
          onAddToCombat={onAddToCombat}
          onDelete={(id) => {
            setSelectedMonster(null);
            setDeleteConfirmId(id);
          }}
        />
      )}

      {/* Delete Monster Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-xl">
            <h3 className="mb-2 font-heading text-lg text-foreground">{t("confirmDelete")}</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              {t("deleteMonsterConfirm", {
                name: monsters.find((m) => m.id === deleteConfirmId)?.name ?? "",
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteMonster(deleteConfirmId)}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                {t("deleteMonster")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
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
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ─── Monster Card (Grid View) ────────────────────────────────────────

function MonsterCard({
  monster,
  locale,
  onSelect,
  onAddToCombat,
  isBookmarked,
  userId: cardUserId,
  onBookmarkToggle: cardOnBookmarkToggle,
}: {
  monster: MonsterRow;
  locale: string;
  onSelect: () => void;
  onAddToCombat?: (monster: MonsterRow, count: number) => void;
  isBookmarked?: boolean;
  userId?: string;
  onBookmarkToggle?: (
    entityType: import("@/lib/supabase/types").BookmarkEntityType,
    entityId: string
  ) => void;
}) {
  const t = useTranslations("master");
  const displayName = localized(monster.name, monster.name_en, locale);
  const description = monster.description
    ? localized(monster.description, monster.description_en, locale)
    : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="w-full cursor-pointer text-left"
    >
      <GlassCard
        className="relative overflow-hidden p-0 transition-all hover:scale-[1.01]"
        data-testid={`gm-monster-card-${monster.id}`}
      >
        {/* Bookmark + Add to combat buttons in corner */}
        <div className="absolute right-2 top-2 z-10 flex gap-1">
          {cardUserId && cardOnBookmarkToggle && (
            <div
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="rounded-full bg-black/60 hover:bg-black/80"
            >
              <BookmarkToggle
                entityType="monster"
                entityId={monster.id}
                isBookmarked={isBookmarked ?? false}
                userId={cardUserId}
                onToggle={cardOnBookmarkToggle}
              />
            </div>
          )}
          {onAddToCombat && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCombat(monster, 1);
              }}
              className="rounded-full bg-black/60 p-1.5 text-primary hover:bg-black/80"
              title={t("monsterAddToCombat")}
              data-testid={`gm-monster-add-${monster.id}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Image — square aspect ratio */}
        <div className="relative aspect-square w-full bg-black/40">
          {monster.image_url ? (
            <Image
              src={monster.image_url}
              alt={displayName}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={monsterAvatar(displayName, monster.size)}
              alt={displayName}
              className="h-full w-full object-contain"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute bottom-1.5 left-2 right-2">
            <h4 className="font-heading text-sm font-semibold leading-tight text-foreground drop-shadow-lg">
              {displayName}
            </h4>
          </div>
        </div>

        <div className="p-2">
          {/* Key stats — compact row */}
          <div className="flex justify-between gap-1 text-center text-[10px]">
            <div>
              <div className="flex items-center justify-center gap-0.5 text-muted-foreground">
                <Shield className="h-2.5 w-2.5 text-amber-400" />
                {t("ac")}
              </div>
              <div className="font-mono text-sm font-bold text-amber-300">{monster.ac}</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-0.5 text-muted-foreground">
                <Heart className="h-2.5 w-2.5 text-red-400" />
                {t("monsterHD")}
              </div>
              <div className="font-mono text-sm font-bold text-red-300">{monster.hit_dice}</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-0.5 text-muted-foreground">
                <Crosshair className="h-2.5 w-2.5 text-sky-400" />
                {t("thac0")}
              </div>
              <div className="font-mono text-sm font-bold text-sky-300">{monster.thac0}</div>
            </div>
          </div>

          {/* Secondary stats */}
          <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
            <span>
              {t("monsterXP")} {monster.xp_value.toLocaleString()}
            </span>
            <span>{t(`size${monster.size}`)}</span>
            {monster.magic_resistance > 0 && (
              <span className="flex items-center gap-0.5 text-purple-400">
                <Zap className="h-2.5 w-2.5" />
                {monster.magic_resistance}%
              </span>
            )}
          </div>

          {/* Description preview */}
          {description && (
            <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground/70">{description}</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Monster List View ───────────────────────────────────────────────

function MonsterListView({
  monsters,
  locale,
  sortKey,
  sortDir,
  onSort,
  onSelect,
  onAddToCombat,
}: {
  monsters: MonsterRow[];
  locale: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onSelect: (monster: MonsterRow) => void;
  onAddToCombat?: (monster: MonsterRow, count: number) => void;
}) {
  const t = useTranslations("master");

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  const headerClass =
    "cursor-pointer select-none px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors";

  return (
    <div className="overflow-x-auto" data-testid="gm-bestiary-list">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <th
              className={headerClass}
              onClick={() => onSort("name")}
              aria-sort={
                sortKey === "name" ? (sortDir === "asc" ? "ascending" : "descending") : "none"
              }
            >
              {t("monsterSortName")}
              {sortIndicator("name")}
            </th>
            <th
              className={`${headerClass} text-center`}
              onClick={() => onSort("ac")}
              aria-sort={
                sortKey === "ac" ? (sortDir === "asc" ? "ascending" : "descending") : "none"
              }
            >
              <span className="inline-flex items-center gap-1">
                <Shield className="h-3 w-3 text-amber-400" aria-hidden="true" />
                {t("monsterSortAC")}
                {sortIndicator("ac")}
              </span>
            </th>
            <th
              className={`${headerClass} text-center`}
              onClick={() => onSort("hd")}
              aria-sort={
                sortKey === "hd" ? (sortDir === "asc" ? "ascending" : "descending") : "none"
              }
            >
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3 w-3 text-red-400" aria-hidden="true" />
                {t("monsterSortHD")}
                {sortIndicator("hd")}
              </span>
            </th>
            <th
              className={`${headerClass} text-center`}
              onClick={() => onSort("thac0")}
              aria-sort={
                sortKey === "thac0" ? (sortDir === "asc" ? "ascending" : "descending") : "none"
              }
            >
              <span className="inline-flex items-center gap-1">
                <Crosshair className="h-3 w-3 text-sky-400" aria-hidden="true" />
                {t("monsterSortTHAC0")}
                {sortIndicator("thac0")}
              </span>
            </th>
            <th className={`${headerClass} hidden text-center sm:table-cell`}>
              {t("monsterMovement")}
            </th>
            <th className={`${headerClass} text-center`}>{t("monsterSize")}</th>
            <th
              className={`${headerClass} text-right`}
              onClick={() => onSort("xp")}
              aria-sort={
                sortKey === "xp" ? (sortDir === "asc" ? "ascending" : "descending") : "none"
              }
            >
              {t("monsterSortXP")}
              {sortIndicator("xp")}
            </th>
            {onAddToCombat && <th className="w-10" />}
          </tr>
        </thead>
        <tbody>
          {monsters.map((m) => {
            const displayName = localized(m.name, m.name_en, locale);
            return (
              <tr
                key={m.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(m)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(m);
                  }
                }}
                className="cursor-pointer border-b border-border/20 transition-colors hover:bg-accent/20"
                data-testid={`gm-monster-row-${m.id}`}
              >
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-black/30">
                      {m.image_url ? (
                        <Image
                          src={m.image_url}
                          alt={displayName}
                          fill
                          className="object-contain"
                          sizes="32px"
                        />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={monsterAvatar(displayName, m.size)}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      )}
                    </div>
                    <div>
                      <span className="font-heading font-medium">{displayName}</span>
                      {m.magic_resistance > 0 && (
                        <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-purple-400">
                          <Zap className="h-2.5 w-2.5" />
                          {m.magic_resistance}%
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-2 py-2 text-center font-mono font-bold text-amber-300">{m.ac}</td>
                <td className="px-2 py-2 text-center font-mono font-bold text-red-300">
                  {m.hit_dice}
                </td>
                <td className="px-2 py-2 text-center font-mono font-bold text-sky-300">
                  {m.thac0}
                </td>
                <td className="hidden px-2 py-2 text-center text-muted-foreground sm:table-cell">
                  {m.movement}
                </td>
                <td className="px-2 py-2 text-center text-muted-foreground">
                  {t(`size${m.size}`)}
                </td>
                <td className="px-2 py-2 text-right text-muted-foreground">
                  {m.xp_value.toLocaleString()}
                </td>
                {onAddToCombat && (
                  <td className="px-1 py-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCombat(m, 1);
                      }}
                      className="rounded-full p-1 text-primary hover:bg-primary/20"
                      title={t("monsterAddToCombat")}
                      data-testid={`gm-monster-add-${m.id}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Monster Detail Modal ────────────────────────────────────────────

function MonsterDetailModal({
  monster,
  locale,
  onClose,
  onAddToCombat,
  onDelete,
}: {
  monster: MonsterRow;
  locale: string;
  onClose: () => void;
  onAddToCombat?: (monster: MonsterRow, count: number) => void;
  onDelete?: (id: string) => void;
}) {
  const t = useTranslations("master");
  const [count, setCount] = useState(1);
  const [imageUrl, setImageUrl] = useState(monster.image_url);
  const [fullscreen, setFullscreen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const displayName = localized(monster.name, monster.name_en, locale);

  // Move focus into dialog on open
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      setUploadError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadMonsterImage(monster.id, formData);
        if (res.success && res.imageUrl) {
          setImageUrl(res.imageUrl + "?t=" + Date.now());
        } else {
          setUploadError(t("monsterImageUploadFailed"));
        }
      } catch {
        setUploadError(t("monsterImageUploadFailed"));
      } finally {
        setUploading(false);
      }
    },
    [monster.id, t]
  );

  const rows = useMemo(
    () => [
      { key: "ac", label: t("ac"), value: monster.ac as string | number | null },
      { key: "movement", label: t("monsterMovementFull"), value: monster.movement },
      { key: "hd", label: t("monsterHD"), value: monster.hit_dice },
      { key: "thac0", label: t("thac0"), value: monster.thac0 },
      { key: "attacks", label: t("monsterAttacksFull"), value: monster.attacks_per_round },
      { key: "damage", label: t("monsterDamageFull"), value: monster.damage },
      { key: "specialAttacks", label: t("monsterSpecialAttacks"), value: monster.special_attacks },
      {
        key: "specialDefenses",
        label: t("monsterSpecialDefenses"),
        value: monster.special_defenses,
      },
      {
        key: "mr",
        label: t("monsterMagicResistance"),
        value: monster.magic_resistance > 0 ? `${monster.magic_resistance}%` : null,
      },
      { key: "size", label: t("monsterSize"), value: t(`size${monster.size}`) },
      { key: "morale", label: t("monsterMorale"), value: monster.morale },
      { key: "alignment", label: t("monsterAlignment"), value: monster.alignment },
      { key: "xp", label: t("monsterXP"), value: monster.xp_value.toLocaleString() },
      { key: "climate", label: t("monsterClimate"), value: monster.climate_terrain },
      { key: "frequency", label: t("monsterFrequency"), value: monster.frequency },
      { key: "organization", label: t("monsterOrganization"), value: monster.organization },
      { key: "activity", label: t("monsterActivityCycle"), value: monster.activity_cycle },
      { key: "diet", label: t("monsterDiet"), value: monster.diet },
      { key: "intelligence", label: t("monsterIntelligence"), value: monster.intelligence },
      { key: "treasure", label: t("monsterTreasure"), value: monster.treasure },
    ],
    [monster, t]
  );

  // Keyboard: Escape to close, P for player image flash
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullscreen) setFullscreen(false);
        else onClose();
      }
      if (e.key === "p" || e.key === "P") {
        // Don't trigger if typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (imageUrl) setFullscreen(true);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [fullscreen, onClose, imageUrl]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="monster-detail-title"
      onClick={onClose}
      data-testid="gm-monster-detail-overlay"
    >
      <div
        className="glass max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-border bg-background/95 p-0"
        onClick={(e) => e.stopPropagation()}
        data-testid="gm-monster-detail"
      >
        {/* Fullscreen image overlay — spoiler-free for player display */}
        {fullscreen && imageUrl && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={displayName}
            onClick={() => setFullscreen(false)}
            data-testid="gm-monster-fullscreen"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={displayName}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <h2 className="font-heading text-3xl font-bold text-white drop-shadow-lg">
                {displayName}
              </h2>
            </div>
            <button
              onClick={() => setFullscreen(false)}
              className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
              aria-label="Close"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Two-column layout: Image left, Stats right */}
        <div className="flex flex-col lg:flex-row">
          {/* Left column — Image */}
          <div className="relative flex shrink-0 items-center justify-center bg-black/40 lg:w-2/5">
            <div className="relative aspect-square w-full">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={displayName}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-contain"
                  data-testid="gm-monster-detail-image"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={monsterAvatar(displayName, monster.size)}
                  alt={displayName}
                  className="h-full w-full object-contain p-8"
                  data-testid="gm-monster-detail-image"
                />
              )}
            </div>

            {/* Image action buttons */}
            <button
              onClick={() => setFullscreen(true)}
              className="absolute right-3 top-3 rounded-md bg-black/60 p-1.5 text-white hover:bg-black/80"
              title="Fullscreen"
              aria-label="Fullscreen"
              data-testid="gm-monster-fullscreen-btn"
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={onClose}
              className="absolute left-3 top-3 rounded-md bg-black/60 p-1.5 text-white hover:bg-black/80 lg:hidden"
              aria-label="Close"
              data-testid="gm-monster-detail-close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Show Players button */}
            {imageUrl && (
              <button
                onClick={() => setFullscreen(true)}
                className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-primary/80 px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary"
                title="P"
                data-testid="gm-monster-show-players"
              >
                <Eye className="h-4 w-4" />
                {t("monsterShowPlayers")}
              </button>
            )}
          </div>

          {/* Right column — Stats */}
          <div className="flex-1 p-5">
            {/* Close button (desktop — on right side) */}
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2
                  id="monster-detail-title"
                  className="font-heading text-2xl font-bold text-foreground"
                >
                  {displayName}
                </h2>
                {monster.name !== monster.name_en && monster.name_en && (
                  <p className="text-sm text-muted-foreground">{monster.name_en}</p>
                )}
              </div>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="hidden rounded-md p-1.5 text-muted-foreground hover:bg-accent/30 hover:text-foreground lg:block"
                aria-label="Close"
                data-testid="gm-monster-detail-close-desktop"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Image upload */}
            <div className="mb-4 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                data-testid="gm-monster-image-input"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-busy={uploading}
                className="flex items-center gap-1 rounded-md bg-accent/30 px-2 py-1 text-xs text-muted-foreground hover:bg-accent/50"
                data-testid="gm-monster-image-upload"
              >
                <Upload className="h-3 w-3" />
                {imageUrl ? t("monsterChangeImage") : t("monsterUploadImage")}
              </button>
              {uploadError && (
                <p className="text-xs text-red-400" role="alert">
                  {uploadError}
                </p>
              )}
            </div>

            {/* Description */}
            {monster.description && (
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                {localized(monster.description, monster.description_en, locale)}
              </p>
            )}

            {/* Core stats — Monster Manual style block with icons */}
            <div className="mb-4 grid grid-cols-4 gap-2">
              {[
                {
                  label: t("ac"),
                  value: monster.ac,
                  icon: Shield,
                  color: "text-amber-400",
                  valueColor: "text-amber-300",
                },
                {
                  label: t("monsterHDFull"),
                  value: monster.hit_dice,
                  icon: Heart,
                  color: "text-red-400",
                  valueColor: "text-red-300",
                },
                {
                  label: t("thac0"),
                  value: monster.thac0,
                  icon: Crosshair,
                  color: "text-sky-400",
                  valueColor: "text-sky-300",
                },
                {
                  label: t("monsterMovementFull"),
                  value: monster.movement,
                  icon: null,
                  color: "",
                  valueColor: "",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-border/50 px-2 py-2 text-center"
                >
                  <div className="mb-0.5 flex items-center justify-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {s.icon && <s.icon className={`h-3 w-3 ${s.color}`} />}
                    {s.label}
                  </div>
                  <div className={`font-mono text-lg font-bold ${s.valueColor}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Combat stats — full labels */}
            <div className="mb-4 grid grid-cols-2 gap-2">
              {[
                { label: t("monsterAttacksFull"), value: monster.attacks_per_round },
                { label: t("monsterDamageFull"), value: monster.damage },
                { label: t("monsterSpecialAttacks"), value: monster.special_attacks },
                { label: t("monsterSpecialDefenses"), value: monster.special_defenses },
              ]
                .filter((s) => s.value)
                .map((s) => (
                  <div key={s.label} className="rounded border border-border/30 px-3 py-2">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                    <div className="text-sm">{s.value}</div>
                  </div>
                ))}
            </div>

            {/* Secondary stat table */}
            <dl className="space-y-1">
              {rows
                .filter((r) => !PROMOTED_KEYS.has(r.key) && r.value !== null && r.value !== "")
                .map((r) => (
                  <div
                    key={r.label}
                    className="flex justify-between border-b border-border/30 py-1 text-sm"
                  >
                    <dt className="font-medium text-muted-foreground">{r.label}</dt>
                    <dd className="text-right text-foreground">{r.value}</dd>
                  </div>
                ))}
            </dl>

            {/* Typical spells */}
            {monster.typical_spells.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground">{t("npcSpellNotes")}:</p>
                <p className="text-sm text-foreground">{monster.typical_spells.join(", ")}</p>
              </div>
            )}

            {/* Add to combat */}
            {onAddToCombat && (
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 rounded-md border border-border bg-background/50 px-2 py-1.5 text-center text-sm"
                  data-testid="gm-monster-detail-count"
                />
                <button
                  onClick={() => {
                    onAddToCombat(monster, count);
                    onClose();
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
                  data-testid="gm-monster-detail-add"
                >
                  <Skull className="h-4 w-4" />
                  {count}x {t("monsterAddToCombat")}
                </button>
              </div>
            )}

            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={() => onDelete(monster.id)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-red-900/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/40"
                data-testid="gm-monster-detail-delete"
              >
                <Trash2 className="h-4 w-4" />
                {t("deleteMonster")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
