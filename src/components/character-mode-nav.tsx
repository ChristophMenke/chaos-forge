"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { PenLine, Swords, Sparkles } from "lucide-react";

interface CharacterModeNavProps {
  characterId: string;
  hasEpicItems: boolean;
  basePath?: string;
}

export function CharacterModeNav({
  characterId,
  hasEpicItems,
  basePath = "/characters",
}: CharacterModeNavProps) {
  const t = useTranslations("characters");
  const pathname = usePathname();

  const modes = [
    {
      href: `${basePath}/${characterId}/manage`,
      label: t("manageCharacter"),
      shortLabel: t("manage"),
      icon: PenLine,
      testId: "mode-nav-manage",
      active: pathname.includes("/manage"),
    },
    {
      href: `${basePath}/${characterId}/play`,
      label: t("playCharacter"),
      shortLabel: t("play"),
      icon: Swords,
      testId: "mode-nav-play",
      active: pathname.includes("/play"),
    },
    ...(hasEpicItems
      ? [
          {
            href: `${basePath}/${characterId}/epic`,
            label: t("epicEquipment"),
            shortLabel: t("epic"),
            icon: Sparkles,
            testId: "mode-nav-epic",
            active: pathname.includes("/epic"),
          },
        ]
      : []),
  ];

  return (
    <nav
      className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/30 p-1"
      data-testid="character-mode-nav"
    >
      {modes.map((mode) => {
        const Icon = mode.icon;
        return (
          <Link
            key={mode.href}
            href={mode.href}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode.active
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            data-testid={mode.testId}
          >
            <Icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline lg:text-sm">{mode.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
