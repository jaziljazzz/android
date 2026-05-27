"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { sendOtp, type SendOtpState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-skip-accent text-white font-semibold py-3 hover:bg-skip-accentHi transition disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send OTP"}
    </button>
  );
}

export default function LoginPage() {
  const [state, action] = useFormState<SendOtpState, FormData>(sendOtp, undefined);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="text-skip-accent text-xs font-bold tracking-widest uppercase">
            skipQ Partner
          </div>
          <h1 className="mt-2 text-2xl font-bold text-skip-ink">Sign in to your salon</h1>
          <p className="mt-1 text-sm text-skip-stone">
            We&apos;ll text a one-time code to your registered phone.
          </p>
        </div>

        <form action={action} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-skip-slate">Phone</span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              placeholder="+916282640278"
              className="mt-1 w-full rounded-lg border border-skip-stone/30 bg-white px-3 py-3 text-skip-ink focus:outline-none focus:ring-2 focus:ring-skip-accent"
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
          Not registered yet?{" "}
          <Link href="https://skipq.in/partners" className="text-skip-accent font-semibold">
            Talk to skipQ
          </Link>
        </p>
      </div>
    </main>
  );
}
