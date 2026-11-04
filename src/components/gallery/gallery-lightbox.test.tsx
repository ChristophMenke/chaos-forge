import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useState } from "react";
import type { GalleryImageRow } from "@/lib/supabase/types";

afterEach(cleanup);

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

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
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(img().src).toContain("a.webp");
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(img().src).toContain("b.webp");
    fireEvent.keyDown(document, { key: "ArrowRight" });
    fireEvent.keyDown(document, { key: "ArrowRight" });
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
    fireEvent.keyDown(document, { key: "Escape" });
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
