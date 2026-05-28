import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface HomeSalon {
  id: string;
  name: string;
  tagline: string | null;
  area: string | null;
  city: string;
  type: string | null;
  rating: number | string | null;
  review_count: number | null;
  cover_image: string | null;
  featured: boolean;
  queue_ahead: number;
  eta_min: number;
  is_open: boolean;
}

export default async function CustomerHome() {
  const supabase = createClient();
  // ONE round-trip for the whole page instead of 12 (previously 1 + 5×2 + 1).
  const [{ data: partnership }, { data: salonsData }] = await Promise.all([
    supabase.rpc("current_partnership_for_me"),
    supabase.rpc("customer_home_salons"),
  ]);
  const banner = Array.isArray(partnership) ? partnership[0] : null;
  const salons = (salonsData ?? []) as HomeSalon[];

  return (
    <main className="max-w-3xl mx-auto px-5 py-6">
      <h1 className="text-3xl font-extrabold text-skip-ink leading-tight">
        Book your slot,<br />
        <span className="text-skip-accent">skip the line.</span>
      </h1>

      {banner ? (
        <Link
          href={banner.cta_url || "#"}
          prefetch
          className="mt-6 block bg-skip-ink text-white rounded-2xl p-4 active:opacity-80 transition"
        >
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/70">
            {banner.brand_name}
          </p>
          <p className="mt-1 font-bold">{banner.perk_text}</p>
        </Link>
      ) : null}

      <h2 className="mt-8 text-lg font-bold text-skip-ink">Active salons</h2>
      <ul className="mt-3 space-y-2">
        {salons.map((s) => {
          const closed = !s.is_open;
          const noWait = s.is_open && s.queue_ahead === 0;
          const etaDisplay = closed
            ? "Closed"
            : noWait
            ? "No wait"
            : `${Math.max(5, Math.round(s.eta_min / 5) * 5)} min`;

          return (
            <li key={s.id}>
              <Link
                href={`/c/salon/${s.id}`}
                prefetch
                className="skip-card p-4 flex items-center gap-4 hover:border-skip-accent active:opacity-70 transition select-none"
              >
                {s.cover_image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={s.cover_image}
                    alt=""
                    loading="lazy"
                    className="w-14 h-14 rounded-xl object-cover"
                  />
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
                    {s.tagline ??
                      (s.type ? `${s.type[0]?.toUpperCase()}${s.type.slice(1)} salon` : "Salon")}
                    {s.area ? ` · ${s.area}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-xs font-bold ${
                      closed
                        ? "text-skip-stone"
                        : noWait
                        ? "text-skip-success"
                        : "text-skip-ink"
                    }`}
                  >
                    {etaDisplay}
                  </p>
                  {!closed ? (
                    <p className="text-[10px] text-skip-stone">{s.queue_ahead} in queue</p>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
        {!salons.length ? (
          <li className="text-skip-stone text-sm">No active salons yet.</li>
        ) : null}
      </ul>
    </main>
  );
}
