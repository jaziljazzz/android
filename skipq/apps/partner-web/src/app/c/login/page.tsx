"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import {
  customerSignInWithGoogle,
  sendPhoneOtp,
  type AuthState,
} from "./actions";

function Continue() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-skip-accent text-white font-bold py-4 rounded-2xl active:opacity-80 disabled:opacity-60 transition shadow-card"
    >
      {pending ? "Sending OTP…" : "Continue"}
    </button>
  );
}

function LoginInner() {
  const search = useSearchParams();
  const router = useRouter();
  const next = search.get("next") ?? "";

  const [state, action] = useFormState<AuthState, FormData>(
    sendPhoneOtp,
    undefined,
  );

  const [phone, setPhone] = useState("");
  const err = (k: string) => state?.fieldErrors?.[k];

  function skip() {
    router.push("/c/home");
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Hero */}
      <div className="relative">
        <div
          className="relative h-[44vh] min-h-[280px] max-h-[420px] overflow-hidden flex items-center justify-center"
          style={{
            background:
              "linear-gradient(160deg, #FF6B6B 0%, #FF5454 50%, #E03B3B 100%)",
          }}
        >
          {/* Decorative confetti */}
          <div className="absolute inset-0 opacity-50 text-white text-xl">
            <div className="absolute left-[8%] top-[12%]">✦</div>
            <div className="absolute left-[18%] top-[28%]">·</div>
            <div className="absolute left-[28%] top-[18%]">✧</div>
            <div className="absolute right-[12%] top-[10%]">✦</div>
            <div className="absolute right-[28%] top-[22%]">·</div>
            <div className="absolute right-[18%] top-[42%]">✧</div>
            <div className="absolute left-[12%] bottom-[18%]">✦</div>
            <div className="absolute right-[10%] bottom-[14%]">·</div>
            <div className="absolute left-[40%] bottom-[8%]">✧</div>
          </div>

          {/* SkipQ wordmark */}
          <div className="relative text-center px-6">
            <p className="text-white font-black text-5xl tracking-tight drop-shadow-sm">
              SkipQ
            </p>
            <p className="mt-2 text-white/90 font-medium text-sm">
              Skip the wait at every salon
            </p>
          </div>

          {/* Skip button */}
          <button
            type="button"
            onClick={skip}
            className="absolute top-4 right-4 px-4 py-1.5 rounded-full bg-skip-ink/85 text-white text-sm font-bold active:opacity-70"
          >
            Skip
          </button>

          {/* Stylised salon icons */}
          <svg
            className="absolute left-5 bottom-6 text-white/70"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
          <svg
            className="absolute right-6 bottom-8 text-white/70"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3h18v6H3z" />
            <path d="M5 9v12h14V9" />
            <line x1="9" y1="13" x2="9" y2="17" />
            <line x1="12" y1="13" x2="12" y2="17" />
            <line x1="15" y1="13" x2="15" y2="17" />
          </svg>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="flex-1 px-6 pt-7 pb-6 flex flex-col">
        <h1 className="text-2xl font-extrabold text-skip-ink leading-tight text-center">
          Kerala&apos;s smartest way<br />to skip salon queues
        </h1>

        <div className="my-5 flex items-center gap-3">
          <span className="flex-1 h-px bg-skip-stone/20" />
          <span className="text-xs font-bold text-skip-stone tracking-wide">
            Log in or sign up
          </span>
          <span className="flex-1 h-px bg-skip-stone/20" />
        </div>

        <form action={action}>
          <input type="hidden" name="next" value={next} />
          <div className="flex items-stretch gap-2">
            <div className="flex items-center gap-1 px-3 rounded-xl border border-skip-stone/25 bg-white">
              <span className="text-lg leading-none">🇮🇳</span>
              <span className="text-skip-ink font-bold text-sm">+91</span>
            </div>
            <div className="flex-1">
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="Enter Mobile Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/gu, ""))}
                maxLength={10}
                className="w-full h-12 px-3 rounded-xl border border-skip-stone/25 bg-white outline-none text-skip-ink placeholder:text-skip-stone focus:border-skip-accent"
              />
            </div>
          </div>
          {err("phone") ? (
            <p className="mt-2 text-xs text-skip-accent font-medium">{err("phone")}</p>
          ) : null}
          {state?.error ? (
            <p className="mt-2 text-xs text-skip-accent font-medium">{state.error}</p>
          ) : null}

          <div className="mt-4">
            <Continue />
          </div>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="flex-1 h-px bg-skip-stone/20" />
          <span className="text-xs font-medium text-skip-stone">or</span>
          <span className="flex-1 h-px bg-skip-stone/20" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <form action={customerSignInWithGoogle}>
            <input type="hidden" name="next" value={next} />
            <button
              type="submit"
              className="w-full h-14 rounded-2xl bg-white border border-skip-stone/15 flex items-center justify-center active:opacity-70 shadow-sm"
              aria-label="Continue with Google"
            >
              <svg width="28" height="28" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5C9.5 39.7 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C40.1 36 44 30.5 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
            </button>
          </form>

          <button
            type="button"
            disabled
            className="w-full h-14 rounded-2xl bg-white border border-skip-stone/15 flex items-center justify-center opacity-40"
            aria-label="Apple sign-in (coming soon)"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#000">
              <path d="M16.365 1.43c0 1.14-.491 2.064-1.197 2.755-.79.78-2.02 1.37-3.01 1.29-.16-1.06.39-2.13 1.05-2.81.78-.84 2.06-1.46 3.157-1.235zM21 17.55c-.41.95-.61 1.37-1.13 2.21-.74 1.18-1.78 2.65-3.07 2.66-1.15.01-1.45-.75-3.01-.74-1.56.01-1.89.76-3.04.74-1.29-.02-2.27-1.34-3.01-2.52C5.16 15.94 4.94 11 7.07 8.71c1.06-1.15 2.62-1.74 4.06-1.74 1.47.01 2.69.83 3.4.83.7 0 2.2-1.03 3.81-.88.67.03 2.56.27 3.77 2.06-3.31 1.79-2.77 6.23-1.11 8.57z" />
            </svg>
          </button>

          <Link
            href={`/c/login/email${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            prefetch
            className="w-full h-14 rounded-2xl bg-white border border-skip-stone/15 flex items-center justify-center active:opacity-70 shadow-sm"
            aria-label="Continue with email"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FF5454" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </Link>
        </div>

        <p className="mt-auto pt-6 text-center text-[11px] text-skip-stone leading-relaxed">
          By continuing, you agree to our{" "}
          <Link href="/privacy" className="underline text-skip-slate">
            Terms of Service
          </Link>
          {" · "}
          <Link href="/privacy" className="underline text-skip-slate">
            Privacy Policy
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function CustomerLogin() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
