"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const IMMERSIVE_ROUTES = ["/login", "/master"];

export function AppHeader() {
  const pathname = usePathname();
  const isImmersive = IMMERSIVE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isImmersive) return null;

  return (
    <header className="embed-hidden flex items-center justify-center border-b border-border px-4 py-2 sm:px-6 sm:py-4">
      <Link href="/">
        <Image
          src="/header-logo.webp"
          alt="Chaos Forge"
          width={280}
          height={120}
          loading="eager"
          className="h-[84px] w-auto sm:h-[168px]"
        />
      </Link>
    </header>
  );
}
