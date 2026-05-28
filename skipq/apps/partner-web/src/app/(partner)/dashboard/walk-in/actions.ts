"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculateWaitTime, type ServiceRequest } from "@skipq/algorithm";
import { requirePartner } from "@/lib/auth";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+\d{8,15}$/u, "Phone must be in E.164 format, e.g. +91XXXXXXXXXX");

const walkInSchema = z.object({
  guest_name: z.string().trim().min(1, "Name is required").max(80),
  guest_phone: phoneSchema,
  service_ids: z.array(z.string().uuid()).min(1, "Pick at least one service"),
  preferred_stylist_id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  notes: z.string().trim().max(280).optional(),
});

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

export async function createWalkIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = walkInSchema.safeParse({
    guest_name: formData.get("guest_name"),
    guest_phone: formData.get("guest_phone"),
    service_ids: formData.getAll("service_ids").map(String).filter(Boolean),
    preferred_stylist_id: formData.get("preferred_stylist_id") || "",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.errors) {
      const key = issue.path.join(".") || "_";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { supabase, partner } = await requirePartner();

  // Resolve service catalog rows for price, duration, category.
  const { data: services, error: servicesErr } = await supabase
    .from("services")
    .select("id, name, price, default_duration, category")
    .in("id", parsed.data.service_ids);

  if (servicesErr) return { error: servicesErr.message };
  if (!services || services.length === 0)
    return { error: "Couldn't find the selected services" };

  const totalPrice = services.reduce((acc, s) => acc + Number(s.price), 0);

  // ETA estimate: count active entries ahead globally at this salon. Refined
  // per-stylist version lands when we re-compute on every status change.
  const { count: aheadCount } = await supabase
    .from("queue_entries")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", partner.salon_id)
    .in("status", ["waiting", "arrived", "serving"]);

  const serviceRequests: ServiceRequest[] = services.map((s) => ({
    serviceId: s.id,
    defaultDurationMin: s.default_duration,
    category: s.category ?? "hair",
  }));

  // Pull each ahead entry's services so the algorithm can sum remaining time.
  const { data: aheadEntries } = await supabase
    .from("queue_entries")
    .select(
      `id, started_at,
       queue_entry_services ( duration_at_time, services ( category ) )`,
    )
    .eq("salon_id", partner.salon_id)
    .in("status", ["waiting", "arrived", "serving"])
    .order("joined_at", { ascending: true });

  const ahead = (aheadEntries ?? []).map((e) => ({
    services: (e.queue_entry_services ?? []).map((qes) => {
      const cat = Array.isArray(qes.services)
        ? qes.services[0]?.category
        : qes.services?.category;
      return {
        serviceId: "x",
        defaultDurationMin: qes.duration_at_time,
        category: cat ?? "hair",
      };
    }),
    startedAt: e.started_at ?? undefined,
  }));

  // Default stylist completion count to 0 (range-only ETA) when stylist isn't
  // picked at join time. The completeService action increments this.
  let stylistCompleted = 0;
  if (parsed.data.preferred_stylist_id) {
    const { data: stylist } = await supabase
      .from("stylists")
      .select("total_services")
      .eq("id", parsed.data.preferred_stylist_id)
      .single();
    stylistCompleted = stylist?.total_services ?? 0;
  }

  const eta = calculateWaitTime({
    ahead,
    services: serviceRequests,
    stylistCompletedServices: stylistCompleted,
  });

  // Position: append to the end of active entries.
  const position = (aheadCount ?? 0) + 1;

  const { data: inserted, error: insertErr } = await supabase
    .from("queue_entries")
    .insert({
      salon_id: partner.salon_id,
      guest_name: parsed.data.guest_name,
      guest_phone: parsed.data.guest_phone,
      preferred_stylist_id: parsed.data.preferred_stylist_id ?? null,
      stylist_id: parsed.data.preferred_stylist_id ?? null,
      position,
      status: "waiting",
      source: "walk_in_manual",
      estimated_wait_min: Math.round(eta.totalEtaMin),
      total_price: totalPrice,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return { error: insertErr?.message ?? "Failed to add walk-in" };
  }

  await supabase.from("queue_entry_services").insert(
    services.map((s) => ({
      queue_entry_id: inserted.id,
      service_id: s.id,
      price_at_time: Number(s.price),
      duration_at_time: s.default_duration,
    })),
  );

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
