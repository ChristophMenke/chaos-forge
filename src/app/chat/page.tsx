import { RulebookChat } from "@/components/rulebook-chat/rulebook-chat";
import { requireAuth } from "@/lib/supabase/auth";

export default async function RulebookPage() {
  // Deduplicated with the layout's check (React cache).
  const user = await requireAuth();
  return <RulebookChat scope="player" userId={user.id} />;
}
