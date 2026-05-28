import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteStylist } from "./actions";

export const dynamic = "force-dynamic";

export default async function StylistsPage() {
  const supabase = createClient();
  const { data: stylists, error } = await supabase
    .from("stylists")
    .select("id, name, role, specialty, status, gender_serves, total_services")
    .order("name", { ascending: true });

  return (
    <main className="p-8 max-w-4xl">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-skip-ink">Stylists</h1>
          <p className="mt-1 text-skip-stone text-sm">Who&apos;s on the floor today.</p>
        </div>
        <Link
          href="/dashboard/stylists/new"
          className="rounded-lg bg-skip-accent text-white font-semibold px-4 py-2 hover:bg-skip-accentHi transition"
        >
          + New stylist
        </Link>
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
              <div className="min-w-0">
                <div className="font-semibold text-skip-ink">
                  {s.name}{" "}
                  <span className="text-xs font-normal text-skip-stone">{s.role ?? ""}</span>
                </div>
                <div className="text-xs text-skip-stone">
                  {s.specialty ?? "—"} · serves {(s.gender_serves ?? []).join(", ") || "all"}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wide text-skip-stone">
                    {s.status}
                  </div>
                  <div className="text-xs text-skip-stone">{s.total_services} services</div>
                </div>
                <Link
                  href={`/dashboard/stylists/${s.id}`}
                  className="text-sm font-medium text-skip-accent hover:text-skip-accentHi"
                >
                  Edit
                </Link>
                <form action={deleteStylist}>
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
          No stylists yet. Tap <span className="font-medium">+ New stylist</span> to add one.
        </div>
      )}
    </main>
  );
}
