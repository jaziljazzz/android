"use client";

import { Suspense } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyOtp, type VerifyOtpState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-skip-accent text-white font-semibold py-3 hover:bg-skip-accentHi transition disabled:opacity-60"
    >
      {pending ? "Verifying…" : "Sign in"}
    </button>
  );
}

function VerifyForm() {
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const [state, action] = useFormState<VerifyOtpState, FormData>(verifyOtp, undefined);

  return (
    <>
      <div className="text-center">
        <div className="text-skip-accent text-xs font-bold tracking-widest uppercase">
          skipQ Partner
        </div>
        <h1 className="mt-2 text-2xl font-bold text-skip-ink">Enter your code</h1>
        <p className="mt-1 text-sm text-skip-stone">
          We sent it to <span className="font-medium text-skip-slate">{phone}</span>
        </p>
      </div>

      <form action={action} className="mt-8 space-y-4">
        <input type="hidden" name="phone" value={phone} />
        <label className="block">
          <span className="text-xs font-semibold text-skip-slate">One-time code</span>
          <input
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={8}
            className="mt-1 w-full rounded-lg border border-skip-stone/30 bg-white px-3 py-3 text-center text-2xl tracking-[0.5em] text-skip-ink focus:outline-none focus:ring-2 focus:ring-skip-accent"
          />
        </label>

        {state?.error ? (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        ) : null}

        <SubmitButton />
      </form>

      <p className="mt-8 text-center text-xs text-skip-stone">
        <Link href="/login" className="text-skip-accent font-semibold">
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
        <Suspense fallback={<div className="text-center text-skip-stone">Loading…</div>}>
          <VerifyForm />
        </Suspense>
      </div>
    </main>
  );
}
