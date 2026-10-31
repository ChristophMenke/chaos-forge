"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useApproval } from "@/components/approval-provider";
import { createClient } from "@/lib/supabase/client";
import {
  getUnseenReleases,
  isReleaseNotesRoute,
  LATEST_RELEASE_ID,
  readSeenRelease,
  RELEASES,
  setReleaseNotesOpen,
  writeSeenRelease,
  type Release,
} from "@/lib/release-notes";

const ReleaseNotesDialogContent = dynamic(
  () => import("./release-notes-dialog-content").then((m) => m.ReleaseNotesDialogContent),
  { ssr: false }
);

/**
 * Opens once per unseen release on signed-in app pages (see
 * isReleaseNotesRoute). Lives in the root layout. A per-player localStorage
 * entry avoids the profile query once the latest release has been seen;
 * closing in any way stores profiles.last_seen_release.
 */
export function ReleaseNotesDialog() {
  const { userId } = useApproval();
  const pathname = usePathname();
  const [unseen, setUnseen] = useState<Release[] | null>(null);
  // One check per player and page load; navigation must not re-query.
  const checkedFor = useRef<string | null>(null);
  const dismissed = useRef(false);

  useEffect(() => {
    if (!userId || checkedFor.current === userId) return;
    if (!isReleaseNotesRoute(pathname)) return;
    if (document.documentElement.classList.contains("embed-mode")) return;
    if (readSeenRelease(userId) === LATEST_RELEASE_ID) return;

    checkedFor.current = userId;
    let cancelled = false;
    let answered = false;
    createClient()
      .from("profiles")
      .select("last_seen_release, created_at")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        answered = true;
        if (!data) return;
        const releases = getUnseenReleases(RELEASES, {
          lastSeenId: data.last_seen_release ?? null,
          createdAt: data.created_at ?? null,
        });
        if (releases.length === 0) {
          writeSeenRelease(userId, LATEST_RELEASE_ID);
          return;
        }
        setUnseen(releases);
      });

    return () => {
      cancelled = true;
      // Navigating away before the answer arrives allows a retry on the next page.
      if (!answered && checkedFor.current === userId) checkedFor.current = null;
    };
  }, [userId, pathname]);

  const open = unseen !== null;
  useEffect(() => {
    if (!open) return;
    setReleaseNotesOpen(true);
    return () => setReleaseNotesOpen(false);
  }, [open]);

  function dismiss() {
    if (!userId || dismissed.current) return;
    dismissed.current = true;
    writeSeenRelease(userId, LATEST_RELEASE_ID);
    setUnseen(null);
    createClient()
      .from("profiles")
      .update({ last_seen_release: LATEST_RELEASE_ID })
      .eq("id", userId)
      .then(({ error }) => {
        if (error) console.error("[ReleaseNotes] markSeen failed:", error);
      });
  }

  if (!unseen) return null;
  return <ReleaseNotesDialogContent releases={unseen} onDismiss={dismiss} />;
}
