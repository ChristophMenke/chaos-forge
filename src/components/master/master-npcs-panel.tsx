"use client";

import { useState, useMemo, useCallback, useEffect, useRef, memo } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Shield,
  Heart,
  Copy,
  Loader2,
  Check,
  X,
  Crosshair,
  MapPin,
  LayoutGrid,
  List,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  User,
  Swords,
} from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { npcAvatar } from "@/lib/utils/svg-avatar";
import { createNpc, updateNpc, deleteNpc, createNpcFromCharacter } from "@/app/master/actions";
import type { ChronicleNpcRow, CharacterRow } from "@/lib/supabase/types";

// ─── Types ───────────────────────────────────────────────────────────

type NpcSortKey = "name" | "location" | "level";
type SortDir = "asc" | "desc";

/** Unified wrapper so normal NPCs and character NPCs can be sorted/filtered together */
type UnifiedNpc =
  | { kind: "normal"; id: string; npc: ChronicleNpcRow }
  | { kind: "character"; id: string; char: CharacterRow };

function getUnifiedName(u: UnifiedNpc): string {
  return u.kind === "normal" ? u.npc.name : u.char.name;
}
function getUnifiedLocation(u: UnifiedNpc): string {
  return u.kind === "normal" ? (u.npc.location ?? "") : "";
}
function getUnifiedLevel(u: UnifiedNpc): number {
  if (u.kind === "normal") return u.npc.level ?? 0;
  return u.char.level ?? 0;
}
function getUnifiedTier(u: UnifiedNpc): string {
  if (u.kind === "character") return "character";
  return u.npc.tier;
}
function getUnifiedVisible(u: UnifiedNpc): boolean {
  if (u.kind === "normal") return u.npc.is_visible_to_players;
  return u.char.npc_visible_to_players ?? false;
}
function getUnifiedAvatarUrl(u: UnifiedNpc): string | null {
  if (u.kind === "normal") return u.npc.avatar_url;
  return u.char.avatar_url ?? null;
}

const TIER_ICON: Record<string, typeof User> = {
  normal: User,
  advanced: Swords,
  character: Crown,
};

const TIER_COLOR: Record<string, string> = {
  normal: "bg-zinc-700/60 text-zinc-300",
  advanced: "bg-zinc-700/60 text-zinc-300",
  character: "bg-purple-900/60 text-purple-300",
};

const TIER_LABEL: Record<string, string> = {
  normal: "npcCreate", // "Einfacher NPC" / "Simple NPC"
  advanced: "npcCreate", // same — simple NPCs with extra stats
  character: "npcAdvancedCreate", // "Vollständiger NPC" / "Full NPC"
};

// ─── Props ───────────────────────────────────────────────────────────

interface MasterNpcsPanelProps {
  initialNpcs: ChronicleNpcRow[];
  characters: CharacterRow[];
  npcCharacters: CharacterRow[];
  gmUserId: string;
}

const PAGE_SIZE = 24;

// ─── Main Component ──────────────────────────────────────────────────

