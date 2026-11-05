"use client";

import { useState } from "react";
import { History, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { RELEASES, groupReleasesByDay } from "@/lib/release-notes";
import { ReleaseNotesList } from "./release-notes-list";
import { OlderReleasesViewer } from "./older-releases-viewer";

/**
 * Settings → "What's new": the newest release day, older days as swipeable cards
 * behind a button so the settings page stays short.
 */
export function ReleaseNotesSection() {
  const t = useTranslations("releaseNotes");
  const [olderOpen, setOlderOpen] = useState(false);
  const [newest, ...older] = groupReleasesByDay(RELEASES);

  return (
    <GlassCard hover={false} data-testid="settings-section-release-notes">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-lg text-primary">{t("sectionTitle")}</h2>
      </div>
      {newest && <ReleaseNotesList releases={[newest]} />}
      {older.length > 0 && (
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setOlderOpen(true)}
          data-testid="release-notes-older"
        >
          <History className="h-4 w-4" />
          {t("olderButton", { count: older.length })}
        </Button>
      )}
      {olderOpen && <OlderReleasesViewer releases={older} onClose={() => setOlderOpen(false)} />}
    </GlassCard>
  );
}
