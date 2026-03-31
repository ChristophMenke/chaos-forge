"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AvatarDisplay } from "@/components/avatar-display";
import { NpcAvatarUpload } from "./npc-avatar-upload";
import type { ChronicleNpcRow } from "@/lib/supabase/types";

const PAGE_SIZE = 10;

interface NpcManagerProps {
  npcs: ChronicleNpcRow[];
}

export function NpcManager({ npcs: initialNpcs }: NpcManagerProps) {
  const t = useTranslations("chronicle");
  const tcom = useTranslations("common");
  const [npcs, setNpcs] = useState(initialNpcs);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // Unique locations for filter dropdown
  const uniqueLocations = useMemo(
    () =>
      [...new Set(npcs.map((npc) => npc.location).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [npcs]
  );

  // Filter + Search
  const filteredNpcs = useMemo(() => {
    return npcs.filter((npc) => {
      const matchesLocation = !locationFilter || npc.location === locationFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        npc.name.toLowerCase().includes(query) ||
        npc.location.toLowerCase().includes(query) ||
        npc.description.toLowerCase().includes(query);
      return matchesLocation && matchesSearch;
    });
  }, [npcs, searchQuery, locationFilter]);

  // Paging
  const totalPages = Math.max(1, Math.ceil(filteredNpcs.length / PAGE_SIZE));
  const pagedNpcs = filteredNpcs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleFilterChange(newSearch: string, newLocation: string) {
    setSearchQuery(newSearch);
    setLocationFilter(newLocation);
    setPage(0);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();

    if (editingId) {
      const { error } = await supabase
        .from("chronicle_npcs")
        .update({ name: name.trim(), location: location.trim(), description: description.trim() })
        .eq("id", editingId);
      if (!error) {
        setNpcs((prev) =>
          prev.map((npc) =>
            npc.id === editingId
              ? {
                  ...npc,
                  name: name.trim(),
                  location: location.trim(),
                  description: description.trim(),
                }
              : npc
          )
        );
      }
    } else {
      const { data, error } = await supabase
        .from("chronicle_npcs")
        .insert({ name: name.trim(), location: location.trim(), description: description.trim() })
        .select()
        .single<ChronicleNpcRow>();
      if (!error && data) {
        setNpcs((prev) => [data, ...prev]);
      }
    }

    resetForm();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    // Clean up avatar from storage if exists
    const npc = npcs.find((n) => n.id === id);
    if (npc?.avatar_url) {
      await supabase.storage.from("npc-avatars").remove([`${id}.webp`]);
    }
    const { error } = await supabase.from("chronicle_npcs").delete().eq("id", id);
    if (!error) {
      setNpcs((prev) => {
        const next = prev.filter((n) => n.id !== id);
        // Clamp page if current page is now out of bounds
        const filtered = next.filter((n) => {
          const matchesLocation = !locationFilter || n.location === locationFilter;
          const query = searchQuery.toLowerCase();
          const matchesSearch =
            !query ||
            n.name.toLowerCase().includes(query) ||
            n.location.toLowerCase().includes(query) ||
            n.description.toLowerCase().includes(query);
          return matchesLocation && matchesSearch;
        });
        const newTotalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        if (page >= newTotalPages) setPage(Math.max(0, newTotalPages - 1));
        return next;
      });
    }
  }

  function startEdit(npc: ChronicleNpcRow) {
    setEditingId(npc.id);
    setName(npc.name);
    setLocation(npc.location);
    setDescription(npc.description);
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setLocation("");
    setDescription("");
    setShowForm(false);
  }

  function handleAvatarUploaded(npcId: string, url: string | null) {
    setNpcs((prev) => prev.map((npc) => (npc.id === npcId ? { ...npc, avatar_url: url } : npc)));
  }

  return (
    <div data-testid="npc-manager">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-xl text-primary">{t("npcs")}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          data-testid="npc-add-button"
        >
          {showForm ? tcom("cancel") : t("addNpc")}
        </Button>
      </div>

      {/* Search + Location Filter */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder={t("searchNpcs")}
          value={searchQuery}
          onChange={(e) => handleFilterChange(e.target.value, locationFilter)}
          className="flex-1"
          data-testid="npc-search"
        />
        {uniqueLocations.length > 0 && (
          <select
            value={locationFilter}
            onChange={(e) => handleFilterChange(searchQuery, e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            aria-label={t("npcAllLocations")}
            data-testid="npc-location-filter"
          >
            <option value="">{t("npcAllLocations")}</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="mb-4 rounded-lg border border-border bg-card/50 p-4" data-testid="npc-form">
          <div className="flex flex-col gap-3">
            <Input
              placeholder={t("npcName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="npc-name-input"
              autoFocus
            />
            <Input
              placeholder={t("npcLocation")}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              data-testid="npc-location-input"
            />
            <textarea
              placeholder={t("npcDescription")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              data-testid="npc-description-input"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>
                {tcom("cancel")}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !name.trim()}
                data-testid="npc-save-button"
              >
                {saving && <Spinner className="mr-2" />}
                {editingId ? tcom("save") : tcom("add")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* NPC List */}
      {filteredNpcs.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground" data-testid="npc-empty">
          {t("noNpcs")}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {pagedNpcs.map((npc) => (
              <div
                key={npc.id}
                className="rounded-lg border border-border bg-card/30 p-3"
                data-testid={`npc-card-${npc.id}`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <NpcAvatarUpload
                    npcId={npc.id}
                    npcName={npc.name}
                    currentAvatarUrl={npc.avatar_url}
                    onUploaded={(url) => handleAvatarUploaded(npc.id, url)}
                  />

                  {/* Content */}
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex-1 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === npc.id ? null : npc.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpandedId(expandedId === npc.id ? null : npc.id);
                      }
                    }}
                  >
                    <span className="font-medium">{npc.name}</span>
                    {npc.location && (
                      <span className="ml-2 text-sm text-muted-foreground">— {npc.location}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(npc)}
                      data-testid={`npc-edit-${npc.id}`}
                    >
                      {tcom("edit")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(npc.id)}
                      data-testid={`npc-delete-${npc.id}`}
                    >
                      {tcom("delete")}
                    </Button>
                  </div>
                </div>
                {expandedId === npc.id && npc.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {npc.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Paging */}
          {totalPages > 1 && (
            <div
              className="mt-3 flex items-center justify-center gap-3"
              data-testid="npc-pagination"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                data-testid="npc-prev"
              >
                {t("npcPrev")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("npcPage", { current: page + 1, total: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                data-testid="npc-next"
              >
                {t("npcNext")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
