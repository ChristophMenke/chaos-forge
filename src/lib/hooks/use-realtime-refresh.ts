"use client";

import { useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface RealtimeTableBinding {
  table: string;
  filter?: string;
  schema?: string;
}

/**
 * Subscribes to postgres_changes on one or more tables and calls
 * router.refresh() (debounced) on every event. Falls back silently if the
 * realtime channel fails to connect. Used by shared pages where multiple
 * users look at the same server-rendered data.
 *
 * A refresh re-runs every server query of the page, so tabs in the background
 * don't refresh: they remember that something changed and refresh once when
 * the user comes back.
 *
 * `bindings` is serialized to a stable string key so callers can pass inline
 * array literals without causing infinite re-subscriptions. `router.refresh`
 * is stored in a ref so that Next.js router identity changes (which happen
 * on navigations) do not tear down and re-create the channel.
 */
export function useRealtimeRefresh(channelName: string, bindings: RealtimeTableBinding[]): void {
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep router.refresh stable across renders to avoid unnecessary channel
  // teardowns when the Next.js router object is replaced after navigations.
  const refreshRef = useRef(router.refresh.bind(router));
  useEffect(() => {
    refreshRef.current = router.refresh.bind(router);
  });

  // Serialize bindings for a stable useEffect dep — callers may pass inline
  // array literals, and JSON.stringify gives a cheap structural equality check.
  const bindingsKey = JSON.stringify(bindings);
  // Per-instance suffix: two mounted callers (or a remount before the old
  // channel is gone) must not share a Supabase channel name.
  const instanceId = useId();

  useEffect(() => {
    if (bindings.length === 0) return;

    const supabase = createClient();
    let pendingWhileHidden = false;

    const scheduleRefresh = () => {
      if (document.visibilityState !== "visible") {
        pendingWhileHidden = true;
        return;
      }
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        refreshRef.current();
        refreshTimer.current = null;
      }, 150);
    };

    let channel = supabase.channel(`${channelName}-${instanceId}`);
    for (const binding of bindings) {
      channel = channel.on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "*",
          schema: binding.schema ?? "public",
          table: binding.table,
          ...(binding.filter ? { filter: binding.filter } : {}),
        },
        scheduleRefresh
      );
    }
    channel.subscribe();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && pendingWhileHidden) {
        pendingWhileHidden = false;
        scheduleRefresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, bindingsKey, instanceId]);
}
