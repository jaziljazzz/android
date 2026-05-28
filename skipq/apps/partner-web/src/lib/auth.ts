import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Loads the current partner's row, or redirects to /login if absent. */
export async function requirePartner() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: partner, error } = await supabase
    .from("partner_users")
    .select("id, name, role, salon_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!partner) redirect("/login");

  return { supabase, partner, user };
}
