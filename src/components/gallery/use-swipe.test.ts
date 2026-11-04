import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type React from "react";
import { useSwipe } from "./use-swipe";

function touch(x: number, y: number) {
  return { touches: [{ clientX: x, clientY: y }], changedTouches: [{ clientX: x, clientY: y }] };
}

function swipe(from: [number, number], to: [number, number]) {
  const onNext = vi.fn();
  const onPrevious = vi.fn();
  const { result } = renderHook(() => useSwipe({ onNext, onPrevious }));
  result.current.onTouchStart(touch(...from) as unknown as React.TouchEvent);
  result.current.onTouchEnd(touch(...to) as unknown as React.TouchEvent);
  return { onNext, onPrevious };
}

describe("useSwipe", () => {
  it("swiping left goes to the next image", () => {
    const { onNext, onPrevious } = swipe([300, 200], [200, 210]);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it("swiping right goes to the previous image", () => {
    const { onNext, onPrevious } = swipe([100, 200], [220, 190]);
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });

  it("ignores short movements", () => {
    const { onNext, onPrevious } = swipe([100, 200], [140, 200]);
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it("ignores mostly vertical movements", () => {
    const { onNext, onPrevious } = swipe([100, 100], [170, 300]);
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrevious).not.toHaveBeenCalled();
  });
});
