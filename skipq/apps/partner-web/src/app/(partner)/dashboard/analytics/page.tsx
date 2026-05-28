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

interface StylistRow {
  stylist_id: string;
  stylist_name: string;
  services_completed: number;
  avg_minutes: number;
  avg_rating: number | null;
  rating_count: number;
  revenue: number | string;
}

export default async function AnalyticsPage() {
  const supabase = createClient();
  const [{ data: rows }, { data: heat }, { data: prod }] = await Promise.all([
    supabase.rpc("salon_daily_analytics"),
    supabase.rpc("salon_hourly_heatmap", { p_days: 30 }),
    supabase.rpc("salon_stylist_productivity", { p_days: 30 }),
  ]);
  const s = (rows?.[0] as Stats | undefined) ?? null;
  const heatmap = (heat ?? []) as { day_of_week: number; hour_of_day: number; visits: number }[];
  const stylistRows = (prod ?? []) as StylistRow[];

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

          <section className="mt-8">
            <h2 className="text-lg font-bold text-skip-ink">Busy times (last 30 days)</h2>
            <p className="text-sm text-skip-slate mt-1">
              Darker cells = more customers joining. Helps you plan stylist rosters.
            </p>
            <Heatmap data={heatmap} />
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-skip-ink">Stylist productivity (30 days)</h2>
            <p className="text-sm text-skip-slate mt-1">
              Completed services, average service time and rating. Spots your top performer
              and any stylist with thin coverage.
            </p>
            <StylistProductivityTable rows={stylistRows} />
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

function Heatmap({
  data,
}: {
  data: { day_of_week: number; hour_of_day: number; visits: number }[];
}) {
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const grid: number[][] = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  let max = 0;
  for (const row of data) {
    const dayRow = grid[row.day_of_week];
    if (!dayRow) continue;
    if (row.hour_of_day < 0 || row.hour_of_day >= 24) continue;
    dayRow[row.hour_of_day] = row.visits;
    if (row.visits > max) max = row.visits;
  }
  if (max === 0) {
    return (
      <p className="mt-4 text-sm text-skip-stone">
        Not enough completed visits in the last 30 days yet.
      </p>
    );
  }
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex pl-10 mb-1 text-[9px] text-skip-stone gap-[2px]">
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="w-5 text-center">
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
        </div>
        {grid.map((row, d) => (
          <div key={d} className="flex items-center gap-[2px] mb-[2px]">
            <div className="w-10 text-xs text-skip-slate font-semibold">{DAYS[d]}</div>
            {row.map((v, h) => {
              const intensity = v === 0 ? 0 : Math.min(1, v / max);
              const alpha = intensity === 0 ? 0 : 0.12 + intensity * 0.78;
              return (
                <div
                  key={h}
                  title={`${DAYS[d]} ${h}:00 — ${v} visit${v === 1 ? "" : "s"}`}
                  className="w-5 h-5 rounded"
                  style={{
                    backgroundColor:
                      intensity === 0 ? "rgba(142,154,171,0.08)" : `rgba(255,84,84,${alpha})`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
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

function StylistProductivityTable({ rows }: { rows: StylistRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="mt-4 text-sm text-skip-stone">
        No completed services in the last 30 days yet.
      </p>
    );
  }
  return (
    <div className="mt-4 overflow-x-auto skip-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-skip-stone font-bold">
            <th className="px-4 py-3">Stylist</th>
            <th className="px-4 py-3 text-right">Services</th>
            <th className="px-4 py-3 text-right">Avg time</th>
            <th className="px-4 py-3 text-right">Rating</th>
            <th className="px-4 py-3 text-right">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.stylist_id} className="border-t border-skip-stone/10">
              <td className="px-4 py-3 text-skip-ink font-semibold">{r.stylist_name}</td>
              <td className="px-4 py-3 text-right text-skip-ink">{r.services_completed}</td>
              <td className="px-4 py-3 text-right text-skip-slate">
                {r.services_completed > 0 ? `${r.avg_minutes}m` : "—"}
              </td>
              <td className="px-4 py-3 text-right text-skip-slate">
                {r.avg_rating != null ? (
                  <span>
                    {Number(r.avg_rating).toFixed(1)} ★
                    <span className="text-skip-stone text-xs ml-1">({r.rating_count})</span>
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-right font-bold text-skip-ink">
                ₹{Number(r.revenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
