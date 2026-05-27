import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: partner } = await supabase
    .from("partner_users")
    .select("salon_id")
    .single();

  const salonId = partner?.salon_id;
  if (!salonId) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-skip-ink">Salon profile</h1>
        <p className="mt-4 text-skip-stone">No salon linked.</p>
      </main>
    );
  }

  const { data: salon, error } = await supabase
    .from("salons")
    .select("name, tagline, type, address, area, city, state, phone, email, status, hours")
    .eq("id", salonId)
    .single();

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-skip-ink">Salon profile</h1>
        <p className="mt-4 text-red-600">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold text-skip-ink">Salon profile</h1>
        <p className="mt-1 text-skip-stone text-sm">
          What customers see when they tap your salon.
        </p>
      </header>

      <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Row label="Name" value={salon.name} />
        <Row label="Tagline" value={salon.tagline ?? "—"} />
        <Row label="Type" value={salon.type ?? "—"} />
        <Row label="Status" value={salon.status} />
        <Row label="Address" value={salon.address} fullSpan />
        <Row label="Area" value={[salon.area, salon.city, salon.state].filter(Boolean).join(", ")} />
        <Row label="Phone" value={salon.phone ?? "—"} />
        <Row label="Email" value={salon.email ?? "—"} />
      </dl>

      <p className="mt-8 text-xs text-skip-stone">
        Edit support lands next. For now, ask the skipQ team for changes.
      </p>
    </main>
  );
}

function Row({ label, value, fullSpan }: { label: string; value: string; fullSpan?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border border-skip-stone/15 p-4 ${fullSpan ? "sm:col-span-2" : ""}`}>
      <dt className="text-[10px] uppercase tracking-wide font-bold text-skip-stone">{label}</dt>
      <dd className="mt-1 text-skip-ink">{value}</dd>
    </div>
  );
}
