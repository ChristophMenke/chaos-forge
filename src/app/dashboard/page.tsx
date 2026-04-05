/* eslint-disable react-hooks/purity -- Server Component: Math.random()/Date.now() are safe (run once per request) */
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { getTranslations, getLocale } from "next-intl/server";
import { GlassCard } from "@/components/glass-card";
import { CharacterCard } from "@/components/character-card";
import { QuoteReactionBar } from "@/components/session/quote-reaction-bar";
import { AvatarDisplay } from "@/components/avatar-display";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  BookOpen,
  Clock,
  Crown,
  Swords,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { getAlignmentLabel } from "@/lib/rules/alignment";
import { CLASSES } from "@/lib/rules/classes";
import { RACES } from "@/lib/rules/races";
import { getClassGroupColors } from "@/lib/utils/class-colors";
import { localized } from "@/lib/utils/localize";
import type { ClassGroup, ClassId } from "@/lib/rules/types";
import type {
  CharacterRow,
  CharacterClassRow,
  SessionRow,
  SessionEntryRow,
  ChronicleQuoteRow,
  QuoteReactionRow,
  ChronicleNpcRow,
  TagRow,
  CharacterShareRow,
} from "@/lib/supabase/types";

const TAG_COLORS: Record<string, string> = {
  npc: "bg-red-900/50 text-red-200",
  location: "bg-green-900/50 text-green-200",
  item: "bg-blue-900/50 text-blue-200",
  quest: "bg-purple-900/50 text-purple-200",
};

