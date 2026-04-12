import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { PartyPageClient } from "@/components/party/party-page-client";
import { TutorialOverlay } from "@/components/tutorial/tutorial-overlay";
import { collectOwnedItems } from "@/lib/party-loot/owned-items";
import type {
  PartyLootGoldRow,
  PartyLootItemWithDetails,
  PartyLootLogRow,
  CharacterRow,
  CharacterInventoryWithDetails,
  CharacterEquipmentWithDetails,
} from "@/lib/supabase/types";

interface CharacterOption {
  id: string;
  name: string;
  user_id: string;
}

interface ProfileOption {
  id: string;
  display_name: string;
}

export default async function PartyPage() {
  const user = await requireAuth();
  const t = await getTranslations("party");
  const supabase = await createClient();

  const [
    { data: goldRows },
    { data: items },
    { data: log },
    { data: characters },
    { data: profiles },
    { data: ownCharacters },
  ] = await Promise.all([
    supabase.from("party_loot_gold").select("*").limit(1).returns<PartyLootGoldRow[]>(),
    supabase
      .from("party_loot_items")
      .select("*, item:general_items(*)")
      .order("created_at", { ascending: false })
      .returns<PartyLootItemWithDetails[]>(),
    supabase
      .from("party_loot_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<PartyLootLogRow[]>(),
    supabase
      .from("characters")
      .select("id, name, user_id")
      .eq("is_active", true)
      .order("name")
      .returns<CharacterOption[]>(),
    supabase.from("profiles").select("id, display_name").returns<ProfileOption[]>(),
    supabase
      .from("characters")
      .select("id, name, avatar_url, gold_pp, gold_gp, gold_ep, gold_sp, gold_cp")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("name")
      .returns<
        Pick<
          CharacterRow,
          "id" | "name" | "avatar_url" | "gold_pp" | "gold_gp" | "gold_ep" | "gold_sp" | "gold_cp"
        >[]
      >(),
  ]);

  const ownCharacterIds = (ownCharacters ?? []).map((c) => c.id);

  const [{ data: inventory }, { data: equipment }] =
    ownCharacterIds.length > 0
      ? await Promise.all([
          supabase
            .from("character_inventory")
            .select("*, item:general_items(*)")
            .in("character_id", ownCharacterIds)
            .returns<CharacterInventoryWithDetails[]>(),
          supabase
            .from("character_equipment")
            .select("*, weapon:weapons(*), armor:armor(*)")
            .in("character_id", ownCharacterIds)
            .returns<CharacterEquipmentWithDetails[]>(),
        ])
      : [
          { data: [] as CharacterInventoryWithDetails[] },
          { data: [] as CharacterEquipmentWithDetails[] },
        ];

  const ownedItemGroups = collectOwnedItems({
    characters: ownCharacters ?? [],
    inventory: inventory ?? [],
    equipment: equipment ?? [],
  });

  const userMap: Record<string, string> = {};
  for (const p of profiles ?? []) {
    userMap[p.id] = p.display_name;
  }

  const characterMap: Record<string, string> = {};
  for (const c of characters ?? []) {
    characterMap[c.id] = c.name;
  }

  const gold = goldRows?.[0] ?? {
    id: "",
    pp: 0,
    gp: 0,
    ep: 0,
    sp: 0,
    cp: 0,
    updated_at: "",
    updated_by: null,
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6" data-testid="party-page">
      <TutorialOverlay page="party" />
      <h1 className="font-heading text-3xl text-primary">{t("title")}</h1>

      <PartyPageClient
        gold={gold}
        items={items ?? []}
        log={log ?? []}
        characters={characters ?? []}
        userMap={userMap}
        characterMap={characterMap}
        userId={user.id}
        ownedItemGroups={ownedItemGroups}
        ownCharacters={ownCharacters ?? []}
      />
    </div>
  );
}
