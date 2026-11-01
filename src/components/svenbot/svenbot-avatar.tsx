"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Sven's face, cut from the Master-of-Chaos artwork (scripts/svenbot-avatar.ts). */
const AVATAR_SRC = "/images/svenbot/svenbot-avatar.webp";

const SIZES = {
  sm: { className: "h-7 w-7", pixels: 64 },
  md: { className: "h-9 w-9", pixels: 64 },
  lg: { className: "h-20 w-20", pixels: 160 },
} as const;

type SvenBotAvatarSize = keyof typeof SIZES;

/** SvenBot's portrait for the chat, labelled for screen readers. */
export function SvenBotAvatar({
  size = "md",
  className,
}: {
  size?: SvenBotAvatarSize;
  className?: string;
}) {
  const t = useTranslations("rulebook");
  const { className: sizeClass, pixels } = SIZES[size];

  return (
    <Image
      src={AVATAR_SRC}
      alt={t("botName")}
      width={pixels}
      height={pixels}
      className={cn(
        "shrink-0 rounded-full object-cover ring-1 ring-primary/40",
        sizeClass,
        className
      )}
      data-testid="svenbot-avatar"
    />
  );
}

/**
 * Drop-in replacement for a lucide icon in the navigations. Decorative: the
 * navigation item already carries the visible label or aria-label.
 */
export function SvenBotIcon({ className }: { className?: string }) {
  return (
    <Image
      src={AVATAR_SRC}
      alt=""
      width={64}
      height={64}
      className={cn("rounded-full object-cover ring-1 ring-primary/40", className)}
    />
  );
}
