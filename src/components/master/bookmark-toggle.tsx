"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleBookmark } from "@/app/master/actions";
import type { BookmarkEntityType } from "@/lib/supabase/types";

interface BookmarkToggleProps {
  entityType: BookmarkEntityType;
  entityId: string;
  isBookmarked: boolean;
  userId: string;
  onToggle: (entityType: BookmarkEntityType, entityId: string) => void;
}

export function BookmarkToggle({
  entityType,
  entityId,
  isBookmarked,
  userId,
  onToggle,
}: BookmarkToggleProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleToggle() {
    setError(false);
    setLoading(true);
    const result = await toggleBookmark(userId, entityType, entityId);
    setLoading(false);
    if (result.success) {
      onToggle(entityType, entityId);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-7 w-7 p-0 ${error ? "ring-1 ring-destructive" : ""}`}
      onClick={handleToggle}
      disabled={loading}
      data-testid={`bookmark-${entityType}-${entityId}`}
    >
      <Star
        className={`h-4 w-4 transition-colors ${
          isBookmarked
            ? "fill-amber-400 text-amber-400"
            : "text-muted-foreground hover:text-amber-400"
        }`}
      />
    </Button>
  );
}
