import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { getTranslations, getLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { CharacterCard } from "@/components/character-card";
import type { CharacterRow, CharacterClassRow, CharacterShareRow } from "@/lib/supabase/types";

export default async function CharactersPage() {
  const t = await getTranslations("characters");
  const ts = await getTranslations("sharing");
  const tp = await getTranslations("playMode");
  const locale = await getLocale();
  const user = await requireAuth();
  const supabase = await createClient();
  const [{ data: characters }, { data: allCharClasses }, { data: myShares }, { data: latestXp }] =
    await Promise.all([
      supabase
        .from("characters")
        .select("*")
        .order("updated_at", { ascending: false })
        .returns<CharacterRow[]>(),
      supabase.from("character_classes").select("*").returns<CharacterClassRow[]>(),
      supabase
        .from("character_shares")
        .select("*")
        .eq("shared_with_user_id", user.id)
        .returns<CharacterShareRow[]>(),
      supabase
        .from("xp_history")
        .select("character_id, created_at")
        .order("created_at", { ascending: false })
        .limit(500)
        .returns<{ character_id: string; created_at: string }[]>(),
    ]);

  const sharedCharacterIds = new Set((myShares ?? []).map((s) => s.character_id));

  // Build map: character_id → latest XP timestamp (first occurrence = most recent)
  const lastXpMap = new Map<string, string>();
  for (const xp of latestXp ?? []) {
    if (!lastXpMap.has(xp.character_id)) {
      lastXpMap.set(xp.character_id, xp.created_at);
    }
  }

  const charClassMap = new Map<string, CharacterClassRow[]>();
  for (const cc of allCharClasses ?? []) {
    const existing = charClassMap.get(cc.character_id) ?? [];
    existing.push(cc);
    charClassMap.set(cc.character_id, existing);
  }

  const allChars = characters ?? [];

  // Split into groups and sort
  const ownActive = allChars
    .filter((c) => c.user_id === user.id && c.is_active === true)
    .sort((a, b) => {
      const aXp = lastXpMap.get(a.id) ?? "";
      const bXp = lastXpMap.get(b.id) ?? "";
      return bXp.localeCompare(aXp); // most recent XP first
    });
  const ownInactive = allChars.filter((c) => c.user_id === user.id && c.is_active === false);
  const sharedWithMe = allChars.filter(
    (c) => c.user_id !== user.id && sharedCharacterIds.has(c.id)
  );
  const publicChars = allChars.filter(
    (c) => c.user_id !== user.id && !sharedCharacterIds.has(c.id) && c.is_public
  );

  const hasOtherCharacters =
    ownInactive.length > 0 || sharedWithMe.length > 0 || publicChars.length > 0;

  function renderCard(character: CharacterRow) {
    const classes = charClassMap.get(character.id) ?? [];
    const isOwner = character.user_id === user.id;
    const isSharedWithMe = sharedCharacterIds.has(character.id);

    return (
      <CharacterCard
        key={character.id}
        character={character}
        classes={classes}
        isOwner={isOwner}
        isSharedWithMe={isSharedWithMe}
        sharedByLabel={
          !isOwner ? ts("sharedBy", { player: character.player_name || "?" }) : undefined
        }
        badgePrivateLabel={ts("badgePrivate")}
        badgeSharedLabel={ts("badgeShared")}
        badgePublicLabel={ts("badgePublic")}
        unconsciousLabel={tp("unconscious")}
        deadLabel={tp("dead")}
        locale={locale}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6" data-testid="characters-page">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-primary sm:text-3xl">{t("title")}</h1>
        <Link href="/characters/new">
          <Button data-testid="create-character-button">{t("newCharacter")}</Button>
        </Link>
      </div>

      {ownActive.length === 0 &&
      ownInactive.length === 0 &&
      sharedWithMe.length === 0 &&
      publicChars.length === 0 ? (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-4 text-center"
          data-testid="no-characters"
        >
          <p className="text-lg text-muted-foreground">{t("noCharacters")}</p>
          <Link href="/characters/new">
            <Button size="lg">{t("createFirst")}</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Own Active Characters */}
          {ownActive.length > 0 && (
            <div
              className="stagger-reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              data-testid="active-characters-grid"
            >
              {ownActive.map(renderCard)}
            </div>
          )}

          {ownActive.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("noCharacters")}</p>
          )}

          {/* Other Characters (inactive + shared) */}
          {/* Shared with me */}
          {sharedWithMe.length > 0 && (
            <div className="mt-4">
              <h2 className="mb-2 font-heading text-lg text-muted-foreground">
                {t("sharedCharacters")} ({sharedWithMe.length})
              </h2>
              <div
                className="stagger-reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                data-testid="shared-characters-grid"
              >
                {sharedWithMe.map(renderCard)}
              </div>
            </div>
          )}

          {/* Public characters */}
          {publicChars.length > 0 && (
            <div className="mt-4">
              <h2 className="mb-2 font-heading text-lg text-muted-foreground">
                {t("publicCharacters")} ({publicChars.length})
              </h2>
              <div
                className="stagger-reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                data-testid="public-characters-grid"
              >
                {publicChars.map(renderCard)}
              </div>
            </div>
          )}

          {/* Own Inactive (collapsed) */}
          {ownInactive.length > 0 && (
            <details className="mt-4" data-testid="other-characters-section">
              <summary className="cursor-pointer font-heading text-lg text-muted-foreground hover:text-foreground">
                {t("inactiveCharacters")} ({ownInactive.length})
              </summary>
              <div
                className="stagger-reveal mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                data-testid="inactive-characters-grid"
              >
                {ownInactive.map(renderCard)}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