function StatCard({
  icon: Icon,
  label,
  value,
  testId,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  testId: string;
}) {
  return (
    <div className="stat-card-frame glass glow-neutral rounded-xl p-5" data-testid={testId}>
      <span aria-hidden="true" className="stat-corner-tr" />
      <div className="relative z-10 flex flex-col items-center gap-2 text-center">
        <Icon className="stat-icon-glow h-6 w-6 text-primary/80" aria-hidden="true" />
        <div className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </div>
        <div className="stat-glow-pulse font-heading text-4xl text-primary">{value}</div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const ts = await getTranslations("sharing");
  const locale = await getLocale();
  const user = await requireAuth();
  const supabase = await createClient();

  // ── Queries (parallelized) ──────────────────────────────
  const [
    { data: characters },
    { data: publicCharacters },
    { data: sharedWithMe },
    { data: allCharClasses },
    { data: sessions },
    { data: allQuotes },
    { data: latestNpcs },
    { data: xpHistory },
    { data: tags },
    { data: sessionTagRows },
  ] = await Promise.all([
    supabase
      .from("characters")
      .select("*")
      .eq("user_id", user.id)
      .order("last_accessed_at", { ascending: false })
      .returns<CharacterRow[]>(),
    supabase
      .from("characters")
      .select("*")
      .eq("is_active", true)
      .eq("is_public", true)
      .neq("user_id", user.id)
      .order("name")
      .returns<CharacterRow[]>(),
    supabase
      .from("character_shares")
      .select("*")
      .eq("shared_with_user_id", user.id)
      .returns<CharacterShareRow[]>(),
    // Intentionally unscoped: charClassMap is used for ALL characters (own + party overview)
    supabase.from("character_classes").select("*").returns<CharacterClassRow[]>(),
    supabase
      .from("sessions")
      .select("id, title, session_date, summary")
      .order("session_date", { ascending: false })
      .returns<Pick<SessionRow, "id" | "title" | "session_date" | "summary">[]>(),
    supabase.from("chronicle_quotes").select("*").returns<ChronicleQuoteRow[]>(),
    supabase
      .from("chronicle_npcs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<ChronicleNpcRow[]>(),
    supabase
      .from("xp_history")
      .select("character_id, xp_amount")
      .returns<{ character_id: string; xp_amount: number }[]>(),
    supabase.from("tags").select("*").returns<TagRow[]>(),
    supabase.from("session_tags").select("tag_id").returns<{ tag_id: string }[]>(),
  ]);

  // Build party overview: public characters + shared (non-public) characters
  const publicIds = new Set((publicCharacters ?? []).map((c) => c.id));
  const sharedNonPublicIds = (sharedWithMe ?? [])
    .map((s) => s.character_id)
    .filter((id) => !publicIds.has(id));

  let sharedChars: CharacterRow[] = [];
  if (sharedNonPublicIds.length > 0) {
    const { data } = await supabase
      .from("characters")
      .select("*")
      .in("id", sharedNonPublicIds)
      .eq("is_active", true)
      .returns<CharacterRow[]>();
    sharedChars = data ?? [];
  }

  const partyOverviewCharacters = [...(publicCharacters ?? []), ...sharedChars].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const charClassMap = new Map<string, CharacterClassRow[]>();
  for (const cc of allCharClasses ?? []) {
    const existing = charClassMap.get(cc.character_id) ?? [];
    existing.push(cc);
    charClassMap.set(cc.character_id, existing);
  }

  const latestSession = sessions?.[0] ?? null;

  // Random quote (server-side, changes per request)
  const randomQuote =
    allQuotes && allQuotes.length > 0
      ? allQuotes[Math.floor(Math.random() * allQuotes.length)]
      : null;

  // Dependent queries (need results from above)
  const [{ data: quoteReactions }, { data: latestSessionTagRows }, { data: latestSessionEntries }] =
    await Promise.all([
      randomQuote
        ? supabase
            .from("chronicle_quote_reactions")
            .select("*")
            .eq("quote_id", randomQuote.id)
            .returns<QuoteReactionRow[]>()
        : Promise.resolve({ data: [] as QuoteReactionRow[] }),
      latestSession
        ? supabase
            .from("session_tags")
            .select("tag_id")
            .eq("session_id", latestSession.id)
            .returns<{ tag_id: string }[]>()
        : Promise.resolve({ data: [] as { tag_id: string }[] }),
      latestSession
        ? supabase
            .from("session_entries")
            .select("id, character_id, content")
            .eq("session_id", latestSession.id)
            .order("created_at", { ascending: true })
            .limit(10)
            .returns<Pick<SessionEntryRow, "id" | "character_id" | "content">[]>()
        : Promise.resolve({
            data: [] as Pick<SessionEntryRow, "id" | "character_id" | "content">[],
          }),
    ]);

  // ── Calculations ──────────────────────────────────────────

  const allCharacters = characters ?? [];
  const activeCharacters = allCharacters.filter((c) => c.is_active);

  const avgLevel = (() => {
    if (allCharacters.length === 0) return 0;
    let totalLevel = 0;
    for (const c of allCharacters) {
      const classes = (charClassMap.get(c.id) ?? []).filter((cc) => cc.is_active);
      if (classes.length > 0) {
        totalLevel += Math.max(...classes.map((cc) => cc.level));
      } else {
        totalLevel += c.level;
      }
    }
    return Math.round(totalLevel / allCharacters.length);
  })();

  // Class distribution across all characters (with class group for color-coding)
  const classDistribution = (() => {
    const counts = new Map<string, { count: number; group: ClassGroup }>();
    for (const c of allCharacters) {
      const classes = (charClassMap.get(c.id) ?? []).filter((cc) => cc.is_active);
      for (const cc of classes) {
        const cls = CLASSES[cc.class_id as ClassId];
        const name = cls ? localized(cls.name, cls.name_en, locale) : cc.class_id;
        const group = cls?.group ?? "warrior";
        const existing = counts.get(name);
        if (existing) {
          existing.count++;
        } else {
          counts.set(name, { count: 1, group });
        }
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, { count, group }]) => ({ name, count, group }));
  })();

  // Race distribution across all characters
  const raceDistribution = (() => {
    const counts = new Map<string, number>();
    for (const c of allCharacters) {
      const race = RACES[c.race_id as keyof typeof RACES];
      const name = race ? localized(race.name, race.name_en, locale) : (c.race_id ?? "?");
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  })();

  const sessionCount = sessions?.length ?? 0;
  const daysSinceLastSession = latestSession
    ? Math.floor(
        (Date.now() - new Date(latestSession.session_date).getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  // XP totals
  const xpTotals = new Map<string, number>();
  for (const entry of xpHistory ?? []) {
    xpTotals.set(entry.character_id, (xpTotals.get(entry.character_id) ?? 0) + entry.xp_amount);
  }
  const xpRanking = [...xpTotals.entries()]
    .map(([charId, total]) => {
      const char = characters?.find((c) => c.id === charId);
      if (!char) return null;
      return { name: char.name, total };
    })
    .filter((entry): entry is { name: string; total: number } => entry !== null)
    .sort((a, b) => b.total - a.total);

  // Tag cloud with counts
  const tagCountMap = new Map<string, number>();
  for (const st of sessionTagRows ?? []) {
    tagCountMap.set(st.tag_id, (tagCountMap.get(st.tag_id) ?? 0) + 1);
  }
  const tagCloud = (tags ?? [])
    .map((tag) => ({ ...tag, count: tagCountMap.get(tag.id) ?? 0 }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  // Latest session tags resolved
  const latestSessionTags = (latestSessionTagRows ?? [])
    .map((st) => tags?.find((t) => t.id === st.tag_id))
    .filter(Boolean) as TagRow[];

  // Throwback: random older session (not the latest)
  const olderSessions = sessions?.slice(1) ?? [];
  const throwbackSession =
    olderSessions.length > 0
      ? olderSessions[Math.floor(Math.random() * olderSessions.length)]
      : null;
  const throwbackIndex = throwbackSession
    ? (sessions?.findIndex((s) => s.id === throwbackSession.id) ?? 0) + 1
    : 0;

  // Pre-compute distribution max counts for bar widths
  const maxClassCount = classDistribution[0]?.count ?? 1;
  const maxRaceCount = raceDistribution[0]?.count ?? 1;

  // ── Party-wide statistics (all visible characters, not just own) ──
  const allPartyChars = [...allCharacters, ...partyOverviewCharacters];
  // Deduplicate by id (own characters might also be in partyOverview if public)
  const partyCharsMap = new Map(allPartyChars.map((c) => [c.id, c]));
  const partyChars = [...partyCharsMap.values()];

  const partyAvgLevel = (() => {
    if (partyChars.length === 0) return 0;
    let total = 0;
    for (const c of partyChars) {
      const classes = (charClassMap.get(c.id) ?? []).filter((cc) => cc.is_active);
      total += classes.length > 0 ? Math.max(...classes.map((cc) => cc.level)) : c.level;
    }
    return Math.round(total / partyChars.length);
  })();

  // Highest level character in party
  const highestLevelChar = (() => {
    let best: { name: string; level: number } | null = null;
    for (const c of partyChars) {
      const classes = (charClassMap.get(c.id) ?? []).filter((cc) => cc.is_active);
      const level = classes.length > 0 ? Math.max(...classes.map((cc) => cc.level)) : c.level;
      if (!best || level > best.level) {
        best = { name: c.name, level };
      }
    }
    return best;
  })();

  // Strongest attribute across all party characters
  const strongestStat = (() => {
    const stats = ["str", "dex", "con", "int", "wis", "cha"] as const;
    let best: { stat: string; value: number; name: string } | null = null;
    for (const c of partyChars) {
      for (const stat of stats) {
        const val = c[stat];
        if (!best || val > best.value) {
          best = { stat: stat.toUpperCase(), value: val, name: c.name };
        }
      }
    }
    return best;
  })();

  // Alignment distribution
  const alignmentDistribution = (() => {
    const counts = new Map<string, number>();
    for (const c of partyChars) {
      if (!c.alignment) continue;
      const label = getAlignmentLabel(c.alignment, locale);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  })();
  const maxAlignmentCount = alignmentDistribution[0]?.count ?? 1;

  // Party class distribution
  const partyClassDistribution = (() => {
    const counts = new Map<string, { count: number; group: ClassGroup }>();
    for (const c of partyChars) {
      const classes = (charClassMap.get(c.id) ?? []).filter((cc) => cc.is_active);
      for (const cc of classes) {
        const cls = CLASSES[cc.class_id as ClassId];
        const name = cls ? localized(cls.name, cls.name_en, locale) : cc.class_id;
        const group = cls?.group ?? "warrior";
        const existing = counts.get(name);
        if (existing) existing.count++;
        else counts.set(name, { count: 1, group });
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, { count, group }]) => ({ name, count, group }));
  })();
  const maxPartyClassCount = partyClassDistribution[0]?.count ?? 1;

  // Party race distribution
  const partyRaceDistribution = (() => {
    const counts = new Map<string, number>();
    for (const c of partyChars) {
      const race = RACES[c.race_id as keyof typeof RACES];
      const name = race ? localized(race.name, race.name_en, locale) : (c.race_id ?? "?");
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  })();
  const maxPartyRaceCount = partyRaceDistribution[0]?.count ?? 1;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6" data-testid="dashboard-page">
      <h1 className="font-heading text-3xl text-primary">{t("title")}</h1>

      {/* ── Character Grid (Hero Section — top) ──────────── */}
      <h2 className="font-heading text-xl">{t("myCharacters")}</h2>
      {activeCharacters.length === 0 ? (
        <p className="text-muted-foreground">{t("noCharacters")}</p>
      ) : (
        <div className="stagger-reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeCharacters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              classes={charClassMap.get(character.id) ?? []}
              isOwner={true}
              isSharedWithMe={false}
              badgePrivateLabel={ts("badgePrivate")}
              badgeSharedLabel={ts("badgeShared")}
              badgePublicLabel={ts("badgePublic")}
              locale={locale}
            />
          ))}
        </div>
      )}

      {/* ── Stats Row (AAA Style) ─────────────────────────── */}
      <div className="stagger-reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label={t("adventurers")}
          value={allCharacters.length}
          testId="stat-card-adventurers"
        />
        <StatCard
          icon={TrendingUp}
          label={t("averageLevel")}
          value={avgLevel}
          testId="stat-card-avg-level"
        />
        <StatCard
          icon={BookOpen}
          label={t("totalSessions")}
          value={sessionCount}
          testId="stat-card-sessions"
        />
        <StatCard
          icon={Clock}
          label={t("daysSinceLastSession")}
          value={daysSinceLastSession ?? "—"}
          testId="stat-card-days-since"
        />
      </div>

      {/* ── Class & Race Distribution (Visual Bars) ──────── */}
      {(classDistribution.length > 0 || raceDistribution.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {classDistribution.length > 0 && (
            <div
              className="stat-card-frame glass glow-neutral rounded-xl p-5"
              data-testid="stat-card-classes"
            >
              <span aria-hidden="true" className="stat-corner-tr" />
              <h3 className="relative z-10 mb-3 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("classDistribution")}
              </h3>
              <div className="relative z-10 space-y-2.5">
                {classDistribution.map((c) => {
                  const pct = Math.round((c.count / maxClassCount) * 100);
                  const colors = getClassGroupColors(c.group);
                  return (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="w-20 truncate text-xs text-foreground">{c.name}</span>
                      <div className="distribution-bar flex-1">
                        <div
                          className={`distribution-bar-fill ${colors.hpBar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right font-mono text-xs text-muted-foreground">
                        {c.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {raceDistribution.length > 0 && (
            <div
              className="stat-card-frame glass glow-neutral rounded-xl p-5"
              data-testid="stat-card-races"
            >
              <span aria-hidden="true" className="stat-corner-tr" />
              <h3 className="relative z-10 mb-3 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("raceDistribution")}
              </h3>
              <div className="relative z-10 space-y-2.5">
                {raceDistribution.map((r) => {
                  const pct = Math.round((r.count / maxRaceCount) * 100);
                  return (
                    <div key={r.name} className="flex items-center gap-3">
                      <span className="w-20 truncate text-xs text-foreground">{r.name}</span>
                      <div className="distribution-bar flex-1">
                        <div
                          className="distribution-bar-fill hp-bar-priest"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right font-mono text-xs text-muted-foreground">
                        {r.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Party-Wide Stats ────────────────────────────────── */}
      {partyChars.length > 0 && (
        <>
          <h2 className="font-heading text-xl">{t("partyStats")}</h2>

          {/* Party stat cards row */}
          <div className="stagger-reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label={t("partyAdventurers")}
              value={partyChars.length}
              testId="stat-card-party-adventurers"
            />
            <StatCard
              icon={TrendingUp}
              label={t("partyAvgLevel")}
              value={partyAvgLevel}
              testId="stat-card-party-avg-level"
            />
            {highestLevelChar && (
              <StatCard
                icon={Crown}
                label={t("highestLevel")}
                value={t("highestLevelChar", {
                  name: highestLevelChar.name,
                  level: highestLevelChar.level,
                })}
                testId="stat-card-highest-level"
              />
            )}
            {strongestStat && (
              <StatCard
                icon={Swords}
                label={t("strongestStat")}
                value={`${strongestStat.stat} ${strongestStat.value} (${strongestStat.name})`}
                testId="stat-card-strongest-stat"
              />
            )}
          </div>

          {/* Party distributions */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Alignment Distribution */}
            {alignmentDistribution.length > 0 && (
              <div
                className="stat-card-frame glass glow-neutral rounded-xl p-5"
                data-testid="stat-card-alignments"
              >
                <span aria-hidden="true" className="stat-corner-tr" />
                <h3 className="relative z-10 mb-3 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  <Shield
                    className="mr-1.5 inline h-3.5 w-3.5 align-[-2px] text-primary/60"
                    aria-hidden="true"
                  />
                  {t("alignmentDistribution")}
                </h3>
                <div className="relative z-10 space-y-2.5">
                  {alignmentDistribution.map((a) => {
                    const pct = Math.round((a.count / maxAlignmentCount) * 100);
                    return (
                      <div key={a.name} className="flex items-center gap-3">
                        <span className="w-28 truncate text-xs text-foreground">{a.name}</span>
                        <div className="distribution-bar flex-1">
                          <div
                            className="distribution-bar-fill hp-bar-priest"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-6 text-right font-mono text-xs text-muted-foreground">
                          {a.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Party Class Distribution */}
            {partyClassDistribution.length > 0 && (
              <div
                className="stat-card-frame glass glow-neutral rounded-xl p-5"
                data-testid="stat-card-party-classes"
              >
                <span aria-hidden="true" className="stat-corner-tr" />
                <h3 className="relative z-10 mb-3 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {t("partyClassDistribution")}
                </h3>
                <div className="relative z-10 space-y-2.5">
                  {partyClassDistribution.map((c) => {
                    const pct = Math.round((c.count / maxPartyClassCount) * 100);
                    const colors = getClassGroupColors(c.group);
                    return (
                      <div key={c.name} className="flex items-center gap-3">
                        <span className="w-20 truncate text-xs text-foreground">{c.name}</span>
                        <div className="distribution-bar flex-1">
                          <div
                            className={`distribution-bar-fill ${colors.hpBar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-6 text-right font-mono text-xs text-muted-foreground">
                          {c.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Party Race Distribution */}
            {partyRaceDistribution.length > 0 && (
              <div
                className="stat-card-frame glass glow-neutral rounded-xl p-5"
                data-testid="stat-card-party-races"
              >
                <span aria-hidden="true" className="stat-corner-tr" />
                <h3 className="relative z-10 mb-3 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {t("partyRaceDistribution")}
                </h3>
                <div className="relative z-10 space-y-2.5">
                  {partyRaceDistribution.map((r) => {
                    const pct = Math.round((r.count / maxPartyRaceCount) * 100);
                    return (
                      <div key={r.name} className="flex items-center gap-3">
                        <span className="w-20 truncate text-xs text-foreground">{r.name}</span>
                        <div className="distribution-bar flex-1">
                          <div
                            className="distribution-bar-fill hp-bar-priest"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-6 text-right font-mono text-xs text-muted-foreground">
                          {r.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Two-Column Grid ───────────────────────────────── */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Random Quote */}
        {randomQuote && (
          <GlassCard glow="neutral" data-testid="dashboard-random-quote">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("randomQuote")}
              </h3>
              <Link
                href="/sessions"
                className="text-xs text-muted-foreground hover:text-primary"
                data-testid="dashboard-quotes-link"
              >
                {t("viewAll")}
              </Link>
            </div>
            <blockquote className="mt-3 border-l-2 border-primary/40 pl-4 italic text-foreground">
              &ldquo;{randomQuote.content}&rdquo;
            </blockquote>
            <div className="mt-2 text-sm text-muted-foreground">— {randomQuote.attributed_to}</div>
            <div className="mt-2">
              <QuoteReactionBar
                quoteId={randomQuote.id}
                currentUserId={user.id}
                initialReactions={quoteReactions ?? []}
              />
            </div>
          </GlassCard>
        )}

        {/* Party Overview */}
        <GlassCard glow="neutral" data-testid="dashboard-party-overview">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("partyOverview")}
          </h3>
          <div className="mt-3 flex flex-col gap-2">
            {partyOverviewCharacters.map((char) => {
              const classes = (charClassMap.get(char.id) ?? []).filter((cc) => cc.is_active);
              const primaryGroup: ClassGroup = (() => {
                if (classes.length === 0) return "warrior";
                const primary = classes.reduce((best, cc) => (cc.level >= best.level ? cc : best));
                return CLASSES[primary.class_id as ClassId]?.group ?? "warrior";
              })();
              const colors = getClassGroupColors(primaryGroup);
              const race = RACES[char.race_id as keyof typeof RACES];
              const raceName = race ? localized(race.name, race.name_en, locale) : char.race_id;
              const classLabel =
                classes.length > 0
                  ? classes
                      .map((cc) => {
                        const cls = CLASSES[cc.class_id as keyof typeof CLASSES];
                        const name = cls ? localized(cls.name, cls.name_en, locale) : cc.class_id;
                        return `${name} ${cc.level}`;
                      })
                      .join(" / ")
                  : `${char.class_id ?? "?"} ${char.level}`;
              const hpPct =
                char.hp_max > 0
                  ? Math.min(100, Math.round((char.hp_current / char.hp_max) * 100))
                  : 100;

              return (
                <Link
                  key={char.id}
                  href={`/characters/${char.id}`}
                  className={`flex items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-accent/30 ${colors.glow}`}
                  data-testid={`party-char-${char.id}`}
                >
                  <AvatarDisplay name={char.name} avatarUrl={char.avatar_url} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-sm">{char.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="truncate">{raceName}</span>
                      <span>·</span>
                      <span className="truncate">{classLabel}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-xs text-muted-foreground">
                      {char.hp_current}/{char.hp_max} HP
                    </span>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${colors.hpBar}`}
                        style={{ width: `${hpPct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </GlassCard>

        {/* Latest Session with Summary + Tags */}
        {latestSession && (
          <Link href={`/sessions/${latestSession.id}`}>
            <GlassCard glow="neutral" hover data-testid="dashboard-latest-session">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("latestSession")}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {new Date(latestSession.session_date).toLocaleDateString(locale)}
                </span>
              </div>
              <div className="mt-2 font-heading text-lg">{latestSession.title}</div>
              {latestSession.summary && (
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                  {latestSession.summary}
                </p>
              )}
              {latestSessionTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {latestSessionTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className={`text-[10px] ${TAG_COLORS[tag.type] ?? ""}`}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
              {latestSessionEntries && latestSessionEntries.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-border/50 pt-2">
                  {latestSessionEntries.map((entry) => {
                    const char = characters?.find((c) => c.id === entry.character_id);
                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <AvatarDisplay
                          name={char?.name ?? "?"}
                          avatarUrl={char?.avatar_url ?? null}
                          size={20}
                        />
                        <div>
                          <span className="font-medium text-foreground/80">
                            {char?.name ?? "?"}:
                          </span>{" "}
                          {entry.content.length > 120
                            ? entry.content.slice(0, 120) + "…"
                            : entry.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </Link>
        )}

        {/* Throwback Session */}
        {throwbackSession && (
          <Link href={`/sessions/${throwbackSession.id}`}>
            <GlassCard glow="neutral" hover data-testid="dashboard-throwback">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("throwback")}
              </h3>
              <div className="mt-2 text-sm text-muted-foreground">
                {t("throwbackPrefix", { count: throwbackIndex })}
              </div>
              <div className="mt-1 font-heading text-lg">{throwbackSession.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(throwbackSession.session_date).toLocaleDateString(locale)}
              </div>
            </GlassCard>
          </Link>
        )}

        {/* XP Overview */}
        {xpRanking.length > 0 && (
          <GlassCard glow="neutral" data-testid="dashboard-xp-overview">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("xpOverview")}
            </h3>
            <div className="mt-3 space-y-2">
              {xpRanking.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between rounded-md border border-border/50 px-3 py-1.5"
                >
                  <span className="text-sm">{entry.name}</span>
                  <span className="font-mono text-sm font-bold text-primary">
                    {entry.total.toLocaleString(locale)} XP
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Tag Cloud */}
        {tagCloud.length > 0 && (
          <GlassCard glow="neutral" data-testid="dashboard-tag-cloud">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("tagCloud")}
            </h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tagCloud.map((tag) => (
                <Badge key={tag.id} variant="secondary" className={TAG_COLORS[tag.type] ?? ""}>
                  {tag.name}
                  <span className="ml-1 opacity-60">{tag.count}</span>
                </Badge>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Latest NPCs */}
        {latestNpcs && latestNpcs.length > 0 && (
          <GlassCard glow="neutral" data-testid="dashboard-latest-npcs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("latestNpcs")}
              </h3>
              <Link
                href="/sessions"
                className="text-xs text-muted-foreground hover:text-primary"
                data-testid="dashboard-npcs-link"
              >
                {t("viewAll")}
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {latestNpcs.map((npc) => (
                <div key={npc.id} className="rounded-md border border-border/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <AvatarDisplay name={npc.name} avatarUrl={npc.avatar_url} size={24} />
                    <span className="flex-1 text-sm font-medium">{npc.name}</span>
                    {npc.location && (
                      <span className="text-xs text-muted-foreground">{npc.location}</span>
                    )}
                  </div>
                  {npc.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {npc.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
