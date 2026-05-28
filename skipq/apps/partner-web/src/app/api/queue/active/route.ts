import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ booking: null });

  const sb = supabase as unknown as {
    rpc: (
      fn: string,
      args?: Record<string, unknown>,
    ) => Promise<{ data: unknown }>;
  };
  const { data } = await sb.rpc("customer_active_booking");
  const row = Array.isArray(data) && data.length ? data[0] : null;
  return NextResponse.json({ booking: row });
}
