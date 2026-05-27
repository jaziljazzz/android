import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StylistsPage() {
  const supabase = createClient();
  const { data: stylists, error } = await supabase
    .from("stylists")
    .select("id, name, role, specialty, status, gender_serves, total_services, rating")
    .order("name", { ascending: true });

  return (
    <main className="p-8 max-w-4xl">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-skip-ink">Stylists</h1>
          <p className="mt-1 text-skip-stone text-sm">
            Who&apos;s on the floor today.
          </p>
        </div>
      </header>

      {error ? (
        <p className="mt-6 text-red-600">{error.message}</p>
      ) : stylists && stylists.length > 0 ? (
        <ul className="mt-6 space-y-2">
          {stylists.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between bg-white rounded-xl border border-skip-stone/15 px-4 py-3"
            >
              <div>
                <div className="font-semibold text-skip-ink">
                  {s.name}{" "}
                  <span className="text-xs font-normal text-skip-stone">
                    {s.role ?? ""}
                  </span>
                </div>
                <div className="text-xs text-skip-stone">
                  {s.specialty ?? "—"} · serves {(s.gender_serves ?? []).join(", ") || "all"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wide text-skip-stone">
                  {s.status}
                </div>
                <div className="text-xs text-skip-stone">
                  {s.total_services} services
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-skip-stone/30 bg-white p-10 text-center text-skip-stone">
          No stylists yet. Add/edit support lands next.
        </div>
      )}
    </main>
  );
}
