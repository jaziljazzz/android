"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import {
  customerSignIn,
  customerSignUp,
  type AuthState,
} from "../actions";

function Submit({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-skip-accent text-white font-bold py-4 rounded-2xl active:opacity-80 disabled:opacity-60 transition shadow-card"
    >
      {pending ? busy : idle}
    </button>
  );
}

function EmailInner() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signIn, signInAction] = useFormState<AuthState, FormData>(
    customerSignIn,
    undefined,
  );
  const [signUp, signUpAction] = useFormState<AuthState, FormData>(
    customerSignUp,
    undefined,
  );

  const search = useSearchParams();
  const next = search.get("next") ?? "";
  const params = new URLSearchParams();
  search.forEach((v, k) => {
    if (k !== "next") params.set(k, v);
  });
  const nextParams = params.toString();

  const state = mode === "signin" ? signIn : signUp;
  const err = (k: string) => state?.fieldErrors?.[k];

  return (
    <main className="min-h-screen bg-skip-mist flex flex-col px-6 pt-8 pb-6">
      <Link
        href="/c/login"
        prefetch
        className="text-skip-slate font-semibold active:opacity-60 inline-flex items-center gap-1 -ml-1"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </Link>

      <h1 className="mt-6 text-2xl font-extrabold text-skip-ink leading-tight">
        Continue with email
      </h1>

      <div className="mt-6 flex bg-white rounded-xl border border-skip-stone/15 p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 text-sm font-bold py-2 rounded-lg ${
              mode === m ? "bg-skip-ink text-white" : "text-skip-slate"
            }`}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      {mode === "signin" ? (
        <form action={signInAction} className="mt-6 space-y-3">
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="nextParams" value={nextParams} />
          <Field label="Email" error={err("email")}>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="skip-input"
              placeholder="you@email.com"
            />
          </Field>
          <Field label="Password" error={err("password")}>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="skip-input"
              placeholder="At least 8 characters"
            />
          </Field>
          {state?.error ? (
            <p className="text-sm text-skip-accent font-medium">{state.error}</p>
          ) : null}
          <Submit idle="Sign in" busy="Signing in…" />
        </form>
      ) : (
        <form action={signUpAction} className="mt-6 space-y-3">
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="nextParams" value={nextParams} />
          <Field label="Email" error={err("email")}>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="skip-input"
              placeholder="you@email.com"
            />
          </Field>
          <Field label="Password" error={err("password")}>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              className="skip-input"
              placeholder="At least 8 characters"
            />
          </Field>
          <Field label="Referral code (optional)" error={err("referralCode")}>
            <input
              name="referralCode"
              maxLength={8}
              className="skip-input uppercase"
              placeholder="From a friend?"
            />
          </Field>
          {state?.error ? (
            <p className="text-sm text-skip-accent font-medium">{state.error}</p>
          ) : null}
          <Submit idle="Create account" busy="Creating…" />
        </form>
      )}
    </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">
        {label}
      </span>
      <div className="mt-1">{children}</div>
      {error ? <span className="text-xs text-skip-accent mt-1 block">{error}</span> : null}
    </label>
  );
}

export default function EmailLogin() {
  return (
    <Suspense fallback={null}>
      <EmailInner />
    </Suspense>
  );
}
