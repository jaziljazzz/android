import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { partner } = await requirePartner();
  const supabase = createClient();

  const { data: customers, error } = await supabase
    .from("customers_salons")
    .select("id, phone, first_visit_at, last_visit_at, total_visits, total_spend, acquired_via")
    .eq("salon_id", partner.salon_id)
    .order("last_visit_at", { ascending: false, nullsFirst: false })
    .limit(200);

  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">Customers</h1>
          <p className="mt-2 text-skip-slate">
            Everyone who&apos;s visited your salon, automatically captured.
          </p>
        </div>
      </header>

      {error ? (
        <p className="mt-6 text-skip-accent">{error.message}</p>
      ) : customers && customers.length > 0 ? (
        <section className="mt-6">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-skip-stone">
            <div className="col-span-3">Phone</div>
            <div className="col-span-2 text-center">Visits</div>
            <div className="col-span-2 text-right">Spent</div>
            <div className="col-span-2">Acquired via</div>
            <div className="col-span-3 text-right">Last visit</div>
          </div>
          <ul className="space-y-2">
            {customers.map((c) => (
              <li
                key={c.id}
                className="skip-card p-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center"
              >
                <div className="sm:col-span-3 font-semibold text-skip-ink">{c.phone}</div>
                <div className="sm:col-span-2 sm:text-center text-sm">
                  <span className="text-skip-stone sm:hidden">Visits: </span>
                  <span className="font-bold text-skip-ink">{c.total_visits}</span>
                </div>
                <div className="sm:col-span-2 sm:text-right text-sm">
                  <span className="text-skip-stone sm:hidden">Spent: </span>
                  <span className="font-bold text-skip-ink">₹{Number(c.total_spend).toFixed(0)}</span>
                </div>
                <div className="sm:col-span-2 text-xs">
                  <span
                    className={`uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                      c.acquired_via === "skipq"
                        ? "bg-skip-accentLo text-skip-accent"
                        : "bg-skip-mist text-skip-slate"
                    }`}
                  >
                    {c.acquired_via ?? "walk-in"}
                  </span>
                </div>
                <div className="sm:col-span-3 sm:text-right text-xs text-skip-stone">
                  {c.last_visit_at
                    ? new Date(c.last_visit_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="mt-6 skip-card p-12 text-center">
          <h2 className="text-xl font-bold text-skip-ink">No customers yet</h2>
          <p className="mt-1 text-skip-slate">
            Every queue join (app or walk-in) automatically lands here.
          </p>
          <Link href="/dashboard/walk-in" className="skip-btn-primary inline-flex mt-6">
            Add your first walk-in
          </Link>
        </div>
      )}

      <p className="mt-10 text-xs text-skip-stone">
        Customers acquired via SkipQ are billed at ₹50/lead (first visit only). Walk-ins and
        salon-existing customers are free.
      </p>
    </main>
  );
}
