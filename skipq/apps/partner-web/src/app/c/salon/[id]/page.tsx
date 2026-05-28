import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JoinForm } from "./JoinForm";

export const dynamic = "force-dynamic";

export default async function CustomerSalonPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/c/login`);

  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, tagline, type, area, city, address, status, cover_image, photos, hours, rating, review_count")
    .eq("id", params.id)
    .eq("status", "active")
    .maybeSingle();
  if (!salon) notFound();

  const [{ data: services }, { data: stylists }, { data: eta }, { count: queueAhead }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, category, price, default_duration")
      .eq("salon_id", salon.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("stylists")
      .select("id, name, role, total_services, photo")
      .eq("salon_id", salon.id)
      .neq("status", "off")
      .order("name"),
    supabase.rpc("salon_live_eta", { p_salon_id: salon.id }),
    supabase
      .from("queue_entries")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salon.id)
      .in("status", ["waiting", "arrived", "serving", "waiting_deposit"]),
  ]);

  const etaMin = Number(eta ?? 0);
  const ahead = queueAhead ?? 0;

  return (
    <main className="max-w-3xl mx-auto px-5 py-6">
      <Link href="/c/home" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back
      </Link>

      {salon.cover_image ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={salon.cover_image}
          alt=""
          className="mt-4 w-full h-48 object-cover rounded-2xl"
        />
      ) : null}

      <h1 className="mt-4 text-2xl font-extrabold text-skip-ink">{salon.name}</h1>
      {salon.tagline ? (
        <p className="text-skip-slate">{salon.tagline}</p>
      ) : null}
      <p className="text-xs text-skip-stone mt-1">{salon.address}</p>

      <section className="mt-6 skip-card p-5">
        <p className="text-[10px] uppercase tracking-wider font-bold text-skip-stone">
          Live waiting time
        </p>
        {ahead === 0 ? (
          <p className="mt-1 text-3xl font-extrabold text-skip-success">No wait</p>
        ) : (
          <p className="mt-1 text-3xl font-extrabold text-skip-ink">
            ~{Math.max(5, Math.round(etaMin / 5) * 5)} min
          </p>
        )}
        <p className="text-sm text-skip-stone mt-1">
          {ahead} {ahead === 1 ? "person" : "people"} ahead
        </p>
      </section>

      <h2 className="mt-8 text-lg font-bold text-skip-ink">Book your slot</h2>
      <JoinForm
        salonId={salon.id}
        services={(services ?? []).map((s) => ({
          ...s,
          price: Number(s.price),
        }))}
        stylists={stylists ?? []}
      />
    </main>
  );
}
