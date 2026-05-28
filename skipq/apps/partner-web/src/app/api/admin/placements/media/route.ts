import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ADMIN_EMAILS = ["jazilsameer@gmail.com"];

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  let body: { id?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const id = body?.id;
  const url = body?.url;
  if (!id || typeof url !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const sb = supabase as unknown as {
    from: (t: string) => {
      update: (patch: Record<string, unknown>) => {
        eq: (col: string, v: string) => Promise<{ error: unknown }>;
      };
    };
  };
  const { error } = await sb
    .from("sponsored_placements")
    .update({ media_url: url })
    .eq("id", id);
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
