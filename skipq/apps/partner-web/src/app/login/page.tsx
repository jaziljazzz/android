"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { sendOtp, type SendOtpState } from "./actions";
import { Logo } from "@/components/Logo";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="skip-btn-primary w-full">
      {pending ? "Sending code…" : "Email me a sign-in code"}
    </button>
  );
}

export default function LoginPage() {
  const [state, action] = useFormState<SendOtpState, FormData>(sendOtp, undefined);

  return (
    <main className="min-h-screen flex items-stretch">
      <div className="hidden lg:flex flex-1 bg-skip-ink text-white p-12 flex-col justify-between">
        <Logo size="md" variant="light" />
        <div>
          <h2 className="text-5xl font-extrabold leading-tight">
            Book your slot.
            <br />
            <span className="text-skip-accent">Skip the line.</span>
          </h2>
          <p className="mt-6 text-lg text-white/70 max-w-md">
            Live queue management for your salon. Customers join from anywhere,
            walk in when it&apos;s their turn.
          </p>
        </div>
        <div className="text-xs text-white/40">© SkipQ · Kochi → South India</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <Logo size="md" />
          </div>

          <h1 className="text-3xl font-extrabold text-skip-ink leading-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-skip-slate">
            We&apos;ll email you a 6-digit code to sign in.
          </p>

          <form action={action} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">
                Email
              </span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@salon.com"
                className="skip-input mt-2 text-lg"
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
            Not on SkipQ yet?{" "}
            <Link href="https://skipq.in/partners" className="text-skip-accent font-semibold hover:underline">
              Talk to our team
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
