import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LiveBooking } from "./LiveBooking";

export const dynamic = "force-dynamic";

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

  const { data: booking } = await supabase
    .from("queue_entries")
    .select(
      `id, salon_id, status, position, estimated_wait_min, total_price, joined_at,
       salons ( name, area, address ),
       queue_entry_services ( services ( name ) )`,
    )
    .eq("user_id", user.id)
    .in("status", ["waiting", "arrived", "serving", "waiting_deposit"])
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!booking) {
    return (
      <main className="max-w-3xl mx-auto px-5 py-10 text-center">
        <h1 className="text-2xl font-extrabold text-skip-ink">No active bookings</h1>
        <p className="mt-2 text-skip-slate">
          Find a salon and tap &ldquo;Skip the queue.&rdquo;
        </p>
        <Link href="/c/home" className="skip-btn-primary inline-block mt-6">
          Browse salons
        </Link>
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
      </section>

      <LiveBooking entryId={booking.id} salonId={booking.salon_id} />
    </main>
  );
}
