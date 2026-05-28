import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StyleMemory() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="max-w-3xl mx-auto px-5 py-10 text-center">
        <h1 className="text-2xl font-extrabold text-skip-ink">Sign in to see your styles</h1>
        <Link
          href="/c/login?next=/c/style-memory"
          className="skip-btn-primary inline-block mt-6"
        >
          Sign in
        </Link>
      </main>
    );
  }

  const { data: rows } = await supabase
    .from("style_records")
    .select(
      `id, service_summary, customer_notes, stylist_notes, photos, rating, created_at,
       salons ( name )`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <main className="max-w-3xl mx-auto px-5 py-5">
      <h1 className="text-2xl font-extrabold text-skip-ink">Style memory</h1>
      <p className="mt-1 text-skip-stone text-sm">
        Your saved cuts + notes from past visits.
      </p>

      {!rows?.length ? (
        <p className="mt-8 text-skip-stone text-sm">
          Nothing saved yet. After your next salon visit, add notes and photos to remember
          what you got.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {rows.map((r) => {
            const salon = Array.isArray(r.salons) ? r.salons[0] : r.salons;
            return (
              <li key={r.id} className="skip-card overflow-hidden">
                {r.photos && r.photos.length > 0 ? (
                  <div className="flex gap-1 overflow-x-auto">
                    {r.photos.map((p, i) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={i}
                        src={p}
                        alt=""
                        className="h-40 w-40 object-cover shrink-0"
                      />
                    ))}
                  </div>
                ) : null}
                <div className="p-4">
                  <p className="font-bold text-skip-ink">
                    {r.service_summary ?? "Visit"}
                  </p>
                  <p className="text-xs text-skip-stone mt-0.5">
                    {salon?.name ?? "Salon"} ·{" "}
                    {new Date(r.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {r.customer_notes ? (
                    <p className="mt-2 text-sm text-skip-slate">{r.customer_notes}</p>
                  ) : null}
                  {r.stylist_notes ? (
                    <p className="mt-1 text-xs text-skip-stone italic">
                      Stylist: {r.stylist_notes}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
