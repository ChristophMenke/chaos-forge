"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  Moon,
  Sun,
  Globe,
  GraduationCap,
  User,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/glass-card";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme-provider";
import { resetTutorials } from "@/lib/tutorial/steps";

interface SettingsClientProps {
  userId: string;
  email: string;
  initialDisplayName: string;
  initialAvatarUrl: string | null;
}

const ADMIN_EMAIL = "christoph.menke@gmail.com";

export function SettingsClient({
  userId,
  email,
  initialDisplayName,
  initialAvatarUrl,
}: SettingsClientProps) {
  const t = useTranslations("settings");
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const profileDirty =
    displayName !== initialDisplayName || (avatarUrl || null) !== (initialAvatarUrl ?? null);

  async function saveProfile() {
    if (savingProfile || !profileDirty) return;
    const trimmed = displayName.trim();
    if (trimmed.length === 0) {
      toast.error(t("displayNameRequired"));
      return;
    }
    setSavingProfile(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: trimmed, avatar_url: avatarUrl || null })
        .eq("id", userId);
      if (error) throw error;
      toast.success(t("profileSaved"));
      router.refresh();
    } catch {
      toast.error(t("profileSaveError"));
    } finally {
      setSavingProfile(false);
    }
  }

  function toggleLocale() {
    const current =
      typeof document !== "undefined"
        ? (document.cookie
            .split("; ")
            .find((c) => c.startsWith("NEXT_LOCALE="))
            ?.split("=")[1] ?? "de")
        : "de";
    const next = current === "en" ? "de" : "en";
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000`;
    window.location.reload();
  }

  function handleResetTutorials() {
    resetTutorials();
    toast.success(t("tutorialsReset"));
  }

  async function handleDeleteAccount() {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      toast.success(t("accountDeleted"));
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch {
      toast.error(t("accountDeleteError"));
      setDeleting(false);
    }
  }

  const isAdmin = email === ADMIN_EMAIL;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Profile ────────────────────────────────────────── */}
      <GlassCard hover={false} data-testid="settings-section-profile">
        <div className="mb-3 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-lg text-primary">{t("sectionProfile")}</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="settings-email" className="mb-1 block text-xs text-muted-foreground">
              {t("email")}
            </label>
            <Input id="settings-email" value={email} disabled data-testid="settings-email" />
          </div>

          <div>
            <label
              htmlFor="settings-display-name"
              className="mb-1 block text-xs text-muted-foreground"
            >
              {t("displayName")}
            </label>
            <Input
              id="settings-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              data-testid="settings-display-name"
            />
          </div>

          <div>
            <label
              htmlFor="settings-avatar-url"
              className="mb-1 block text-xs text-muted-foreground"
            >
              {t("avatarUrl")}
            </label>
            <Input
              id="settings-avatar-url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
              data-testid="settings-avatar-url"
            />
          </div>

          <Button
            onClick={saveProfile}
            disabled={savingProfile || !profileDirty}
            data-testid="settings-save-profile"
          >
            {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("save")}
          </Button>
        </div>
      </GlassCard>

      {/* ── Appearance ────────────────────────────────────── */}
      <GlassCard hover={false} data-testid="settings-section-appearance">
        <div className="mb-3 flex items-center gap-2">
          <Sun className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-lg text-primary">{t("sectionAppearance")}</h2>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={toggleTheme}
            data-testid="settings-toggle-theme"
            className="flex-1"
          >
            {theme === "dark" ? (
              <Moon className="mr-2 h-4 w-4" />
            ) : (
              <Sun className="mr-2 h-4 w-4" />
            )}
            {t("theme")}: {theme === "dark" ? t("themeDark") : t("themeLight")}
          </Button>
          <Button
            variant="outline"
            onClick={toggleLocale}
            data-testid="settings-toggle-locale"
            className="flex-1"
          >
            <Globe className="mr-2 h-4 w-4" />
            {t("language")}
          </Button>
        </div>
      </GlassCard>

      {/* ── Tutorials ─────────────────────────────────────── */}
      <GlassCard hover={false} data-testid="settings-section-tutorials">
        <div className="mb-3 flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-lg text-primary">{t("sectionTutorials")}</h2>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">{t("tutorialsHint")}</p>
        <Button
          variant="outline"
          onClick={handleResetTutorials}
          data-testid="settings-reset-tutorials"
        >
          {t("resetTutorials")}
        </Button>
      </GlassCard>

      {/* ── Danger Zone ───────────────────────────────────── */}
      <GlassCard hover={false} data-testid="settings-section-danger">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h2 className="font-heading text-lg text-destructive">{t("sectionDanger")}</h2>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          {isAdmin ? t("adminCantDelete") : t("deleteHint")}
        </p>
        {!isAdmin &&
          (confirmDelete ? (
            <div className="flex flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
              <p className="text-sm text-destructive" data-testid="settings-delete-confirm-message">
                {t("deleteConfirm")}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1"
                  data-testid="settings-delete-submit"
                >
                  {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("deleteAccount")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="flex-1"
                  data-testid="settings-delete-cancel"
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(true)}
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              data-testid="settings-delete-button"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("deleteAccount")}
            </Button>
          ))}
      </GlassCard>
    </div>
  );
}
