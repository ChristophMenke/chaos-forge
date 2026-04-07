import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { GlassCard } from "@/components/glass-card";
import { PenLine, FileUp } from "lucide-react";

export default async function NewNpcPage() {
  const t = await getTranslations("characters");

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-6 p-6"
      data-testid="new-npc-page"
    >
      <h1 className="font-heading text-2xl text-primary sm:text-3xl">{t("newCharacter")}</h1>
      <p className="text-center text-muted-foreground">{t("newCharacterChoice")}</p>

      <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
        <Link href="/master/npcs/new/wizard" data-testid="create-npc-manually-link">
          <GlassCard glow="neutral" className="flex flex-col items-center gap-3 p-6 text-center">
            <PenLine className="h-10 w-10 text-primary" />
            <h2 className="font-heading text-lg">{t("createManually")}</h2>
            <p className="text-sm text-muted-foreground">{t("createManuallyDesc")}</p>
          </GlassCard>
        </Link>

        <Link href="/master/npcs/import" data-testid="import-npc-link">
          <GlassCard glow="neutral" className="flex flex-col items-center gap-3 p-6 text-center">
            <FileUp className="h-10 w-10 text-primary" />
            <h2 className="font-heading text-lg">{t("importCharacter")}</h2>
            <p className="text-sm text-muted-foreground">{t("importCharacterDesc")}</p>
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
