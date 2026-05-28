import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PastVisits() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="max-w-3xl mx-auto px-5 py-10 text-center">
        <h1 className="text-2xl font-extrabold text-skip-ink">Sign in to see history</h1>
        <Link
          href="/c/login?next=/c/history"
          className="skip-btn-primary inline-block mt-6"
        >
          Sign in
        </Link>
      </main>
    );
  }

  const { data: rows } = await supabase
    .from("queue_entries")
    .select(
      `id, status, joined_at, completed_at, total_price,
       salons ( name, area ),
       queue_entry_services ( services ( name ) )`,
    )
    .eq("user_id", user.id)
    .in("status", ["completed", "no_show", "cancelled"])
    .order("joined_at", { ascending: false })
    .limit(50);

  return (
    <main className="max-w-3xl mx-auto px-5 py-5">
      <h1 className="text-2xl font-extrabold text-skip-ink">Past visits</h1>
      <p className="mt-1 text-skip-stone text-sm">Last 50 bookings.</p>

      {!rows?.length ? (
        <p className="mt-8 text-skip-stone text-sm">
          You haven&apos;t booked any salons yet. Start with{" "}
          <Link href="/c/home" className="text-skip-accent font-semibold underline">
            home
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-5 space-y-2">
          {rows.map((r) => {
            const salon = Array.isArray(r.salons) ? r.salons[0] : r.salons;
            const services = (r.queue_entry_services ?? [])
              .map((qes) => {
                const s = Array.isArray(qes.services) ? qes.services[0] : qes.services;
                return s?.name;
              })
              .filter((n): n is string => !!n);
            return (
              <li key={r.id} className="skip-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-skip-ink truncate">{salon?.name ?? "Salon"}</p>
                    <p className="text-xs text-skip-stone mt-0.5">
                      {new Date(r.joined_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {salon?.area ? ` · ${salon.area}` : ""}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      r.status === "completed"
                        ? "bg-skip-successLo text-skip-success"
                        : r.status === "no_show"
                        ? "bg-skip-mist text-skip-stone"
                        : "bg-skip-mist text-skip-stone"
                    }`}
                  >
                    {r.status === "no_show" ? "no-show" : r.status}
                  </span>
                </div>
                {services.length > 0 ? (
                  <p className="mt-2 text-sm text-skip-ink font-semibold">
                    {services.join(" + ")}
                    {r.total_price ? ` · ₹${Number(r.total_price).toFixed(0)}` : ""}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
