import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface Stats {
  served_today: number;
  walk_aways_today: number;
  avg_wait_min_today: number | null;
  avg_rating: number | null;
  review_count: number;
  peak_hour: number | null;
  active_now: number;
}

function formatHour(h: number | null | undefined): string {
  if (h == null) return "—";
  const hour12 = ((h + 11) % 12) + 1;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${hour12} ${ampm}`;
}

export default async function AnalyticsPage() {
  const supabase = createClient();
  const { data: rows } = await supabase.rpc("salon_daily_analytics");
  const s = (rows?.[0] as Stats | undefined) ?? null;

  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <header>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">Analytics</h1>
        <p className="mt-2 text-skip-slate">
          How your salon performed today, at a glance.
        </p>
      </header>

      {!s ? (
        <p className="mt-6 text-skip-stone">No data yet.</p>
      ) : (
        <>
          <section className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Served today" value={String(s.served_today)} tone="success" />
            <StatCard label="In salon now" value={String(s.active_now)} tone="ink" />
            <StatCard
              label="Avg wait"
              value={s.avg_wait_min_today != null ? `${Math.round(Number(s.avg_wait_min_today))}m` : "—"}
              tone="ink"
            />
            <StatCard
              label="Walk-aways"
              value={String(s.walk_aways_today)}
              tone={s.walk_aways_today > 0 ? "caution" : "ink"}
            />
          </section>

          <section className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <BigCard
              label="Peak hour (30 days)"
              value={formatHour(s.peak_hour)}
              hint="Schedule extra stylists during this window."
            />
            <BigCard
              label="Average rating"
              value={s.review_count > 0 ? `${Number(s.avg_rating ?? 0).toFixed(1)} ★` : "—"}
              hint={s.review_count > 0 ? `From ${s.review_count} review${s.review_count === 1 ? "" : "s"}` : "No reviews yet"}
            />
            <BigCard
              label="No-show rate today"
              value={
                s.served_today + s.walk_aways_today > 0
                  ? `${Math.round((s.walk_aways_today / (s.served_today + s.walk_aways_today)) * 100)}%`
                  : "—"
              }
              hint="Pre-pay bookings (Razorpay) reduce this."
            />
          </section>

          <p className="mt-10 text-xs text-skip-stone">
            Times shown in IST. Walk-aways include cancellations + no-shows. Peak hour is the
            busiest hour across the last 30 days based on queue joins.
          </p>
        </>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "caution" | "ink";
}) {
  const valueColor =
    tone === "success" ? "text-skip-success" : tone === "caution" ? "text-skip-caution" : "text-skip-ink";
  return (
    <div className="skip-card p-4">
      <div className={`text-3xl font-extrabold ${valueColor}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-skip-stone mt-1 font-semibold">
        {label}
      </div>
    </div>
  );
}

function BigCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="skip-card p-5">
      <div className="text-[10px] uppercase tracking-wider text-skip-stone font-bold">{label}</div>
      <div className="text-2xl font-extrabold text-skip-ink mt-2">{value}</div>
      {hint ? <div className="text-xs text-skip-stone mt-1.5">{hint}</div> : null}
    </div>
  );
}
