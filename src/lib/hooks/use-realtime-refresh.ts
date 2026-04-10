"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (bindings.length === 0) return;

    const supabase = createClient();
    const scheduleRefresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        refreshRef.current();
        refreshTimer.current = null;
      }, 150);
    };

    let channel = supabase.channel(channelName);
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

    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, bindingsKey]);
}
