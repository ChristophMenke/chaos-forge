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
  Footprints,
  Swords,
} from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { localized } from "@/lib/utils/localize";
import { uploadMonsterImage } from "@/app/master/actions";
import type { MonsterRow } from "@/lib/supabase/types";

const SIZE_ORDER = ["T", "S", "M", "L", "H", "G"] as const;

// Generate a unique hue from a string (deterministic hash)
function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

// Size-based silhouette icons (simple SVG paths)
const SIZE_ICONS: Record<string, string> = {
  T: "M40 22c-3 0-5 2-5 5v3l-4 6v8l4 3v5h2v4h6v-4h2v-5l4-3v-8l-4-6v-3c0-3-2-5-5-5z", // tiny creature
  S: "M40 18c-6 0-10 4-10 9 0 3 2 6 4 8l-2 10 8 5 8-5-2-10c2-2 4-5 4-8 0-5-4-9-10-9z", // small skull
  M: "M28 50l4-14c-3-2-5-6-5-10 0-7 6-12 13-12s13 5 13 12c0 4-2 8-5 10l4 14h-4l-1 6h-14l-1-6h-4z", // humanoid
  L: "M20 42c0-8 4-14 8-18 2-2 5-4 8-4h8c3 0 6 2 8 4 4 4 8 10 8 18v4l-4 6-6 2v4h-20v-4l-6-2-4-6v-4z", // beast
  H: "M16 38c0-10 6-18 12-22 3-2 7-2 10 0l6 4 6-4c3-2 7-2 10 0 6 4 12 12 12 22v6l-8 8h-8v6h-24v-6h-8l-8-8v-6z", // dragon-like
  G: "M12 36c0-12 8-22 16-26 4-2 8-2 12 0 8 4 16 14 16 26v8l-6 6-4 2v4l-4 4h-16l-4-4v-4l-4-2-6-6v-8z", // colossal
};

