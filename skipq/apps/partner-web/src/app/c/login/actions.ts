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

export type AuthState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

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
  // Only allow same-origin /c/* paths so attackers can't redirect off-site.
  if (raw.startsWith("/c/")) return params ? `${raw}?${params}` : raw;
  return "/c/home";
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
      error:
        "Check your inbox for a confirmation link. Tap it, then sign in.",
    };
  }
  if (parsed.data.referralCode) {
    await supabase.rpc("apply_referral_code", { p_code: parsed.data.referralCode });
  }
  redirect(safeReturnPath(formData));
}

export async function customerSignOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/c/login");
}
