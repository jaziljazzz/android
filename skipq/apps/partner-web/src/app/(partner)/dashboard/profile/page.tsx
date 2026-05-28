import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const { partner } = await requirePartner();
  const supabase = createClient();
  const { data: salon, error } = await supabase
    .from("salons")
    .select("name, tagline, type, address, area, city, state, phone, email, status, upi_id, gst_number")
    .eq("id", partner.salon_id)
    .single();

  if (error) {
    return (
      <main className="px-6 py-8 sm:px-10 sm:py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink">Salon profile</h1>
        <p className="mt-4 text-skip-accent">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">Salon profile</h1>
          <p className="mt-2 text-skip-slate">What customers see when they tap your salon.</p>
        </div>
        {partner.role === "owner" ? (
          <Link href="/dashboard/profile/edit" className="skip-btn-primary inline-flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Edit
          </Link>
        ) : null}
      </header>

      {searchParams.saved === "1" ? (
        <div className="mt-4 rounded-xl bg-skip-successLo border border-skip-success/20 px-4 py-3" role="status">
          <p className="text-sm text-skip-success font-medium">Saved! Customers see this immediately.</p>
        </div>
      ) : null}

      <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Row label="Name" value={salon.name} />
        <Row label="Status" value={salon.status} />
        <Row label="Tagline" value={salon.tagline ?? "—"} fullSpan />
        <Row label="Type" value={salon.type ?? "—"} />
        <Row label="Phone" value={salon.phone ?? "—"} />
        <Row label="Address" value={salon.address} fullSpan />
        <Row label="Area" value={[salon.area, salon.city, salon.state].filter(Boolean).join(", ")} />
        <Row label="Email" value={salon.email ?? "—"} />
        <Row label="UPI ID" value={salon.upi_id ?? "—"} />
        <Row label="GST" value={salon.gst_number ?? "—"} />
      </dl>

      {partner.role !== "owner" ? (
        <p className="mt-10 text-sm text-skip-stone">
          Only the salon owner can edit these details.
        </p>
      ) : null}
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
