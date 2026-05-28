"use client";

import { Suspense, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { customerSignIn, customerSignUp, type AuthState } from "./actions";

function Submit({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="skip-btn-primary w-full">
      {pending ? busy : idle}
    </button>
  );
}

function CustomerLoginInner() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction] = useFormState<AuthState, FormData>(
    customerSignIn,
    undefined,
  );
  const [signUpState, signUpAction] = useFormState<AuthState, FormData>(
    customerSignUp,
    undefined,
  );

  const search = useSearchParams();
  const next = search.get("next") ?? "";
  // Everything except `next` is forwarded as nextParams so the booking
  // sheet on the salon page can rebuild the customer's selections.
  const nextParamsObj = new URLSearchParams();
  search.forEach((v, k) => {
    if (k !== "next") nextParamsObj.set(k, v);
  });
  const nextParams = nextParamsObj.toString();

  const state = mode === "signin" ? signInState : signUpState;
  const err = (k: string) => state?.fieldErrors?.[k];

  return (
    <main className="min-h-screen bg-skip-mist flex items-center justify-center px-5 py-10">
      <div className="max-w-sm w-full">
        <Link
          href="/"
          className="text-skip-accent font-extrabold tracking-tight text-2xl block text-center"
        >
          SkipQ
        </Link>
        <p className="text-center text-skip-slate mt-2">Skip the wait at any salon.</p>

        <div className="mt-8 flex bg-white rounded-xl border border-skip-stone/15 p-1">
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

        <p className="mt-6 text-center text-xs text-skip-stone">
          By continuing you agree to our{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
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
      <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">{label}</span>
      <div className="mt-1">{children}</div>
      {error ? <span className="text-xs text-skip-accent mt-1 block">{error}</span> : null}
    </label>
  );
}

export default function CustomerLogin() {
  return (
    <Suspense fallback={null}>
      <CustomerLoginInner />
    </Suspense>
  );
}
