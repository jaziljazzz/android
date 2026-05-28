"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (...args: unknown[]) => void) => void;
    };
  }
}

const TIERS: { clicks: number; priceInr: number; perClick: number; recommended?: boolean }[] = [
  { clicks: 100, priceInr: 299, perClick: 2.99 },
  { clicks: 500, priceInr: 1399, perClick: 2.8, recommended: true },
  { clicks: 2000, priceInr: 4999, perClick: 2.5 },
];

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = CHECKOUT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("checkout.js failed"));
    document.head.appendChild(s);
  });
}

export function BoostCheckout({ salonName }: { salonName: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadCheckout().catch(() => {});
  }, []);

  async function buy(clicks: number) {
    setError(null);
    setSuccess(null);
    setPending(clicks);
    try {
      await loadCheckout();
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sign in first.");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-boost-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clicks }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Order create failed");
      const rzp = new window.Razorpay!({
        key: body.key_id,
        amount: body.amount,
        currency: body.currency,
        order_id: body.order_id,
        name: "SkipQ",
        description: `${clicks} search-boost clicks`,
        theme: { color: "#FF5454" },
        handler: () => {
          setSuccess(`${clicks} credits added the moment Razorpay confirms.`);
          setPending(null);
          setTimeout(() => router.refresh(), 5000);
        },
        modal: { ondismiss: () => setPending(null) },
      });
      rzp.on("payment.failed", () => {
        setError("Payment failed. Try again, or use a different method.");
        setPending(null);
      });
      rzp.open();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't start checkout");
      setPending(null);
    }
  }

  return (
    <section className="mt-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-skip-stone">
        Pick a pack — {salonName}
      </h2>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TIERS.map((t) => {
          const busy = pending === t.clicks;
          return (
            <div
              key={t.clicks}
              className={`skip-card p-5 flex flex-col gap-3 ${t.recommended ? "ring-2 ring-skip-accent" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-skip-ink">{t.clicks} clicks</span>
                {t.recommended ? (
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-skip-accent text-white px-2 py-0.5 rounded-full">
                    Best value
                  </span>
                ) : null}
              </div>
              <div className="text-3xl font-extrabold text-skip-ink">
                ₹{t.priceInr.toLocaleString("en-IN")}
              </div>
              <p className="text-sm text-skip-slate">~₹{t.perClick.toFixed(2)}/click</p>
              <button
                type="button"
                onClick={() => buy(t.clicks)}
                disabled={pending !== null}
                className={`mt-auto ${t.recommended ? "skip-btn-primary" : "skip-btn-secondary"} ${busy ? "opacity-60" : ""}`}
              >
                {busy ? "Opening Razorpay…" : "Buy now"}
              </button>
            </div>
          );
        })}
      </div>

      {error ? (
        <div className="mt-4 rounded-xl bg-skip-accentLo border border-skip-accent/20 px-4 py-3" role="alert">
          <p className="text-sm text-skip-accent font-medium">{error}</p>
        </div>
      ) : null}
      {success ? (
        <div className="mt-4 rounded-xl bg-skip-successLo border border-skip-success/20 px-4 py-3" role="status">
          <p className="text-sm text-skip-success font-medium">{success}</p>
        </div>
      ) : null}

      <p className="mt-6 text-xs text-skip-stone">
        One credit is consumed when a customer taps your salon card in the nearby
        list. We don&apos;t charge for impressions.
      </p>
    </section>
  );
}
