"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = ["jazilsameer@gmail.com"];

const credSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
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

export async function adminSignIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: flatErrors(parsed.error) };

  if (!ADMIN_EMAILS.includes(parsed.data.email)) {
    return {
      error:
        "This sign-in is for the SkipQ admin team. Salon partners — use the staff sign-in page.",
    };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: error.message };

  redirect("/admin");
}

export async function adminSignOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin-login");
}
