import { getTranslations, getLocale } from "next-intl/server";
import { CalendarDays } from "lucide-react";
import { GlassCard } from "@/components/glass-card";

/**
 * Nächster Spielabend — aktuell hart kodiert. Wenn mehrere Termine oder
 * Editierbarkeit gebraucht werden, Wert in eine `system_settings`-Tabelle
 * oder ein eigenes Admin-Panel migrieren.
 */
const NEXT_SESSION_ISO = "2026-06-20";

function parseSessionDate(): Date {
  const [y, m, d] = NEXT_SESSION_ISO.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysUntil(target: Date): number {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = target.getTime() - startOfToday.getTime();
  return Math.round(diffMs / 86_400_000);
}

export async function NextSessionBanner() {
  const t = await getTranslations("dashboard");
  const locale = await getLocale();
  const target = parseSessionDate();
  const days = daysUntil(target);

  if (days < 0) return null;

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedDate = dateFormatter.format(target);

  const countdownLabel =
    days === 0
      ? t("nextSessionToday")
      : days === 1
        ? t("nextSessionTomorrow")
        : t("nextSessionInDays", { count: days });

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
          <p className="font-heading text-lg text-primary sm:text-xl">{formattedDate}</p>
          <p className="text-sm text-muted-foreground" data-testid="next-session-countdown">
            {countdownLabel}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
