import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { EpicEquipmentView } from "@/components/epic-equipment/epic-equipment-view";
import { getHighestActiveClassLevel } from "@/lib/rules/multiclass";
import type { CharacterRow, CharacterClassRow, EpicItemRow } from "@/lib/supabase/types";

interface EpicPageProps {
  params: Promise<{ id: string }>;
}

export default async function EpicEquipmentPage({ params }: EpicPageProps) {
  const { id } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  // One wave: the share and the epic items are cheap to load even when the
  // owner check below makes one of them unnecessary.
  const [{ data: character }, { data: characterClasses }, { data: share }, { data: epicItems }] =
    await Promise.all([
      supabase
        .from("characters")
        .select(
          "id, name, avatar_url, user_id, level, con, con_health, con_fitness, hp_max, hp_current, gold_pp, gold_gp, gold_ep, gold_sp, gold_cp"
        )
        .eq("id", id)
        .maybeSingle<
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
            | "gold_pp"
            | "gold_gp"
            | "gold_ep"
            | "gold_sp"
            | "gold_cp"
          >
        >(),
      supabase
        .from("character_classes")
        .select("*")
        .eq("character_id", id)
        .returns<CharacterClassRow[]>(),
      supabase
        .from("character_shares")
        .select("id")
        .eq("character_id", id)
        .eq("shared_with_user_id", user.id)
        .maybeSingle(),
      supabase.from("epic_items").select("*").eq("character_id", id).returns<EpicItemRow[]>(),
    ]);

  if (!character) {
    notFound();
  }

  const isOwner = character.user_id === user.id;

  // Allow shared users to view epic items (read-only)
  if (!isOwner && !share) {
    redirect(`/characters/${id}`);
  }

  // Use highest class level for multiclass characters
  const highestLevel = getHighestActiveClassLevel(characterClasses ?? [], character.level);

  return (
    <EpicEquipmentView
      character={{ ...character, level: highestLevel }}
      characterClasses={characterClasses ?? []}
      epicItems={epicItems ?? []}
      isOwner={isOwner}
    />
  );
}
