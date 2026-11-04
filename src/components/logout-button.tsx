"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "@/lib/supabase/sign-out";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const t = useTranslations("nav");

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="logout-button">
      {t("logout")}
    </Button>
  );
}
