import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { id?: string; event?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const id = body?.id;
  const event = body?.event;
  if (!id || (event !== "impression" && event !== "click")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const supabase = createClient();
  // RPC was added in migration 0056; types regen separately
  await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<unknown>)("track_placement_event", {
    p_id: id,
    p_event: event,
  });
  return NextResponse.json({ ok: true });
}
