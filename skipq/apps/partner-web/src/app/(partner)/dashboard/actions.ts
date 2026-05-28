"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { serviceSignature } from "@skipq/algorithm";
import type { Database } from "@skipq/shared-types";
import { requirePartner } from "@/lib/auth";

const idSchema = z.string().uuid();

type QueueEntryUpdate = Database["public"]["Tables"]["queue_entries"]["Update"];

export async function markArrived(formData: FormData): Promise<void> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;

  const { supabase } = await requirePartner();
  await supabase
    .from("queue_entries")
    .update({ status: "arrived", arrived_at: new Date().toISOString() })
    .eq("id", id.data);
  revalidatePath("/dashboard");
}

export async function startService(formData: FormData): Promise<void> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;

  // If the caller picked a stylist at start time (because the entry was
  // "any available"), assign it. Otherwise leave the existing stylist_id.
  const update: QueueEntryUpdate = {
    status: "serving",
    started_at: new Date().toISOString(),
  };
  const stylistOverride = formData.get("stylist_id");
  if (typeof stylistOverride === "string" && stylistOverride.length > 0) {
    const stylistId = idSchema.safeParse(stylistOverride);
    if (stylistId.success) update.stylist_id = stylistId.data;
  }

  const { supabase } = await requirePartner();
  await supabase.from("queue_entries").update(update).eq("id", id.data);
  revalidatePath("/dashboard");
}

export async function completeService(formData: FormData): Promise<void> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;

  const { supabase } = await requirePartner();
  const completedAt = new Date();

  const { data: entry } = await supabase
    .from("queue_entries")
    .select(
      `id, salon_id, stylist_id, started_at,
       queue_entry_services ( service_id )`,
    )
    .eq("id", id.data)
    .single();

  if (!entry) return;

  await supabase
    .from("queue_entries")
    .update({ status: "completed", completed_at: completedAt.toISOString() })
    .eq("id", id.data);

  // Feed the v2 algorithm: record actual service duration plus context.
  if (entry.stylist_id && entry.started_at) {
    const services = (entry.queue_entry_services ?? []).map((s) => s.service_id);
    if (services.length > 0) {
      const durationSeconds = Math.max(
        1,
        Math.round((completedAt.getTime() - Date.parse(entry.started_at)) / 1000),
      );
      await supabase.from("service_timings").insert({
        salon_id: entry.salon_id,
        stylist_id: entry.stylist_id,
        queue_entry_id: entry.id,
        service_signature: serviceSignature(services),
        total_duration_seconds: durationSeconds,
        day_of_week: completedAt.getDay(),
        hour_of_day: completedAt.getHours(),
      });

      // Bump the stylist's completion count so the algorithm flips from
      // "show range" to "show point estimate" once they cross threshold.
      const { data: stylist } = await supabase
        .from("stylists")
        .select("total_services")
        .eq("id", entry.stylist_id)
        .single();
      if (stylist) {
        await supabase
          .from("stylists")
          .update({ total_services: (stylist.total_services ?? 0) + 1 })
          .eq("id", entry.stylist_id);
      }
    }
  }

  revalidatePath("/dashboard");
}

export async function markNoShow(formData: FormData): Promise<void> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;

  const { supabase } = await requirePartner();
  await supabase
    .from("queue_entries")
    .update({ status: "no_show" })
    .eq("id", id.data);
  revalidatePath("/dashboard");
}

export async function cancelEntry(formData: FormData): Promise<void> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;

  const { supabase } = await requirePartner();
  await supabase
    .from("queue_entries")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", id.data);
  revalidatePath("/dashboard");
}
