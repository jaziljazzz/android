import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SearchAndFilters } from "./SearchAndFilters";
import { PlusUpsell } from "@/components/PlusUpsell";

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
  const [{ data: partnership }, { data: salonsData }, { data: { user } }] = await Promise.all([
    supabase.rpc("current_partnership_for_me"),
    supabase.rpc("customer_home_salons"),
    supabase.auth.getUser(),
  ]);
  const banner = Array.isArray(partnership) ? partnership[0] : null;
  const salons = (salonsData ?? []) as HomeSalon[];

  let isPlus = false;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("plus_until")
      .eq("id", user.id)
      .maybeSingle();
    isPlus = Boolean(profile?.plus_until && new Date(profile.plus_until) > new Date());
  }

  return (
    <main className="max-w-3xl mx-auto px-5 pt-4 pb-8">
      <PlusUpsell alreadyPlus={isPlus} />
      <SearchAndFilters />

      {banner ? (
        <Link
          href={banner.cta_url || "#"}
          prefetch
          className="mt-5 block bg-skip-ink text-white rounded-2xl p-4 active:opacity-80 transition"
        >
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/70">
            {banner.brand_name}
          </p>
          <p className="mt-1 font-bold text-sm">{banner.perk_text}</p>
        </Link>
      ) : null}

      <h2 className="mt-6 text-base font-extrabold text-skip-ink uppercase tracking-wide">
        Salons near you
      </h2>

      <ul className="mt-3 space-y-2.5" data-salon-list>
        {salons.map((s) => {
          const closed = !s.is_open;
          const noWait = s.is_open && s.queue_ahead === 0;
          const etaDisplay = closed
            ? "Closed"
            : noWait
            ? "No wait"
            : `${Math.max(5, Math.round(s.eta_min / 5) * 5)} min`;

          const searchHaystack = [
            s.name,
            s.area ?? "",
            s.tagline ?? "",
            s.type ?? "",
          ]
            .join(" ")
            .toLowerCase();

          return (
            <li
              key={s.id}
              data-salon
              data-type={s.type ?? "all"}
              data-search={searchHaystack}
              data-status={closed ? "closed" : "open"}
              data-nowait={noWait ? "1" : "0"}
              data-rating={Number(s.rating ?? 0)}
            >
              <Link
                href={`/c/salon/${s.id}`}
                prefetch
                className="block bg-white rounded-2xl overflow-hidden active:opacity-70 transition select-none shadow-card"
              >
                {s.cover_image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={s.cover_image}
                    alt=""
                    loading="lazy"
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-skip-mist" />
                )}
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-skip-ink truncate text-base leading-tight">
                        {s.name}
                      </p>
                      <p className="text-xs text-skip-stone truncate mt-0.5">
                        {s.tagline ??
                          (s.type
                            ? `${s.type[0]?.toUpperCase()}${s.type.slice(1)} salon`
                            : "Salon")}
                        {s.area ? ` · ${s.area}` : ""}
                      </p>
                    </div>
                    {s.review_count && s.review_count > 0 ? (
                      <span className="bg-skip-success text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shrink-0">
                        {Number(s.rating).toFixed(1)}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {s.featured ? (
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-skip-accent text-white px-2 py-0.5 rounded">
                        Featured
                      </span>
                    ) : null}
                    <span
                      className={`text-xs font-bold ${
                        closed
                          ? "text-skip-stone"
                          : noWait
                          ? "text-skip-success"
                          : "text-skip-ink"
                      }`}
                    >
                      {etaDisplay}
                    </span>
                    {!closed && s.queue_ahead > 0 ? (
                      <span className="text-xs text-skip-stone">
                        · {s.queue_ahead} in queue
                      </span>
                    ) : null}
                  </div>
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
