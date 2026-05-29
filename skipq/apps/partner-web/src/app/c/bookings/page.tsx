import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LiveBooking } from "./LiveBooking";
import { PayBookingButton } from "./PayBookingButton";

export const dynamic = "force-dynamic";

interface HistoryRow {
  id: string;
  salon_id: string;
  salon_name: string;
  salon_area: string | null;
  status: string;
  completed_at: string | null;
  cancelled_at: string | null;
  joined_at: string;
  total_price: number | string | null;
  service_summary: string | null;
}

function historyDate(r: HistoryRow): string {
  const iso = r.completed_at ?? r.cancelled_at ?? r.joined_at;
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function historyStatusLabel(s: string): { label: string; tone: string } {
  switch (s) {
    case "completed":
      return { label: "Completed", tone: "bg-skip-successLo text-skip-success" };
    case "cancelled":
      return { label: "Cancelled", tone: "bg-skip-mist text-skip-stone" };
    case "no_show":
      return { label: "No-show", tone: "bg-skip-cautionLo text-skip-caution" };
    default:
      return { label: s, tone: "bg-skip-mist text-skip-stone" };
  }
}

export default async function CustomerBookings() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="max-w-3xl mx-auto px-5 py-10 text-center">
        <h1 className="text-2xl font-extrabold text-skip-ink">Sign in to see your queue</h1>
        <p className="mt-2 text-skip-slate">
          We&apos;ll keep your live booking here once you skip your first queue.
        </p>
        <Link
          href="/c/login?next=/c/bookings"
          className="skip-btn-primary inline-block mt-6"
        >
          Sign in
        </Link>
        <p className="mt-3 text-xs text-skip-stone">
          Or{" "}
          <Link href="/c/home" className="underline">
            browse salons first
          </Link>
        </p>
      </main>
    );
  }

  const [{ data: booking }, { data: historyRaw }] = await Promise.all([
    supabase
      .from("queue_entries")
      .select(
        `id, salon_id, status, position, estimated_wait_min, total_price, joined_at, notes,
         salons ( name, area, address ),
         queue_entry_services ( services ( name ) )`,
      )
      .eq("user_id", user.id)
      .in("status", ["waiting", "arrived", "serving", "waiting_deposit"])
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    (
      supabase as unknown as {
        rpc: (
          fn: string,
          args?: Record<string, unknown>,
        ) => Promise<{ data: HistoryRow[] | null }>;
      }
    ).rpc("customer_booking_history", { p_limit: 30 }),
  ]);
  const history = (historyRaw ?? []) as HistoryRow[];

  const historySection =
    history.length > 0 ? (
      <section className="mt-8">
        <h3 className="text-base font-extrabold text-skip-ink uppercase tracking-wide">
          Past bookings
        </h3>
        <ul className="mt-3 space-y-2">
          {history.map((h) => {
            const chip = historyStatusLabel(h.status);
            return (
              <li key={h.id}>
                <Link
                  href={`/c/salon/${h.salon_id}`}
                  prefetch
                  className="skip-card block p-4 active:opacity-80"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-skip-ink truncate">
                          {h.salon_name}
                        </p>
                        <span
                          className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${chip.tone}`}
                        >
                          {chip.label}
                        </span>
                      </div>
                      {h.salon_area ? (
                        <p className="text-[11px] text-skip-stone truncate">
                          {h.salon_area}
                        </p>
                      ) : null}
                      {h.service_summary ? (
                        <p className="text-sm text-skip-slate mt-1 truncate">
                          {h.service_summary}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-skip-stone">
                        {historyDate(h)}
                        {h.total_price
                          ? ` · ₹${Number(h.total_price).toFixed(0)}`
                          : ""}
                      </p>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-skip-stone shrink-0 mt-1"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    ) : null;

  if (!booking) {
    return (
      <main className="max-w-3xl mx-auto px-5 py-6">
        <Link
          href="/c/home"
          className="text-sm font-medium text-skip-slate hover:text-skip-ink"
        >
          ← Home
        </Link>
        <h1 className="mt-4 text-2xl font-extrabold text-skip-ink">
          Your bookings
        </h1>

        <section className="mt-5 skip-card p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-skip-mist flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-skip-stone"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h2 className="mt-3 text-lg font-extrabold text-skip-ink">
            No active booking
          </h2>
          <p className="mt-1 text-sm text-skip-slate">
            Find a salon and tap &ldquo;Skip the queue&rdquo; to start.
          </p>
          <Link
            href="/c/home"
            prefetch
            className="skip-btn-primary inline-block mt-4"
          >
            Browse salons
          </Link>
        </section>

        {historySection}
      </main>
    );
  }

  const salon = Array.isArray(booking.salons) ? booking.salons[0] : booking.salons;
  const serviceNames = (booking.queue_entry_services ?? [])
    .map((qes) => {
      const s = Array.isArray(qes.services) ? qes.services[0] : qes.services;
      return s?.name;
    })
    .filter((n): n is string => !!n);

  const { data: pos } = await supabase.rpc("my_queue_position", { p_entry_id: booking.id });
  const livePosition = typeof pos === "number" ? pos : booking.position;

  return (
    <main className="max-w-3xl mx-auto px-5 py-6">
      <Link href="/c/home" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Home
      </Link>
      <h1 className="mt-4 text-2xl font-extrabold text-skip-ink">Your booking</h1>

      <section className="mt-6 skip-card p-6">
        <div className="flex items-start gap-5">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-extrabold shrink-0 ${
              booking.status === "serving"
                ? "bg-skip-success text-white"
                : booking.status === "arrived"
                ? "bg-skip-caution text-white"
                : booking.status === "waiting_deposit"
                ? "bg-skip-mist text-skip-stone border border-skip-caution"
                : "bg-skip-ink text-white"
            }`}
          >
            #{livePosition}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-skip-slate">
              {booking.status === "waiting"
                ? "You're in the queue"
                : booking.status === "arrived"
                ? "Checked in"
                : booking.status === "serving"
                ? "Being served right now"
                : booking.status === "waiting_deposit"
                ? "Deposit required"
                : booking.status}
            </p>
            <h2 className="text-xl font-extrabold text-skip-ink truncate">{salon?.name}</h2>
            {salon?.area ? (
              <p className="text-xs text-skip-stone">{salon.area}</p>
            ) : null}
            {serviceNames.length ? (
              <p className="text-sm text-skip-ink mt-2 font-semibold">
                {serviceNames.join(" + ")}
                {booking.total_price ? ` · ₹${Number(booking.total_price).toFixed(0)}` : ""}
              </p>
            ) : null}
          </div>
        </div>

        {booking.estimated_wait_min != null ? (
          <div className="mt-5 pt-5 border-t border-skip-stone/10">
            <p className="text-[10px] uppercase tracking-wider font-bold text-skip-stone">
              Estimated wait
            </p>
            <p className="text-2xl font-extrabold text-skip-ink">
              ~{Math.max(5, Math.round(booking.estimated_wait_min / 5) * 5)} min
            </p>
          </div>
        ) : null}

        {booking.status === "waiting_deposit" ? (
          <div className="mt-4 rounded-xl bg-skip-cautionLo border border-skip-caution/20 p-4">
            <p className="text-sm font-semibold text-skip-caution">
              Pay the deposit on the app to confirm your spot. After 3 recent no-shows we
              hold the slot until payment lands.
            </p>
          </div>
        ) : null}

        {booking.total_price && Number(booking.total_price) > 0 && booking.notes !== "✓ Paid in advance via SkipQ" ? (
          <PayBookingButton
            entryId={booking.id}
            amount={Number(booking.total_price)}
            variant={booking.status === "waiting_deposit" ? "deposit" : "service"}
            userEmail={user.email ?? null}
            salonName={salon?.name ?? "SkipQ"}
          />
        ) : booking.notes === "✓ Paid in advance via SkipQ" ? (
          <p className="mt-4 rounded-xl bg-skip-successLo border border-skip-success/20 px-4 py-3 text-sm font-semibold text-skip-success">
            ✓ Paid via SkipQ · Just walk in when your turn comes
          </p>
        ) : null}
      </section>

      <LiveBooking entryId={booking.id} salonId={booking.salon_id} />

      {historySection}
    </main>
  );
}
