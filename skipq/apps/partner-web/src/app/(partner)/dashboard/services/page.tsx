import { createClient } from "@/lib/supabase/server";

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
              <div>
                <div className="font-semibold text-skip-ink">{s.name}</div>
                <div className="text-xs text-skip-stone capitalize">
                  {s.category ?? "uncategorised"} · {s.default_duration} min ·{" "}
                  {s.gender ?? "all"}
                  {s.active ? "" : " · inactive"}
                </div>
              </div>
              <div className="text-skip-ink font-semibold">₹{Number(s.price).toFixed(0)}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-skip-stone/30 bg-white p-10 text-center text-skip-stone">
          No services yet. Add/edit support lands next.
        </div>
      )}
    </main>
  );
}
