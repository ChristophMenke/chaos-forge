import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { GalleryImageRow } from "@/lib/supabase/types";

afterEach(cleanup);

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

import { GalleryGrid } from "./gallery-grid";

function image(id: string, title: string | null): GalleryImageRow {
  return {
    id,
    title,
    description: null,
    image_path: `${id}.webp`,
    thumb_path: `${id}-thumb.webp`,
    width: 100,
    height: 80,
    sort_order: 1,
    created_by: null,
    created_at: "",
    updated_at: "",
  };
}

const IMAGES = [image("a", "Burg Grauzahn"), image("b", null), image("c", "Der Drache")];

describe("GalleryGrid", () => {
  it("renders responsive tiles with lazy thumbnails and optional titles", () => {
    render(<GalleryGrid images={IMAGES} />);

    const grid = screen.getByTestId("gallery-grid");
    expect(grid.className).toContain("grid-cols-2");
    expect(grid.className).toContain("sm:grid-cols-3");
    expect(grid.className).toContain("lg:grid-cols-4");
    expect(grid.className).toContain("xl:grid-cols-5");

    const thumbs = screen.getAllByRole("img") as HTMLImageElement[];
    expect(thumbs.map((t) => t.getAttribute("loading"))).toEqual(["lazy", "lazy", "lazy"]);
    expect(thumbs[0].src).toContain("a-thumb.webp");
    expect(thumbs[0].alt).toBe("Burg Grauzahn");
    expect(thumbs[1].alt).toBe('sceneLabel:{"index":2,"total":3}');
    expect(screen.getByText("Der Drache")).toBeTruthy();
  });

  it("opens the fullscreen view at the tapped image", () => {
    render(<GalleryGrid images={IMAGES} />);
    fireEvent.click(screen.getAllByTestId("gallery-tile")[2]);

    expect(screen.getByRole("dialog").getAttribute("aria-label")).toBe("Der Drache");
    fireEvent.click(screen.getByTestId("gallery-lightbox-close"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
