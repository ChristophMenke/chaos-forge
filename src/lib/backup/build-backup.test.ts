import { describe, it, expect, vi } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { buildBackup } from "./build-backup";

const BASE = "https://proj.supabase.co";
const pub = (bucket: string, path: string) => `${BASE}/storage/v1/object/public/${bucket}/${path}`;

function apiResponse(tables: Record<string, unknown[]>) {
  return new Response(JSON.stringify({ generatedAt: "2026-11-01T12:00:00.000Z", tables }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function imageResponse(bytes: number[]) {
  return new Response(new Uint8Array(bytes), { status: 200 });
}

describe("buildBackup", () => {
  it("fetches the data, downloads the images and zips everything", async () => {
    const fetchImpl = vi.fn(async (input: string, init?: RequestInit) => {
      if (input === "/api/admin/backup")
        return apiResponse({
          characters: [
            { avatar_url: pub("avatars", "u1/c1.webp?t=1") },
            { avatar_url: pub("avatars", "u1/c2.webp") },
          ],
        });
      expect(init?.cache).toBe("no-store");
      if (input.includes("c1.webp")) return imageResponse([1]);
      return new Response("missing", { status: 404 });
    });
    const progress = vi.fn();

    const result = await buildBackup({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      supabaseUrl: BASE,
      onProgress: progress,
      now: new Date("2026-11-01T12:00:00Z"),
    });

    expect(fetchImpl).toHaveBeenCalledWith("/api/admin/backup", { cache: "no-store" });
    expect(result.fileName).toBe("chaos-forge-backup-2026-11-01.zip");
    expect(result.imageCount).toBe(1);
    expect(result.failedImages).toEqual([
      { bucket: "avatars", path: "u1/c2.webp", reason: "HTTP 404" },
    ]);

    const files = unzipSync(result.zip);
    expect([...files["images/avatars/u1/c1.webp"]]).toEqual([1]);
    expect(JSON.parse(strFromU8(files["manifest.json"])).failedImages).toHaveLength(1);

    expect(progress).toHaveBeenCalledWith("data", 0, 0);
    expect(progress).toHaveBeenCalledWith("images", 2, 2);
    expect(progress).toHaveBeenLastCalledWith("zip", 0, 0);
  });

  it("records network errors instead of aborting", async () => {
    const fetchImpl = vi.fn(async (input: string) => {
      if (input === "/api/admin/backup") {
        return apiResponse({ sessions: [{ image_url: pub("session-images", "s1.webp") }] });
      }
      throw new TypeError("Failed to fetch");
    });

    const result = await buildBackup({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      supabaseUrl: BASE,
    });

    expect(result.failedImages).toEqual([
      { bucket: "session-images", path: "s1.webp", reason: "Failed to fetch" },
    ]);
  });

  it("fails with the status when the data API refuses", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 403 }));

    await expect(
      buildBackup({ fetchImpl: fetchImpl as unknown as typeof fetch, supabaseUrl: BASE })
    ).rejects.toThrow("403");
  });

  it("downloads at most six images at a time", async () => {
    const characters = Array.from({ length: 20 }, (_, i) => ({
      avatar_url: pub("avatars", `u/${i}.webp`),
    }));
    let running = 0;
    let peak = 0;
    const fetchImpl = vi.fn(async (input: string) => {
      if (input === "/api/admin/backup") return apiResponse({ characters });
      running++;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 1));
      running--;
      return imageResponse([0]);
    });

    const result = await buildBackup({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      supabaseUrl: BASE,
    });

    expect(result.imageCount).toBe(20);
    expect(peak).toBeLessThanOrEqual(6);
  });
});
