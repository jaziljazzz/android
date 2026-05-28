import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminQueuesPage() {
  const supabase = createClient();
  const { data: entries } = await supabase
    .from("queue_entries")
    .select(
      `id, salon_id, status, joined_at, started_at, completed_at,
       total_price, is_new_customer, source,
       salons ( name, area )`,
    )
    .order("joined_at", { ascending: false })
    .limit(50);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 sm:py-10">
      <header>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">Live activity</h1>
        <p className="mt-2 text-skip-slate">
          Last 50 queue entries across every SkipQ salon. Internal-only view.
        </p>
      </header>

      <ul className="mt-6 space-y-2">
        {(entries ?? []).map((e) => {
          const salon = Array.isArray(e.salons) ? e.salons[0] : e.salons;
          return (
            <li key={e.id} className="skip-card p-4 grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-4 items-center text-sm">
              <Link href={`/admin/salons/${e.salon_id}`} className="font-semibold text-skip-ink hover:text-skip-accent">
                {salon?.name}
              </Link>
              <span className="text-skip-stone text-xs">{salon?.area}</span>
              <span className="capitalize">
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                  e.status === "completed" ? "bg-skip-successLo text-skip-success" :
                  e.status === "serving" ? "bg-skip-accent/20 text-skip-accent" :
                  e.status === "arrived" ? "bg-skip-cautionLo text-skip-caution" :
                  e.status === "cancelled" || e.status === "no_show" ? "bg-skip-mist text-skip-stone" :
                  "bg-skip-mist text-skip-slate"
                }`}>{e.status}</span>
              </span>
              <span className="text-xs text-skip-stone">
                {new Date(e.joined_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
              </span>
              <span className="text-xs flex items-center justify-end gap-2">
                {e.is_new_customer ? <span className="text-[10px] uppercase tracking-wider font-bold bg-skip-accentLo text-skip-accent px-2 py-0.5 rounded-full">NEW</span> : null}
                <span className="text-[10px] uppercase tracking-wider font-bold bg-skip-mist text-skip-slate px-2 py-0.5 rounded-full">{e.source}</span>
                {e.total_price ? <span className="font-bold text-skip-ink">₹{Number(e.total_price).toFixed(0)}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
