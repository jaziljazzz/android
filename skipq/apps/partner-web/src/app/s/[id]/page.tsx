import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OpenInAppButton } from "./OpenInAppButton";

export const dynamic = "force-dynamic";

export default async function SalonLandingPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, tagline, area, city, address, status, cover_image, rating, review_count")
    .eq("id", params.id)
    .eq("status", "active")
    .maybeSingle();

  if (!salon) notFound();

  const deepLink = `skipq://salon/${salon.id}`;

  return (
    <main className="min-h-screen bg-skip-mist flex flex-col">
      <div className="max-w-md w-full mx-auto px-6 py-10 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-skip-accent font-extrabold tracking-tight">
            SkipQ
          </Link>
          <span className="text-[10px] uppercase tracking-wider font-bold text-skip-stone">
            Scan to skip the wait
          </span>
        </div>

        <section className="mt-8 skip-card overflow-hidden">
          {salon.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={salon.cover_image} alt="" className="w-full h-48 object-cover" />
          ) : null}
          <div className="p-6">
            <h1 className="text-2xl font-extrabold text-skip-ink leading-tight">{salon.name}</h1>
            {salon.tagline ? (
              <p className="mt-1 text-skip-slate text-sm">{salon.tagline}</p>
            ) : null}
            {salon.area || salon.city ? (
              <p className="mt-1 text-skip-stone text-xs">
                {[salon.area, salon.city].filter(Boolean).join(", ")}
              </p>
            ) : null}
            {salon.review_count && salon.review_count > 0 ? (
              <p className="mt-3 text-sm font-semibold text-skip-ink">
                ★ {Number(salon.rating).toFixed(1)} · {salon.review_count} review{salon.review_count === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>
        </section>

        <OpenInAppButton deepLink={deepLink} />

        <p className="mt-6 text-center text-xs text-skip-stone">
          Don&apos;t have the app yet? It auto-installs the first time. Or ask the
          reception to add you as a walk-in.
        </p>
      </div>

      <footer className="text-center text-xs text-skip-stone py-6">
        Powered by SkipQ · skip the wait
      </footer>
    </main>
  );
}
