"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CLASSES } from "@/lib/rules/classes";
import { getPendingLevelUps } from "@/lib/rules/level-up";
import { localized } from "@/lib/utils/localize";
import type { CharacterClassRow } from "@/lib/supabase/types";

interface PendingLevelUpBannerProps {
  classes: CharacterClassRow[];
  isOwner: boolean;
  onStart: () => void;
}

/** Shown while a class has the XP for its next level but the level-up is not done yet. */
export function PendingLevelUpBanner({ classes, isOwner, onStart }: PendingLevelUpBannerProps) {
  const t = useTranslations("levelUpWizard");
  const locale = useLocale();
  const pending = getPendingLevelUps(classes)[0];
  if (!isOwner || !pending) return null;

  const cls = CLASSES[pending.classId];
  const className = cls ? localized(cls.name, cls.name_en, locale) : pending.classId;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm"
      data-testid="pending-level-up-banner"
    >
      <span className="flex items-center gap-2">
        <ArrowUpCircle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
        {t("banner", { className, from: pending.fromLevel, to: pending.toLevel })}
      </span>
      <Button size="sm" onClick={onStart} data-testid="pending-level-up-start">
        {t("bannerButton")}
      </Button>
    </div>
  );
}
