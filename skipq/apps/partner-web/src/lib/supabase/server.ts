import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import type { Database } from "@skipq/shared-types";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

export function createClient() {
  const cookieStore = cookies();
  const { url, anonKey } = supabaseEnv();

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      } catch {
        // Called from a Server Component — Next.js disallows cookie writes
        // there. The middleware refreshes the session on every request, so
        // this branch is fine to swallow.
      }
    },
  };

  return createServerClient<Database>(url, anonKey, { cookies: cookieMethods });
}
