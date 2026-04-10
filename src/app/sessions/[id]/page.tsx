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

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single<SessionRow>();

  if (!session) {
    notFound();
  }

  const { data: entries } = await supabase
    .from("session_entries")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: true })
    .returns<SessionEntryRow[]>();

  // Fetch characters for entries + user's own characters
  const characterIds = [...new Set(entries?.map((e) => e.character_id) ?? [])];
  const { data: entryCharacters } = await supabase
    .from("characters")
    .select("id, name, avatar_url, race_id, class_id")
    .in("id", characterIds.length > 0 ? characterIds : ["none"])
    .returns<Pick<CharacterRow, "id" | "name" | "avatar_url" | "race_id" | "class_id">[]>();

  const { data: userCharacters } = await supabase
    .from("characters")
    .select("id, name, avatar_url")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .returns<Pick<CharacterRow, "id" | "name" | "avatar_url">[]>();

  // Fetch tags
  const { data: sessionTags } = await supabase
    .from("session_tags")
    .select("tag_id, tags(*)")
    .eq("session_id", id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tags: TagRow[] = sessionTags?.map((st: any) => st.tags as TagRow).filter(Boolean) ?? [];

  // Fetch all tags for autocomplete
  const { data: allTags } = await supabase
    .from("tags")
    .select("*")
    .order("name")
    .returns<TagRow[]>();

  // Fetch XP history for this session
  const { data: sessionXpHistory } = await supabase
    .from("xp_history")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: false })
    .returns<XpHistoryRow[]>();

  // Fetch session participants
  const { data: participantRows } = await supabase
    .from("session_participants")
    .select("*")
    .eq("session_id", id)
    .returns<SessionParticipantRow[]>();

  const participantCharIds = (participantRows ?? []).map((p) => p.character_id);
  const { data: participantChars } =
    participantCharIds.length > 0
      ? await supabase
          .from("characters")
          .select("id, name, avatar_url, race_id, class_id")
          .in("id", participantCharIds)
          .returns<Pick<CharacterRow, "id" | "name" | "avatar_url" | "race_id" | "class_id">[]>()
      : { data: [] as Pick<CharacterRow, "id" | "name" | "avatar_url" | "race_id" | "class_id">[] };

  // Fetch all active non-NPC characters for the participant picker
  const { data: allActiveChars } = await supabase
    .from("characters")
    .select("id, name, avatar_url, race_id, class_id")
    .eq("is_active", true)
    .neq("is_npc", true)
    .order("name")
    .returns<Pick<CharacterRow, "id" | "name" | "avatar_url" | "race_id" | "class_id">[]>();

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
