import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteStylist } from "./actions";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function StylistsPage() {
  const supabase = createClient();
  const { data: stylists, error } = await supabase
    .from("stylists")
    .select("id, name, role, specialty, photo, status, gender_serves, total_services")
    .order("name", { ascending: true });

  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-skip-ink leading-tight">Stylists</h1>
          <p className="mt-2 text-skip-slate">Who&apos;s on the floor today.</p>
        </div>
        <Link href="/dashboard/stylists/new" className="skip-btn-primary inline-flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New stylist
        </Link>
      </header>

      <section className="mt-6">
        {error ? (
          <div className="skip-card p-6 text-skip-accent">{error.message}</div>
        ) : stylists && stylists.length > 0 ? (
          <ul className="space-y-3">
            {stylists.map((s) => {
              const onShift = s.status !== "off";
              return (
                <li key={s.id} className="skip-card p-4 flex items-center gap-4">
                  {s.photo ? (
                    <img
                      src={s.photo}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover bg-skip-mist"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-skip-accentLo text-skip-accent font-bold flex items-center justify-center">
                      {initials(s.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-skip-ink text-lg">
                      {s.name}
                      {s.role ? (
                        <span className="text-sm font-normal text-skip-stone ml-2">{s.role}</span>
                      ) : null}
                    </div>
                    <div className="text-sm text-skip-slate mt-0.5 truncate">
                      {s.specialty ?? "—"} · serves {(s.gender_serves ?? []).join(", ") || "all"}
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${
                        onShift
                          ? "bg-skip-successLo text-skip-success"
                          : "bg-skip-mist text-skip-stone"
                      }`}
                    >
                      {s.status}
                    </span>
                    <div className="text-xs text-skip-stone mt-2">{s.total_services} services</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/stylists/${s.id}`}
                      className="rounded-xl bg-skip-mist text-skip-slate font-semibold px-4 py-2 text-sm hover:bg-skip-stone/20 transition"
                    >
                      Edit
                    </Link>
                    <form action={deleteStylist}>
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
              );
            })}
          </ul>
        ) : (
          <div className="skip-card p-12 text-center">
            <h2 className="text-xl font-bold text-skip-ink">No stylists yet</h2>
            <p className="mt-1 text-skip-slate">Add your first stylist to start taking bookings.</p>
            <Link href="/dashboard/stylists/new" className="skip-btn-primary inline-flex mt-6">
              Add your first stylist
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
