import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { QueueList } from "./QueueList";
import { QueueRealtime } from "./QueueRealtime";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const supabase = createClient();

  const { data: partner } = await supabase
    .from("partner_users")
    .select("salon_id")
    .maybeSingle();

  const { data: entries, error } = await supabase
    .from("queue_entries")
    .select(
      `
        id,
        position,
        status,
        joined_at,
        started_at,
        guest_name,
        guest_phone,
        notes,
        estimated_wait_min,
        stylists!queue_entries_stylist_id_fkey ( id, name ),
        users    ( id, name )
      `,
    )
    .in("status", ["waiting", "arrived", "serving"])
    .order("joined_at", { ascending: true });

  const total = entries?.length ?? 0;
  const serving = entries?.filter((e) => e.status === "serving").length ?? 0;
  const arrived = entries?.filter((e) => e.status === "arrived").length ?? 0;
  const waiting = entries?.filter((e) => e.status === "waiting").length ?? 0;

  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-skip-ink leading-tight">Live queue</h1>
          <p className="mt-2 text-skip-slate">
            {total === 0
              ? "All caught up. Add a walk-in when one arrives."
              : `${total} ${total === 1 ? "customer" : "customers"} in the salon right now.`}
          </p>
        </div>
        <Link href="/dashboard/walk-in" className="skip-btn-primary inline-flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add walk-in
        </Link>
      </header>

      {total > 0 ? (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="Now serving" value={serving} tone="success" />
          <Stat label="Arrived" value={arrived} tone="caution" />
          <Stat label="Waiting" value={waiting} tone="neutral" />
        </div>
      ) : null}

      <section className="mt-6">
        {error ? (
          <div className="skip-card p-6 text-skip-accent">{error.message}</div>
        ) : (
          <QueueList entries={entries ?? []} />
        )}
      </section>

      {partner?.salon_id ? <QueueRealtime salonId={partner.salon_id} /> : null}
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "caution" | "neutral";
}) {
  const accent =
    tone === "success"
      ? "text-skip-success"
      : tone === "caution"
      ? "text-skip-caution"
      : "text-skip-ink";
  return (
    <div className="skip-card p-4">
      <div className={`text-3xl font-extrabold ${accent}`}>{value}</div>
      <div className="text-xs uppercase tracking-wider text-skip-stone mt-1 font-semibold">
        {label}
      </div>
    </div>
  );
}
