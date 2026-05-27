import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SkipqClient = SupabaseClient;

export interface CreateClientOptions {
  url: string;
  anonKey: string;
}

export function createSkipqClient({ url, anonKey }: CreateClientOptions): SkipqClient {
  if (!url || !anonKey) {
    throw new Error("createSkipqClient: url and anonKey are required");
  }
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}
