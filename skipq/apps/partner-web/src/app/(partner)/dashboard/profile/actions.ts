"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePartner } from "@/lib/auth";

const SALON_TYPES = ["mens", "ladies", "unisex"] as const;
const SALON_STATUSES = ["pending", "active", "suspended"] as const;

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  tagline: z.string().trim().max(160).optional(),
  type: z.enum(SALON_TYPES).optional(),
  status: z.enum(SALON_STATUSES),
  address: z.string().trim().min(1, "Address is required").max(280),
  area: z.string().trim().max(80).optional(),
  city: z.string().trim().min(1, "City is required").max(80),
  state: z.string().trim().min(1, "State is required").max(80),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  upi_id: z.string().trim().max(80).optional(),
  gst_number: z.string().trim().max(20).optional(),
});

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

function flatErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.errors) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function updateSalonProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: flatErrors(parsed.error) };

  const { supabase, partner } = await requirePartner();
  if (partner.role !== "owner") {
    return { error: "Only owners can edit the salon profile." };
  }

  const { email, tagline, area, type, phone, upi_id, gst_number, ...rest } = parsed.data;
  const update = {
    ...rest,
    tagline: tagline || null,
    area: area || null,
    type: type ?? null,
    phone: phone || null,
    email: email || null,
    upi_id: upi_id || null,
    gst_number: gst_number || null,
  };

  const { error } = await supabase
    .from("salons")
    .update(update)
    .eq("id", partner.salon_id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/profile");
  redirect("/dashboard/profile?saved=1");
}