export function MasterNpcsPanel({
  initialNpcs,
  characters,
  npcCharacters,
  gmUserId,
}: MasterNpcsPanelProps) {
  const t = useTranslations("master");

  // Data
  const [npcs, setNpcs] = useState(initialNpcs);
  const [npcChars, setNpcChars] = useState(npcCharacters);

  // Filter / Sort / View
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"" | "simple" | "full">("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortKey, setSortKey] = useState<NpcSortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);

  // UI state
  const [selectedNpc, setSelectedNpc] = useState<UnifiedNpc | null>(null);
  const [editingNpc, setEditingNpc] = useState<ChronicleNpcRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCopyPicker, setShowCopyPicker] = useState(false);
  const [copyingCharId, setCopyingCharId] = useState<string | null>(null);
  const [copiedCharName, setCopiedCharName] = useState<string | null>(null);

  // ─── Unified list ────────────────────────────────────────────────

  const unified = useMemo<UnifiedNpc[]>(() => {
    const items: UnifiedNpc[] = [
      ...npcs.map((npc): UnifiedNpc => ({ kind: "normal", id: npc.id, npc })),
      ...npcChars.map((char): UnifiedNpc => ({ kind: "character", id: char.id, char })),
    ];
    return items;
  }, [npcs, npcChars]);

  // Unique locations for filter dropdown
  const locations = useMemo(() => {
    const locs = new Set<string>();
    unified.forEach((u) => {
      const loc = getUnifiedLocation(u);
      if (loc) locs.add(loc);
    });
    return [...locs].sort();
  }, [unified]);

  const filtered = useMemo(() => {
    let result = unified;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          getUnifiedName(u).toLowerCase().includes(q) ||
          getUnifiedLocation(u).toLowerCase().includes(q)
      );
    }
    if (tierFilter) {
      result = result.filter((u) =>
        tierFilter === "simple" ? u.kind === "normal" : u.kind === "character"
      );
    }
    if (locationFilter) {
      result = result.filter((u) => getUnifiedLocation(u) === locationFilter);
    }
    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = getUnifiedName(a).localeCompare(getUnifiedName(b));
          break;
        case "location":
          cmp = getUnifiedLocation(a).localeCompare(getUnifiedLocation(b));
          break;
        case "level":
          cmp = getUnifiedLevel(a) - getUnifiedLevel(b);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [unified, search, tierFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // ─── CRUD Handlers ───────────────────────────────────────────────

  const handleToggleVisibility = useCallback(async (npc: ChronicleNpcRow) => {
    const res = await updateNpc(npc.id, { is_visible_to_players: !npc.is_visible_to_players });
    if (res.success) {
      setNpcs((prev) =>
        prev.map((n) =>
          n.id === npc.id ? { ...n, is_visible_to_players: !n.is_visible_to_players } : n
        )
      );
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const res = await deleteNpc(id);
    if (res.success) {
      setNpcs((prev) => prev.filter((n) => n.id !== id));
      setSelectedNpc(null);
    }
  }, []);

  const handleSave = useCallback(
    async (data: Partial<ChronicleNpcRow>, isNew: boolean) => {
      if (isNew) {
        const res = await createNpc(data);
        if (res.success && res.id) {
          const temp: ChronicleNpcRow = {
            id: res.id,
            name: data.name ?? "",
            location: data.location ?? "",
            description: data.description ?? "",
            avatar_url: null,
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tier: data.tier ?? "normal",
            is_visible_to_players: data.is_visible_to_players ?? false,
            race_id: data.race_id ?? null,
            class_ids: data.class_ids ?? [],
            level: data.level ?? null,
            str: data.str ?? null,
            dex: data.dex ?? null,
            con: data.con ?? null,
            int: data.int ?? null,
            wis: data.wis ?? null,
            cha: data.cha ?? null,
            hp_current: data.hp_current ?? null,
            hp_max: data.hp_max ?? null,
            ac: data.ac ?? null,
            thac0: data.thac0 ?? null,
            equipment_notes: data.equipment_notes ?? null,
            spell_notes: data.spell_notes ?? null,
            notes: data.notes ?? "",
          };
          setNpcs((prev) => [...prev, temp].sort((a, b) => a.name.localeCompare(b.name)));
        }
      } else if (editingNpc) {
        const res = await updateNpc(editingNpc.id, data);
        if (res.success) {
          setNpcs((prev) => prev.map((n) => (n.id === editingNpc.id ? { ...n, ...data } : n)));
        }
      }
      setIsCreating(false);
      setEditingNpc(null);
    },
    [editingNpc]
  );

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-4" data-testid="gm-npcs-panel">
      {/* ── Filter Bar ─────────────────────────────────────────────── */}
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
            placeholder={t("npcSearch")}
            className="w-full rounded-lg border border-border bg-background/50 py-2 pl-10 pr-3 text-sm"
            data-testid="gm-npc-search"
          />
        </div>

        {/* Tier Filter */}
        <select
          value={tierFilter}
          onChange={(e) => {
            setTierFilter(e.target.value as typeof tierFilter);
            setPage(0);
          }}
          className="rounded-lg border border-border bg-background/50 px-3 py-2 text-sm"
          data-testid="gm-npc-tier-filter"
        >
          <option value="">{t("npcTier")}</option>
          <option value="simple">{t("npcCreate")}</option>
          <option value="full">{t("npcAdvancedCreate")}</option>
        </select>

        {/* Location Filter */}
        {locations.length > 0 && (
          <select
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              setPage(0);
            }}
            className="rounded-lg border border-border bg-background/50 px-3 py-2 text-sm"
            data-testid="gm-npc-location-filter"
          >
            <option value="">{t("npcLocation")}</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        )}

        {/* Sort */}
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={`${sortKey}-${sortDir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split("-") as [NpcSortKey, SortDir];
              setSortKey(k);
              setSortDir(d);
            }}
            className="rounded-lg border border-border bg-background/50 px-2 py-2 text-sm"
            data-testid="gm-npc-sort"
          >
            <option value="name-asc">{t("name")} ↑</option>
            <option value="name-desc">{t("name")} ↓</option>
            <option value="location-asc">{t("npcLocation")} ↑</option>
            <option value="location-desc">{t("npcLocation")} ↓</option>
            <option value="level-asc">{t("npcLevel")} ↑</option>
            <option value="level-desc">{t("npcLevel")} ↓</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex rounded-lg border border-border">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-l-lg p-2 ${viewMode === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-accent/30"}`}
            aria-pressed={viewMode === "grid"}
            data-testid="gm-npc-view-grid"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-r-lg p-2 ${viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-accent/30"}`}
            aria-pressed={viewMode === "list"}
            data-testid="gm-npc-view-list"
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* Create Buttons */}
        <button
          onClick={() => {
            setIsCreating(true);
            setEditingNpc(null);
            setShowCopyPicker(false);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20"
          data-testid="gm-npc-create"
        >
          <Plus className="h-4 w-4" />
          {t("npcCreate")}
        </button>
        <Link
          href="/master/npcs/new"
          className="flex items-center gap-1.5 rounded-lg bg-green-600/10 px-3 py-2 text-sm font-medium text-green-400 hover:bg-green-600/20"
          data-testid="gm-npc-create-advanced"
        >
          <Shield className="h-4 w-4" />
          {t("npcAdvancedCreate")}
        </Link>
        <button
          onClick={() => setShowCopyPicker(!showCopyPicker)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-600/10 px-3 py-2 text-sm font-medium text-amber-400 hover:bg-amber-600/20"
          data-testid="gm-npc-copy-from-char"
        >
          <Copy className="h-4 w-4" />
          {t("npcCopyFromCharacter")}
        </button>
      </div>

      {/* ── Copy Picker ────────────────────────────────────────────── */}
      {showCopyPicker && (
        <CopyPicker
          characters={characters}
          copyingCharId={copyingCharId}
          copiedCharName={copiedCharName}
          onCopy={async (charId) => {
            setCopyingCharId(charId);
            setCopiedCharName(null);
            const char = characters.find((c) => c.id === charId);
            const res = await createNpcFromCharacter(charId, gmUserId);
            if (res.success && res.id && char) {
              const npcCopy: CharacterRow = {
                ...char,
                id: res.id,
                name: `${char.name} (NPC)`,
                is_npc: true,
                npc_visible_to_players: false,
                is_active: false,
                user_id: gmUserId,
              };
              setNpcChars((prev) =>
                [...prev, npcCopy].sort((a, b) => a.name.localeCompare(b.name))
              );
              setCopiedCharName(char.name);
            }
            setCopyingCharId(null);
          }}
          t={t}
        />
      )}

      {/* ── Create/Edit Modal ──────────────────────────────────────── */}
      {(isCreating || editingNpc) && (
        <NpcFormModal
          npc={editingNpc ?? undefined}
          onSave={(data) => handleSave(data, isCreating)}
          onCancel={() => {
            setIsCreating(false);
            setEditingNpc(null);
          }}
        />
      )}

      {/* ── Results Count ──────────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground">
        {filtered.length > PAGE_SIZE
          ? `${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} / ${filtered.length}`
          : `${filtered.length} NPCs`}
      </p>

      {/* ── Empty State ────────────────────────────────────────────── */}
      {filtered.length === 0 && !isCreating && (
        <p className="py-8 text-center text-sm text-muted-foreground" data-testid="gm-npc-empty">
          {t("npcNoResults")}
        </p>
      )}

      {/* ── Grid / List ────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <>
          {viewMode === "grid" ? (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {paged.map((u) => (
                <NpcGridCard
                  key={u.id}
                  npc={u}
                  onSelect={() => setSelectedNpc(u)}
                  onToggleVisibility={
                    u.kind === "normal" ? () => handleToggleVisibility(u.npc) : undefined
                  }
                  t={t}
                />
              ))}
            </div>
          ) : (
            <NpcListView
              npcs={paged}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={(key) => {
                if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                else {
                  setSortKey(key);
                  setSortDir("asc");
                }
              }}
              onSelect={setSelectedNpc}
              t={t}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-center gap-3 pt-2"
              data-testid="gm-npc-pagination"
            >
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 disabled:opacity-30"
                data-testid="gm-npc-prev"
              >
                <ChevronLeft className="h-4 w-4" />
                {t("paginationPrev")}
              </button>
              <span className="text-xs text-muted-foreground" data-testid="gm-npc-page-info">
                {t("paginationPage", { current: safePage + 1, total: totalPages })}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 disabled:opacity-30"
                data-testid="gm-npc-next"
              >
                {t("paginationNext")}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Detail Modal ───────────────────────────────────────────── */}
      {selectedNpc && (
        <NpcDetailModal
          npc={selectedNpc}
          onClose={() => setSelectedNpc(null)}
          onEdit={
            selectedNpc.kind === "normal"
              ? () => {
                  setEditingNpc(selectedNpc.npc);
                  setSelectedNpc(null);
                }
              : undefined
          }
          onDelete={selectedNpc.kind === "normal" ? () => handleDelete(selectedNpc.id) : undefined}
          onToggleVisibility={
            selectedNpc.kind === "normal"
              ? () => handleToggleVisibility(selectedNpc.npc)
              : undefined
          }
          t={t}
        />
      )}
    </div>
  );
}

// ─── NPC Grid Card ───────────────────────────────────────────────────

const NpcGridCard = memo(function NpcGridCard({
  npc: u,
  onSelect,
  onToggleVisibility,
  t,
}: {
  npc: UnifiedNpc;
  onSelect: () => void;
  onToggleVisibility?: () => void;
  t: ReturnType<typeof useTranslations<"master">>;
}) {
  const name = getUnifiedName(u);
  const tier = getUnifiedTier(u);
  const imageUrl = getUnifiedAvatarUrl(u);
  const fallbackAvatar = npcAvatar(name, tier as "normal" | "advanced" | "character");
  const location = getUnifiedLocation(u);
  const visible = getUnifiedVisible(u);
  const level = getUnifiedLevel(u);

  // Stats for advanced/character NPCs
  const ac = u.kind === "normal" ? u.npc.ac : null;
  const hpCurrent =
    u.kind === "normal" ? u.npc.hp_current : u.kind === "character" ? u.char.hp_current : null;
  const hpMax = u.kind === "normal" ? u.npc.hp_max : u.kind === "character" ? u.char.hp_max : null;
  const hasStats = tier !== "normal" && (ac !== null || hpMax !== null || level > 0);

  const TierIcon = TIER_ICON[tier] ?? User;

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
        data-testid={`gm-npc-card-${u.id}`}
      >
        {/* Visibility indicator */}
        {onToggleVisibility && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1.5 hover:bg-black/80"
            title={visible ? t("npcVisibleToPlayers") : t("npcHidden")}
            data-testid={`gm-npc-visibility-${u.id}`}
          >
            {visible ? (
              <Eye className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        )}

        {/* Avatar — square aspect ratio */}
        <div className="relative aspect-square w-full bg-black/40">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={fallbackAvatar} alt={name} className="h-full w-full object-contain" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute bottom-1.5 left-2 right-2">
            <h4 className="font-heading text-sm font-semibold leading-tight text-foreground drop-shadow-lg">
              {name}
            </h4>
          </div>
        </div>

        <div className="p-2">
          {/* Stats row — only for advanced/character */}
          {hasStats && (
            <div className="flex justify-between gap-1 text-center text-[10px]">
              {ac !== null && (
                <div>
                  <div className="flex items-center justify-center gap-0.5 text-muted-foreground">
                    <Shield className="h-2.5 w-2.5 text-amber-400" />
                    {t("ac")}
                  </div>
                  <div className="font-mono text-sm font-bold text-amber-300">{ac}</div>
                </div>
              )}
              {hpMax !== null && (
                <div>
                  <div className="flex items-center justify-center gap-0.5 text-muted-foreground">
                    <Heart className="h-2.5 w-2.5 text-red-400" />
                    HP
                  </div>
                  <div className="font-mono text-sm font-bold text-red-300">
                    {hpCurrent ?? hpMax}/{hpMax}
                  </div>
                </div>
              )}
              {level > 0 && (
                <div>
                  <div className="flex items-center justify-center gap-0.5 text-muted-foreground">
                    <Crosshair className="h-2.5 w-2.5 text-sky-400" />
                    Lv
                  </div>
                  <div className="font-mono text-sm font-bold text-sky-300">{level}</div>
                </div>
              )}
            </div>
          )}

          {/* Location + Tier badge */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 ${TIER_COLOR[tier]}`}
            >
              <TierIcon className="h-2.5 w-2.5" />
              {t(TIER_LABEL[tier] ?? "npcCreate")}
            </span>
            {location && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5" />
                {location}
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
});

// ─── NPC List View ───────────────────────────────────────────────────

function NpcListView({
  npcs,
  sortKey,
  sortDir,
  onSort,
  onSelect,
  t,
}: {
  npcs: UnifiedNpc[];
  sortKey: NpcSortKey;
  sortDir: SortDir;
  onSort: (key: NpcSortKey) => void;
  onSelect: (npc: UnifiedNpc) => void;
  t: ReturnType<typeof useTranslations<"master">>;
}) {
  const sortIndicator = (key: NpcSortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  const headerClass =
    "cursor-pointer select-none px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors";

  return (
    <div className="overflow-x-auto" data-testid="gm-npc-list">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <th className={headerClass} onClick={() => onSort("name")}>
              {t("name")}
              {sortIndicator("name")}
            </th>
            <th className={headerClass} onClick={() => onSort("location")}>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                {t("npcLocation")}
                {sortIndicator("location")}
              </span>
            </th>
            <th className={`${headerClass} text-center`}>{t("npcTier")}</th>
            <th className={`${headerClass} text-center`} onClick={() => onSort("level")}>
              {t("npcLevel")}
              {sortIndicator("level")}
            </th>
            <th className={`${headerClass} text-center hidden sm:table-cell`}>
              <span className="inline-flex items-center gap-1">
                <Shield className="h-3 w-3 text-amber-400" />
                {t("ac")}
              </span>
            </th>
            <th className={`${headerClass} text-center hidden sm:table-cell`}>
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3 w-3 text-red-400" />
                HP
              </span>
            </th>
            <th className={`${headerClass} text-center`}>
              <Eye className="inline h-3 w-3" />
            </th>
          </tr>
        </thead>
        <tbody>
          {npcs.map((u) => {
            const name = getUnifiedName(u);
            const tier = getUnifiedTier(u);
            const TierIcon = TIER_ICON[tier] ?? User;
            const imageUrl = getUnifiedAvatarUrl(u);
            const fallbackAvatar = npcAvatar(name, tier as "normal" | "advanced" | "character");
            const ac = u.kind === "normal" ? u.npc.ac : null;
            const hpMax =
              u.kind === "normal" ? u.npc.hp_max : u.kind === "character" ? u.char.hp_max : null;
            const hpCurrent =
              u.kind === "normal"
                ? u.npc.hp_current
                : u.kind === "character"
                  ? u.char.hp_current
                  : null;

            return (
              <tr
                key={u.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(u)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(u);
                  }
                }}
                className="cursor-pointer border-b border-border/20 transition-colors hover:bg-accent/20"
                data-testid={`gm-npc-row-${u.id}`}
              >
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-black/30">
                      {imageUrl ? (
                        <Image src={imageUrl} alt="" fill className="object-cover" sizes="32px" />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={fallbackAvatar} alt="" className="h-full w-full object-contain" />
                      )}
                    </div>
                    <span className="font-heading font-medium">{name}</span>
                  </div>
                </td>
                <td className="px-2 py-2 text-muted-foreground">{getUnifiedLocation(u) || "—"}</td>
                <td className="px-2 py-2 text-center">
                  <span
                    className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs ${TIER_COLOR[tier]}`}
                  >
                    <TierIcon className="h-3 w-3" />
                  </span>
                </td>
                <td className="px-2 py-2 text-center font-mono">
                  {getUnifiedLevel(u) > 0 ? getUnifiedLevel(u) : "—"}
                </td>
                <td className="px-2 py-2 text-center font-mono hidden sm:table-cell text-amber-300">
                  {ac ?? "—"}
                </td>
                <td className="px-2 py-2 text-center font-mono hidden sm:table-cell text-red-300">
                  {hpMax !== null ? `${hpCurrent ?? hpMax}/${hpMax}` : "—"}
                </td>
                <td className="px-2 py-2 text-center">
                  {getUnifiedVisible(u) ? (
                    <Eye className="inline h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <EyeOff className="inline h-3.5 w-3.5 text-muted-foreground/50" />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Detail Modal ────────────────────────────────────────────────────

function NpcDetailModal({
  npc: u,
  onClose,
  onEdit,
  onDelete,
  onToggleVisibility,
  t,
}: {
  npc: UnifiedNpc;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
  t: ReturnType<typeof useTranslations<"master">>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const name = getUnifiedName(u);
  const tier = getUnifiedTier(u);
  const imageUrl = getUnifiedAvatarUrl(u);
  const fallbackAvatar = npcAvatar(name, tier as "normal" | "advanced" | "character");
  const visible = getUnifiedVisible(u);
  const TierIcon = TIER_ICON[tier] ?? User;

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="npc-detail-title"
      onClick={onClose}
      data-testid="gm-npc-detail"
    >
      <div onClick={(e) => e.stopPropagation()}>
        <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {/* Header with avatar */}
          <div className="relative">
            <div className="flex items-start gap-4 p-6 pb-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-black/40">
                {imageUrl ? (
                  <Image src={imageUrl} alt={name} fill className="object-cover" sizes="80px" />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={fallbackAvatar} alt={name} className="h-full w-full object-contain" />
                )}
              </div>
              <div className="flex-1">
                <h2
                  id="npc-detail-title"
                  className="font-heading text-xl font-bold text-foreground"
                >
                  {name}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${TIER_COLOR[tier]}`}
                  >
                    <TierIcon className="h-3 w-3" />
                    {tier === "character"
                      ? t("npcAdvancedCreate")
                      : t(tier === "advanced" ? "npcAdvanced" : "npcNormal")}
                  </span>
                  {u.kind === "normal" && u.npc.location && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {u.npc.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-muted-foreground">
                    {visible ? (
                      <Eye className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                    {visible ? t("npcVisibleToPlayers") : t("npcHidden")}
                  </span>
                </div>
              </div>
              <button
                ref={closeRef}
                onClick={onClose}
                className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-accent/50"
                data-testid="gm-npc-detail-close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4 px-6 pb-6">
            {/* Stats grid */}
            {u.kind === "normal" && u.npc.tier === "advanced" && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {u.npc.ac !== null && (
                  <StatBlock icon={Shield} color="amber" label={t("ac")} value={u.npc.ac} />
                )}
                {u.npc.hp_max !== null && (
                  <StatBlock
                    icon={Heart}
                    color="red"
                    label="HP"
                    value={`${u.npc.hp_current ?? u.npc.hp_max}/${u.npc.hp_max}`}
                  />
                )}
                {u.npc.thac0 !== null && (
                  <StatBlock icon={Crosshair} color="sky" label={t("thac0")} value={u.npc.thac0} />
                )}
                {u.npc.level !== null && (
                  <StatBlock
                    icon={Crown}
                    color="purple"
                    label={t("npcLevel")}
                    value={u.npc.level}
                  />
                )}
              </div>
            )}

            {u.kind === "character" && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                <StatBlock icon={Crown} color="purple" label={t("npcLevel")} value={u.char.level} />
                <StatBlock
                  icon={Heart}
                  color="red"
                  label="HP"
                  value={`${u.char.hp_current}/${u.char.hp_max}`}
                />
              </div>
            )}

            {/* Abilities */}
            {u.kind === "normal" && u.npc.str !== null && (
              <div className="grid grid-cols-6 gap-2 text-center text-xs">
                {(["str", "dex", "con", "int", "wis", "cha"] as const).map((attr) => (
                  <div key={attr} className="rounded-lg border border-border/50 p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">{attr}</div>
                    <div className="font-mono text-sm font-bold">{u.npc[attr] ?? "—"}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Description & Notes */}
            {u.kind === "normal" && u.npc.description && (
              <div>
                <h4 className="text-xs font-medium uppercase text-muted-foreground">
                  {t("npcDescription")}
                </h4>
                <p className="mt-1 text-sm">{u.npc.description}</p>
              </div>
            )}
            {u.kind === "normal" && u.npc.equipment_notes && (
              <div>
                <h4 className="text-xs font-medium uppercase text-muted-foreground">
                  {t("npcEquipmentNotes")}
                </h4>
                <p className="mt-1 text-sm">{u.npc.equipment_notes}</p>
              </div>
            )}
            {u.kind === "normal" && u.npc.spell_notes && (
              <div>
                <h4 className="text-xs font-medium uppercase text-muted-foreground">
                  {t("npcSpellNotes")}
                </h4>
                <p className="mt-1 text-sm">{u.npc.spell_notes}</p>
              </div>
            )}
            {u.kind === "normal" && u.npc.notes && (
              <div>
                <h4 className="text-xs font-medium uppercase text-muted-foreground">
                  {t("npcNotes")}
                </h4>
                <p className="mt-1 text-sm">{u.npc.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
              {onToggleVisibility && (
                <button
                  onClick={onToggleVisibility}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/50"
                  data-testid={`gm-npc-modal-visibility-${u.id}`}
                >
                  {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {visible ? t("npcHidden") : t("npcVisibleToPlayers")}
                </button>
              )}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-primary hover:bg-primary/10"
                  data-testid={`gm-npc-modal-edit-${u.id}`}
                >
                  <Pencil className="h-4 w-4" />
                  {t("npcEdit")}
                </button>
              )}
              {u.kind === "character" && (
                <>
                  <Link
                    href={`/master/npcs/${u.id}/manage`}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-primary hover:bg-primary/10"
                    data-testid={`gm-npc-char-manage-${u.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                    {t("npcManage")}
                  </Link>
                  <Link
                    href={`/master/npcs/${u.id}/play`}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-green-400 hover:bg-green-900/10"
                    data-testid={`gm-npc-char-play-${u.id}`}
                  >
                    <Swords className="h-4 w-4" />
                    {t("npcPlay")}
                  </Link>
                </>
              )}
              {onDelete && (
                <>
                  {confirmDelete ? (
                    <button
                      onClick={() => {
                        onDelete();
                        setConfirmDelete(false);
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/20"
                      data-testid={`gm-npc-confirm-delete-${u.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("npcDeleteConfirm")}
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                      data-testid={`gm-npc-delete-${u.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("npcDelete")}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Stat Block (for Detail Modal) ──────────────────────────────────

function StatBlock({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof Shield;
  color: string;
  label: string;
  value: string | number;
}) {
  const colorMap: Record<string, string> = {
    amber: "text-amber-400",
    red: "text-red-400",
    sky: "text-sky-400",
    purple: "text-purple-400",
  };
  const valueColorMap: Record<string, string> = {
    amber: "text-amber-300",
    red: "text-red-300",
    sky: "text-sky-300",
    purple: "text-purple-300",
  };
  return (
    <div className="rounded-lg border border-border/50 p-2 text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        <Icon className={`h-3 w-3 ${colorMap[color]}`} />
        {label}
      </div>
      <div className={`font-mono text-lg font-bold ${valueColorMap[color]}`}>{value}</div>
    </div>
  );
}

// ─── Copy Picker ─────────────────────────────────────────────────────

function CopyPicker({
  characters,
  copyingCharId,
  copiedCharName,
  onCopy,
  t,
}: {
  characters: CharacterRow[];
  copyingCharId: string | null;
  copiedCharName: string | null;
  onCopy: (charId: string) => void;
  t: ReturnType<typeof useTranslations<"master">>;
}) {
  return (
    <GlassCard className="p-3" data-testid="gm-npc-copy-picker">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{t("npcSelectCharacter")}</p>
      {copiedCharName && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-green-900/20 px-3 py-2 text-sm text-green-400">
          <Check className="h-4 w-4 shrink-0" />
          {copiedCharName} (NPC) {t("npcCreated")}
        </div>
      )}
      <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
        {characters.map((char) => {
          const isCopying = copyingCharId === char.id;
          return (
            <button
              key={char.id}
              disabled={!!copyingCharId}
              onClick={() => onCopy(char.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                isCopying
                  ? "bg-primary/10 text-primary"
                  : copyingCharId
                    ? "opacity-40"
                    : "text-muted-foreground hover:bg-accent/30"
              }`}
              data-testid={`gm-npc-copy-char-${char.id}`}
            >
              {isCopying && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />}
              <span className="truncate font-medium text-foreground">{char.name}</span>
              <span className="shrink-0 text-xs">Lv {char.level}</span>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ─── NPC Form Modal ──────────────────────────────────────────────────

function NpcFormModal({
  npc,
  onSave,
  onCancel,
}: {
  npc?: ChronicleNpcRow;
  onSave: (data: Partial<ChronicleNpcRow>) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("master");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  const [tier, setTier] = useState<"normal" | "advanced">(npc?.tier ?? "normal");
  const [name, setName] = useState(npc?.name ?? "");
  const [location, setLocation] = useState(npc?.location ?? "");
  const [description, setDescription] = useState(npc?.description ?? "");
  const [isVisible, setIsVisible] = useState(npc?.is_visible_to_players ?? false);
  const [level, setLevel] = useState(npc?.level?.toString() ?? "");
  const [str, setStr] = useState(npc?.str?.toString() ?? "");
  const [dex, setDex] = useState(npc?.dex?.toString() ?? "");
  const [con, setCon] = useState(npc?.con?.toString() ?? "");
  const [int, setInt] = useState(npc?.int?.toString() ?? "");
  const [wis, setWis] = useState(npc?.wis?.toString() ?? "");
  const [cha, setCha] = useState(npc?.cha?.toString() ?? "");
  const [hpMax, setHpMax] = useState(npc?.hp_max?.toString() ?? "");
  const [hpCurrent, setHpCurrent] = useState(npc?.hp_current?.toString() ?? "");
  const [ac, setAc] = useState(npc?.ac?.toString() ?? "");
  const [thac0, setThac0] = useState(npc?.thac0?.toString() ?? "");
  const [equipmentNotes, setEquipmentNotes] = useState(npc?.equipment_notes ?? "");
  const [spellNotes, setSpellNotes] = useState(npc?.spell_notes ?? "");
  const [notes, setNotes] = useState(npc?.notes ?? "");

  const handleSubmit = () => {
    const parseNum = (v: string) => (v ? parseInt(v, 10) : null);
    onSave({
      name,
      location,
      description,
      tier,
      is_visible_to_players: isVisible,
      ...(tier === "advanced"
        ? {
            level: parseNum(level),
            str: parseNum(str),
            dex: parseNum(dex),
            con: parseNum(con),
            int: parseNum(int),
            wis: parseNum(wis),
            cha: parseNum(cha),
            hp_max: parseNum(hpMax),
            hp_current: parseNum(hpCurrent) ?? parseNum(hpMax),
            ac: parseNum(ac),
            thac0: parseNum(thac0),
            equipment_notes: equipmentNotes || null,
            spell_notes: spellNotes || null,
            notes,
          }
        : {}),
    });
  };

  const inputClass = "w-full rounded-md border border-border bg-background/50 px-2 py-1.5 text-sm";
  const labelClass = "text-xs font-medium text-muted-foreground";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="npc-form-title"
      onClick={onCancel}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <GlassCard
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-3 p-4"
          data-testid="gm-npc-form"
        >
          <div className="flex items-center justify-between">
            <h3 id="npc-form-title" className="font-heading text-sm font-semibold">
              {npc ? t("npcEdit") : t("npcCreate")}
            </h3>
            <button
              onClick={onCancel}
              className="rounded-full p-1 text-muted-foreground hover:bg-accent/50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tier toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setTier("normal")}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                tier === "normal" ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
              data-testid="gm-npc-tier-normal"
            >
              {t("npcNormal")}
            </button>
            <button
              onClick={() => setTier("advanced")}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                tier === "advanced" ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
              data-testid="gm-npc-tier-advanced"
            >
              {t("npcAdvanced")}
            </button>
          </div>

          {/* Common fields */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{t("name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                data-testid="gm-npc-name"
              />
            </div>
            <div>
              <label className={labelClass}>{t("npcLocation")}</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClass}
                data-testid="gm-npc-location"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("npcDescription")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={inputClass}
              data-testid="gm-npc-description"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              data-testid="gm-npc-visible"
            />
            {t("npcVisibleToPlayers")}
          </label>

          {/* Advanced fields */}
          {tier === "advanced" && (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                <div>
                  <label className={labelClass}>{t("npcLevel")}</label>
                  <input
                    type="number"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className={inputClass}
                    data-testid="gm-npc-level"
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("ac")}</label>
                  <input
                    type="number"
                    value={ac}
                    onChange={(e) => setAc(e.target.value)}
                    className={inputClass}
                    data-testid="gm-npc-ac"
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("thac0")}</label>
                  <input
                    type="number"
                    value={thac0}
                    onChange={(e) => setThac0(e.target.value)}
                    className={inputClass}
                    data-testid="gm-npc-thac0"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("npcAbilities")}</label>
                <div className="grid grid-cols-6 gap-1">
                  {[
                    { label: "STR", val: str, set: setStr, tid: "gm-npc-str" },
                    { label: "DEX", val: dex, set: setDex, tid: "gm-npc-dex" },
                    { label: "CON", val: con, set: setCon, tid: "gm-npc-con" },
                    { label: "INT", val: int, set: setInt, tid: "gm-npc-int" },
                    { label: "WIS", val: wis, set: setWis, tid: "gm-npc-wis" },
                    { label: "CHA", val: cha, set: setCha, tid: "gm-npc-cha" },
                  ].map((a) => (
                    <div key={a.label} className="text-center">
                      <span className="text-[10px] md:text-xs text-muted-foreground">
                        {a.label}
                      </span>
                      <input
                        type="number"
                        value={a.val}
                        onChange={(e) => a.set(e.target.value)}
                        className="w-full rounded border border-border bg-background/50 px-1 py-1 text-center text-xs"
                        data-testid={a.tid}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>{t("npcHp")} (Max)</label>
                  <input
                    type="number"
                    value={hpMax}
                    onChange={(e) => setHpMax(e.target.value)}
                    className={inputClass}
                    data-testid="gm-npc-hp-max"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {t("npcHp")} ({t("npcHpCurrent")})
                  </label>
                  <input
                    type="number"
                    value={hpCurrent}
                    onChange={(e) => setHpCurrent(e.target.value)}
                    className={inputClass}
                    data-testid="gm-npc-hp-current"
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>{t("npcEquipmentNotes")}</label>
                  <textarea
                    value={equipmentNotes}
                    onChange={(e) => setEquipmentNotes(e.target.value)}
                    rows={2}
                    className={inputClass}
                    data-testid="gm-npc-equipment-notes"
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("npcSpellNotes")}</label>
                  <textarea
                    value={spellNotes}
                    onChange={(e) => setSpellNotes(e.target.value)}
                    rows={2}
                    className={inputClass}
                    data-testid="gm-npc-spell-notes"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t("npcNotes")}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className={inputClass}
                  data-testid="gm-npc-notes"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/50"
              data-testid="gm-npc-cancel"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="rounded-lg bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
              data-testid="gm-npc-save"
            >
              {npc ? t("npcEdit") : t("npcCreate")}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
