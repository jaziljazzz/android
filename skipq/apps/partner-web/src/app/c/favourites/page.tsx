import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CustomerFavourites() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="max-w-3xl mx-auto px-5 py-10 text-center">
        <h1 className="text-2xl font-extrabold text-skip-ink">Sign in to save favourites</h1>
        <Link
          href="/c/login?next=/c/favourites"
          className="skip-btn-primary inline-block mt-6"
        >
          Sign in
        </Link>
      </main>
    );
  }

  const { data: favs } = await supabase
    .from("favourites")
    .select(
      `salon_id,
       salons ( id, name, area, cover_image, rating, review_count, status )`,
    )
    .eq("user_id", user.id);

  const rows =
    (favs ?? [])
      .map((f) => (Array.isArray(f.salons) ? f.salons[0] : f.salons))
      .filter((s): s is { id: string; name: string; area: string | null; cover_image: string | null; rating: number; review_count: number; status: string } => !!s && s.status === "active");

  return (
    <main className="max-w-3xl mx-auto px-5 py-6">
      <h1 className="text-2xl font-extrabold text-skip-ink">Favourites</h1>
      {rows.length === 0 ? (
        <p className="mt-4 text-skip-stone text-sm">
          You haven&apos;t favourited any salons yet. Tap the heart on a salon page to save it
          here.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((s) => (
            <li key={s.id}>
              <Link
                href={`/c/salon/${s.id}`}
                prefetch
                className="skip-card p-4 flex items-center gap-4 active:opacity-70"
              >
                {s.cover_image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={s.cover_image}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-skip-mist" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-skip-ink truncate">{s.name}</p>
                  <p className="text-xs text-skip-stone truncate">
                    {s.area ?? "Salon"}
                    {s.review_count > 0 ? ` · ★ ${Number(s.rating).toFixed(1)}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
