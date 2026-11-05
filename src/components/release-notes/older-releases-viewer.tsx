"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronLeft, ChevronRight, XIcon } from "lucide-react";
import { useSwipe } from "@/components/gallery/use-swipe";
import type { Release } from "@/lib/release-notes";
import { cn } from "@/lib/utils";
import { ReleaseNotesList } from "./release-notes-list";

interface OlderReleasesViewerProps {
  /** Newest first; the first one is shown first. */
  releases: Release[];
  onClose: () => void;
}

/**
 * Settings → "What's new" → older releases: one card per release, paged by
 * swipe, ← → , ‹ › or the dots (no wrap-around). Esc / ✕ closes.
 * Rendered through a portal because glass cards create a containing block for
 * `fixed` (see src/test/modal-portal-guard.test.ts).
 */
export function OlderReleasesViewer({ releases, onClose }: OlderReleasesViewerProps) {
  const t = useTranslations("releaseNotes");
  const [index, setIndex] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const hasPrevious = index > 0;
  const hasNext = index < releases.length - 1;
  const last = releases.length - 1;

  const goTo = useCallback(
    (target: number) => setIndex(Math.min(Math.max(target, 0), last)),
    [last]
  );
  const previous = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, last)), [last]);
  const swipe = useSwipe({ onNext: next, onPrevious: previous });

  // A long release day scrolls inside its card: a new card starts at the top,
  // and a fade with ⌄ shows that there is more below.
  const [moreBelow, setMoreBelow] = useState(false);
  const updateMoreBelow = useCallback(() => {
    const el = cardRef.current;
    setMoreBelow(!!el && el.scrollHeight - el.scrollTop - el.clientHeight > 8);
  }, []);
  useEffect(() => {
    cardRef.current?.scrollTo?.({ top: 0 });
    // Measure after the new card has been laid out.
    const frame = requestAnimationFrame(updateMoreBelow);
    return () => cancelAnimationFrame(frame);
  }, [index, updateMoreBelow]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
      else if (e.key === "ArrowLeft") previous();
      else if (e.key === "ArrowRight") next();
      else return;
      e.preventDefault();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [previous, next]);

  // Focus ✕ while open, lock page scrolling, give both back on close.
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

  const release = releases[index];
  if (!release) return null;
  const navButton =
    "rounded-full border border-muted-foreground/50 bg-background/80 p-2 text-foreground transition-colors hover:border-primary hover:text-primary";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="older-releases-title"
      data-testid="older-releases"
      onTouchStart={swipe.onTouchStart}
      onTouchEnd={swipe.onTouchEnd}
    >
      <div className="flex max-h-full w-full max-w-lg flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 id="older-releases-title" className="font-heading text-lg text-primary">
            {t("olderTitle")}
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className={navButton}
            aria-label={t("close")}
            data-testid="older-releases-close"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="relative">
          <div
            ref={cardRef}
            onScroll={updateMoreBelow}
            className="glass glow-neutral max-h-[65dvh] overflow-y-auto rounded-xl p-5"
            aria-live="polite"
            data-testid="older-releases-card"
          >
            <ReleaseNotesList releases={[release]} />
          </div>
          {moreBelow && (
            <div
              className="pointer-events-none absolute inset-x-px bottom-px flex h-14 items-end justify-center rounded-b-xl bg-gradient-to-t from-background via-background/80 to-transparent pb-2"
              aria-hidden="true"
              data-testid="older-releases-more"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/60 bg-background">
                <ChevronDown className="h-4 w-4 text-primary" />
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {hasPrevious ? (
            <button
              onClick={previous}
              className={navButton}
              aria-label={t("previous")}
              data-testid="older-releases-previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <span className="h-[38px] w-[38px]" />
          )}

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center">
              {releases.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => goTo(i)}
                  className="flex h-8 w-6 items-center justify-center"
                  aria-label={t("cardPosition", { index: i + 1, total: releases.length })}
                  aria-current={i === index ? "true" : undefined}
                  data-testid="older-releases-dot"
                >
                  <span
                    className={cn(
                      "block h-2 rounded-full transition-all",
                      i === index ? "w-4 bg-primary" : "w-2 bg-muted-foreground/60"
                    )}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {t("cardPosition", { index: index + 1, total: releases.length })}
            </span>
          </div>

          {hasNext ? (
            <button
              onClick={next}
              className={navButton}
              aria-label={t("next")}
              data-testid="older-releases-next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <span className="h-[38px] w-[38px]" />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
