import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { EpicEquipmentView } from "@/components/epic-equipment/epic-equipment-view";
import type { CharacterRow, CharacterClassRow, EpicItemRow } from "@/lib/supabase/types";

interface EpicPageProps {
  params: Promise<{ id: string }>;
}

export default async function EpicEquipmentPage({ params }: EpicPageProps) {
  const { id } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const [{ data: character }, { data: classesForLevel }, { data: characterClasses }] =
    await Promise.all([
      supabase
        .from("characters")
        .select(
          "id, name, avatar_url, user_id, level, con, con_health, con_fitness, hp_max, hp_current"
        )
        .eq("id", id)
        .single<
          Pick<
            CharacterRow,
            | "id"
            | "name"
            | "avatar_url"
            | "user_id"
            | "level"
            | "con"
            | "con_health"
            | "con_fitness"
            | "hp_max"
            | "hp_current"
          >
        >(),
      supabase
        .from("character_classes")
        .select("level")
        .eq("character_id", id)
        .eq("is_active", true),
      supabase
        .from("character_classes")
        .select("*")
        .eq("character_id", id)
        .returns<CharacterClassRow[]>(),
    ]);

  if (!character) {
    notFound();
  }

  const isOwner = character.user_id === user.id;

  // Allow shared users to view epic items (read-only)
  if (!isOwner) {
    const { data: share } = await supabase
      .from("character_shares")
      .select("id")
      .eq("character_id", id)
      .eq("shared_with_user_id", user.id)
      .maybeSingle();
    if (!share) {
      redirect(`/characters/${id}`);
    }
  }

  // Use highest class level for multiclass characters
  const highestLevel =
    classesForLevel && classesForLevel.length > 0
      ? Math.max(...classesForLevel.map((c) => c.level))
      : character.level;

  const { data: epicItems } = await supabase
    .from("epic_items")
    .select("*")
    .eq("character_id", id)
    .returns<EpicItemRow[]>();

  return (
    <EpicEquipmentView
      character={{ ...character, level: highestLevel }}
      characterClasses={characterClasses ?? []}
      epicItems={epicItems ?? []}
      isOwner={isOwner}
    />
  );
}
