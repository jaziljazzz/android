"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { signInWithGoogle, signUpWithPassword, type AuthState } from "../login/actions";
import { Logo } from "@/components/Logo";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="skip-btn-primary w-full">
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

function GoogleButton() {
  return (
    <form action={signInWithGoogle}>
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-3 rounded-xl border border-skip-stone/30 bg-white py-3 font-semibold text-skip-ink hover:border-skip-slate/50 hover:bg-skip-mist transition"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Sign up with Google
      </button>
    </form>
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

          <form action={action} className="mt-6 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@salon.com"
                className="skip-input mt-2"
              />
              {err("email") ? <span className="text-xs text-skip-accent mt-1 block">{err("email")}</span> : null}
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">Password</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="skip-input mt-2"
              />
              {err("password") ? (
                <span className="text-xs text-skip-accent mt-1 block">{err("password")}</span>
              ) : (
                <span className="text-xs text-skip-stone mt-1 block">At least 8 characters.</span>
              )}
            </label>

            {state?.error ? (
              <div className="rounded-xl bg-skip-accentLo border border-skip-accent/20 px-4 py-3" role="alert">
                <p className="text-sm text-skip-accent font-medium">{state.error}</p>
              </div>
            ) : null}

            <SubmitButton />
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-skip-stone/20" />
            <span className="text-xs text-skip-stone font-medium uppercase tracking-wider">
              or continue with
            </span>
            <div className="flex-1 h-px bg-skip-stone/20" />
          </div>

          <GoogleButton />

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
