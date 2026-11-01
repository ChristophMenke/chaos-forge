"use client";

import { HardDriveDownload } from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/glass-card";
import { BackupPanel } from "./backup-panel";

/** Settings → "Backup" (admin only; the caller decides visibility). */
export function BackupSection() {
  const t = useTranslations("backup");

  return (
    <GlassCard hover={false} data-testid="settings-section-backup">
      <div className="mb-3 flex items-center gap-2">
        <HardDriveDownload className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-lg text-primary">{t("sectionTitle")}</h2>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">{t("hint")}</p>
      <BackupPanel />
    </GlassCard>
  );
}
