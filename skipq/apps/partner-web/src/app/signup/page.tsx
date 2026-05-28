"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { signUpWithPassword, type AuthState } from "../login/actions";
import { Logo } from "@/components/Logo";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="skip-btn-primary w-full">
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

export default function SignupPage() {
  const [state, action] = useFormState<AuthState, FormData>(signUpWithPassword, undefined);
  const err = (k: string) => state?.fieldErrors?.[k];

  return (
    <main className="min-h-screen flex items-stretch">
      <div className="hidden lg:flex flex-1 bg-skip-ink text-white p-12 flex-col justify-between">
        <Logo size="md" variant="light" />
        <div>
          <h2 className="text-5xl font-extrabold leading-tight">
            Manage your queue.
            <br />
            <span className="text-skip-accent">Skip the chaos.</span>
          </h2>
          <p className="mt-6 text-lg text-white/70 max-w-md">
            Create your SkipQ partner account in 30 seconds.
          </p>
        </div>
        <div className="text-xs text-white/40">© SkipQ · Kochi → South India</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <Logo size="md" />
          </div>

          <h1 className="text-3xl font-extrabold text-skip-ink leading-tight">Create your account</h1>
          <p className="mt-2 text-skip-slate">
            Use the email the SkipQ team has linked to your salon.
          </p>

          <form action={action} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@salon.com"
                className="skip-input mt-2 text-lg"
              />
              {err("email") ? <span className="text-xs text-skip-accent mt-1 block">{err("email")}</span> : null}
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">
                Password
              </span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="skip-input mt-2 text-lg"
              />
              {err("password") ? (
                <span className="text-xs text-skip-accent mt-1 block">{err("password")}</span>
              ) : (
                <span className="text-xs text-skip-stone mt-1 block">
                  At least 8 characters.
                </span>
              )}
            </label>

            {state?.error ? (
              <div className="rounded-xl bg-skip-accentLo border border-skip-accent/20 px-4 py-3" role="alert">
                <p className="text-sm text-skip-accent font-medium">{state.error}</p>
              </div>
            ) : null}

            <SubmitButton />
          </form>

          <p className="mt-8 text-center text-sm text-skip-stone">
            Already have an account?{" "}
            <Link href="/login" className="text-skip-accent font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
