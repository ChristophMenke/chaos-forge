import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import bundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "";

// Files in public/ are served with `max-age=0` by default, so browsers
// revalidate every artwork on every visit. A day of caching (plus a week of
// stale-while-revalidate) keeps replaced images from lingering for long.
const PUBLIC_ASSET_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:file(.*\\.(?:webp|png|ico))",
        headers: [{ key: "Cache-Control", value: PUBLIC_ASSET_CACHE }],
      },
      {
        source: "/:file(.*\\.webmanifest)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
    ];
  },
  images: {
    minimumCacheTTL: 86400,
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
