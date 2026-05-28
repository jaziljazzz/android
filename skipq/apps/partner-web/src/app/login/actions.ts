"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email("Enter a valid email address");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");
const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{4,8}$/u, "OTP should be 4–8 digits");

export type AuthState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

function flatErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.errors) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

async function linkAndRedirect() {
  const supabase = createClient();
  const { error: linkError } = await supabase.rpc("link_partner_user");
  if (linkError) {
    return {
      error: "Signed in, but no partner record matched this email. Ask the SkipQ team.",
    };
  }
  // Note: link_partner_user returns null for unmatched emails (no error)
  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Password sign-in
// ---------------------------------------------------------------------------
export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1, "Password is required") })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success) return { fieldErrors: flatErrors(parsed.error) };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: error.message };

  return linkAndRedirect();
}

// ---------------------------------------------------------------------------
// Password sign-up
// ---------------------------------------------------------------------------
export async function signUpWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = z
    .object({ email: emailSchema, password: passwordSchema })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success) return { fieldErrors: flatErrors(parsed.error) };

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: error.message };

  // If "Confirm email" is enabled in Supabase, session is null here — user has
  // to click the email link before they can sign in. If disabled, they're
  // signed in already.
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    return {
      error: `Account created. Check ${parsed.data.email} for a confirmation link, then come back to sign in.`,
    };
  }
  return linkAndRedirect();
}

// ---------------------------------------------------------------------------
// OTP fallback (email-only, sends 6-digit code)
// ---------------------------------------------------------------------------
export type SendOtpState = { error?: string } | undefined;
export async function sendOtp(_prev: SendOtpState, formData: FormData): Promise<SendOtpState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid email" };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: true },
  });
  if (error) return { error: error.message };
  redirect(`/login/verify?email=${encodeURIComponent(parsed.data)}`);
}

export type VerifyOtpState = { error?: string } | undefined;
export async function verifyOtp(
  _prev: VerifyOtpState,
  formData: FormData,
): Promise<VerifyOtpState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const otp = otpSchema.safeParse(formData.get("otp"));
  if (!email.success) return { error: "Missing email — restart sign-in." };
  if (!otp.success) return { error: otp.error.errors[0]?.message ?? "Invalid OTP" };

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: email.data,
    token: otp.data,
    type: "email",
  });
  if (error) return { error: error.message };
  return linkAndRedirect();
}

// ---------------------------------------------------------------------------
// Sign-out
// ---------------------------------------------------------------------------
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
