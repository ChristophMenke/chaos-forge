import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await requireAuth();
  const t = await getTranslations("settings");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div
      className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-10"
      data-testid="settings-page"
    >
      <h1 className="font-heading mb-6 text-3xl text-primary sm:text-4xl">{t("title")}</h1>

      <SettingsClient
        userId={user.id}
        email={profile.email ?? user.email ?? ""}
        initialDisplayName={profile.display_name}
        initialAvatarUrl={profile.avatar_url}
      />
    </div>
  );
}
