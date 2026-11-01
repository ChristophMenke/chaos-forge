"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/glass-card";
import { RELEASES } from "@/lib/release-notes";
import { ReleaseNotesList } from "./release-notes-list";

/** Settings → "What's new": every release, so dismissed notes can be reread. */
export function ReleaseNotesSection() {
  const t = useTranslations("releaseNotes");

  return (
    <GlassCard hover={false} data-testid="settings-section-release-notes">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-lg text-primary">{t("sectionTitle")}</h2>
      </div>
      <ReleaseNotesList releases={RELEASES} />
    </GlassCard>
  );
}
