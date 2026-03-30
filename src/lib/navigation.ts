import { LayoutDashboard, Users, ScrollText, FileUp, BookOpen } from "lucide-react";

export const NAV_ITEMS = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    labelKey: "dashboard" as const,
    testId: "nav-dashboard",
  },
  { href: "/characters", icon: Users, labelKey: "characters" as const, testId: "nav-characters" },
  { href: "/sessions", icon: ScrollText, labelKey: "sessions" as const, testId: "nav-sessions" },
  {
    href: "/characters/import",
    icon: FileUp,
    labelKey: "import" as const,
    testId: "nav-import",
  },
  {
    href: "/chat",
    icon: BookOpen,
    labelKey: "rulebook" as const,
    testId: "nav-rulebook",
  },
];
