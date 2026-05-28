"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISSED_KEY = "skipq_plus_upsell_dismissed";

export function PlusUpsell({ alreadyPlus }: { alreadyPlus: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (alreadyPlus) return;
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [alreadyPlus]);

  function close() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setOpen(false);
  }

  if (!mounted || !open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 flex items-end animate-fade"
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl mx-auto rounded-t-3xl overflow-hidden text-white relative animate-slide-up"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, #6E4A12 0%, #2C1C04 55%, #120A02 100%)",
        }}
      >
        <button
          type="button"
          onClick={close}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:opacity-70"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Decorative confetti */}
        <div className="absolute inset-x-0 top-0 h-24 opacity-50 pointer-events-none">
          <div className="absolute left-[8%] top-3 text-amber-300">✦</div>
          <div className="absolute left-[20%] top-10 text-amber-200">✧</div>
          <div className="absolute right-[12%] top-4 text-amber-300">✦</div>
          <div className="absolute right-[28%] top-12 text-amber-200">✧</div>
          <div className="absolute left-[42%] top-8 text-amber-200">·</div>
        </div>

        <div className="pt-12 pb-8 px-6 text-center">
          <p
            className="text-2xl font-black tracking-wide"
            style={{
              background: "linear-gradient(180deg, #FFE9A8 0%, #F0B852 60%, #C58B1F 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            SKIP THE WAIT,
          </p>
          <p
            className="text-2xl font-black tracking-wide -mt-1"
            style={{
              background: "linear-gradient(180deg, #FFE9A8 0%, #F0B852 60%, #C58B1F 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            EVERY TIME
          </p>

          <p className="mt-5 text-lg">
            <span className="text-white/55 line-through text-base">₹199</span>{" "}
            <span className="text-amber-300 font-bold">₹99</span>
            <span className="text-amber-100/80 text-sm"> / month</span>
          </p>

          <div className="my-6 flex justify-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
              style={{
                background: "radial-gradient(circle at 30% 25%, #FFE39C 0%, #E1A734 60%, #8C5C0F 100%)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#1A0E00">
                <path d="M5 19h14v-2H5v2zm2-4h10l1-9-4 3-2-5-2 5-4-3 1 9z" />
              </svg>
            </div>
          </div>

          <p className="text-base font-bold">
            Join <span className="text-amber-300">PLUS</span> for priority queue + zero fees
          </p>
          <p className="mt-1 text-xs text-white/70">
            Same-day cancellation · No auto-renew
          </p>
        </div>

        <div className="bg-black p-4 pb-6">
          <Link
            href="/c/plus"
            onClick={close}
            className="block w-full text-center py-4 rounded-2xl bg-white text-black font-bold active:opacity-80"
          >
            Join Plus now
          </Link>
        </div>
      </div>
    </div>
  );
}
