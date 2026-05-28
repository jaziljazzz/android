import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JoinForm } from "./JoinForm";

export const dynamic = "force-dynamic";

interface SalonDetail {
  salon: {
    id: string;
    name: string;
    tagline: string | null;
    type: string | null;
    area: string | null;
    address: string;
    cover_image: string | null;
    photos: string[] | null;
    rating: number | string;
    review_count: number;
  } | null;
  services: {
    id: string;
    name: string;
    category: string | null;
    price: number | string;
    default_duration: number;
    display_order: number;
  }[];
  stylists: {
    id: string;
    name: string;
    role: string | null;
    total_services: number;
    photo: string | null;
  }[];
  queue_ahead: number;
  eta_min: number;
  is_open: boolean;
}

export default async function CustomerSalonPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  // ONE round-trip for the whole page.
  const { data } = await supabase.rpc("customer_salon_detail", { p_salon_id: params.id });
  const detail = data as SalonDetail | null;
  if (!detail?.salon) notFound();

  const { salon, services, stylists, queue_ahead, eta_min, is_open } = detail;
  const noWait = is_open && queue_ahead === 0;

  return (
    <main className="max-w-3xl mx-auto px-5 py-6">
      <Link href="/c/home" prefetch className="text-sm font-medium text-skip-slate hover:text-skip-ink">
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
        {!is_open ? (
          <p className="mt-1 text-3xl font-extrabold text-skip-stone">Closed right now</p>
        ) : noWait ? (
          <p className="mt-1 text-3xl font-extrabold text-skip-success">No wait</p>
        ) : (
          <p className="mt-1 text-3xl font-extrabold text-skip-ink">
            ~{Math.max(5, Math.round(eta_min / 5) * 5)} min
          </p>
        )}
        {is_open ? (
          <p className="text-sm text-skip-stone mt-1">
            {queue_ahead} {queue_ahead === 1 ? "person" : "people"} ahead
          </p>
        ) : (
          <p className="text-sm text-skip-stone mt-1">Come back during opening hours.</p>
        )}
      </section>

      <h2 className="mt-8 text-lg font-bold text-skip-ink">Book your slot</h2>
      <JoinForm
        salonId={salon.id}
        services={(services ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          price: Number(s.price),
          default_duration: s.default_duration,
        }))}
        stylists={(stylists ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          role: s.role,
          total_services: s.total_services,
          photo: s.photo,
        }))}
        disabled={!is_open}
      />
    </main>
  );
}
