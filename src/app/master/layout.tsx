import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Master of Chaos — GM Dashboard",
  description: "Game Master Dashboard für AD&D 2nd Edition — Chaos RPG",
  manifest: "/master-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Master of Chaos",
    statusBarStyle: "black-translucent",
  },
};

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
