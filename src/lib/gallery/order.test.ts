import { describe, it, expect } from "vitest";
import { neighbourFor, nextSortOrders } from "./order";

describe("nextSortOrders", () => {
  it("gives the first selected image the highest value", () => {
    expect(nextSortOrders(5, 3)).toEqual([8, 7, 6]);
  });

  it("starts at 1 in an empty gallery", () => {
    expect(nextSortOrders(0, 2)).toEqual([2, 1]);
  });
});

describe("neighbourFor", () => {
  // Sorted like the UI: highest sort_order first.
  const list = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("finds the image above and below", () => {
    expect(neighbourFor(list, "b", "up")).toBe("a");
    expect(neighbourFor(list, "b", "down")).toBe("c");
  });

  it("returns null at the edges and for unknown ids", () => {
    expect(neighbourFor(list, "a", "up")).toBeNull();
    expect(neighbourFor(list, "c", "down")).toBeNull();
    expect(neighbourFor(list, "x", "up")).toBeNull();
  });
});
