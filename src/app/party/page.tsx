import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { PartyPageClient } from "@/components/party/party-page-client";
import type {
  PartyLootGoldRow,
  PartyLootItemWithDetails,
  PartyLootLogRow,
  GeneralItemRow,
  WeaponRow,
  ArmorRow,
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
    { data: generalItems },
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
    supabase.from("general_items").select("*").order("name").returns<GeneralItemRow[]>(),
  ]);

  // Fetch weapons and armor for loot search
  const [{ data: weapons }, { data: armor }] = await Promise.all([
    supabase.from("weapons").select("*").order("name").returns<WeaponRow[]>(),
    supabase.from("armor").select("*").order("name").returns<ArmorRow[]>(),
  ]);

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
      <h1 className="font-heading text-3xl text-primary">{t("title")}</h1>

      <PartyPageClient
        gold={gold}
        items={items ?? []}
        log={log ?? []}
        characters={characters ?? []}
        userMap={userMap}
        characterMap={characterMap}
        userId={user.id}
        allGeneralItems={generalItems ?? []}
        allWeapons={weapons ?? []}
        allArmor={armor ?? []}
      />
    </div>
  );
}
