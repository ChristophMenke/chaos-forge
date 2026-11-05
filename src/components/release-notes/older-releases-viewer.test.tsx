import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { Release } from "@/lib/release-notes";

vi.mock("next-intl", () => ({
  useLocale: () => "de",
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

const { OlderReleasesViewer } = await import("./older-releases-viewer");

function release(id: string, title: string): Release {
  return {
    id,
    date: id,
    items: [{ icon: "undo", title: { de: title, en: title }, text: { de: "Text", en: "Text" } }],
  };
}

const RELEASES = [
  release("2026-11-02", "Erste"),
  release("2026-10-31", "Zweite"),
  release("2026-10-20", "Dritte"),
];

afterEach(cleanup);

const card = () => screen.getByTestId("release-notes-release");
const key = (k: string) => fireEvent.keyDown(document, { key: k });
const touch = (x: number) => ({
  touches: [{ clientX: x, clientY: 100 }],
  changedTouches: [{ clientX: x, clientY: 100 }],
});
function swipe(from: number, to: number) {
  const area = screen.getByTestId("older-releases");
  fireEvent.touchStart(area, touch(from));
  fireEvent.touchEnd(area, touch(to));
}

describe("OlderReleasesViewer", () => {
  it("is a modal dialog showing one release per card with its position", () => {
    render(<OlderReleasesViewer releases={RELEASES} onClose={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(within(dialog).getAllByTestId("release-notes-release")).toHaveLength(1);
    expect(card()).toHaveTextContent("Erste");
    expect(screen.getByText('cardPosition:{"index":1,"total":3}')).toBeTruthy();
  });

  it("pages with the arrow keys and stops at both ends", () => {
    render(<OlderReleasesViewer releases={RELEASES} onClose={() => {}} />);
    key("ArrowLeft");
    expect(card()).toHaveTextContent("Erste");
    key("ArrowRight");
    key("ArrowRight");
    key("ArrowRight");
    expect(card()).toHaveTextContent("Dritte");
  });

  it("pages by swiping", () => {
    render(<OlderReleasesViewer releases={RELEASES} onClose={() => {}} />);
    swipe(300, 100);
    expect(card()).toHaveTextContent("Zweite");
    swipe(100, 300);
    expect(card()).toHaveTextContent("Erste");
  });

  it("hides ‹ on the first and › on the last card", () => {
    render(<OlderReleasesViewer releases={RELEASES} onClose={() => {}} />);
    expect(screen.queryByTestId("older-releases-previous")).toBeNull();
    fireEvent.click(screen.getByTestId("older-releases-next"));
    fireEvent.click(screen.getByTestId("older-releases-next"));
    expect(screen.queryByTestId("older-releases-next")).toBeNull();
    fireEvent.click(screen.getByTestId("older-releases-previous"));
    expect(card()).toHaveTextContent("Zweite");
  });

  it("jumps to a card via its dot", () => {
    render(<OlderReleasesViewer releases={RELEASES} onClose={() => {}} />);
    const dots = screen.getAllByTestId("older-releases-dot");
    expect(dots).toHaveLength(3);
    expect(dots[0].getAttribute("aria-current")).toBe("true");
    fireEvent.click(dots[2]);
    expect(card()).toHaveTextContent("Dritte");
  });

  it("closes with Escape and ✕, focusing ✕ and locking page scroll while open", () => {
    const onClose = vi.fn();
    const { unmount } = render(<OlderReleasesViewer releases={RELEASES} onClose={onClose} />);
    expect(document.activeElement).toBe(screen.getByTestId("older-releases-close"));
    expect(document.body.style.overflow).toBe("hidden");

    key("Escape");
    fireEvent.click(screen.getByTestId("older-releases-close"));
    expect(onClose).toHaveBeenCalledTimes(2);

    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("hints at more content below in a long card until it is scrolled down", () => {
    render(<OlderReleasesViewer releases={RELEASES} onClose={() => {}} />);
    const scroller = screen.getByTestId("older-releases-card");
    const size = (scrollTop: number) => {
      Object.defineProperty(scroller, "scrollHeight", { value: 900, configurable: true });
      Object.defineProperty(scroller, "clientHeight", { value: 500, configurable: true });
      scroller.scrollTop = scrollTop;
    };

    size(0);
    fireEvent.scroll(scroller);
    expect(screen.getByTestId("older-releases-more")).toBeTruthy();

    size(400);
    fireEvent.scroll(scroller);
    expect(screen.queryByTestId("older-releases-more")).toBeNull();
  });
});