function monsterAvatar(name: string, size: string): string {
  const hue = nameToHue(name);
  const letter = name.charAt(0).toUpperCase();
  const path = SIZE_ICONS[size] ?? SIZE_ICONS.M;
  const c1 = `hsl(${hue}, 60%, 25%)`;
  const c2 = `hsl(${hue}, 70%, 40%)`;
  const c3 = `hsl(${hue}, 50%, 55%)`;

  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0%" stop-color="${c1}"/>` +
      `<stop offset="100%" stop-color="${c2}"/>` +
      `</linearGradient></defs>` +
      `<rect width="80" height="80" rx="12" fill="url(#g)"/>` +
      `<path d="${path}" fill="${c3}" opacity="0.4"/>` +
      `<text x="40" y="42" text-anchor="middle" dominant-baseline="central" ` +
      `font-family="serif" font-size="32" font-weight="bold" fill="white" opacity="0.95">${letter}</text>` +
      `</svg>`
  )}`;
}

interface MasterBestiaryPanelProps {
  monsters: MonsterRow[];
  onAddToCombat?: (monster: MonsterRow, count: number) => void;
}

const PAGE_SIZE = 20;

export function MasterBestiaryPanel({ monsters, onAddToCombat }: MasterBestiaryPanelProps) {
  const t = useTranslations("master");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState<string>("");
  const [selectedMonster, setSelectedMonster] = useState<MonsterRow | null>(null);
  const [page, setPage] = useState(0);

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
    return result;
  }, [monsters, search, sizeFilter]);

  // Reset page when filters change
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4" data-testid="gm-bestiary-panel">
      {/* Search & Filters */}
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
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length > PAGE_SIZE
          ? `${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} / ${filtered.length}`
          : `${filtered.length} / ${monsters.length}`}
      </p>

      {/* Monster Grid */}
      {filtered.length === 0 ? (
        <p
          className="py-8 text-center text-sm text-muted-foreground"
          data-testid="gm-bestiary-empty"
        >
          {t("monsterNoResults")}
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
            {paged.map((m) => (
              <MonsterCard
                key={m.id}
                monster={m}
                locale={locale}
                onSelect={() => setSelectedMonster(m)}
                onAddToCombat={onAddToCombat}
              />
            ))}
          </div>

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
        />
      )}
    </div>
  );
}

// ─── Monster Card ─────────────────────────────────────────────────────

function MonsterCard({
  monster,
  locale,
  onSelect,
  onAddToCombat,
}: {
  monster: MonsterRow;
  locale: string;
  onSelect: () => void;
  onAddToCombat?: (monster: MonsterRow, count: number) => void;
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
        className="overflow-hidden p-0 transition-all hover:scale-[1.01]"
        data-testid={`gm-monster-card-${monster.id}`}
      >
        {/* Prominent image */}
        <div className="relative h-36 w-full">
          {monster.image_url ? (
            <Image src={monster.image_url} alt={displayName} fill className="object-cover" />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={monsterAvatar(displayName, monster.size)}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3">
            <h4 className="font-heading text-base font-semibold text-foreground drop-shadow-lg">
              {displayName}
            </h4>
          </div>
        </div>

        <div className="p-3">
          {/* Key stats grid — Monster Manual style */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded border border-border/50 px-1 py-1.5">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {t("ac")}
              </div>
              <div className="font-mono text-sm font-bold">{monster.ac}</div>
            </div>
            <div className="rounded border border-border/50 px-1 py-1.5">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {t("monsterHD")}
              </div>
              <div className="font-mono text-sm font-bold">{monster.hit_dice}</div>
            </div>
            <div className="rounded border border-border/50 px-1 py-1.5">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {t("thac0")}
              </div>
              <div className="font-mono text-sm font-bold">{monster.thac0}</div>
            </div>
          </div>

          {/* Secondary stats */}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
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
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground/70">{description}</p>
          )}

          {/* Add to combat */}
          {onAddToCombat && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCombat(monster, 1);
              }}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20"
              data-testid={`gm-monster-add-${monster.id}`}
            >
              <Plus className="h-3 w-3" />
              {t("monsterAddToCombat")}
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Monster Detail Modal ─────────────────────────────────────────────

function MonsterDetailModal({
  monster,
  locale,
  onClose,
  onAddToCombat,
}: {
  monster: MonsterRow;
  locale: string;
  onClose: () => void;
  onAddToCombat?: (monster: MonsterRow, count: number) => void;
}) {
  const t = useTranslations("master");
  const [count, setCount] = useState(1);
  const [imageUrl, setImageUrl] = useState(monster.image_url);
  const [fullscreen, setFullscreen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayName = localized(monster.name, monster.name_en, locale);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadMonsterImage(monster.id, formData);
      if (res.success && res.imageUrl) {
        setImageUrl(res.imageUrl + "?t=" + Date.now()); // Cache-bust
      }
      setUploading(false);
    },
    [monster.id]
  );

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

  const rows: { key: string; label: string; value: string | number | null }[] = [
    { key: "ac", label: t("ac"), value: monster.ac },
    { key: "movement", label: t("monsterMovement"), value: monster.movement },
    { key: "hd", label: t("monsterHD"), value: monster.hit_dice },
    { key: "thac0", label: t("thac0"), value: monster.thac0 },
    { key: "attacks", label: t("monsterAttacks"), value: monster.attacks_per_round },
    { key: "damage", label: t("monsterDamage"), value: monster.damage },
    { key: "specialAttacks", label: t("monsterSpecialAttacks"), value: monster.special_attacks },
    { key: "specialDefenses", label: t("monsterSpecialDefenses"), value: monster.special_defenses },
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
  ];

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullscreen) setFullscreen(false);
        else onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [fullscreen, onClose]);

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
        className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border p-0"
        onClick={(e) => e.stopPropagation()}
        data-testid="gm-monster-detail"
      >
        {/* Fullscreen image overlay */}
        {fullscreen && imageUrl && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setFullscreen(false)}
            data-testid="gm-monster-fullscreen"
          >
            {/* Fullscreen uses img — fill mode with unknown dimensions */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={displayName}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            />
            <button
              onClick={() => setFullscreen(false)}
              className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        )}

        {/* Prominent monster image — hero section */}
        <div className="relative h-64 w-full">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayName}
              fill
              className="object-cover"
              data-testid="gm-monster-detail-image"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={monsterAvatar(displayName, monster.size)}
              alt={displayName}
              className="h-full w-full object-cover"
              data-testid="gm-monster-detail-image"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <button
            onClick={() => setFullscreen(true)}
            className="absolute right-3 top-3 rounded-md bg-black/60 p-1.5 text-white hover:bg-black/80"
            title="Fullscreen"
            data-testid="gm-monster-fullscreen-btn"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="absolute left-3 top-3 rounded-md bg-black/60 p-1.5 text-white hover:bg-black/80"
            data-testid="gm-monster-detail-close"
          >
            <X className="h-4 w-4" />
          </button>
          {/* Name overlay on image */}
          <div className="absolute bottom-3 left-4 right-4">
            <h2
              id="monster-detail-title"
              className="font-heading text-2xl font-bold text-foreground drop-shadow-lg"
            >
              {displayName}
            </h2>
            {monster.name !== monster.name_en && monster.name_en && (
              <p className="text-sm text-muted-foreground drop-shadow-lg">{monster.name_en}</p>
            )}
          </div>
        </div>

        <div className="p-5">
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
              className="flex items-center gap-1 rounded-md bg-accent/30 px-2 py-1 text-xs text-muted-foreground hover:bg-accent/50"
              data-testid="gm-monster-image-upload"
            >
              <Upload className="h-3 w-3" />
              {imageUrl ? t("monsterChangeImage") : t("monsterUploadImage")}
            </button>
          </div>

          {/* Description */}
          {monster.description && (
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              {localized(monster.description, monster.description_en, locale)}
            </p>
          )}

          {/* Core stats — Monster Manual style block */}
          <div className="mb-4 grid grid-cols-4 gap-2">
            {[
              { label: t("ac"), value: monster.ac },
              { label: t("monsterHD"), value: monster.hit_dice },
              { label: t("thac0"), value: monster.thac0 },
              { label: t("monsterMovement"), value: monster.movement },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-border/50 px-2 py-2 text-center"
              >
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
                <div className="font-mono text-lg font-bold">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Combat stats */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            {[
              { label: t("monsterAttacks"), value: monster.attacks_per_round },
              { label: t("monsterDamage"), value: monster.damage },
              { label: t("monsterSpecialAttacks"), value: monster.special_attacks },
              { label: t("monsterSpecialDefenses"), value: monster.special_defenses },
            ]
              .filter((s) => s.value)
              .map((s) => (
                <div key={s.label} className="rounded border border-border/30 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="text-sm">{s.value}</div>
                </div>
              ))}
          </div>

          {/* Secondary stat table — excludes stats already shown in core/combat grids */}
          <div className="space-y-1">
            {rows
              .filter((r) => !PROMOTED_KEYS.has(r.key) && r.value !== null && r.value !== "")
              .map((r) => (
                <div
                  key={r.label}
                  className="flex justify-between border-b border-border/30 py-1 text-sm"
                >
                  <span className="font-medium text-muted-foreground">{r.label}</span>
                  <span className="text-right text-foreground">{r.value}</span>
                </div>
              ))}
          </div>

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
        </div>
      </div>
    </div>
  );
}
