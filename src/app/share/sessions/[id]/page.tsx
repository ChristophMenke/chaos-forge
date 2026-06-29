import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import remarkBreaks from "remark-breaks";
import { createServiceClient } from "@/lib/supabase/service";
import { MarkdownRenderer as ReactMarkdown } from "@/components/markdown-renderer";
import { AvatarDisplay } from "@/components/avatar-display";
import { Badge } from "@/components/ui/badge";
import type { SessionRow, SessionEntryRow, CharacterRow, TagRow } from "@/lib/supabase/types";

type PublicEntry = {
  id: string;
  content: string;
  characterName: string;
  characterAvatarUrl: string | null;
};

interface PublicSessionPageProps {
  params: Promise<{ id: string }>;
}

const TAG_COLORS: Record<string, string> = {
  npc: "bg-red-900/50 text-red-200",
  location: "bg-green-900/50 text-green-200",
  item: "bg-blue-900/50 text-blue-200",
  quest: "bg-purple-900/50 text-purple-200",
};

/**
 * Loads a session ONLY if it is publicly shared. Uses the Service-Role client
 * (RLS bypass) but hard-filters on is_public = true, so private sessions can
 * never be read through this route.
 */
async function getPublicSession(id: string): Promise<SessionRow | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle<SessionRow>();
  return data ?? null;
}

export async function generateMetadata({ params }: PublicSessionPageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await getPublicSession(id);
  if (!session) {
    return { title: "Chaos Forge", robots: { index: false } };
  }
  return {
    title: `${session.title} — Chaos Forge`,
    description: session.summary?.slice(0, 160) || undefined,
    // Share links carry random UUIDs and are not meant to be crawled.
    robots: { index: false, follow: false },
  };
}

export default async function PublicSessionPage({ params }: PublicSessionPageProps) {
  const { id } = await params;
  const session = await getPublicSession(id);

  if (!session) {
    notFound();
  }

  const t = await getTranslations("sessions");

  // Tags are non-sensitive metadata — load them via the same guarded client.
  const supabase = createServiceClient();
  const { data: sessionTags } = await supabase
    .from("session_tags")
    .select("tags(*)")
    .eq("session_id", id);
  const tags: TagRow[] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sessionTags ?? []).map((st: any) => st.tags as TagRow).filter(Boolean) ?? [];

  // Character entries — only non-sensitive fields (character name + avatar +
  // content). user_id and audio are deliberately NOT exposed publicly.
  const { data: entryRows } = await supabase
    .from("session_entries")
    .select("id, character_id, content")
    .eq("session_id", id)
    .order("created_at", { ascending: true })
    .returns<Pick<SessionEntryRow, "id" | "character_id" | "content">[]>();

  const characterIds = [...new Set((entryRows ?? []).map((e) => e.character_id))];
  const { data: entryCharacters } = characterIds.length
    ? await supabase
        .from("characters")
        .select("id, name, avatar_url")
        .in("id", characterIds)
        .returns<Pick<CharacterRow, "id" | "name" | "avatar_url">[]>()
    : { data: [] as Pick<CharacterRow, "id" | "name" | "avatar_url">[] };

  const characterById = new Map((entryCharacters ?? []).map((c) => [c.id, c]));
  const entries: PublicEntry[] = (entryRows ?? [])
    .filter((e) => e.content?.trim())
    .map((e) => ({
      id: e.id,
      content: e.content,
      characterName: characterById.get(e.character_id)?.name ?? "?",
      characterAvatarUrl: characterById.get(e.character_id)?.avatar_url ?? null,
    }));

  const dateStr = new Date(session.session_date).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-3xl p-6" data-testid="public-session">
      <header className="mb-6">
        <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
          {t("publicShareKicker")}
        </p>
        <h1 className="font-heading text-3xl text-primary" data-testid="public-session-title">
          {session.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{dateStr}</p>
      </header>

      {session.image_url && (
        <div className="relative mb-6 h-56 w-full overflow-hidden rounded-xl">
          <Image
            src={session.image_url}
            alt={session.title}
            fill
            className="object-cover"
            data-testid="public-session-image"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}

      {tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag.id} className={TAG_COLORS[tag.type] ?? ""} variant="secondary">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {session.summary && (
        <section className="mb-8" data-testid="public-session-summary">
          <div className="prose prose-sm prose-invert max-w-none rounded-md border border-border p-4">
            <ReactMarkdown remarkPlugins={[remarkBreaks]}>{session.summary}</ReactMarkdown>
          </div>
        </section>
      )}

      {entries.length > 0 && (
        <section data-testid="public-session-entries">
          <h2 className="mb-4 font-heading text-xl">{t("entries")}</h2>
          <div className="flex flex-col gap-4">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-md border border-border p-4"
                data-testid="public-session-entry"
              >
                <div className="mb-3 flex items-center gap-2">
                  <AvatarDisplay
                    name={entry.characterName}
                    avatarUrl={entry.characterAvatarUrl}
                    size={36}
                  />
                  <span className="font-heading text-lg">{entry.characterName}</span>
                </div>
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{entry.content}</ReactMarkdown>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {!session.summary && entries.length === 0 && (
        <p className="text-sm text-muted-foreground" data-testid="public-session-empty">
          {t("noSummary")}
        </p>
      )}

      <footer className="mt-10 border-t border-border pt-4 text-center text-xs text-muted-foreground">
        <Link href="/" className="underline hover:text-primary">
          {t("publicShareFooter")}
        </Link>
      </footer>
    </div>
  );
}
