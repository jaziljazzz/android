import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { QueueList } from "../QueueList";
import { QueueRealtime } from "../QueueRealtime";
import { requirePartner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MyQueuePage() {
  const { partner } = await requirePartner();
  const supabase = createClient();

  // Find this partner_user's stylist row (the link is partner_users.id ↔ stylists.partner_user_id)
  const { data: stylist } = await supabase
    .from("stylists")
    .select("id, name")
    .eq("partner_user_id", partner.id)
    .maybeSingle();

  if (!stylist) {
    return (
      <main className="px-6 py-8 sm:px-10 sm:py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink">My queue</h1>
        <p className="mt-4 text-skip-slate">
          You&apos;re signed in as <span className="font-semibold">{partner.role}</span>, not a stylist.
          The owner or receptionist can use the main{" "}
          <Link href="/dashboard" className="text-skip-accent font-semibold">Live queue</Link>.
        </p>
      </main>
    );
  }

  const { data: entries } = await supabase
    .from("queue_entries")
    .select(
      `
        id, position, status, joined_at, started_at,
        guest_name, guest_phone, notes, estimated_wait_min,
        stylists!queue_entries_stylist_id_fkey ( id, name ),
        users ( id, name )
      `,
    )
    .eq("stylist_id", stylist.id)
    .in("status", ["waiting", "arrived", "serving"])
    .order("joined_at", { ascending: true });

  const active = entries?.length ?? 0;
  return (
    <main className="px-4 py-5 sm:px-10 sm:py-10 max-w-4xl">
      <header className="sticky top-0 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-skip-mist/95 backdrop-blur z-10 border-b border-skip-stone/10 sm:border-none">
        <h1 className="text-xl sm:text-4xl font-extrabold text-skip-ink leading-tight">
          {stylist.name} · {active} in queue
        </h1>
        <p className="hidden sm:block mt-2 text-skip-slate">
          Only customers assigned to{" "}
          <span className="font-semibold text-skip-ink">{stylist.name}</span>.
        </p>
      </header>

      <section className="mt-4 sm:mt-6">
        <QueueList entries={entries ?? []} />
      </section>

      {partner.salon_id ? <QueueRealtime salonId={partner.salon_id} /> : null}
    </main>
  );
}
