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

interface Tier {
  months: number;
  priceInr: number;
  label: string;
  hint: string;
  recommended?: boolean;
}

const TIERS: Tier[] = [
  { months: 1, priceInr: 99, label: "1 month", hint: "Try Plus for a month" },
  {
    months: 12,
    priceInr: 799,
    label: "12 months",
    hint: "Save ₹389 vs monthly",
    recommended: true,
  },
];

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.Razorpay) return resolve();
    const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("checkout.js failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = CHECKOUT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("checkout.js failed"));
    document.head.appendChild(s);
  });
}

export function PlusCheckout({ userEmail }: { userEmail: string | null }) {
  const supabase = createClient();
  const router = useRouter();
  const [pendingMonths, setPendingMonths] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadCheckout().catch(() => {});
  }, []);

  async function buy(months: number) {
    setError(null);
    setSuccess(null);
    setPendingMonths(months);
    try {
      await loadCheckout();
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sign in first.");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-plus-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ months }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Couldn't create order");
      }
      if (!window.Razorpay) throw new Error("Checkout didn't load");
      const rzp = new window.Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: "SkipQ Plus",
        description: months === 12 ? "12 months · ₹799" : "1 month · ₹99",
        prefill: { email: userEmail ?? undefined },
        theme: { color: "#FF5454" },
        handler: () => {
          setSuccess(
            "Payment received. Your Plus membership will activate within a few seconds.",
          );
          setPendingMonths(null);
          // Webhook updates plus_until; refresh after a short delay
          setTimeout(() => router.refresh(), 2500);
        },
        modal: {
          ondismiss: () => setPendingMonths(null),
        },
      });
      rzp.on("payment.failed", () => {
        setError("Payment failed — try again.");
        setPendingMonths(null);
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPendingMonths(null);
    }
  }

  return (
    <div className="mt-6">
      <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-skip-stone">
        Choose your plan
      </p>
      <div className="mt-3 space-y-3">
        {TIERS.map((t) => (
          <button
            key={t.months}
            type="button"
            onClick={() => buy(t.months)}
            disabled={pendingMonths !== null}
            className={`w-full text-left skip-card p-4 active:opacity-80 disabled:opacity-50 transition relative ${
              t.recommended ? "ring-2 ring-skip-accent" : ""
            }`}
          >
            {t.recommended ? (
              <span className="absolute -top-2.5 right-4 text-[9px] uppercase tracking-wider font-bold bg-skip-accent text-white px-2 py-0.5 rounded-full">
                Best value
              </span>
            ) : null}
            <div className="flex items-end justify-between">
              <div>
                <p className="font-extrabold text-skip-ink text-lg">{t.label}</p>
                <p className="text-xs text-skip-slate mt-0.5">{t.hint}</p>
              </div>
              <p className="text-xl font-extrabold text-skip-ink">
                ₹{t.priceInr.toLocaleString("en-IN")}
              </p>
            </div>
            {pendingMonths === t.months ? (
              <p className="mt-2 text-xs text-skip-stone">Opening Razorpay…</p>
            ) : null}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-4 text-sm font-semibold text-skip-accent">{error}</p>
      ) : null}
      {success ? (
        <p className="mt-4 rounded-xl bg-skip-successLo border border-skip-success/20 px-4 py-3 text-sm font-semibold text-skip-success">
          {success}
        </p>
      ) : null}

      <p className="mt-5 text-[11px] text-skip-stone leading-relaxed">
        Payments are processed by Razorpay (test mode). Use card{" "}
        <span className="font-mono">4111 1111 1111 1111</span>, any CVV, any
        future expiry to test.
      </p>
    </div>
  );
}
