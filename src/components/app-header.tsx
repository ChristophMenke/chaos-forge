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
    <header className="embed-hidden flex items-center justify-center border-b border-border px-4 pb-2 pt-[calc(env(safe-area-inset-top,0px)_+_0.5rem)] sm:px-6 sm:pb-4 sm:pt-[calc(env(safe-area-inset-top,0px)_+_1rem)]">
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
