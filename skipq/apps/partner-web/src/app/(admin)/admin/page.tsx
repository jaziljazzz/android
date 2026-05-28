import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminSalonsPage() {
  const supabase = createClient();
  // Service-role-like: layout already verified admin. Read all salons.
  const { data: salons } = await supabase
    .from("salons")
    .select("id, name, area, city, status, rating, review_count, featured_until, joined_at")
    .order("joined_at", { ascending: false });

  const total = salons?.length ?? 0;
  const active = salons?.filter((s) => s.status === "active").length ?? 0;
  const featured = salons?.filter((s) => s.featured_until && new Date(s.featured_until) > new Date()).length ?? 0;

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 sm:py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">All salons</h1>
          <p className="mt-2 text-skip-slate">
            {total} total · {active} active · {featured} featured right now
          </p>
        </div>
        <Link href="/admin/salons/new" className="skip-btn-primary inline-flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Onboard salon
        </Link>
      </header>

      <section className="mt-6 space-y-2">
        {salons?.map((s) => {
          const isFeatured = s.featured_until && new Date(s.featured_until) > new Date();
          return (
            <Link
              key={s.id}
              href={`/admin/salons/${s.id}`}
              className="skip-card p-4 flex items-center gap-4 hover:border-skip-accent transition block"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-skip-ink">{s.name}</span>
                  <StatusPill status={s.status} />
                  {isFeatured ? (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-skip-accent text-white px-2 py-0.5 rounded-full">Featured</span>
                  ) : null}
                </div>
                <div className="text-xs text-skip-slate mt-1">
                  {[s.area, s.city].filter(Boolean).join(", ")} · joined{" "}
                  {new Date(s.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-skip-ink">
                  {s.review_count > 0 ? `${Number(s.rating).toFixed(1)} ★` : "—"}
                </div>
                <div className="text-[10px] text-skip-stone">{s.review_count} reviews</div>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "active"
      ? "bg-skip-successLo text-skip-success"
      : status === "suspended"
      ? "bg-skip-accentLo text-skip-accent"
      : "bg-skip-mist text-skip-slate";
  return (
    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}
