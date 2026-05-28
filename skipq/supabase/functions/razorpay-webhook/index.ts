// SkipQ edge function: razorpay-webhook
//
// POST /functions/v1/razorpay-webhook
// Auth: none (Razorpay POSTs here; signature verified inside)
// Body: Razorpay webhook event payload
// Headers: x-razorpay-signature (hex HMAC-SHA256 of raw body with webhook_secret)
//
// On payment.captured: flips public.payments.status='paid' and stamps the
// queue_entries notes with "Paid via Razorpay" so the partner dashboard
// knows the customer pre-paid (and the receptionist can prioritise them).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function ok() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
function bad(status: number, msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return bad(405, "method not allowed");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return bad(500, "supabase env missing");

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: creds, error: credsErr } = await admin.rpc("get_razorpay_creds");
  if (credsErr || !creds) return bad(500, "couldn't read creds");
  const webhookSecret = (creds as { webhook_secret?: string }).webhook_secret;
  if (!webhookSecret || webhookSecret === "PENDING_CONFIGURATION") {
    return bad(503, "webhook secret not configured");
  }

  const rawBody = await req.text();
  const provided = req.headers.get("x-razorpay-signature") ?? "";
  const expected = await hmacSha256Hex(webhookSecret, rawBody);
  if (!constantTimeEqual(expected, provided)) {
    return bad(401, "invalid signature");
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: Record<string, unknown> } };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return bad(400, "invalid json");
  }

  const payment = event.payload?.payment?.entity ?? null;
  if (!payment) return ok(); // nothing to do for non-payment events

  const orderId = String(payment.order_id ?? "");
  const paymentId = String(payment.id ?? "");
  const amount = Number(payment.amount ?? 0) / 100;
  const status = String(payment.status ?? "");
  const eventName = event.event ?? "";

  if (!orderId || !paymentId) return ok();

  // Look up our payments row by order_id (we inserted it in create-payment-order / create-featured-order)
  const { data: pay } = await admin
    .from("payments")
    .select("id, queue_entry_id, purpose")
    .eq("razorpay_order_id", orderId)
    .single();

  if (!pay) {
    // Unknown order — log and 200 so Razorpay doesn't retry forever
    console.warn(`webhook: unknown order_id ${orderId} (event=${eventName})`);
    return ok();
  }

  if (eventName === "payment.captured" || status === "captured") {
    await admin
      .from("payments")
      .update({
        razorpay_payment_id: paymentId,
        amount,
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", pay.id);

    if (pay.purpose === "featured") {
      // Extend salons.featured_until
      const { error: featErr } = await admin.rpc("apply_featured_purchase", {
        p_payment_id: pay.id,
      });
      if (featErr) {
        console.error(`webhook: apply_featured_purchase failed`, featErr);
      }
    } else if (pay.queue_entry_id) {
      // Surface payment status on the queue_entry so the partner dashboard
      // can show a "PAID" badge without joining the payments table.
      await admin
        .from("queue_entries")
        .update({
          notes: "✓ Paid in advance via SkipQ",
        })
        .eq("id", pay.queue_entry_id);
    }
  } else if (eventName === "payment.failed" || status === "failed") {
    await admin
      .from("payments")
      .update({
        razorpay_payment_id: paymentId,
        status: "refunded",
      })
      .eq("id", pay.id);
  }

  return ok();
});
