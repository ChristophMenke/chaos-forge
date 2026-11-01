"use client";

import { useCallback, useState } from "react";
import { markBackupOffered, shouldOfferBackup } from "@/lib/backup/offer";

/**
 * Offers the admin a backup after a session text was saved — at most once per
 * session on this device. Players never see it.
 */
export function useBackupOffer({ isAdmin, sessionId }: { isAdmin: boolean; sessionId: string }) {
  const [open, setOpen] = useState(false);

  const offer = useCallback(() => {
    if (!isAdmin || !shouldOfferBackup(sessionId)) return;
    markBackupOffered(sessionId);
    setOpen(true);
  }, [isAdmin, sessionId]);

  const close = useCallback(() => setOpen(false), []);

  return { open, offer, close };
}
