"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, XIcon } from "lucide-react";
import { galleryPublicUrl } from "@/lib/gallery/paths";
import type { GalleryImageRow } from "@/lib/supabase/types";
import { useSwipe } from "./use-swipe";

interface GalleryLightboxProps {
  images: GalleryImageRow[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/**
 * Fullscreen view of the gallery: ← → / swipe / ‹ › to page (no wrap-around),
 * Esc / ✕ to close. Rendered through a portal because glass cards create a
 * containing block for `fixed` (see src/test/modal-portal-guard.test.ts).
 */
export function GalleryLightbox({ images, index, onIndexChange, onClose }: GalleryLightboxProps) {
  const t = useTranslations("gallery");
  const closeRef = useRef<HTMLButtonElement>(null);
  const image = images[index];
  const hasPrevious = index > 0;
  const hasNext = index < images.length - 1;

  // Latest values for the document listener, without re-subscribing per index.
  const navRef = useRef({ index, hasPrevious, hasNext, onIndexChange, onClose });
  useEffect(() => {
    navRef.current = { index, hasPrevious, hasNext, onIndexChange, onClose };
  });

  const previous = useCallback(() => {
    const nav = navRef.current;
    if (nav.hasPrevious) nav.onIndexChange(nav.index - 1);
  }, []);
  const next = useCallback(() => {
    const nav = navRef.current;
    if (nav.hasNext) nav.onIndexChange(nav.index + 1);
  }, []);
  const swipe = useSwipe({ onNext: next, onPrevious: previous });

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") navRef.current.onClose();
      else if (e.key === "ArrowLeft") previous();
      else if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [previous, next]);

  // Focus ✕ while open, lock page scrolling, and give both back on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Preload the neighbours so paging feels instant.
  useEffect(() => {
    for (const neighbour of [images[index - 1], images[index + 1]]) {
      if (neighbour) new window.Image().src = galleryPublicUrl(neighbour.image_path);
    }
  }, [images, index]);

  if (!image) return null;
  const label = image.title ?? t("sceneLabel", { index: index + 1, total: images.length });
  const navButton =
    "absolute top-1/2 z-[101] -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-testid="gallery-lightbox"
      onTouchStart={swipe.onTouchStart}
      onTouchEnd={swipe.onTouchEnd}
    >
      <button
        ref={closeRef}
        onClick={onClose}
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-[101] rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
        aria-label={t("close")}
        data-testid="gallery-lightbox-close"
      >
        <XIcon className="h-6 w-6" />
      </button>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 sm:px-16">
        {hasPrevious && (
          <button
            onClick={previous}
            className={`${navButton} left-2 sm:left-4`}
            aria-label={t("previous")}
            data-testid="gallery-lightbox-previous"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={image.id}
          src={galleryPublicUrl(image.image_path)}
          alt={label}
          className="max-h-full max-w-full rounded-lg object-contain"
          data-testid="gallery-lightbox-img"
        />
        {hasNext && (
          <button
            onClick={next}
            className={`${navButton} right-2 sm:right-4`}
            aria-label={t("next")}
            data-testid="gallery-lightbox-next"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        )}
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-white">
        <div className="flex items-baseline justify-between gap-4">
          {image.title ? (
            <h2 className="font-heading text-lg font-semibold" data-testid="gallery-lightbox-title">
              {image.title}
            </h2>
          ) : (
            <span />
          )}
          <span className="shrink-0 text-sm text-white/70">
            {t("counter", { index: index + 1, total: images.length })}
          </span>
        </div>
        {image.description && (
          <p
            className="mt-1 max-h-32 overflow-y-auto whitespace-pre-line text-sm text-white/80"
            data-testid="gallery-lightbox-description"
          >
            {image.description}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
