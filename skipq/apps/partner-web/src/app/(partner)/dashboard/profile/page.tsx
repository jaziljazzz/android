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
      <main className="px-6 py-8 sm:px-10 sm:py-10">
        <h1 className="text-4xl font-extrabold text-skip-ink">Salon profile</h1>
        <p className="mt-4 text-skip-slate">No salon linked.</p>
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
      <main className="px-6 py-8 sm:px-10 sm:py-10">
        <h1 className="text-4xl font-extrabold text-skip-ink">Salon profile</h1>
        <p className="mt-4 text-skip-accent">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <header>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">Salon profile</h1>
        <p className="mt-2 text-skip-slate">What customers see when they tap your salon.</p>
      </header>

      <dl className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Row label="Name" value={salon.name} />
        <Row label="Status" value={salon.status} />
        <Row label="Tagline" value={salon.tagline ?? "—"} fullSpan />
        <Row label="Type" value={salon.type ?? "—"} />
        <Row label="Phone" value={salon.phone ?? "—"} />
        <Row label="Address" value={salon.address} fullSpan />
        <Row label="Area" value={[salon.area, salon.city, salon.state].filter(Boolean).join(", ")} />
        <Row label="Email" value={salon.email ?? "—"} />
      </dl>

      <p className="mt-10 text-sm text-skip-stone">
        Edit support lands next. For now, ask the SkipQ team for any changes.
      </p>
    </main>
  );
}

function Row({ label, value, fullSpan }: { label: string; value: string; fullSpan?: boolean }) {
  return (
    <div className={`skip-card p-5 ${fullSpan ? "sm:col-span-2" : ""}`}>
      <dt className="text-[10px] uppercase tracking-wider font-bold text-skip-stone">{label}</dt>
      <dd className="mt-1.5 text-skip-ink font-medium">{value}</dd>
    </div>
  );
}
