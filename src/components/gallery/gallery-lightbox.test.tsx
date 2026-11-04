import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { useState } from "react";
import type { GalleryImageRow } from "@/lib/supabase/types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

// The zoom library needs real layout; the test only checks how the lightbox
// drives it (controls, scale callback, disabled panning at 1×).
const zoom = vi.hoisted(() => ({
  controls: { zoomIn: vi.fn(), zoomOut: vi.fn(), resetTransform: vi.fn() },
  props: {} as Record<string, unknown>,
  capture(props: Record<string, unknown>) {
    zoom.props = props;
  },
}));
vi.mock("react-zoom-pan-pinch", async () => {
  const React = await import("react");
  return {
    TransformWrapper: React.forwardRef<unknown, { children?: React.ReactNode }>(
      function TransformWrapper(props, ref) {
        zoom.capture(props as Record<string, unknown>);
        React.useImperativeHandle(ref, () => zoom.controls);
        return <>{props.children}</>;
      }
    ),
    TransformComponent: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="zoom-area">{children}</div>
    ),
  };
});

let compactLandscape = false;
vi.mock("./use-compact-landscape", () => ({ useCompactLandscape: () => compactLandscape }));

import { GalleryLightbox } from "./gallery-lightbox";

function image(id: string, extra: Partial<GalleryImageRow> = {}): GalleryImageRow {
  return {
    id,
    title: null,
    description: null,
    image_path: `${id}.webp`,
    thumb_path: `${id}-thumb.webp`,
    width: 100,
    height: 80,
    sort_order: 1,
    created_by: null,
    created_at: "",
    updated_at: "",
    ...extra,
  };
}

const IMAGES = [
  image("a", { title: "Burg Grauzahn", description: "Die Helden stürmen das Tor." }),
  image("b"),
  image("c", { title: "Der Drache" }),
];

function Harness({ start = 0, onClose = vi.fn() }: { start?: number; onClose?: () => void }) {
  const [index, setIndex] = useState(start);
  return (
    <GalleryLightbox images={IMAGES} index={index} onIndexChange={setIndex} onClose={onClose} />
  );
}

const img = () => screen.getByTestId("gallery-lightbox-img") as HTMLImageElement;
const key = (k: string) => fireEvent.keyDown(document, { key: k });
const captionShown = () => screen.queryByTestId("gallery-lightbox-caption") !== null;
const touch = (x: number, y: number) => ({
  touches: [{ clientX: x, clientY: y }],
  changedTouches: [{ clientX: x, clientY: y }],
});
function swipeLeft() {
  const area = screen.getByTestId("gallery-lightbox");
  fireEvent.touchStart(area, touch(300, 200));
  fireEvent.touchEnd(area, touch(100, 200));
}
function tap() {
  const area = screen.getByTestId("gallery-lightbox");
  fireEvent.touchStart(area, touch(150, 150));
  fireEvent.touchEnd(area, touch(150, 150));
  act(() => {
    vi.advanceTimersByTime(300);
  });
}

