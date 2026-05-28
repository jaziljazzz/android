"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePartner } from "@/lib/auth";

const STYLIST_STATUSES = ["available", "busy", "break", "off"] as const;
const GENDERS = ["male", "female", "all"] as const;

const stylistSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  role: z.string().trim().max(40).optional(),
  specialty: z.string().trim().max(120).optional(),
  photo: z.string().url("Must be a URL").optional().or(z.literal("")),
  status: z.enum(STYLIST_STATUSES).default("available"),
  gender_serves: z.array(z.enum(GENDERS)).min(1, "Pick at least one"),
});

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

function parseForm(formData: FormData) {
  // gender_serves arrives as multiple values under the same key
  const gender_serves = formData.getAll("gender_serves").map(String);
  const payload = {
    name: formData.get("name"),
    role: formData.get("role") || undefined,
    specialty: formData.get("specialty") || undefined,
    photo: formData.get("photo") || undefined,
    status: formData.get("status") || "available",
    gender_serves,
  };
  return stylistSchema.safeParse(payload);
}

function flatErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.errors) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createStylist(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: flatErrors(parsed.error) };

  const { supabase, partner } = await requirePartner();
  const { photo, ...rest } = parsed.data;
  const { error } = await supabase.from("stylists").insert({
    ...rest,
    photo: photo || null,
    salon_id: partner.salon_id,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/stylists");
  redirect("/dashboard/stylists");
}

export async function updateStylist(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: flatErrors(parsed.error) };

  const { supabase } = await requirePartner();
  const { photo, ...rest } = parsed.data;
  const { error } = await supabase
    .from("stylists")
    .update({ ...rest, photo: photo || null })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/stylists");
  redirect("/dashboard/stylists");
}

export async function deleteStylist(formData: FormData): Promise<void> {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  const { supabase } = await requirePartner();
  await supabase.from("stylists").delete().eq("id", id.data);
  revalidatePath("/dashboard/stylists");
}
