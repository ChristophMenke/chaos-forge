import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { PenLine, Sparkles, Swords } from "lucide-react";
import type { CharacterRow } from "@/lib/supabase/types";

interface CharacterPageProps {
  params: Promise<{ id: string }>;
}

export default async function CharacterPage({ params }: CharacterPageProps) {
  const { id } = await params;
  const user = await requireAuth();
  const supabase = await createClient();
  const t = await getTranslations("characters");

  const { data: character } = await supabase
    .from("characters")
    .select("id, name, avatar_url, user_id")
    .eq("id", id)
    .single<Pick<CharacterRow, "id" | "name" | "avatar_url" | "user_id">>();

  if (!character) {
    notFound();
  }

  // Non-owners skip the choice page and go directly to the character sheet
  if (character.user_id !== user.id) {
    redirect(`/characters/${id}/manage`);
  }

  // Check if character has epic items
  const { count: epicItemCount } = await supabase
    .from("epic_items")
    .select("id", { count: "exact", head: true })
    .eq("character_id", id);

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-6 p-6"
      data-testid="character-choice-page"
    >
      {/* Character avatar + name */}
      <div className="flex flex-col items-center gap-3">
        {character.avatar_url ? (
          <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-primary/30">
            <Image
              src={character.avatar_url}
              alt={character.name}
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/30 bg-muted font-heading text-2xl">
            {character.name.charAt(0)}
          </div>
        )}
        <h1 className="font-heading text-2xl text-primary sm:text-3xl">{character.name}</h1>
        <p className="text-center text-muted-foreground">{t("characterChoice")}</p>
      </div>

      <div className="flex w-full max-w-lg flex-col gap-4 sm:flex-row">
        <Link
          href={`/characters/${id}/manage`}
          className="glass glass-hover glow-neutral flex-1 rounded-xl p-6"
          data-testid="character-manage-link"
        >
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <PenLine className="h-10 w-10 text-primary" />
            <h2 className="font-heading text-lg">{t("manageCharacter")}</h2>
            <p className="text-sm text-muted-foreground">{t("manageCharacterDesc")}</p>
          </div>
        </Link>

        <Link
          href={`/characters/${id}/play`}
          className="glass glass-hover glow-neutral flex-1 rounded-xl p-6"
          data-testid="character-play-link"
        >
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Swords className="h-10 w-10 text-primary" />
            <h2 className="font-heading text-lg">{t("playCharacter")}</h2>
            <p className="text-sm text-muted-foreground">{t("playCharacterDesc")}</p>
          </div>
        </Link>
      </div>

      {(epicItemCount ?? 0) > 0 && (
        <div className="flex w-full max-w-lg flex-col">
          <Link
            href={`/characters/${id}/epic`}
            className="glass glass-hover glow-neutral rounded-xl p-6"
            data-testid="character-epic-link"
          >
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Sparkles className="h-10 w-10 text-primary" />
              <h2 className="font-heading text-lg">{t("epicEquipment")}</h2>
              <p className="text-sm text-muted-foreground">{t("epicEquipmentDesc")}</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
