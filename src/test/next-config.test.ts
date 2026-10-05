import { describe, it, expect, vi } from "vitest";

// The plugins only wrap the config; the test checks our own settings.
vi.mock("next-intl/plugin", () => ({ default: () => (config: unknown) => config }));
vi.mock("@next/bundle-analyzer", () => ({ default: () => (config: unknown) => config }));

const { default: nextConfig } = await import("../../next.config");

describe("next.config caching", () => {
  it("lets browsers cache public images and icons for a day", async () => {
    const rules = await nextConfig.headers!();
    const imageRule = rules.find((rule) => rule.source.includes("webp"));

    expect(imageRule?.source).toBe("/:file(.*\\.(?:webp|png|ico))");
    expect(imageRule?.headers).toContainEqual({
      key: "Cache-Control",
      value: "public, max-age=86400, stale-while-revalidate=604800",
    });
  });

  it("caches the web app manifests for a day", async () => {
    const rules = await nextConfig.headers!();
    const manifestRule = rules.find((rule) => rule.source.includes("webmanifest"));

    expect(manifestRule?.headers).toContainEqual({
      key: "Cache-Control",
      value: "public, max-age=86400",
    });
  });

  it("keeps optimized images for a day", () => {
    expect(nextConfig.images?.minimumCacheTTL).toBe(86400);
  });
});
