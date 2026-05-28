"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  sendOtp,
  signInWithPassword,
  type AuthState,
  type SendOtpState,
} from "./actions";
import { Logo } from "@/components/Logo";

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="skip-btn-primary w-full">
      {pending ? busy : idle}
    </button>
  );
}

function PasswordForm() {
  const [state, action] = useFormState<AuthState, FormData>(signInWithPassword, undefined);
  const err = (k: string) => state?.fieldErrors?.[k];
  return (
    <form action={action} className="space-y-4">
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
        <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="skip-input mt-2 text-lg"
        />
        {err("password") ? <span className="text-xs text-skip-accent mt-1 block">{err("password")}</span> : null}
      </label>
      {state?.error ? (
        <div className="rounded-xl bg-skip-accentLo border border-skip-accent/20 px-4 py-3" role="alert">
          <p className="text-sm text-skip-accent font-medium">{state.error}</p>
        </div>
      ) : null}
      <SubmitButton idle="Sign in" busy="Signing in…" />
    </form>
  );
}

function CodeForm() {
  const [state, action] = useFormState<SendOtpState, FormData>(sendOtp, undefined);
  return (
    <form action={action} className="space-y-4">
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
      </label>
      {state?.error ? (
        <div className="rounded-xl bg-skip-accentLo border border-skip-accent/20 px-4 py-3" role="alert">
          <p className="text-sm text-skip-accent font-medium">{state.error}</p>
        </div>
      ) : null}
      <SubmitButton idle="Email me a code" busy="Sending…" />
    </form>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<"password" | "code">("password");

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

          <h1 className="text-3xl font-extrabold text-skip-ink leading-tight">Welcome back</h1>
          <p className="mt-2 text-skip-slate">
            {mode === "password"
              ? "Sign in to your salon dashboard."
              : "We'll email you a 6-digit code."}
          </p>

          {/* Tab toggle */}
          <div className="mt-6 flex gap-1 bg-skip-mist rounded-xl p-1">
            <button
              type="button"
              onClick={() => setMode("password")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                mode === "password"
                  ? "bg-white text-skip-ink shadow-card"
                  : "text-skip-stone"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setMode("code")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                mode === "code"
                  ? "bg-white text-skip-ink shadow-card"
                  : "text-skip-stone"
              }`}
            >
              Email code
            </button>
          </div>

          <div className="mt-6">
            {mode === "password" ? <PasswordForm /> : <CodeForm />}
          </div>

          <div className="mt-6 text-center text-sm text-skip-stone space-y-2">
            <p>
              First time here?{" "}
              <Link href="/signup" className="text-skip-accent font-semibold hover:underline">
                Create an account
              </Link>
            </p>
            <p>
              Not on SkipQ?{" "}
              <Link href="https://skipq.in/partners" className="text-skip-accent font-semibold hover:underline">
                Talk to our team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
