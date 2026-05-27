"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// E.164 phone, e.g. +916282640278. Spec §13 uses this format.
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+\d{8,15}$/u, "Enter your phone in E.164 format, e.g. +91XXXXXXXXXX");

const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{4,8}$/u, "OTP should be 4–8 digits");

export type SendOtpState = { error?: string } | undefined;

export async function sendOtp(_prev: SendOtpState, formData: FormData): Promise<SendOtpState> {
  const parsed = phoneSchema.safeParse(formData.get("phone"));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid phone" };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone: parsed.data });
  if (error) {
    return { error: error.message };
  }

  redirect(`/login/verify?phone=${encodeURIComponent(parsed.data)}`);
}

export type VerifyOtpState = { error?: string } | undefined;

export async function verifyOtp(
  _prev: VerifyOtpState,
  formData: FormData,
): Promise<VerifyOtpState> {
  const phone = phoneSchema.safeParse(formData.get("phone"));
  const otp = otpSchema.safeParse(formData.get("otp"));
  if (!phone.success) return { error: "Missing phone — restart sign-in." };
  if (!otp.success) return { error: otp.error.errors[0]?.message ?? "Invalid OTP" };

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone: phone.data,
    token: otp.data,
    type: "sms",
  });
  if (error) return { error: error.message };

  // Link the freshly-authenticated user to their pre-provisioned partner row.
  // Sales rep created partner_users.phone == this phone; we claim it.
  const { error: linkError } = await supabase.rpc("link_partner_user");
  if (linkError) {
    return {
      error: `Signed in, but no partner record found for ${phone.data}. Ask the skipQ team to provision your salon.`,
    };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
