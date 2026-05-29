// SkipQ edge function: create-plus-order
//
// POST /functions/v1/create-plus-order
// Auth: Supabase JWT (customer)
// Body: { months: 1 | 12 }
// Returns: { order_id, amount, currency, key_id, payment_id, months }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRICES_INR: Record<number, number> = {
  1: 99,
  12: 799,
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

  let payload: { months?: number };
  try {
    payload = await req.json();
  } catch {
    return respond(400, { error: "invalid json body" });
  }
  const months = Number(payload.months ?? 0);
  if (!PRICES_INR[months]) {
    return respond(400, { error: "months must be 1 or 12" });
  }
  const amountInr = PRICES_INR[months];
  const amountInPaise = amountInr * 100;

  const { data: credsRow, error: credsErr } = await adminClient.rpc("get_razorpay_creds");
  if (credsErr || !credsRow) {
    return respond(500, { error: "couldn't read razorpay creds" });
  }
  const creds = credsRow as { key_id?: string; key_secret?: string };
  if (!creds.key_id || !creds.key_secret) {
    return respond(500, { error: "razorpay creds not provisioned" });
  }

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
      receipt: `plus_${user.id.slice(0, 28)}_${months}m`.slice(0, 40),
      notes: {
        kind: "plus",
        user_id: user.id,
        months: String(months),
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

  const { data: paymentRow, error: payErr } = await adminClient
    .from("payments")
    .insert({
      queue_entry_id: null,
      user_id: user.id,
      salon_id: null,
      amount: amountInr,
      razorpay_order_id: orderBody.id,
      status: "pending",
      purpose: "plus",
      metadata: { months },
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
    months,
  });
});
