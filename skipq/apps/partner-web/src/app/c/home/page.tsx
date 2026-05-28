import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { SearchAndFilters } from "./SearchAndFilters";
import { PlusUpsell } from "@/components/PlusUpsell";
import { BrandHero } from "@/components/BrandHero";
import { BrandVideo } from "@/components/BrandVideo";
import { BrandStrip } from "@/components/BrandStrip";
import { fetchPlacements } from "@/lib/placements";

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

function readCity(): string | null {
  try {
    const raw = cookies().get("skipq_loc")?.value;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    if (parsed?.sub) return String(parsed.sub);
    if (parsed?.place) return String(parsed.place);
    return null;
  } catch {
    return null;
  }
}

export default async function CustomerHome() {
  const supabase = createClient();
  const city = readCity();
  const [
    { data: salonsData },
    { data: { user } },
    heroPlacements,
    videoPlacements,
    stripPlacements,
  ] = await Promise.all([
    supabase.rpc("customer_home_salons"),
    supabase.auth.getUser(),
    fetchPlacements("home_hero", city, 5),
    fetchPlacements("home_video", city, 1),
    fetchPlacements("home_strip", city, 8),
  ]);
  const salons = (salonsData ?? []) as HomeSalon[];
  const videoAd = videoPlacements[0] ?? null;

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

      <BrandHero placements={heroPlacements} />

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

      {videoAd ? <BrandVideo placement={videoAd} /> : null}
      <BrandStrip placements={stripPlacements} title="From our partners" />
    </main>
  );
}
