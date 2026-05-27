import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@skipq/shared-types";

export type SkipqClient = SupabaseClient<Database>;

export interface CreateClientOptions {
  url: string;
  anonKey: string;
}

export function createSkipqClient({ url, anonKey }: CreateClientOptions): SkipqClient {
  if (!url || !anonKey) {
    throw new Error("createSkipqClient: url and anonKey are required");
  }
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}
