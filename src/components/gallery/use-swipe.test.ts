import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type React from "react";
import { useSwipe } from "./use-swipe";

afterEach(() => vi.useRealTimers());

type Point = [number, number];

function touchEvent(points: Point[]) {
  const list = points.map(([x, y]) => ({ clientX: x, clientY: y }));
  return { touches: list, changedTouches: list } as unknown as React.TouchEvent;
}

function setup(enabled = true) {
  const onNext = vi.fn();
  const onPrevious = vi.fn();
  const onTap = vi.fn();
  const { result } = renderHook(() => useSwipe({ onNext, onPrevious, onTap, enabled }));
  return { result, onNext, onPrevious, onTap };
}

function swipe(from: Point, to: Point, enabled = true) {
  const s = setup(enabled);
  s.result.current.onTouchStart(touchEvent([from]));
  s.result.current.onTouchEnd(touchEvent([to]));
  return s;
}

describe("useSwipe", () => {
  it("swiping left goes to the next image", () => {
    const { onNext, onPrevious, onTap } = swipe([300, 200], [200, 210]);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).not.toHaveBeenCalled();
    expect(onTap).not.toHaveBeenCalled();
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

  it("does not page while disabled (zoomed in)", () => {
    const { onNext, onPrevious } = swipe([300, 200], [100, 200], false);
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it("never pages after a two-finger pinch", () => {
    const { result, onNext, onPrevious } = setup();
    result.current.onTouchStart(touchEvent([[300, 200]]));
    result.current.onTouchStart(
      touchEvent([
        [300, 200],
        [100, 200],
      ])
    );
    result.current.onTouchEnd(touchEvent([[100, 200]]));
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it("reports a single short tap after the double-tap window", () => {
    vi.useFakeTimers();
    const { result, onTap } = setup();
    result.current.onTouchStart(touchEvent([[150, 150]]));
    result.current.onTouchEnd(touchEvent([[152, 151]]));
    expect(onTap).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it("swallows a double tap (that one zooms)", () => {
    vi.useFakeTimers();
    const { result, onTap } = setup();
    for (let i = 0; i < 2; i++) {
      result.current.onTouchStart(touchEvent([[150, 150]]));
      result.current.onTouchEnd(touchEvent([[150, 150]]));
      vi.advanceTimersByTime(100);
    }
    vi.advanceTimersByTime(300);
    expect(onTap).not.toHaveBeenCalled();
  });
});
