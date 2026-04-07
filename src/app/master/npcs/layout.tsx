import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/supabase/auth";
import { checkGmSession } from "../actions";
import { ArrowLeft, Shield } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function NpcLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  const isGm = await checkGmSession();

  if (!isGm) {
    redirect("/master");
  }

  const t = await getTranslations("master");

  return (
    <div className="flex min-h-screen flex-col">
      {/* NPC Top Bar */}
      <header
        className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-lg"
        data-testid="npc-layout-header"
      >
        <Link
          href="/master"
          className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          data-testid="npc-back-to-master"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToDashboard")}
        </Link>
        <div className="flex items-center gap-1.5 rounded-md bg-amber-600/10 px-2.5 py-1">
          <Shield className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400">{t("npcManagement")}</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
