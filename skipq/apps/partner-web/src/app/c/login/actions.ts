"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const credSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupSchema = credSchema.extend({
  referralCode: z.string().trim().max(8).optional(),
});

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "Enter a valid phone number")
    .regex(/^\+?\d[\d\s-]*$/u, "Enter digits only"),
});

const otpSchema = z.object({
  phone: z.string().trim().min(7),
  code: z.string().trim().regex(/^\d{4,8}$/u, "Enter the 4-6 digit code"),
});

export type AuthState =
  | { error?: string; fieldErrors?: Record<string, string> }
  | undefined;

function flatErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.errors) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function safeReturnPath(formData: FormData): string {
  const raw = String(formData.get("next") ?? "").trim();
  const params = String(formData.get("nextParams") ?? "").trim();
  if (raw.startsWith("/c/")) return params ? `${raw}?${params}` : raw;
  return "/c/home";
}

function normaliseIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/gu, "");
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (raw.startsWith("+")) return `+${digits}`;
  return `+${digits}`;
}

export async function sendPhoneOtp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = phoneSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) return { fieldErrors: flatErrors(parsed.error) };
  const phone = normaliseIndianPhone(parsed.data.phone);
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) {
    // SMS provider not yet configured at the Supabase side is common in
    // pre-launch — surface a friendly nudge to the email path.
    if (/sms|provider|not configured|unauthorized/iu.test(error.message)) {
      return {
        error:
          "Phone OTP isn't enabled yet. Try email or Google below.",
      };
    }
    return { error: error.message };
  }
  const next = safeReturnPath(formData);
  const params = new URLSearchParams({ phone, next });
  redirect(`/c/login/verify?${params.toString()}`);
}

export async function verifyPhoneOtp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = otpSchema.safeParse({
    phone: formData.get("phone"),
    code: formData.get("code"),
  });
  if (!parsed.success) return { fieldErrors: flatErrors(parsed.error) };
  const phone = normaliseIndianPhone(parsed.data.phone);
  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token: parsed.data.code,
    type: "sms",
  });
  if (error) return { error: error.message };
  redirect(safeReturnPath(formData));
}

export async function customerSignIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: flatErrors(parsed.error) };
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email.trim(),
    password: parsed.data.password,
  });
  if (error) return { error: error.message };
  redirect(safeReturnPath(formData));
}

export async function customerSignUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    referralCode: formData.get("referralCode") ?? undefined,
  });
  if (!parsed.success) return { fieldErrors: flatErrors(parsed.error) };
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email.trim(),
    password: parsed.data.password,
  });
  if (error) return { error: error.message };
  if (!data.session) {
    return {
      error: "Check your inbox for a confirmation link. Tap it, then sign in.",
    };
  }
  if (parsed.data.referralCode) {
    await supabase.rpc("apply_referral_code", { p_code: parsed.data.referralCode });
  }
  redirect(safeReturnPath(formData));
}

export async function customerSignInWithGoogle(formData: FormData): Promise<void> {
  const supabase = createClient();
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://skipq-partner.vercel.app";
  const next = safeReturnPath(formData);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${base}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return;
  if (data?.url) redirect(data.url);
}

export async function customerSignOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/c/login");
}
