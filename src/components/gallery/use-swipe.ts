import { useCallback, useRef } from "react";
import type React from "react";

const MIN_DISTANCE = 50;

/** Horizontal swipe on touch screens: left = next, right = previous. */
export function useSwipe({ onNext, onPrevious }: { onNext: () => void; onPrevious: () => void }) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!start.current) return;
      const dx = e.changedTouches[0].clientX - start.current.x;
      const dy = e.changedTouches[0].clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0) onNext();
      else onPrevious();
    },
    [onNext, onPrevious]
  );

  return { onTouchStart, onTouchEnd };
}
