"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ActiveBooking {
  id: string;
  salon_id: string;
  salon_name: string;
  salon_area: string | null;
  status: string;
  queue_position: number;
  live_queue_position: number;
  estimated_wait_min: number | null;
  joined_at: string;
  total_price: number | null;
  service_summary: string | null;
}

const DISMISS_KEY = "skipq_booking_floater_dismissed";

function statusLine(status: string): string {
  switch (status) {
    case "waiting":
      return "In the queue";
    case "arrived":
      return "Checked in";
    case "serving":
      return "Being served";
    case "waiting_deposit":
      return "Deposit pending";
    default:
      return "Live";
  }
}

function etaText(min: number | null): string {
  if (min == null || min <= 0) return "Almost ready";
  const rounded = Math.max(5, Math.round(min / 5) * 5);
  return `~${rounded} min`;
}

export function ActiveBookingFloater() {
  const pathname = usePathname() ?? "";
  const [booking, setBooking] = useState<ActiveBooking | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      setDismissedId(sessionStorage.getItem(DISMISS_KEY));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/queue/active", { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        if (!cancelled) setBooking(j.booking ?? null);
      } catch {
        /* ignore */
      }
    }
    void load();
    const i = setInterval(load, 25000);
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      clearInterval(i);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  if (!booking) return null;
  if (dismissedId === booking.id) return null;

  // Don't show on /c/bookings (the same info is already on screen)
  if (pathname.startsWith("/c/bookings")) return null;
  // Don't show on auth pages
  if (pathname.startsWith("/c/login")) return null;

  const isServing = booking.status === "serving";
  const isAlmost =
    isServing ||
    booking.live_queue_position <= 1 ||
    (booking.estimated_wait_min ?? 99) <= 5;

  function dismiss() {
    try {
      if (booking) {
        sessionStorage.setItem(DISMISS_KEY, booking.id);
        setDismissedId(booking.id);
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="fixed left-3 right-3 z-30 pointer-events-none"
      style={{ bottom: "calc(64px + env(safe-area-inset-bottom))" }}
    >
      <div
        className="pointer-events-auto mx-auto max-w-md rounded-2xl bg-skip-ink text-white shadow-2xl overflow-hidden border border-white/10"
        style={{ boxShadow: "0 12px 32px rgba(0,0,0,0.25)" }}
      >
        {!expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 active:bg-white/5"
          >
            <span
              className={`relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${
                isAlmost ? "bg-skip-success" : "bg-skip-accent"
              }`}
            >
              {isAlmost ? (
                <span className="text-xs">NOW</span>
              ) : (
                <>#{booking.live_queue_position}</>
              )}
              <span
                aria-hidden
                className={`absolute inset-0 rounded-full animate-ping ${
                  isAlmost ? "bg-skip-success" : "bg-skip-accent"
                } opacity-40`}
              />
            </span>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-white/60">
                  Live
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-white/80">
                  · {statusLine(booking.status)}
                </span>
              </div>
              <p className="text-sm font-bold truncate">
                {booking.salon_name}
              </p>
              <p className="text-[11px] text-white/70 truncate">
                {isServing
                  ? "Service in progress"
                  : `${etaText(booking.estimated_wait_min)} · #${booking.live_queue_position} in line`}
              </p>
            </div>
            <span
              aria-hidden
              className="text-white/60 shrink-0"
              title="Expand"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </span>
          </button>
        ) : (
          <div className="p-4">
            <div className="flex items-start gap-3">
              <span
                className={`relative w-12 h-12 rounded-full flex items-center justify-center text-base font-extrabold shrink-0 ${
                  isAlmost ? "bg-skip-success" : "bg-skip-accent"
                }`}
              >
                {isAlmost ? "NOW" : `#${booking.live_queue_position}`}
                <span
                  aria-hidden
                  className={`absolute inset-0 rounded-full animate-ping ${
                    isAlmost ? "bg-skip-success" : "bg-skip-accent"
                  } opacity-40`}
                />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-white/60">
                    {statusLine(booking.status)}
                  </span>
                </div>
                <p className="font-extrabold truncate">{booking.salon_name}</p>
                {booking.salon_area ? (
                  <p className="text-[11px] text-white/60 truncate">
                    {booking.salon_area}
                  </p>
                ) : null}
                {booking.service_summary ? (
                  <p className="text-xs text-white/85 mt-1 truncate">
                    {booking.service_summary}
                    {booking.total_price
                      ? ` · ₹${Number(booking.total_price).toFixed(0)}`
                      : ""}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Hide"
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss();
                }}
                className="shrink-0 w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-95"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-white/5 px-2.5 py-1.5">
                <p className="text-[9px] uppercase tracking-wider font-bold text-white/50">
                  Wait
                </p>
                <p className="font-bold mt-0.5">
                  {etaText(booking.estimated_wait_min)}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 px-2.5 py-1.5">
                <p className="text-[9px] uppercase tracking-wider font-bold text-white/50">
                  Position
                </p>
                <p className="font-bold mt-0.5">
                  #{booking.live_queue_position}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-xl bg-white/10 text-white font-semibold py-2 text-sm active:bg-white/15"
              >
                Minimise
              </button>
              <Link
                href="/c/bookings"
                prefetch
                className="rounded-xl bg-skip-accent text-white font-bold py-2 text-center text-sm active:opacity-90"
              >
                View booking
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
