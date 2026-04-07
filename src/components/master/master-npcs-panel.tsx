"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Shield,
  Heart,
  Copy,
  Loader2,
  Check,
} from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import {
  createNpc,
  updateNpc,
  deleteNpc,
  createNpcFromCharacter,
  createBlankNpcCharacter,
} from "@/app/master/actions";
import type { ChronicleNpcRow, CharacterRow } from "@/lib/supabase/types";

interface MasterNpcsPanelProps {
  initialNpcs: ChronicleNpcRow[];
  characters: CharacterRow[];
  /** Characters with is_npc = true — shown as Advanced NPCs */
  npcCharacters: CharacterRow[];
  gmUserId: string;
}

export function MasterNpcsPanel({
  initialNpcs,
  characters,
  npcCharacters,
  gmUserId,
}: MasterNpcsPanelProps) {
  const t = useTranslations("master");
  const [npcs, setNpcs] = useState(initialNpcs);
  const [npcChars, setNpcChars] = useState(npcCharacters);
  const [search, setSearch] = useState("");
  const [editingNpc, setEditingNpc] = useState<ChronicleNpcRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCopyPicker, setShowCopyPicker] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copyingCharId, setCopyingCharId] = useState<string | null>(null);
  const [copiedCharName, setCopiedCharName] = useState<string | null>(null);

  const filtered = npcs.filter(
    (npc) =>
      npc.name.toLowerCase().includes(search.toLowerCase()) ||
      npc.location.toLowerCase().includes(search.toLowerCase())
  );

  const normalNpcs = filtered.filter((n) => n.tier === "normal");

  const filteredNpcChars = npcChars.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleVisibility = useCallback(async (npc: ChronicleNpcRow) => {
    const res = await updateNpc(npc.id, {
      is_visible_to_players: !npc.is_visible_to_players,
    });
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
    }
  }, []);

  const handleSave = useCallback(
    async (npc: Partial<ChronicleNpcRow>, isNew: boolean) => {
      if (isNew) {
        const res = await createNpc(npc);
        if (res.success && res.id) {
          const temp: ChronicleNpcRow = {
            id: res.id,
            name: npc.name ?? "",
            location: npc.location ?? "",
            description: npc.description ?? "",
            avatar_url: null,
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tier: npc.tier ?? "normal",
            is_visible_to_players: npc.is_visible_to_players ?? false,
            race_id: npc.race_id ?? null,
            class_ids: npc.class_ids ?? [],
            level: npc.level ?? null,
            str: npc.str ?? null,
            dex: npc.dex ?? null,
            con: npc.con ?? null,
            int: npc.int ?? null,
            wis: npc.wis ?? null,
            cha: npc.cha ?? null,
            hp_current: npc.hp_current ?? null,
            hp_max: npc.hp_max ?? null,
            ac: npc.ac ?? null,
            thac0: npc.thac0 ?? null,
            equipment_notes: npc.equipment_notes ?? null,
            spell_notes: npc.spell_notes ?? null,
            notes: npc.notes ?? "",
          };
          setNpcs((prev) => [...prev, temp].sort((a, b) => a.name.localeCompare(b.name)));
        }
      } else if (editingNpc) {
        const res = await updateNpc(editingNpc.id, npc);
        if (res.success) {
          setNpcs((prev) => prev.map((n) => (n.id === editingNpc.id ? { ...n, ...npc } : n)));
        }
      }
      setIsCreating(false);
      setEditingNpc(null);
    },
    [editingNpc]
  );

  return (
    <div className="space-y-4" data-testid="gm-npcs-panel">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("npcSearch")}
            className="w-full rounded-lg border border-border bg-background/50 py-2 pl-10 pr-3 text-sm"
            data-testid="gm-npc-search"
          />
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setEditingNpc(null);
            setShowCopyPicker(false);
          }}
          className="flex flex-col items-start rounded-lg bg-primary/10 px-3 py-2 text-left hover:bg-primary/20"
          data-testid="gm-npc-create"
        >
          <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <Plus className="h-4 w-4" />
            {t("npcCreate")}
          </span>
          <span className="pl-5.5 text-[10px] md:text-xs text-muted-foreground">
            {t("npcCreateDesc")}
          </span>
        </button>
        <Link
          href="/master/npcs/new"
          className="flex flex-col items-start rounded-lg bg-green-600/10 px-3 py-2 text-left hover:bg-green-600/20"
          data-testid="gm-npc-create-advanced"
        >
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-400">
            <Shield className="h-4 w-4" />
            {t("npcAdvancedCreate")}
          </span>
          <span className="pl-5.5 text-[10px] md:text-xs text-muted-foreground">
            {t("npcAdvancedCreateDesc")}
          </span>
        </Link>
        <button
          onClick={() => setShowCopyPicker(!showCopyPicker)}
          className="flex items-center gap-2 rounded-lg bg-amber-600/10 px-3 py-2 text-sm font-medium text-amber-400 hover:bg-amber-600/20"
          data-testid="gm-npc-copy-from-char"
        >
          <Copy className="h-4 w-4" />
          {t("npcCopyFromCharacter")}
        </button>
      </div>

      {/* Copy from Character Picker */}
      {showCopyPicker && (
        <GlassCard className="p-3" data-testid="gm-npc-copy-picker">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {t("npcSelectCharacter")}
          </p>

          {/* Success banner */}
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
                  onClick={async () => {
                    setCopyingCharId(char.id);
                    setCopiedCharName(null);
                    const res = await createNpcFromCharacter(char.id, gmUserId);
                    if (res.success && res.id) {
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
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isCopying
                      ? "bg-primary/10 text-primary"
                      : copyingCharId
                        ? "opacity-40"
                        : "text-muted-foreground hover:bg-accent/30"
                  }`}
                  data-testid={`gm-npc-copy-char-${char.id}`}
                >
                  {isCopying ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                  ) : null}
                  <span className="truncate font-medium text-foreground">{char.name}</span>
                  <span className="shrink-0 text-xs">Lv {char.level}</span>
                </button>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Create / Edit Form */}
      {(isCreating || editingNpc) && (
        <NpcForm
          npc={editingNpc ?? undefined}
          onSave={(data) => handleSave(data, isCreating)}
          onCancel={() => {
            setIsCreating(false);
            setEditingNpc(null);
          }}
        />
      )}

      {/* NPC List */}
      {filtered.length === 0 && !isCreating && (
        <p className="py-8 text-center text-sm text-muted-foreground" data-testid="gm-npc-empty">
          {t("npcNoResults")}
        </p>
      )}

      {/* Advanced NPCs (full character sheets) — shown first */}
      {filteredNpcChars.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("npcAdvanced")} ({filteredNpcChars.length})
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNpcChars.map((char) => (
              <GlassCard key={char.id} className="p-3" data-testid={`gm-npc-char-${char.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-heading text-sm font-semibold text-foreground">
                      {char.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Lv {char.level} — HP {char.hp_current}/{char.hp_max}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/master/npcs/${char.id}/manage`}
                      className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                      data-testid={`gm-npc-char-manage-${char.id}`}
                    >
                      {t("npcManage")}
                    </Link>
                    <Link
                      href={`/master/npcs/${char.id}/play`}
                      className="rounded px-2 py-1 text-xs font-medium text-green-400 hover:bg-green-900/10"
                      data-testid={`gm-npc-char-play-${char.id}`}
                    >
                      {t("npcPlay")}
                    </Link>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Normal NPCs (metadata only) */}
      {normalNpcs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("npcNormal")} ({normalNpcs.length})
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {normalNpcs.map((npc) => (
              <NpcCard
                key={npc.id}
                npc={npc}
                isExpanded={expandedId === npc.id}
                onToggleExpand={() => setExpandedId(expandedId === npc.id ? null : npc.id)}
                onEdit={() => setEditingNpc(npc)}
                onDelete={() => handleDelete(npc.id)}
                onToggleVisibility={() => handleToggleVisibility(npc)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NPC Card ─────────────────────────────────────────────────────────

function NpcCard({
  npc,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleVisibility,
}: {
  npc: ChronicleNpcRow;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}) {
  const t = useTranslations("master");
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <GlassCard className="p-3" data-testid={`gm-npc-card-${npc.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <button
            onClick={onToggleExpand}
            className="flex w-full items-center gap-1 text-left"
            data-testid={`gm-npc-expand-${npc.id}`}
          >
            <h4 className="truncate font-heading text-sm font-semibold text-foreground">
              {npc.name}
            </h4>
            {isExpanded ? (
              <ChevronUp className="h-3 w-3 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
          </button>
          {npc.location && <p className="truncate text-xs text-muted-foreground">{npc.location}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onToggleVisibility}
            className="rounded p-1 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            title={npc.is_visible_to_players ? t("npcVisibleToPlayers") : t("npcHidden")}
            data-testid={`gm-npc-visibility-${npc.id}`}
          >
            {npc.is_visible_to_players ? (
              <Eye className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={onEdit}
            className="rounded p-1 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            data-testid={`gm-npc-edit-${npc.id}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {confirmDelete ? (
            <button
              onClick={() => {
                onDelete();
                setConfirmDelete(false);
              }}
              className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive hover:bg-destructive/20"
              data-testid={`gm-npc-confirm-delete-${npc.id}`}
            >
              {t("npcDelete")}
            </button>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              data-testid={`gm-npc-delete-${npc.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Advanced stats preview */}
      {npc.tier === "advanced" && npc.ac !== null && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Shield className="h-3 w-3" />
            {t("ac")} {npc.ac}
          </span>
          {npc.hp_max !== null && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Heart className="h-3 w-3" />
              {npc.hp_current ?? npc.hp_max}/{npc.hp_max}
            </span>
          )}
          {npc.thac0 !== null && (
            <span className="text-muted-foreground">
              {t("thac0")} {npc.thac0}
            </span>
          )}
          {npc.level !== null && (
            <span className="text-muted-foreground">
              {t("npcLevel")} {npc.level}
            </span>
          )}
        </div>
      )}

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-2 space-y-1 border-t border-border/50 pt-2 text-xs text-muted-foreground">
          {npc.description && <p>{npc.description}</p>}
          {npc.tier === "advanced" && (
            <>
              {npc.str !== null && (
                <p>
                  {t("npcAbilities")}: STR {npc.str}, DEX {npc.dex}, CON {npc.con}, INT {npc.int},
                  WIS {npc.wis}, CHA {npc.cha}
                </p>
              )}
              {npc.equipment_notes && (
                <p>
                  {t("npcEquipmentNotes")}: {npc.equipment_notes}
                </p>
              )}
              {npc.spell_notes && (
                <p>
                  {t("npcSpellNotes")}: {npc.spell_notes}
                </p>
              )}
              {npc.notes && (
                <p>
                  {t("npcNotes")}: {npc.notes}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </GlassCard>
  );
}

// ─── NPC Form ─────────────────────────────────────────────────────────

function NpcForm({
  npc,
  onSave,
  onCancel,
}: {
  npc?: ChronicleNpcRow;
  onSave: (data: Partial<ChronicleNpcRow>) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("master");
  const [tier, setTier] = useState<"normal" | "advanced">(npc?.tier ?? "normal");
  const [name, setName] = useState(npc?.name ?? "");
  const [location, setLocation] = useState(npc?.location ?? "");
  const [description, setDescription] = useState(npc?.description ?? "");
  const [isVisible, setIsVisible] = useState(npc?.is_visible_to_players ?? false);
  // Advanced fields
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
    <GlassCard className="space-y-3 p-4" data-testid="gm-npc-form">
      <h3 className="font-heading text-sm font-semibold">{npc ? t("npcEdit") : t("npcCreate")}</h3>

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

          {/* Abilities */}
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
                  <span className="text-[10px] md:text-xs text-muted-foreground">{a.label}</span>
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

          {/* HP */}
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
              <label className={labelClass}>{t("npcHp")} (Aktuell)</label>
              <input
                type="number"
                value={hpCurrent}
                onChange={(e) => setHpCurrent(e.target.value)}
                className={inputClass}
                data-testid="gm-npc-hp-current"
              />
            </div>
          </div>

          {/* Notes */}
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
  );
}