beforeEach(() => {
  compactLandscape = false;
  zoom.props = {};
  Object.values(zoom.controls).forEach((fn) => fn.mockClear());
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("GalleryLightbox", () => {
  it("shows the image with title, description and counter", () => {
    render(<Harness />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-label")).toBe("Burg Grauzahn");
    expect(img().src).toContain("a.webp");
    expect(screen.getByText("Die Helden stürmen das Tor.")).toBeTruthy();
    expect(screen.getByText('counter:{"index":1,"total":3}')).toBeTruthy();
  });

  it("labels untitled scenes by position and hides missing texts", () => {
    render(<Harness start={1} />);
    expect(screen.getByRole("dialog").getAttribute("aria-label")).toBe(
      'sceneLabel:{"index":2,"total":3}'
    );
    expect(screen.queryByTestId("gallery-lightbox-title")).toBeNull();
    expect(screen.queryByTestId("gallery-lightbox-description")).toBeNull();
  });

  it("pages with the arrow keys and stops at both ends", () => {
    render(<Harness />);
    key("ArrowLeft");
    expect(img().src).toContain("a.webp");
    key("ArrowRight");
    expect(img().src).toContain("b.webp");
    key("ArrowRight");
    key("ArrowRight");
    expect(img().src).toContain("c.webp");
  });

  it("hides ‹ on the first and › on the last image", () => {
    render(<Harness />);
    expect(screen.queryByTestId("gallery-lightbox-previous")).toBeNull();
    fireEvent.click(screen.getByTestId("gallery-lightbox-next"));
    fireEvent.click(screen.getByTestId("gallery-lightbox-next"));
    expect(screen.queryByTestId("gallery-lightbox-next")).toBeNull();
    fireEvent.click(screen.getByTestId("gallery-lightbox-previous"));
    expect(img().src).toContain("b.webp");
  });

  it("closes with Escape and ✕", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    key("Escape");
    fireEvent.click(screen.getByTestId("gallery-lightbox-close"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("focuses ✕, locks page scrolling and restores both when closed", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = render(<Harness />);
    expect(document.activeElement).toBe(screen.getByTestId("gallery-lightbox-close"));
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
    trigger.remove();
  });

  it("preloads the neighbouring full images", () => {
    const created: string[] = [];
    const OriginalImage = window.Image;
    window.Image = class {
      set src(value: string) {
        created.push(value);
      }
    } as unknown as typeof Image;

    render(<Harness start={1} />);
    expect(created.some((src) => src.endsWith("a.webp"))).toBe(true);
    expect(created.some((src) => src.endsWith("c.webp"))).toBe(true);
    window.Image = OriginalImage;
  });
});

describe("GalleryLightbox — image only", () => {
  it("⛶ hides everything but the image, and the button brings it back", () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId("gallery-lightbox-immersive"));

    expect(captionShown()).toBe(false);
    expect(screen.queryByTestId("gallery-lightbox-next")).toBeNull();
    expect(screen.getByTestId("gallery-lightbox").dataset.immersive).toBe("true");

    vi.useFakeTimers();
    tap(); // controls appear for a moment
    fireEvent.click(screen.getByTestId("gallery-lightbox-immersive"));
    expect(captionShown()).toBe(true);
  });

  it("F toggles image only on the PC; Escape leaves it before closing", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    key("f");
    expect(captionShown()).toBe(false);
    key("Escape");
    expect(captionShown()).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
    key("Escape");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows only the image when a phone is held sideways", () => {
    compactLandscape = true;
    render(<Harness />);
    expect(captionShown()).toBe(false);
    expect(screen.queryByTestId("gallery-lightbox-close")).toBeNull();
    // Rotating back is the way out, so there is no ⛶ to leave.
    expect(screen.queryByTestId("gallery-lightbox-immersive")).toBeNull();
  });

  it("a tap shows the controls for a few seconds", () => {
    compactLandscape = true;
    vi.useFakeTimers();
    render(<Harness />);

    tap();
    expect(screen.getByTestId("gallery-lightbox-close")).toBeTruthy();
    expect(screen.getByTestId("gallery-lightbox-next")).toBeTruthy();
    expect(captionShown()).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(screen.queryByTestId("gallery-lightbox-close")).toBeNull();
  });

  it("keeps swiping between images without zoom", () => {
    compactLandscape = true;
    render(<Harness />);
    swipeLeft();
    expect(img().src).toContain("b.webp");
  });
});

describe("GalleryLightbox — zoom", () => {
  it("configures pinch, wheel and double tap from 1× up to 5×", () => {
    render(<Harness />);
    expect(zoom.props.minScale).toBe(1);
    expect(zoom.props.maxScale).toBe(5);
    expect(zoom.props.doubleClick).toMatchObject({ mode: "toggle" });
    expect((zoom.props.wheel as { disabled?: boolean }).disabled).toBeFalsy();
    // At 1× a one-finger drag must reach the swipe handler, not the pan.
    expect((zoom.props.panning as { disabled: boolean }).disabled).toBe(true);
  });

  it("zooms with + / − and resets with 0", () => {
    render(<Harness />);
    key("+");
    key("=");
    key("-");
    key("0");
    expect(zoom.controls.zoomIn).toHaveBeenCalledTimes(2);
    expect(zoom.controls.zoomOut).toHaveBeenCalledTimes(1);
    expect(zoom.controls.resetTransform).toHaveBeenCalledTimes(1);
  });

  it("pans instead of paging while zoomed in", () => {
    render(<Harness />);
    act(() => {
      (zoom.props.onTransform as (ref: unknown, s: { scale: number }) => void)(null, {
        scale: 2.5,
      });
    });

    expect((zoom.props.panning as { disabled: boolean }).disabled).toBe(false);
    swipeLeft();
    expect(img().src).toContain("a.webp");
  });

  it("starts every image unzoomed", () => {
    render(<Harness />);
    act(() => {
      (zoom.props.onTransform as (ref: unknown, s: { scale: number }) => void)(null, {
        scale: 3,
      });
    });
    key("ArrowRight");
    expect(img().src).toContain("b.webp");
    expect((zoom.props.panning as { disabled: boolean }).disabled).toBe(true);
  });
});
