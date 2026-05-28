import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteService } from "./actions";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const supabase = createClient();
  const { data: services, error } = await supabase
    .from("services")
    .select("id, name, category, price, default_duration, gender, active")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">Services</h1>
          <p className="mt-2 text-skip-slate">
            What you offer, how long it takes, what it costs.
          </p>
        </div>
        <Link href="/dashboard/services/new" className="skip-btn-primary inline-flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New service
        </Link>
      </header>

      <section className="mt-6">
        {error ? (
          <div className="skip-card p-6 text-skip-accent">{error.message}</div>
        ) : services && services.length > 0 ? (
          <ul className="space-y-3">
            {services.map((s) => (
              <li key={s.id} className="skip-card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-skip-ink text-lg">{s.name}</div>
                  <div className="text-sm text-skip-slate mt-0.5 capitalize">
                    {s.category ?? "uncategorised"} · {s.default_duration} min ·{" "}
                    {s.gender ?? "all"}
                    {s.active ? "" : " · inactive"}
                  </div>
                </div>
                <div className="text-skip-ink font-extrabold text-xl">
                  ₹{Number(s.price).toFixed(0)}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/services/${s.id}`}
                    className="rounded-xl bg-skip-mist text-skip-slate font-semibold px-4 py-2 text-sm hover:bg-skip-stone/20 transition"
                  >
                    Edit
                  </Link>
                  <form action={deleteService}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="rounded-xl bg-skip-accentLo text-skip-accent font-semibold px-4 py-2 text-sm hover:bg-skip-accent hover:text-white transition"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="skip-card p-12 text-center">
            <h2 className="text-xl font-bold text-skip-ink">No services yet</h2>
            <p className="mt-1 text-skip-slate">
              Add a service so customers can book it.
            </p>
            <Link href="/dashboard/services/new" className="skip-btn-primary inline-flex mt-6">
              Add your first service
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
