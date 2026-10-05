import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { SessionDetail } from "@/components/session/session-detail";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import type {
  SessionRow,
  SessionEntryRow,
  TagRow,
  CharacterRow,
  XpHistoryRow,
  SessionParticipantRow,
} from "@/lib/supabase/types";

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  type CharacterSummary = Pick<CharacterRow, "id" | "name" | "avatar_url" | "race_id" | "class_id">;
  const CHARACTER_SUMMARY = "id, name, avatar_url, race_id, class_id";

  // Wave 1: everything that only needs the session id or the user id
  const [
    { data: session },
    { data: entries },
    { data: userCharacters },
    { data: sessionTags },
    { data: allTags },
    { data: sessionXpHistory },
    { data: participantRows },
    { data: allActiveChars },
  ] = await Promise.all([
    supabase.from("sessions").select("*").eq("id", id).maybeSingle<SessionRow>(),
    supabase
      .from("session_entries")
      .select("*")
      .eq("session_id", id)
      .order("created_at", { ascending: true })
      .returns<SessionEntryRow[]>(),
    supabase
      .from("characters")
      .select("id, name, avatar_url")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .returns<Pick<CharacterRow, "id" | "name" | "avatar_url">[]>(),
    supabase.from("session_tags").select("tag_id, tags(*)").eq("session_id", id),
    supabase.from("tags").select("*").order("name").returns<TagRow[]>(),
    supabase
      .from("xp_history")
      .select("*")
      .eq("session_id", id)
      .order("created_at", { ascending: false })
      .returns<XpHistoryRow[]>(),
    supabase
      .from("session_participants")
      .select("*")
      .eq("session_id", id)
      .returns<SessionParticipantRow[]>(),
    // All active non-NPC characters for the participant picker
    supabase
      .from("characters")
      .select(CHARACTER_SUMMARY)
      .eq("is_active", true)
      .neq("is_npc", true)
      .order("name")
      .returns<CharacterSummary[]>(),
  ]);

  if (!session) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tags: TagRow[] = sessionTags?.map((st: any) => st.tags as TagRow).filter(Boolean) ?? [];

  // Wave 2: characters behind the entries and the participants
  const fetchCharacters = async (ids: string[]): Promise<CharacterSummary[]> => {
    if (ids.length === 0) return [];
    const { data } = await supabase
      .from("characters")
      .select(CHARACTER_SUMMARY)
      .in("id", ids)
      .returns<CharacterSummary[]>();
    return data ?? [];
  };

  const [entryCharacters, participantChars] = await Promise.all([
    fetchCharacters([...new Set(entries?.map((e) => e.character_id) ?? [])]),
    fetchCharacters((participantRows ?? []).map((p) => p.character_id)),
  ]);

  return (
    <>
      <RealtimeRefresh
        channelName={`session-${id}`}
        bindings={[{ table: "session_entries", filter: `session_id=eq.${id}` }]}
      />
      <SessionDetail
        session={session}
        entries={entries ?? []}
        entryCharacters={entryCharacters ?? []}
        userCharacters={userCharacters ?? []}
        tags={tags}
        allTags={allTags ?? []}
        userId={user.id}
        isCreator={session.created_by === user.id}
        xpHistory={sessionXpHistory ?? []}
        entryCharacterMap={Object.fromEntries((entryCharacters ?? []).map((c) => [c.id, c]))}
        participants={participantChars ?? []}
        externalParticipants={session.external_participants}
        allActiveCharacters={allActiveChars ?? []}
      />
    </>
  );
}
