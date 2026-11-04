import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Images } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import type { GalleryImageRow } from "@/lib/supabase/types";

/** Die Galerie des Chaos — scenes the GM uploads in /master, readable via RLS. */
export default async function GalleryPage() {
  await requireAuth();
  const t = await getTranslations("gallery");
  const supabase = await createClient();

  const { data } = await supabase
    .from("gallery_images")
    .select("*")
    .order("sort_order", { ascending: false })
    .returns<GalleryImageRow[]>();
  const images = data ?? [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6" data-testid="gallery-page">
      <div>
        <h1 className="font-heading text-3xl text-primary">{t("title")}</h1>
        {images.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subtitle", { count: images.length })}
          </p>
        )}
      </div>

      {images.length === 0 ? (
        <GlassCard hover={false} className="flex flex-col items-center gap-3 p-8 text-center">
          <Images className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground" data-testid="gallery-empty">
            {t("empty")}
          </p>
        </GlassCard>
      ) : (
        <GalleryGrid images={images} />
      )}
    </div>
  );
}
