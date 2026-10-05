import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { UndoProvider } from "@/components/undo/undo-provider";

/**
 * Keeps one undo history per character while switching between manage,
 * play and epic (the layout stays mounted); only the owner gets one.
 */
export default async function CharacterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();
  const supabase = await createClient();
  const { data } = await supabase.from("characters").select("user_id").eq("id", id).maybeSingle();

  if (data?.user_id !== user.id) return children;
  return <UndoProvider key={id}>{children}</UndoProvider>;
}
