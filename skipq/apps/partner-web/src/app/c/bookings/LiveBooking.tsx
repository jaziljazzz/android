"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LiveBooking({ entryId, salonId }: { entryId: string; salonId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Refresh the page when anything changes on this salon's queue so the
  // server component re-renders with the live position.
  useEffect(() => {
    const channel = supabase
      .channel(`c-queue:${salonId}`)
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
  }, [supabase, router, salonId]);

  async function cancel() {
    setBusy(true);
    await supabase
      .from("queue_entries")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", entryId);
    setBusy(false);
    router.push("/c/home");
  }

  return (
    <button
      type="button"
      onClick={cancel}
      disabled={busy}
      className="mt-4 w-full rounded-xl border border-skip-stone/20 text-skip-stone font-semibold py-3 hover:text-skip-accent hover:border-skip-accent"
    >
      {busy ? "Cancelling…" : "Leave queue"}
    </button>
  );
}
