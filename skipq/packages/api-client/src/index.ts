import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@skipq/shared-types";

export type { Session, User, AuthError } from "@supabase/supabase-js";
export type SkipqClient = SupabaseClient<Database>;

/**
 * Optional AsyncStorage-compatible adapter. Pass AsyncStorage on React
 * Native; omit on web (cookies handle persistence via @supabase/ssr).
 */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

export interface CreateClientOptions {
  url: string;
  anonKey: string;
  storage?: StorageAdapter;
}

export function createSkipqClient({ url, anonKey, storage }: CreateClientOptions): SkipqClient {
  if (!url || !anonKey) {
    throw new Error("createSkipqClient: url and anonKey are required");
  }
  return createClient<Database>(url, anonKey, {
    auth: {
      ...(storage ? { storage } : {}),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}
