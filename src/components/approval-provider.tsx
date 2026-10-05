"use client";

import { createContext, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface ApprovalState {
  userId: string | null;
  isApproved: boolean;
  isLoading: boolean;
}

// Outside the provider (or before the user is known) everything stays
// permissive — the enforce_approval DB trigger is the real safety net.
const PERMISSIVE: ApprovalState = { userId: null, isApproved: true, isLoading: false };

const ApprovalContext = createContext<ApprovalState>(PERMISSIVE);

/**
 * Loads the current user's approval status once per page and keeps it live via
 * a single realtime subscription, so the banner disappears and gated actions
 * unlock immediately when the admin approves the user. ApprovalBanner and every
 * ApprovalGate read from here instead of querying and subscribing themselves.
 */
export function ApprovalProvider({ children }: { children: ReactNode }) {
  // supabase.channel() hands back the existing channel for a known name, and
  // calling .on() on an already-subscribed channel throws (#174). StrictMode's
  // double effect re-subscribes before removeChannel() has finished, so the
  // name carries a per-instance suffix. useId() produces colons, which have
  // meaning in realtime topic names.
  const instanceId = useId().replace(/:/g, "");
  const [userId, setUserId] = useState<string | null>(null);
  const [userResolved, setUserResolved] = useState(false);
  const [isApproved, setIsApproved] = useState(true); // optimistic until we know otherwise
  const [statusLoaded, setStatusLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getClaims()
      .then(({ data }) => {
        if (cancelled) return;
        setUserId(data?.claims?.sub ?? null);
        setUserResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let cancelled = false;

    supabase
      .from("profiles")
      .select("is_approved, email")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) setIsApproved(data.is_approved === true);
        setStatusLoaded(true);
      });

    const channel = supabase
      .channel(`approval-${userId}-${instanceId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new as { is_approved?: boolean };
          if (typeof next.is_approved === "boolean") {
            setIsApproved(next.is_approved);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId, instanceId]);

  const isLoading = !userResolved || (userId !== null && !statusLoaded);

  return (
    <ApprovalContext.Provider value={{ userId, isApproved, isLoading }}>
      {children}
    </ApprovalContext.Provider>
  );
}

export function useApproval(): ApprovalState {
  return useContext(ApprovalContext);
}
