"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { adminSignIn, type AuthState } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-skip-accent text-white font-bold py-3.5 rounded-xl active:opacity-80 disabled:opacity-60 transition shadow-card"
    >
      {pending ? "Signing in…" : "Sign in to admin"}
    </button>
  );
}

export default function AdminLogin() {
  const [state, action] = useFormState<AuthState, FormData>(
    adminSignIn,
    undefined,
  );
  const err = (k: string) => state?.fieldErrors?.[k];

  return (
    <main className="min-h-screen bg-skip-ink text-white flex flex-col items-center px-5 pt-12 pb-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black">
              skip<span className="text-skip-accent">Q</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold bg-skip-accent/20 text-skip-accent px-2 py-0.5 rounded">
              Admin
            </span>
          </div>
          <Link
            href="/login"
            className="text-xs font-semibold text-white/60 hover:text-white"
          >
            Salon staff →
          </Link>
        </div>

        <div className="mt-10">
          <h1 className="text-3xl font-extrabold leading-tight">
            SkipQ team sign-in
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Restricted to the SkipQ admin allowlist. If you&apos;re a
            salon partner, use the{" "}
            <Link href="/login" className="underline">
              staff sign-in
            </Link>{" "}
            instead.
          </p>
        </div>

        <form action={action} className="mt-8 space-y-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider font-bold text-white/60">
              Email
            </span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@skipq.in"
              className="mt-1 w-full h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-skip-accent"
            />
            {err("email") ? (
              <span className="block mt-1 text-[11px] text-skip-accent font-medium">
                {err("email")}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-wider font-bold text-white/60">
              Password
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-skip-accent"
            />
            {err("password") ? (
              <span className="block mt-1 text-[11px] text-skip-accent font-medium">
                {err("password")}
              </span>
            ) : null}
          </label>

          {state?.error ? (
            <p className="text-sm text-skip-accent font-medium pt-1">
              {state.error}
            </p>
          ) : null}

          <div className="pt-2">
            <Submit />
          </div>
        </form>

        <p className="mt-10 text-center text-[11px] text-white/40">
          For account access issues, ping the SkipQ team directly.
        </p>
      </div>
    </main>
  );
}
