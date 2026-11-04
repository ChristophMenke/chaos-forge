"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Maximize, Minimize, XIcon } from "lucide-react";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchContentRef,
} from "react-zoom-pan-pinch";
import { galleryPublicUrl } from "@/lib/gallery/paths";
import type { GalleryImageRow } from "@/lib/supabase/types";
import { useCompactLandscape } from "./use-compact-landscape";
import { useSwipe } from "./use-swipe";

interface GalleryLightboxProps {
  images: GalleryImageRow[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const MAX_ZOOM = 5;
/** How long the controls stay after a tap in image-only mode. */
const CONTROLS_MS = 3000;
/** Anything above this counts as zoomed in: drags pan instead of paging. */
const ZOOMED = 1.01;

/**
 * Fullscreen view of the gallery.
 * - Paging: ← → / swipe / ‹ › (no wrap-around). Close: Esc / ✕.
 * - Zoom: pinch, double tap, mouse wheel, + / − / 0. Zoomed in, a drag pans.
 * - Image only: ⛶ or F, and automatically when a phone is held sideways.
 *   A tap shows the controls for a moment; Esc leaves image-only first.
 * Rendered through a portal because glass cards create a containing block for
 * `fixed` (see src/test/modal-portal-guard.test.ts).
 */
export function GalleryLightbox({ images, index, onIndexChange, onClose }: GalleryLightboxProps) {
  const t = useTranslations("gallery");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const zoomRef = useRef<ReactZoomPanPinchContentRef>(null);
  const compactLandscape = useCompactLandscape();
  const [imageOnly, setImageOnly] = useState(false);
  const [controlsShown, setControlsShown] = useState(false);
  const [scale, setScale] = useState(1);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const image = images[index];
  const hasPrevious = index > 0;
  const hasNext = index < images.length - 1;
  const immersive = imageOnly || compactLandscape;
  const controlsVisible = !immersive || controlsShown;
  const zoomed = scale > ZOOMED;

  // Latest values for the document listener, without re-subscribing per render.
  const navRef = useRef({ index, hasPrevious, hasNext, imageOnly, onIndexChange, onClose });
  useEffect(() => {
    navRef.current = { index, hasPrevious, hasNext, imageOnly, onIndexChange, onClose };
  });

  const goTo = useCallback((target: number) => {
    setScale(1); // the zoom of the next image starts fresh (TransformWrapper is keyed)
    navRef.current.onIndexChange(target);
  }, []);
  const previous = useCallback(() => {
    const nav = navRef.current;
    if (nav.hasPrevious) goTo(nav.index - 1);
  }, [goTo]);
  const next = useCallback(() => {
    const nav = navRef.current;
    if (nav.hasNext) goTo(nav.index + 1);
  }, [goTo]);

  const hideControlsLater = useCallback(() => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setControlsShown(false), CONTROLS_MS);
  }, []);
  const toggleControls = useCallback(() => {
    setControlsShown((shown) => {
      if (!shown) hideControlsLater();
      return !shown;
    });
  }, [hideControlsLater]);
  const toggleImageOnly = useCallback(() => {
    setImageOnly((on) => !on);
    setControlsShown(false);
  }, []);
  useEffect(
    () => () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    },
    []
  );

  const swipe = useSwipe({
    onNext: next,
    onPrevious: previous,
    onTap: immersive ? toggleControls : undefined,
    enabled: !zoomed,
  });

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const zoom = zoomRef.current;
      switch (e.key) {
        case "Escape":
          if (navRef.current.imageOnly) setImageOnly(false);
          else navRef.current.onClose();
          break;
        case "ArrowLeft":
          previous();
          break;
        case "ArrowRight":
          next();
          break;
        case "+":
        case "=":
          zoom?.zoomIn();
          break;
        case "-":
          zoom?.zoomOut();
          break;
        case "0":
          zoom?.resetTransform();
          break;
        case "f":
        case "F":
          toggleImageOnly();
          break;
        default:
          return;
      }
      e.preventDefault();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [previous, next, toggleImageOnly]);

  // Focus ✕ (or the dialog) while open, lock page scrolling, give both back on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (closeRef.current ?? dialogRef.current)?.focus();
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
  const roundButton = "rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70";
  const navButton = `absolute top-1/2 z-[101] -translate-y-1/2 ${roundButton}`;

  const caption = (
    <div
      className={
        immersive
          ? "absolute inset-x-0 bottom-0 z-[101] bg-gradient-to-t from-black/90 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 text-white"
          : "mx-auto w-full max-w-3xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-white"
      }
      data-testid="gallery-lightbox-caption"
    >
      <div className="mx-auto flex max-w-3xl items-baseline justify-between gap-4">
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
          className="mx-auto mt-1 max-h-32 max-w-3xl overflow-y-auto whitespace-pre-line text-sm text-white/80"
          data-testid="gallery-lightbox-description"
        >
          {image.description}
        </p>
      )}
    </div>
  );

  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex flex-col bg-black outline-none"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-testid="gallery-lightbox"
      data-immersive={immersive ? "true" : "false"}
      onTouchStart={swipe.onTouchStart}
      onTouchEnd={swipe.onTouchEnd}
    >
      {controlsVisible && (
        <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-[102] flex gap-2">
          {!compactLandscape && (
            <button
              onClick={toggleImageOnly}
              className={roundButton}
              aria-label={imageOnly ? t("exitImageOnly") : t("imageOnly")}
              aria-pressed={imageOnly}
              data-testid="gallery-lightbox-immersive"
            >
              {imageOnly ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
            </button>
          )}
          <button
            ref={closeRef}
            onClick={onClose}
            className={roundButton}
            aria-label={t("close")}
            data-testid="gallery-lightbox-close"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>
      )}

      <div className={`relative min-h-0 flex-1 ${immersive ? "" : "p-4 sm:px-16"}`}>
        <TransformWrapper
          key={image.id}
          ref={zoomRef}
          minScale={1}
          maxScale={MAX_ZOOM}
          centerOnInit
          doubleClick={{ mode: "toggle", step: 1 }}
          wheel={{ step: 0.2 }}
          pinch={{ step: 5 }}
          // At 1× a one-finger drag belongs to the swipe (paging), not to panning.
          panning={{ disabled: !zoomed, velocityDisabled: true }}
          onTransform={(_ref, state) => setScale(state.scale)}
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={galleryPublicUrl(image.image_path)}
              alt={label}
              draggable={false}
              className={`max-h-full max-w-full select-none object-contain ${immersive ? "" : "rounded-lg"}`}
              data-testid="gallery-lightbox-img"
            />
          </TransformComponent>
        </TransformWrapper>

        {controlsVisible && hasPrevious && (
          <button
            onClick={previous}
            className={`${navButton} left-2 sm:left-4`}
            aria-label={t("previous")}
            data-testid="gallery-lightbox-previous"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}
        {controlsVisible && hasNext && (
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

      {controlsVisible && caption}
    </div>,
    document.body
  );
}
