"use client";

import { ArrowUpCircle, Cog, Sparkles, Undo2 } from "lucide-react";
import { useLocale } from "next-intl";
import { SvenBotIcon } from "@/components/svenbot/svenbot-avatar";
import { parseGameDate } from "@/lib/game-dates";
import type { Release, ReleaseIcon } from "@/lib/release-notes";
import { localized } from "@/lib/utils/localize";

const ICONS: Record<ReleaseIcon, React.ComponentType<{ className?: string }>> = {
  svenbot: SvenBotIcon,
  "level-up": ArrowUpCircle,
  effects: Sparkles,
  undo: Undo2,
  sprocket: Cog,
};

/** "31. Oktober 2026" / "October 31, 2026" — local midnight, no UTC shift. */
function formatReleaseDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseGameDate(iso));
}

/** Release notes, newest first. Shared by the dialog and the settings section. */
export function ReleaseNotesList({ releases }: { releases: Release[] }) {
  const locale = useLocale();

  return (
    <div className="space-y-5">
      {releases.map((release) => (
        <section key={release.id} data-testid="release-notes-release">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {formatReleaseDate(release.date, locale)}
          </h3>
          <ul className="space-y-3">
            {release.items.map((item) => {
              const Icon = ICONS[item.icon];
              return (
                <li key={item.title.de} className="flex gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">
                      {localized(item.title.de, item.title.en, locale)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {localized(item.text.de, item.text.en, locale)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
