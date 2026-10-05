import { getTranslations, getLocale } from "next-intl/server";
import { CalendarDays } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { createClient } from "@/lib/supabase/server";
import {
  daysUntil,
  formatGameDate,
  resolveGameDateTitle,
  toDateInputValue,
  todayInGroupTimezone,
} from "@/lib/game-dates";
import type { GameDateRow } from "@/lib/supabase/types";

/**
 * Nächster Spielabend aus `game_dates` — gepflegt unter /settings.
 * Ohne kommenden Termin rendert der Banner nichts.
 */
async function getNextGameDate(today: Date): Promise<GameDateRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game_dates")
    .select("*")
    .gte("event_date", toDateInputValue(today))
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[NextSessionBanner] Failed to load next game date:", error.message);
    return null;
  }
  return (data as GameDateRow | null) ?? null;
}

export async function NextSessionBanner() {
  const t = await getTranslations("dashboard");
  const locale = await getLocale();
  // Server Components laufen in UTC — "heute" muss die Zeitzone der Gruppe sein.
  const today = todayInGroupTimezone();
  const nextDate = await getNextGameDate(today);

  if (!nextDate) return null;

  const days = daysUntil(nextDate.event_date, today);
  const countdownLabel =
    days === 0
      ? t("nextSessionToday")
      : days === 1
        ? t("nextSessionTomorrow")
        : t("nextSessionInDays", { count: days });

  const title = resolveGameDateTitle(nextDate.title, "");

  return (
    <GlassCard
      className="border-primary/40 bg-primary/5"
      hover={false}
      data-testid="next-session-banner"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary sm:h-12 sm:w-12">
          <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("nextSessionLabel")}
          </p>
          <p className="font-heading text-lg text-primary sm:text-xl">
            {formatGameDate(nextDate.event_date, locale)}
          </p>
          {title && (
            <p className="truncate text-sm text-foreground" data-testid="next-session-title">
              {title}
            </p>
          )}
          <p className="text-sm text-muted-foreground" data-testid="next-session-countdown">
            {countdownLabel}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
