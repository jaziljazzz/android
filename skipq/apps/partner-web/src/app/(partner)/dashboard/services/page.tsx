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
    <main className="p-8 max-w-4xl">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-skip-ink">Services</h1>
          <p className="mt-1 text-skip-stone text-sm">
            What you offer, how long it takes, what it costs.
          </p>
        </div>
        <Link
          href="/dashboard/services/new"
          className="rounded-lg bg-skip-accent text-white font-semibold px-4 py-2 hover:bg-skip-accentHi transition"
        >
          + New service
        </Link>
      </header>

      {error ? (
        <p className="mt-6 text-red-600">{error.message}</p>
      ) : services && services.length > 0 ? (
        <ul className="mt-6 space-y-2">
          {services.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between bg-white rounded-xl border border-skip-stone/15 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="font-semibold text-skip-ink">{s.name}</div>
                <div className="text-xs text-skip-stone capitalize">
                  {s.category ?? "uncategorised"} · {s.default_duration} min ·{" "}
                  {s.gender ?? "all"}
                  {s.active ? "" : " · inactive"}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-skip-ink font-semibold">₹{Number(s.price).toFixed(0)}</div>
                <Link
                  href={`/dashboard/services/${s.id}`}
                  className="text-sm font-medium text-skip-accent hover:text-skip-accentHi"
                >
                  Edit
                </Link>
                <form action={deleteService}>
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    className="text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-skip-stone/30 bg-white p-10 text-center text-skip-stone">
          No services yet. Tap <span className="font-medium">+ New service</span> to add one.
        </div>
      )}
    </main>
  );
}
