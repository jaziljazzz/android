import { createClient } from "@/lib/supabase/server";

export interface Placement {
  id: string;
  brand_name: string;
  brand_logo_url: string | null;
  campaign_name: string;
  copy_eyebrow: string | null;
  copy_title: string;
  copy_subtitle: string | null;
  media_url: string;
  media_poster_url: string | null;
  media_type: "image" | "video";
  bg_color: string;
  fg_color: string;
  accent_color: string;
  cta_label: string;
  cta_url: string | null;
}

export type PlacementSlot =
  | "home_hero"
  | "home_video"
  | "home_strip"
  | "salon_detail";

export async function fetchPlacements(
  slot: PlacementSlot,
  city?: string | null,
  limit = 6,
): Promise<Placement[]> {
  const supabase = createClient();
  // RPC was added in migration 0056; types regen separately
  const sb = supabase as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: unknown }>;
  };
  const { data, error } = await sb.rpc("placements_for_slot", {
    p_slot: slot,
    p_city: city ?? null,
    p_limit: limit,
  });
  if (error || !Array.isArray(data)) return [];
  return data as Placement[];
}
