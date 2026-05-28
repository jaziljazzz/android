// SkipQ edge function: create-payment-order
//
// POST /functions/v1/create-payment-order
// Auth: Supabase JWT
// Body: { queue_entry_id: string }
// Returns: { order_id, amount, currency, key_id, payment_id }
//
// Creates a Razorpay order for the caller's queue entry total_price and
// inserts a pending row in public.payments. Caller hands the returned
// order_id to react-native-razorpay to open the checkout sheet.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return respond(405, { error: "method not allowed" });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return respond(401, { error: "missing authorization" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return respond(500, { error: "supabase env missing" });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userRes } = await userClient.auth.getUser();
  const user = userRes.user;
  if (!user) return respond(401, { error: "unauthenticated" });

  let payload: { queue_entry_id?: string };
  try {
    payload = await req.json();
  } catch {
    return respond(400, { error: "invalid json body" });
  }
  const queueEntryId = payload.queue_entry_id;
  if (!queueEntryId || typeof queueEntryId !== "string") {
    return respond(400, { error: "queue_entry_id required" });
  }

  // RLS scopes this to the caller's own entries
  const { data: entry, error: entryErr } = await userClient
    .from("queue_entries")
    .select("id, salon_id, total_price, status, user_id")
    .eq("id", queueEntryId)
    .single();

  if (entryErr || !entry) return respond(404, { error: "queue entry not found" });
  if (entry.user_id !== user.id) return respond(403, { error: "not your queue entry" });
  if (
    entry.status !== "waiting" &&
    entry.status !== "arrived" &&
    entry.status !== "waiting_deposit"
  ) {
    return respond(400, { error: `queue entry status '${entry.status}' is not payable` });
  }

  // Deposit-required entries fall back to a ₹50 hold even when total_price is 0.
  const rawAmount = entry.status === "waiting_deposit"
    ? Math.max(50, Number(entry.total_price ?? 0))
    : Number(entry.total_price ?? 0);
  const amountInPaise = Math.round(rawAmount * 100);
  if (!amountInPaise || amountInPaise <= 0) {
    return respond(400, { error: "queue entry has no price set" });
  }

  // Pull Razorpay creds from vault
  const { data: credsRow, error: credsErr } = await adminClient.rpc("get_razorpay_creds");
  if (credsErr || !credsRow) {
    return respond(500, { error: "couldn't read razorpay creds" });
  }
  const creds = credsRow as { key_id?: string; key_secret?: string };
  if (!creds.key_id || !creds.key_secret) {
    return respond(500, { error: "razorpay creds not provisioned" });
  }

  // Create the order on Razorpay
  const basicAuth = btoa(`${creds.key_id}:${creds.key_secret}`);
  const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${basicAuth}`,
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: "INR",
      // receipt must be <= 40 chars per Razorpay spec
      receipt: `qe_${queueEntryId.slice(0, 36)}`,
      notes: {
        queue_entry_id: queueEntryId,
        salon_id: entry.salon_id,
        user_id: user.id,
      },
    }),
  });

  const orderBody = await orderRes.json();
  if (!orderRes.ok) {
    return respond(502, {
      error: "razorpay order create failed",
      detail: orderBody?.error?.description ?? null,
    });
  }

  // Record the pending payment using service-role (RLS doesn't have a
  // customer-insert policy on payments).
  const { data: paymentRow, error: payErr } = await adminClient
    .from("payments")
    .insert({
      queue_entry_id: queueEntryId,
      user_id: user.id,
      salon_id: entry.salon_id,
      amount: Number(entry.total_price),
      razorpay_order_id: orderBody.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (payErr) {
    return respond(500, { error: "failed to record payment", detail: payErr.message });
  }

  return respond(200, {
    order_id: orderBody.id,
    amount: amountInPaise,
    currency: "INR",
    key_id: creds.key_id,
    payment_id: paymentRow.id,
  });
});
