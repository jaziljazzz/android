import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().min(1).max(280),
  area: z.string().trim().max(80).optional(),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  type: z.enum(["mens", "ladies", "unisex"]).optional(),
  owner_email: z.string().trim().email(),
  owner_name: z.string().trim().min(1).max(80),
});

async function createSalon(formData: FormData) {
  "use server";
  const parsed = schema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    area: formData.get("area") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    type: formData.get("type") || undefined,
    owner_email: formData.get("owner_email"),
    owner_name: formData.get("owner_name"),
  });
  if (!parsed.success) {
    redirect(`/admin/salons/new?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Invalid input")}`);
  }
  const supabase = createClient();
  const { data: salon, error: insErr } = await supabase
    .from("salons")
    .insert({
      name: parsed.data.name,
      address: parsed.data.address,
      area: parsed.data.area ?? null,
      city: parsed.data.city,
      state: parsed.data.state,
      type: parsed.data.type ?? null,
      status: "active",
    })
    .select("id")
    .single();
  if (insErr) {
    redirect(`/admin/salons/new?error=${encodeURIComponent(insErr.message)}`);
  }
  const { error: puErr } = await supabase.from("partner_users").insert({
    salon_id: salon.id,
    email: parsed.data.owner_email.toLowerCase(),
    name: parsed.data.owner_name,
    role: "owner",
  });
  if (puErr) {
    redirect(`/admin/salons/new?error=${encodeURIComponent(puErr.message)}`);
  }
  redirect(`/admin/salons/${salon.id}`);
}

export default function NewSalonPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="max-w-2xl mx-auto px-6 py-8 sm:py-10">
      <Link href="/admin" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back to salons
      </Link>
      <header className="mt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">Onboard salon</h1>
        <p className="mt-2 text-skip-slate">
          Creates the salon record and the first owner partner_users row. The owner signs in with this email to claim the salon.
        </p>
      </header>

      {searchParams.error ? (
        <div className="mt-4 rounded-xl bg-skip-accentLo border border-skip-accent/20 px-4 py-3" role="alert">
          <p className="text-sm text-skip-accent font-medium">{searchParams.error}</p>
        </div>
      ) : null}

      <form action={createSalon} className="skip-card p-6 mt-6 space-y-4">
        <Field label="Salon name"><input name="name" required className="skip-input" /></Field>
        <Field label="Address"><textarea name="address" required rows={2} className="skip-input resize-none" /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Area"><input name="area" className="skip-input" /></Field>
          <Field label="City"><input name="city" required defaultValue="Kochi" className="skip-input" /></Field>
          <Field label="State"><input name="state" required defaultValue="Kerala" className="skip-input" /></Field>
        </div>
        <Field label="Type">
          <select name="type" className="skip-input" defaultValue="">
            <option value="">—</option>
            <option value="mens">Men&apos;s</option>
            <option value="ladies">Ladies</option>
            <option value="unisex">Unisex</option>
          </select>
        </Field>
        <hr className="border-skip-stone/10" />
        <Field label="Owner email">
          <input name="owner_email" type="email" required className="skip-input" />
        </Field>
        <Field label="Owner name">
          <input name="owner_name" required className="skip-input" />
        </Field>
        <button type="submit" className="skip-btn-primary w-full">Create salon</button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
