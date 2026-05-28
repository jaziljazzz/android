"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { verifyPhoneOtp, type AuthState } from "../actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-skip-accent text-white font-bold py-4 rounded-2xl active:opacity-80 disabled:opacity-60 transition shadow-card"
    >
      {pending ? "Verifying…" : "Verify"}
    </button>
  );
}

function VerifyInner() {
  const search = useSearchParams();
  const phone = search.get("phone") ?? "";
  const next = search.get("next") ?? "";
  const [code, setCode] = useState("");

  const [state, action] = useFormState<AuthState, FormData>(
    verifyPhoneOtp,
    undefined,
  );
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
        Enter the OTP
      </h1>
      <p className="mt-2 text-sm text-skip-slate">
        We&apos;ve sent a code to <span className="font-semibold">{phone}</span>
      </p>

      <form action={action} className="mt-8">
        <input type="hidden" name="phone" value={phone} />
        <input type="hidden" name="next" value={next} />
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/gu, ""))}
          placeholder="• • • • • •"
          className="w-full text-center text-2xl tracking-[0.5em] font-bold py-4 rounded-2xl border border-skip-stone/25 bg-white outline-none text-skip-ink placeholder:text-skip-stone/40 focus:border-skip-accent"
        />
        {err("code") ? (
          <p className="mt-2 text-xs text-skip-accent font-medium">{err("code")}</p>
        ) : null}
        {state?.error ? (
          <p className="mt-2 text-sm text-skip-accent font-medium">{state.error}</p>
        ) : null}
        <div className="mt-5">
          <Submit />
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-skip-stone">
        Didn&apos;t get the code?{" "}
        <Link href="/c/login" prefetch className="text-skip-accent font-bold underline">
          Resend
        </Link>
      </p>
    </main>
  );
}

export default function VerifyOtp() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
