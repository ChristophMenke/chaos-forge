"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { TEST_DOMAIN } from "@/lib/test/constants";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { CharacterShareRow, AppUser } from "@/lib/supabase/types";

interface ShareDialogProps {
  open: boolean;
  characterId: string;
  characterName: string;
  currentUserId: string;
  isPublic: boolean;
  onClose: () => void;
  onVisibilityChange: (isPublic: boolean) => void;
}

function displayName(user: AppUser): string {
  if (user.display_name && user.display_name !== "Abenteurer") {
    return user.display_name;
  }
  return user.email;
}

export function ShareDialog({
  open,
  characterId,
  characterName,
  currentUserId,
  isPublic,
  onClose,
  onVisibilityChange,
}: ShareDialogProps) {
  const t = useTranslations("sharing");
  const tcom = useTranslations("common");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [shares, setShares] = useState<CharacterShareRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, characterId]);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    // Fetch existing shares
    const { data: sharesData } = await supabase
      .from("character_shares")
      .select("*")
      .eq("character_id", characterId)
      .returns<CharacterShareRow[]>();

    setShares(sharesData ?? []);

    // Fetch all profiles directly (no admin API needed)
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, display_name, email");

    // Filter out test-domain users (client-side to avoid NULL email exclusion)
    const mappedUsers: AppUser[] = (profilesData ?? [])
      .filter((p) => !p.email?.endsWith(TEST_DOMAIN))
      .map((p) => ({
        id: p.id,
        email: p.email ?? "",
        display_name: p.display_name ?? "",
      }));
    setUsers(mappedUsers);

    setLoading(false);
  }

  async function handleAddShare() {
    if (!selectedUserId) return;
    setSaving(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("character_shares")
      .insert({ character_id: characterId, shared_with_user_id: selectedUserId })
      .select()
      .single<CharacterShareRow>();

    if (!error && data) {
      setShares((prev) => [...prev, data]);
      setSelectedUserId("");
    }
    setSaving(false);
  }

  async function handleRemoveShare(shareId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("character_shares").delete().eq("id", shareId);
    if (!error) {
      setShares((prev) => prev.filter((s) => s.id !== shareId));
    }
  }

  async function handleTogglePublic() {
    setSaving(true);
    const supabase = createClient();
    const newValue = !isPublic;

    const { error } = await supabase
      .from("characters")
      .update({ is_public: newValue })
      .eq("id", characterId);

    if (!error) {
      onVisibilityChange(newValue);
    }
    setSaving(false);
  }

  if (!open) return null;

  // Users that are not already shared with and not the current user
  const sharedUserIds = new Set(shares.map((s) => s.shared_with_user_id));
  const availableUsers = users.filter((u) => !sharedUserIds.has(u.id) && u.id !== currentUserId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      role="presentation"
      data-testid="share-dialog"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        className="mx-4 flex w-full max-w-md flex-col gap-4 rounded-lg border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="share-dialog-title" className="font-heading text-xl text-primary">
          {t("title", { name: characterName })}
        </h3>

        {/* Public toggle */}
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="text-sm font-medium">{t("publicLabel")}</p>
            <p className="text-xs text-muted-foreground">{t("publicDescription")}</p>
          </div>
          <Button
            variant={isPublic ? "default" : "outline"}
            size="sm"
            onClick={handleTogglePublic}
            disabled={saving}
            data-testid="share-toggle-public"
          >
            {isPublic ? tcom("yes") : tcom("no")}
          </Button>
        </div>

        {/* Shared users list */}
        <div>
          <p className="mb-2 text-sm font-medium">{t("sharedWith")}</p>
          {loading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : shares.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">{t("noShares")}</p>
          ) : (
            <ul className="flex flex-col gap-2" data-testid="share-list">
              {shares.map((share) => {
                const user = users.find((u) => u.id === share.shared_with_user_id);
                return (
                  <li
                    key={share.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    data-testid={`share-item-${share.id}`}
                  >
                    <span className="text-sm">
                      {user ? displayName(user) : share.shared_with_user_id}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveShare(share.id)}
                      data-testid={`share-remove-${share.id}`}
                    >
                      {tcom("remove")}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Add share */}
        {!loading && availableUsers.length === 0 && shares.length === 0 && (
          <p className="text-sm text-muted-foreground" data-testid="share-no-users">
            {t("noUsers")}
          </p>
        )}
        {!loading && availableUsers.length > 0 && (
          <div className="flex gap-2">
            <select
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              aria-label={t("selectUser")}
              data-testid="share-user-select"
            >
              <option value="">{t("selectUser")}</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {displayName(u)}
                </option>
              ))}
            </select>
            <Button
              onClick={handleAddShare}
              disabled={!selectedUserId || saving}
              data-testid="share-add-button"
            >
              {saving ? <Spinner className="mr-2" /> : null}
              {tcom("add")}
            </Button>
          </div>
        )}

        {/* Close */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose} data-testid="share-close-button">
            {tcom("close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
