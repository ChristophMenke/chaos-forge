"use client";

import { useRealtimeRefresh, type RealtimeTableBinding } from "@/lib/hooks/use-realtime-refresh";

interface RealtimeRefreshProps {
  channelName: string;
  bindings: RealtimeTableBinding[];
}

/**
 * Invisible client component that subscribes to postgres_changes and
 * triggers router.refresh() on every event. Drop into server components
 * to add realtime behavior without converting the whole tree to client.
 */
export function RealtimeRefresh({ channelName, bindings }: RealtimeRefreshProps) {
  useRealtimeRefresh(channelName, bindings);
  return null;
}
