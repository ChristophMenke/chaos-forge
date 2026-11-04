// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";

const checkGmSession = vi.fn();
vi.mock("./actions", () => ({ checkGmSession }));

const getAuthUser = vi.fn();
vi.mock("@/lib/supabase/auth", () => ({ getAuthUser }));

const notifyApprovedUsers = vi.fn();
vi.mock("@/lib/notifications", () => ({ notifyApprovedUsers }));

// ── Minimal service-client fake ──────────────────────────────────────────────

interface Row {
  id: string;
  sort_order: number;
  image_path: string;
  thumb_path: string;
  title?: string | null;
  description?: string | null;
}

let rows: Row[] = [];
let existing = new Set<string>();
const createSignedUploadUrl = vi.fn(async (path: string) => ({
  data: { path, token: `token:${path}`, signedUrl: "" },
  error: null,
}));
const exists = vi.fn(async (path: string) => ({ data: existing.has(path), error: null }));
const remove = vi.fn(async () => ({ data: [], error: null }));
const insert = vi.fn();
const update = vi.fn();
const del = vi.fn();
const rpc = vi.fn(async () => ({ error: null }));

/** Chainable query over `rows`, enough for the calls in gallery-actions.ts. */
function query() {
  let list = [...rows];
  const chain = {
    select: () => chain,
    eq: (col: keyof Row, value: unknown) => {
      list = list.filter((r) => r[col] === value);
      return chain;
    },
    gt: (col: keyof Row, value: number) => {
      list = list.filter((r) => (r[col] as number) > value);
      return chain;
    },
    lt: (col: keyof Row, value: number) => {
      list = list.filter((r) => (r[col] as number) < value);
      return chain;
    },
    order: (col: keyof Row, { ascending }: { ascending: boolean }) => {
      list.sort((a, b) => ((a[col] as number) - (b[col] as number)) * (ascending ? 1 : -1));
      return chain;
    },
    limit: (n: number) => {
      list = list.slice(0, n);
      return chain;
    },
    maybeSingle: async () => ({ data: list[0] ?? null, error: null }),
    then: (resolve: (v: { data: Row[]; error: null }) => void) =>
      resolve({ data: list, error: null }),
    insert: (values: Row[]) => {
      insert(values);
      rows.push(...values);
      return { select: async () => ({ data: values, error: null }) };
    },
    update: (values: Partial<Row>) => {
      update(values);
      return {
        eq: (_col: string, id: string) => {
          const row = rows.find((r) => r.id === id);
          if (row) Object.assign(row, values);
          return { select: () => ({ single: async () => ({ data: row, error: null }) }) };
        },
      };
    },
    delete: () => ({
      eq: async (_col: string, id: string) => {
        del(id);
        rows = rows.filter((r) => r.id !== id);
        return { error: null };
      },
    }),
  };
  return chain;
}

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: () => query(),
    rpc,
    storage: { from: () => ({ createSignedUploadUrl, exists, remove }) },
  }),
}));

const actions = await import("./gallery-actions");

beforeEach(() => {
  vi.clearAllMocks();
  checkGmSession.mockResolvedValue(true);
  getAuthUser.mockResolvedValue({ id: "gm-user", email: "gm@example.com" });
  rows = [];
  existing = new Set();
});

describe("GM session", () => {
  it("rejects every action without a GM session", async () => {
    checkGmSession.mockResolvedValue(false);

    expect(await actions.prepareGalleryUpload(1)).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(await actions.registerGalleryImages([])).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(await actions.updateGalleryImage(ID_A, { title: "x", description: null })).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(await actions.deleteGalleryImage(ID_A)).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(await actions.moveGalleryImage(ID_A, "up")).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(createSignedUploadUrl).not.toHaveBeenCalled();
  });
});

describe("prepareGalleryUpload", () => {
  it("issues two signed upload URLs per image with server-chosen paths", async () => {
    const result = await actions.prepareGalleryUpload(2);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.uploads).toHaveLength(2);
    const [first] = result.uploads;
    expect(first.imagePath).toBe(`${first.id}.webp`);
    expect(first.thumbPath).toBe(`${first.id}-thumb.webp`);
    expect(first.imageToken).toBe(`token:${first.id}.webp`);
    expect(createSignedUploadUrl).toHaveBeenCalledTimes(4);
  });

  it.each([0, 21, 1.5])("rejects a count of %s", async (count) => {
    expect(await actions.prepareGalleryUpload(count)).toEqual({
      success: false,
      error: "invalid_count",
    });
  });
});

