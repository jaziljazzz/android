"use client";

import { Suspense } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyOtp, type VerifyOtpState } from "../actions";
import { Logo } from "@/components/Logo";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="skip-btn-primary w-full">
      {pending ? "Verifying…" : "Verify & continue"}
    </button>
  );
}

function VerifyForm() {
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const [state, action] = useFormState<VerifyOtpState, FormData>(verifyOtp, undefined);

  return (
    <>
      <h1 className="text-3xl font-extrabold text-skip-ink leading-tight">Enter your code</h1>
      <p className="mt-2 text-skip-slate">
        We sent a 6-digit code to <span className="font-semibold text-skip-ink">{phone}</span>
      </p>

      <form action={action} className="mt-8 space-y-4">
        <input type="hidden" name="phone" value={phone} />
        <label className="block">
          <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">
            One-time code
          </span>
          <input
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={8}
            className="skip-input mt-2 text-center text-3xl tracking-[0.5em] font-semibold"
            placeholder="••••••"
          />
        </label>

        {state?.error ? (
          <div className="rounded-xl bg-skip-accentLo border border-skip-accent/20 px-4 py-3" role="alert">
            <p className="text-sm text-skip-accent font-medium">{state.error}</p>
          </div>
        ) : null}

        <SubmitButton />
      </form>

      <p className="mt-8 text-center text-sm text-skip-stone">
        <Link href="/login" className="text-skip-accent font-semibold hover:underline">
          ← Use a different number
        </Link>
      </p>
    </>
  );
}

export default function VerifyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Logo size="md" />
        </div>
        <Suspense fallback={<div className="text-center text-skip-stone">Loading…</div>}>
          <VerifyForm />
        </Suspense>
      </div>
    </main>
  );
}
