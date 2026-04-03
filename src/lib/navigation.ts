import { LayoutDashboard, Users, ScrollText, Package, FileUp, BookOpen } from "lucide-react";

export const NAV_ITEMS = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    labelKey: "dashboard" as const,
    testId: "nav-dashboard",
    mobileBar: true,
  },
  {
    href: "/characters",
    icon: Users,
    labelKey: "characters" as const,
    testId: "nav-characters",
    mobileBar: true,
  },
  {
    href: "/sessions",
    icon: ScrollText,
    labelKey: "sessions" as const,
    testId: "nav-sessions",
    mobileBar: true,
  },
  {
    href: "/party",
    icon: Package,
    labelKey: "party" as const,
    testId: "nav-party",
    mobileBar: true,
  },
  {
    href: "/characters/import",
    icon: FileUp,
    labelKey: "import" as const,
    testId: "nav-import",
    mobileBar: false,
  },
  {
    href: "/chat",
    icon: BookOpen,
    labelKey: "rulebook" as const,
    testId: "nav-rulebook",
    mobileBar: false,
  },
];
