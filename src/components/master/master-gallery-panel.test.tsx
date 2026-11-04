import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
import type { GalleryImageRow } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
  useLocale: () => "de",
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ storage: { from: () => ({ uploadToSignedUrl: vi.fn() }) } }),
}));

const updateGalleryImage = vi.fn();
const deleteGalleryImage = vi.fn();
const moveGalleryImage = vi.fn();
vi.mock("@/app/master/gallery-actions", () => ({
  prepareGalleryUpload: vi.fn(),
  registerGalleryImages: vi.fn(),
  updateGalleryImage: (...args: unknown[]) => updateGalleryImage(...args),
  deleteGalleryImage: (...args: unknown[]) => deleteGalleryImage(...args),
  moveGalleryImage: (...args: unknown[]) => moveGalleryImage(...args),
}));

import { MasterGalleryPanel } from "./master-gallery-panel";

function image(id: string, sort: number, extra: Partial<GalleryImageRow> = {}): GalleryImageRow {
  return {
    id,
    title: null,
    description: null,
    image_path: `${id}.webp`,
    thumb_path: `${id}-thumb.webp`,
    width: 2560,
    height: 1920,
    sort_order: sort,
    created_by: "gm",
    created_at: "2026-11-04T10:00:00Z",
    updated_at: "2026-11-04T10:00:00Z",
    ...extra,
  };
}

const IMAGES = [
  image("b", 2, { title: "Burg Grauzahn" }),
  image("a", 1, { title: "Der Drache" }),
  image("c", 3),
];

describe("MasterGalleryPanel", () => {
  it("lists the images with the highest sort_order on top", () => {
    render(<MasterGalleryPanel initialImages={IMAGES} />);
    const rows = screen.getAllByTestId("gm-gallery-item");
    expect(rows.map((r) => r.getAttribute("data-image-id"))).toEqual(["c", "b", "a"]);
    expect(within(rows[0]).getByText("galleryUntitled")).toBeTruthy();
  });

  it("disables ▲ on the first and ▼ on the last image", () => {
    render(<MasterGalleryPanel initialImages={IMAGES} />);
    const rows = screen.getAllByTestId("gm-gallery-item");
    const up = (row: HTMLElement) => within(row).getByTestId("gm-gallery-up") as HTMLButtonElement;
    const down = (row: HTMLElement) =>
      within(row).getByTestId("gm-gallery-down") as HTMLButtonElement;

    expect(up(rows[0]).disabled).toBe(true);
    expect(down(rows[0]).disabled).toBe(false);
    expect(up(rows[2]).disabled).toBe(false);
    expect(down(rows[2]).disabled).toBe(true);
  });

  it("moves an image and shows the order returned by the server", async () => {
    moveGalleryImage.mockResolvedValue({
      success: true,
      images: [image("b", 3), image("c", 2), image("a", 1)],
    });
    render(<MasterGalleryPanel initialImages={IMAGES} />);

    fireEvent.click(
      within(screen.getAllByTestId("gm-gallery-item")[1]).getByTestId("gm-gallery-up")
    );

    await waitFor(() =>
      expect(
        screen.getAllByTestId("gm-gallery-item").map((r) => r.getAttribute("data-image-id"))
      ).toEqual(["b", "c", "a"])
    );
    expect(moveGalleryImage).toHaveBeenCalledWith("b", "up");
  });

  it("saves empty texts as null from the edit dialog", async () => {
    updateGalleryImage.mockResolvedValue({ success: true, image: image("b", 2) });
    render(<MasterGalleryPanel initialImages={IMAGES} />);

    fireEvent.click(
      within(screen.getAllByTestId("gm-gallery-item")[1]).getByTestId("gm-gallery-edit")
    );
    fireEvent.change(await screen.findByTestId("gm-gallery-edit-title"), {
      target: { value: "  " },
    });
    fireEvent.click(screen.getByTestId("gm-gallery-edit-save"));

    await waitFor(() =>
      expect(updateGalleryImage).toHaveBeenCalledWith("b", { title: null, description: null })
    );
  });

  it("asks before deleting and removes the image afterwards", async () => {
    deleteGalleryImage.mockResolvedValue({ success: true });
    render(<MasterGalleryPanel initialImages={IMAGES} />);

    fireEvent.click(
      within(screen.getAllByTestId("gm-gallery-item")[0]).getByTestId("gm-gallery-delete")
    );
    expect(deleteGalleryImage).not.toHaveBeenCalled();
    expect(screen.getByTestId("confirm-dialog")).toBeTruthy();

    fireEvent.click(screen.getByTestId("confirm-delete"));

    await waitFor(() => expect(screen.getAllByTestId("gm-gallery-item")).toHaveLength(2));
    expect(deleteGalleryImage).toHaveBeenCalledWith("c");
  });

  it("shows a hint when the gallery is empty", () => {
    render(<MasterGalleryPanel initialImages={[]} />);
    expect(screen.getByTestId("gm-gallery-empty")).toBeTruthy();
    expect(screen.queryByTestId("gm-gallery-item")).toBeNull();
  });
});
