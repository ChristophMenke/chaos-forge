"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { galleryPublicUrl } from "@/lib/gallery/paths";
import type { GalleryImageRow } from "@/lib/supabase/types";
import { GalleryLightbox } from "./gallery-lightbox";

/** Thumbnail grid of the player gallery; a tap opens the fullscreen view. */
export function GalleryGrid({ images }: { images: GalleryImageRow[] }) {
  const t = useTranslations("gallery");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <ul
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        data-testid="gallery-grid"
      >
        {images.map((image, index) => {
          const label = image.title ?? t("sceneLabel", { index: index + 1, total: images.length });
          return (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                className="group block w-full overflow-hidden rounded-lg border border-border/50 bg-black/30 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={t("open", { name: label })}
                data-testid="gallery-tile"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={galleryPublicUrl(image.thumb_path)}
                  alt={label}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover transition-opacity group-hover:opacity-90"
                />
                {image.title && (
                  <span className="block truncate px-2 py-1.5 font-heading text-sm text-foreground">
                    {image.title}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {openIndex !== null && (
        <GalleryLightbox
          images={images}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
