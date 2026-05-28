"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePartner } from "@/lib/auth";

const SERVICE_CATEGORIES = ["hair", "beard", "colour", "facial"] as const;
const SERVICE_GENDERS = ["male", "female", "all"] as const;

const serviceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  category: z.enum(SERVICE_CATEGORIES).optional(),
  price: z.coerce.number().min(0, "Price must be ≥ 0"),
  default_duration: z.coerce
    .number()
    .int("Duration must be a whole number of minutes")
    .min(1, "Duration must be at least 1 minute")
    .max(480, "Cap services at 8 hours"),
  gender: z.enum(SERVICE_GENDERS).optional(),
  active: z.coerce.boolean().optional().default(true),
  display_order: z.coerce.number().int().optional().default(0),
});

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

function parseForm(formData: FormData) {
  const payload = Object.fromEntries(formData.entries());
  // checkbox sends "on" or nothing — coerce to boolean
  if ("active" in payload && payload.active === "") delete (payload as Record<string, unknown>).active;
  return serviceSchema.safeParse({
    ...payload,
    active: payload.active === "on" || payload.active === "true" || payload.active === undefined,
  });
}

function flatErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.errors) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createService(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: flatErrors(parsed.error) };

  const { supabase, partner } = await requirePartner();
  const { error } = await supabase.from("services").insert({
    ...parsed.data,
    salon_id: partner.salon_id,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/services");
  redirect("/dashboard/services");
}

export async function updateService(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: flatErrors(parsed.error) };

  const { supabase } = await requirePartner();
  const { error } = await supabase.from("services").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/services");
  redirect("/dashboard/services");
}

export async function deleteService(formData: FormData): Promise<void> {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  const { supabase } = await requirePartner();
  await supabase.from("services").delete().eq("id", id.data);
  revalidatePath("/dashboard/services");
}
