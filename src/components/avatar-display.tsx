"use client";

import { useState } from "react";
import Image from "next/image";

interface AvatarDisplayProps {
  name: string;
  avatarUrl: string | null;
  size?: number;
  className?: string;
  /** "circle" for lists/cards, "square" for the character sheet header. */
  variant?: "circle" | "square";
  /** Race ID for silhouette fallback */
  raceId?: string;
  /** Class group for silhouette fallback: "warrior" | "priest" | "rogue" | "wizard" */
  classGroup?: string;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AvatarDisplay({
  name,
  avatarUrl,
  size = 80,
  className = "",
  variant = "circle",
  raceId,
  classGroup,
}: AvatarDisplayProps) {
  const [silhouetteFailed, setSilhouetteFailed] = useState(false);
  const borderRadius = variant === "circle" ? "rounded-full" : "rounded-lg";

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={`Avatar von ${name}`}
        width={size}
        height={size}
        className={`${borderRadius} object-cover ${className}`}
        style={{ width: size, height: size }}
        data-testid="avatar-image"
      />
    );
  }

  // Silhouette fallback: race + class group
  if (raceId && classGroup && !silhouetteFailed) {
    const silhouettePath = `/images/avatars/${raceId}-${classGroup}.webp`;
    return (
      <Image
        src={silhouettePath}
        alt={`${name} silhouette`}
        width={size}
        height={size}
        className={`${borderRadius} object-cover ${className}`}
        style={{ width: size, height: size }}
        data-testid="avatar-silhouette"
        onError={() => setSilhouetteFailed(true)}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${borderRadius} bg-primary/20 font-heading text-primary ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      data-testid="avatar-initials"
    >
      {getInitials(name || "?")}
    </div>
  );
}
