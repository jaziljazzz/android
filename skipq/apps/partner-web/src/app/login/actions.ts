"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email("Enter a valid email address");

const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{4,8}$/u, "OTP should be 4–8 digits");

export type SendOtpState = { error?: string } | undefined;

export async function sendOtp(_prev: SendOtpState, formData: FormData): Promise<SendOtpState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid email" };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: true },
  });
  if (error) {
    return { error: error.message };
  }

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

  // Claim the pre-provisioned partner_users row matching this email
  const { data: linked, error: linkError } = await supabase.rpc("link_partner_user");
  if (linkError) {
    return {
      error: `Signed in, but no partner record found for ${email.data}. Ask the SkipQ team to provision your salon.`,
    };
  }
  if (!linked) {
    return {
      error: `Signed in as ${email.data}, but no SkipQ salon is linked to this email. Ask the SkipQ team to set it up.`,
    };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
