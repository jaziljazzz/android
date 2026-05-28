"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to all queue_entries changes for the partner's salon and calls
 * router.refresh() on each event. Refresh re-runs the server component query
 * so RLS still applies — we never have to merge state client-side.
 */
export function QueueRealtime({ salonId }: { salonId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`partner-queue:${salonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `salon_id=eq.${salonId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [salonId, router]);

  return null;
}