describe("registerGalleryImages", () => {
  it("inserts uploaded images on top in selection order and notifies once", async () => {
    rows = [{ id: "old", sort_order: 4, image_path: "", thumb_path: "" }];
    for (const id of [ID_A, ID_B]) {
      existing.add(`${id}.webp`);
      existing.add(`${id}-thumb.webp`);
    }

    const result = await actions.registerGalleryImages([
      { id: ID_A, width: 2560, height: 1920 },
      { id: ID_B, width: 1920, height: 2560 },
    ]);

    expect(result.success).toBe(true);
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        id: ID_A,
        sort_order: 6,
        image_path: `${ID_A}.webp`,
        thumb_path: `${ID_A}-thumb.webp`,
        created_by: "gm-user",
      }),
      expect.objectContaining({ id: ID_B, sort_order: 5 }),
    ]);
    expect(notifyApprovedUsers).toHaveBeenCalledTimes(1);
    expect(notifyApprovedUsers).toHaveBeenCalledWith(expect.anything(), {
      exceptUserId: "gm-user",
      type: "gallery_images_added",
      details: { count: 2 },
    });
  });

  it("ignores forged ids and images whose files are missing", async () => {
    existing.add(`${ID_A}.webp`); // thumb missing

    const result = await actions.registerGalleryImages([
      { id: "../../etc", width: 1, height: 1 },
      { id: ID_A, width: 1, height: 1 },
    ]);

    expect(result).toEqual({ success: true, images: [], failedIds: ["../../etc", ID_A] });
    expect(insert).not.toHaveBeenCalled();
    expect(notifyApprovedUsers).not.toHaveBeenCalled();
  });
});

describe("updateGalleryImage", () => {
  it("trims the texts and stores empty ones as null", async () => {
    rows = [{ id: ID_A, sort_order: 1, image_path: "", thumb_path: "" }];

    const result = await actions.updateGalleryImage(ID_A, {
      title: "  Burg Grauzahn ",
      description: "   ",
    });

    expect(result.success).toBe(true);
    expect(update).toHaveBeenCalledWith({ title: "Burg Grauzahn", description: null });
  });

  it("rejects a title over 120 characters", async () => {
    const result = await actions.updateGalleryImage(ID_A, {
      title: "x".repeat(121),
      description: null,
    });
    expect(result).toEqual({ success: false, error: "too_long" });
    expect(update).not.toHaveBeenCalled();
  });
});

describe("deleteGalleryImage", () => {
  it("removes both files and the row", async () => {
    rows = [{ id: ID_A, sort_order: 1, image_path: "a.webp", thumb_path: "a-thumb.webp" }];

    const result = await actions.deleteGalleryImage(ID_A);

    expect(result).toEqual({ success: true });
    expect(remove).toHaveBeenCalledWith(["a.webp", "a-thumb.webp"]);
    expect(del).toHaveBeenCalledWith(ID_A);
  });

  it("still deletes the row when the files cannot be removed", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    remove.mockResolvedValueOnce({ data: null, error: { message: "gone" } } as never);
    rows = [{ id: ID_A, sort_order: 1, image_path: "a.webp", thumb_path: "a-thumb.webp" }];

    expect(await actions.deleteGalleryImage(ID_A)).toEqual({ success: true });
    expect(del).toHaveBeenCalledWith(ID_A);
    spy.mockRestore();
  });
});

describe("moveGalleryImage", () => {
  beforeEach(() => {
    rows = [
      { id: "top", sort_order: 9, image_path: "", thumb_path: "" },
      { id: "mid", sort_order: 5, image_path: "", thumb_path: "" },
      { id: "low", sort_order: 2, image_path: "", thumb_path: "" },
    ];
  });

  it("swaps with the next higher image when moving up", async () => {
    const result = await actions.moveGalleryImage("low", "up");
    expect(rpc).toHaveBeenCalledWith("swap_gallery_order", { a: "low", b: "mid" });
    expect(result.success).toBe(true);
  });

  it("swaps with the next lower image when moving down", async () => {
    await actions.moveGalleryImage("top", "down");
    expect(rpc).toHaveBeenCalledWith("swap_gallery_order", { a: "top", b: "mid" });
  });

  it("does nothing at the edge", async () => {
    const result = await actions.moveGalleryImage("top", "up");
    expect(rpc).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
});
