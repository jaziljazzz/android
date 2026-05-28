import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CustomerHome() {
  const supabase = createClient();
  // Public — anyone can browse. Sign-in is only asked at the moment
  // of joining a queue. RLS-safe RPC; falls back to "everyone" audience.
  const { data: partnership } = await supabase.rpc("current_partnership_for_me");
  const banner = Array.isArray(partnership) ? partnership[0] : null;

  const { data: salons } = await supabase
    .from("salons")
    .select(
      "id, name, tagline, area, city, type, rating, review_count, status, featured_until, cover_image, hours",
    )
    .eq("status", "active")
    .order("featured_until", { ascending: false, nullsFirst: false })
    .order("rating", { ascending: false });

  // Live ETAs + queue counts per salon (in parallel).
  // Both RPCs are security-definer so this works for anonymous visitors.
  const enriched = await Promise.all(
    (salons ?? []).map(async (s) => {
      const [{ data: count }, { data: eta }] = await Promise.all([
        supabase.rpc("salon_active_count", { p_salon_id: s.id }),
        supabase.rpc("salon_live_eta", { p_salon_id: s.id }),
      ]);
      const featured = s.featured_until && new Date(s.featured_until) > new Date();
      return {
        ...s,
        queue_ahead: typeof count === "number" ? count : 0,
        eta_min: Number(eta ?? 0),
        featured,
      };
    }),
  );

  return (
    <main className="max-w-3xl mx-auto px-5 py-6">
      <h1 className="text-3xl font-extrabold text-skip-ink leading-tight">
        Book your slot,<br />
        <span className="text-skip-accent">skip the line.</span>
      </h1>

      {banner ? (
        <Link
          href={banner.cta_url || "#"}
          className="mt-6 block bg-skip-ink text-white rounded-2xl p-4"
        >
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/70">
            {banner.brand_name}
          </p>
          <p className="mt-1 font-bold">{banner.perk_text}</p>
        </Link>
      ) : null}

      <h2 className="mt-8 text-lg font-bold text-skip-ink">Active salons</h2>
      <ul className="mt-3 space-y-2">
        {enriched.map((s) => (
          <li key={s.id}>
            <Link
              href={`/c/salon/${s.id}`}
              className="skip-card p-4 flex items-center gap-4 hover:border-skip-accent transition"
            >
              {s.cover_image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={s.cover_image} alt="" className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-skip-mist" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-skip-ink truncate">{s.name}</p>
                  {s.featured ? (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-skip-accent text-white px-1.5 py-0.5 rounded-full">
                      Featured
                    </span>
                  ) : null}
                  {s.review_count && s.review_count > 0 ? (
                    <span className="text-xs text-skip-stone">
                      ★ {Number(s.rating).toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-skip-stone truncate">
                  {s.tagline ?? (s.type ? `${s.type[0]?.toUpperCase()}${s.type.slice(1)} salon` : "Salon")}
                  {s.area ? ` · ${s.area}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                {s.queue_ahead === 0 ? (
                  <p className="text-xs font-bold text-skip-success">No wait</p>
                ) : (
                  <p className="text-xs font-bold text-skip-ink">
                    {Math.max(5, Math.round(s.eta_min / 5) * 5)} min
                  </p>
                )}
                <p className="text-[10px] text-skip-stone">
                  {s.queue_ahead} in queue
                </p>
              </div>
            </Link>
          </li>
        ))}
        {!enriched.length ? (
          <li className="text-skip-stone text-sm">No active salons yet.</li>
        ) : null}
      </ul>
    </main>
  );
}
