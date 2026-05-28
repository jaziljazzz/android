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
  { months: 1, priceInr: 999, label: "1 month", hint: "Try Pro for a month" },
  {
    months: 3,
    priceInr: 2499,
    label: "3 months",
    hint: "Save ₹498 vs monthly",
    recommended: true,
  },
  { months: 12, priceInr: 8999, label: "12 months", hint: "Save ₹2,989 vs monthly" },
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

export function ProCheckout({ salonName }: { salonName: string }) {
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
      const res = await fetch(`${supabaseUrl}/functions/v1/create-pro-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ months }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Order create failed");
      const userEmail = sess.session?.user.email ?? "";
      const rzp = new window.Razorpay!({
        key: body.key_id,
        amount: body.amount,
        currency: body.currency,
        order_id: body.order_id,
        name: "SkipQ",
        description: `Pro · ${months} month${months === 1 ? "" : "s"}`,
        prefill: { email: userEmail },
        theme: { color: "#FF5454" },
        handler: () => {
          setSuccess(
            "Payment received. Pro activates the moment Razorpay confirms (usually under 30 seconds).",
          );
          setPendingMonths(null);
          setTimeout(() => router.refresh(), 5000);
        },
        modal: { ondismiss: () => setPendingMonths(null) },
      });
      rzp.on("payment.failed", () => {
        setError("Payment failed. Try again, or use a different method.");
        setPendingMonths(null);
      });
      rzp.open();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't start checkout");
      setPendingMonths(null);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-bold uppercase tracking-wider text-skip-stone">
        Pick a plan — {salonName}
      </h2>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TIERS.map((t) => {
          const busy = pendingMonths === t.months;
          return (
            <div
              key={t.months}
              className={`skip-card p-5 flex flex-col gap-3 ${t.recommended ? "ring-2 ring-skip-accent" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-skip-ink">{t.label}</span>
                {t.recommended ? (
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-skip-accent text-white px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                ) : null}
              </div>
              <div className="text-3xl font-extrabold text-skip-ink">
                ₹{t.priceInr.toLocaleString("en-IN")}
              </div>
              <p className="text-sm text-skip-slate">{t.hint}</p>
              <button
                type="button"
                onClick={() => buy(t.months)}
                disabled={pendingMonths !== null}
                className={`mt-auto ${t.recommended ? "skip-btn-primary" : "skip-btn-secondary"} ${busy ? "opacity-60" : ""}`}
              >
                {busy ? "Opening Razorpay…" : "Subscribe"}
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
        One-shot prepaid passes — no recurring charge. Plans stack additively: buying
        another month while still on Pro adds 30 days to the end date.
      </p>
    </section>
  );
}
