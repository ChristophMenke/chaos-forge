import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { EpicEquipmentView } from "@/components/epic-equipment/epic-equipment-view";
import type { CharacterRow, EpicItemRow } from "@/lib/supabase/types";

interface EpicPageProps {
  params: Promise<{ id: string }>;
}

export default async function EpicEquipmentPage({ params }: EpicPageProps) {
  const { id } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: character } = await supabase
    .from("characters")
    .select("id, name, avatar_url, user_id")
    .eq("id", id)
    .single<Pick<CharacterRow, "id" | "name" | "avatar_url" | "user_id">>();

  if (!character) {
    notFound();
  }

  const isOwner = character.user_id === user.id;

  if (!isOwner) {
    redirect(`/characters/${id}`);
  }

  const { data: epicItems } = await supabase
    .from("epic_items")
    .select("*")
    .eq("character_id", id)
    .returns<EpicItemRow[]>();

  return <EpicEquipmentView character={character} epicItems={epicItems ?? []} isOwner={isOwner} />;
}
