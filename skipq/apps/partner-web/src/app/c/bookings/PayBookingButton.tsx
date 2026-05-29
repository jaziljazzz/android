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

interface Props {
  entryId: string;
  amount: number;
  variant: "deposit" | "service";
  userEmail: string | null;
  salonName: string;
}

export function PayBookingButton({
  entryId,
  amount,
  variant,
  userEmail,
  salonName,
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadCheckout().catch(() => {});
  }, []);

  async function pay() {
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      await loadCheckout();
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sign in first.");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-payment-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ queue_entry_id: entryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Couldn't create order");
      if (!window.Razorpay) throw new Error("Checkout didn't load");
      const rzp = new window.Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: salonName,
        description: variant === "deposit" ? "Booking deposit" : "Pay for service",
        prefill: { email: userEmail ?? undefined },
        theme: { color: "#FF5454" },
        handler: () => {
          setSuccess(
            variant === "deposit"
              ? "Deposit received. Your spot is confirmed."
              : "Payment received. Just walk in when your turn comes.",
          );
          setPending(false);
          setTimeout(() => router.refresh(), 2200);
        },
        modal: {
          ondismiss: () => setPending(false),
        },
      });
      rzp.on("payment.failed", () => {
        setError("Payment failed — try again.");
        setPending(false);
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPending(false);
    }
  }

  const label = variant === "deposit" ? "Pay deposit" : "Pay for service";

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={pay}
        disabled={pending}
        className="w-full bg-skip-accent text-white font-bold py-3.5 rounded-2xl active:opacity-80 disabled:opacity-60 transition shadow-card"
      >
        {pending ? "Opening Razorpay…" : `${label} · ₹${amount.toFixed(0)}`}
      </button>
      {error ? (
        <p className="mt-2 text-sm font-semibold text-skip-accent">{error}</p>
      ) : null}
      {success ? (
        <p className="mt-2 rounded-xl bg-skip-successLo border border-skip-success/20 px-3 py-2 text-sm font-semibold text-skip-success">
          {success}
        </p>
      ) : null}
    </div>
  );
}
