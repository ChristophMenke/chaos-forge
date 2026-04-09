import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass-card";
import { Badge } from "@/components/ui/badge";
import { AvatarDisplay } from "@/components/avatar-display";
import { NpcManager } from "@/components/session/npc-manager";
import { QuoteSection } from "@/components/session/quote-section";
import type {
  SessionRow,
  TagRow,
  ChronicleNpcRow,
  ChronicleQuoteRow,
  QuoteReactionRow,
} from "@/lib/supabase/types";

type EntryWithChar = {
  id: string;
  session_id: string;
  character_id: string;
  content: string;
  characters: { id: string; name: string; avatar_url: string | null } | null;
};

const TAG_COLORS: Record<string, string> = {
  npc: "bg-red-900/50 text-red-200",
  location: "bg-green-900/50 text-green-200",
  item: "bg-blue-900/50 text-blue-200",
  quest: "bg-purple-900/50 text-purple-200",
};

export default async function SessionsPage() {
  const t = await getTranslations("sessions");
  const tc = await getTranslations("chronicle");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? "";

  // Wave 1: Sessions + independent data in parallel
  const [{ data: sessions }, { data: npcs }, { data: quotes }] = await Promise.all([
    supabase
      .from("sessions")
      .select("*")
      .order("session_date", { ascending: false })
      .returns<SessionRow[]>(),
    supabase
      .from("chronicle_npcs")
      .select("*")
      .eq("is_visible_to_players", true)
      .order("name")
      .returns<ChronicleNpcRow[]>(),
    supabase
      .from("chronicle_quotes")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<ChronicleQuoteRow[]>(),
  ]);

  // Wave 2: Dependent queries (need session/quote IDs)
  const sessionIds = sessions?.map((s) => s.id) ?? [];
  const quoteIds = quotes?.map((q) => q.id) ?? [];

  const [{ data: sessionTags }, { data: reactions }, { data: allEntries }] = await Promise.all([
    supabase
      .from("session_tags")
      .select("session_id, tag_id, tags(*)")
      .in("session_id", sessionIds.length > 0 ? sessionIds : ["none"]),
    supabase
      .from("chronicle_quote_reactions")
      .select("*")
      .in("quote_id", quoteIds.length > 0 ? quoteIds : ["none"])
      .returns<QuoteReactionRow[]>(),
    supabase
      .from("session_entries")
      .select("id, session_id, character_id, content, characters(id, name, avatar_url)")
      .in("session_id", sessionIds.length > 0 ? sessionIds : ["none"])
      .order("created_at", { ascending: true }),
  ]);

  // Group tags and entries by session
  const tagsBySession: Record<string, TagRow[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sessionTags?.forEach((st: any) => {
    if (!tagsBySession[st.session_id]) tagsBySession[st.session_id] = [];
    if (st.tags) tagsBySession[st.session_id].push(st.tags as TagRow);
  });

  const entriesBySession: Record<string, EntryWithChar[]> = {};
  ((allEntries as EntryWithChar[] | null) ?? []).forEach((e) => {
    if (!entriesBySession[e.session_id]) entriesBySession[e.session_id] = [];
    entriesBySession[e.session_id].push(e);
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6" data-testid="sessions-page">
      <h1 className="font-heading text-3xl text-primary">{t("title")}</h1>

      {/* 3-column layout: Sessions | Quotes | NPCs */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Column 1: Sessions */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl text-primary">{tc("sessions")}</h2>
            <Link href="/sessions/new">
              <Button data-testid="create-session-button">{t("newSession")}</Button>
            </Link>
          </div>

          {!sessions || sessions.length === 0 ? (
            <div
              className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center"
              data-testid="no-sessions"
            >
              <Image
                src="/images/empty-states/chronicle.webp"
                alt=""
                width={200}
                height={150}
                className="opacity-60"
              />
              <p className="text-lg text-muted-foreground">{t("noSessions")}</p>
              <Link href="/sessions/new">
                <Button size="lg">{t("createFirst")}</Button>
              </Link>
            </div>
          ) : (
            sessions.map((session) => {
              const tags = tagsBySession[session.id] ?? [];
              const sessionEntries = entriesBySession[session.id] ?? [];
              const dateStr = new Date(session.session_date).toLocaleDateString("de-DE", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              });

              return (
                <Link key={session.id} href={`/sessions/${session.id}`}>
                  <GlassCard glow="neutral" data-testid={`session-card-${session.id}`}>
                    <div className="flex items-start justify-between">
                      <h3 className="font-heading text-xl text-foreground">{session.title}</h3>
                      <span className="text-sm text-muted-foreground">{dateStr}</span>
                    </div>
                    {tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            className={TAG_COLORS[tag.type] ?? ""}
                            variant="secondary"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {session.summary && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {session.summary}
                      </p>
                    )}

                    {/* Entry previews */}
                    {sessionEntries.length > 0 && (
                      <div className="mt-3 space-y-1.5 border-t border-border/50 pt-2">
                        {sessionEntries.slice(0, 3).map((entry) => {
                          const char = entry.characters;
                          return (
                            <div
                              key={entry.id}
                              className="flex items-start gap-2 text-xs text-muted-foreground"
                            >
                              <span aria-hidden="true" className="shrink-0">
                                <AvatarDisplay
                                  name={char?.name ?? "?"}
                                  avatarUrl={char?.avatar_url ?? null}
                                  size={20}
                                />
                              </span>
                              <div className="line-clamp-2 min-w-0">
                                <span className="font-medium text-foreground/80">
                                  {char?.name ?? "?"}:
                                </span>{" "}
                                {entry.content}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </GlassCard>
                </Link>
              );
            })
          )}
        </div>

        {/* Column 2: Quotes */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <GlassCard glow="neutral">
            <QuoteSection
              quotes={quotes ?? []}
              reactions={reactions ?? []}
              currentUserId={currentUserId}
            />
          </GlassCard>
        </div>

        {/* Column 3: NPCs */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <GlassCard glow="neutral">
            <NpcManager npcs={npcs ?? []} />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
