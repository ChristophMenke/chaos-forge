import { useCallback, useEffect, useRef } from "react";
import type React from "react";

const MIN_DISTANCE = 50;
/** A finger that moved less than this is a tap, not a swipe. */
const TAP_SLOP = 10;
/** Two taps within this window are a double tap (zoom), not two single taps. */
const DOUBLE_TAP_MS = 250;

interface SwipeOptions {
  onNext: () => void;
  onPrevious: () => void;
  /** Single tap, reported once the double-tap window has passed. */
  onTap?: () => void;
  /** Paging off, e.g. while zoomed in — then a drag pans the image. */
  enabled?: boolean;
}

/**
 * Touch gestures of the fullscreen gallery: horizontal swipe = next/previous,
 * single tap = onTap. Pinches (two fingers) and double taps are left to the
 * zoom library.
 */
export function useSwipe({ onNext, onPrevious, onTap, enabled = true }: SwipeOptions) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const multiTouch = useRef(false);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (tapTimer.current) clearTimeout(tapTimer.current);
    },
    []
  );

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 1) {
      multiTouch.current = true;
      return;
    }
    multiTouch.current = false;
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      // Wait until the last finger is lifted after a pinch.
      if (multiTouch.current) {
        if (e.touches.length === 0) start.current = null;
        return;
      }
      if (!start.current) return;
      const dx = e.changedTouches[0].clientX - start.current.x;
      const dy = e.changedTouches[0].clientY - start.current.y;
      start.current = null;

      if (Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) {
        if (tapTimer.current) {
          // Second tap: a double tap, handled by the zoom.
          clearTimeout(tapTimer.current);
          tapTimer.current = null;
          return;
        }
        tapTimer.current = setTimeout(() => {
          tapTimer.current = null;
          onTap?.();
        }, DOUBLE_TAP_MS);
        return;
      }

      if (!enabled || Math.abs(dx) < MIN_DISTANCE || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0) onNext();
      else onPrevious();
    },
    [enabled, onNext, onPrevious, onTap]
  );

  return { onTouchStart, onTouchEnd };
}
