import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StylistForm } from "../StylistForm";

export const dynamic = "force-dynamic";

export default async function EditStylistPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: stylist } = await supabase
    .from("stylists")
    .select("id, name, role, specialty, photo, status, gender_serves")
    .eq("id", params.id)
    .maybeSingle();

  if (!stylist) notFound();

  return (
    <main className="p-8 max-w-4xl">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-skip-ink">Edit stylist</h1>
          <p className="mt-1 text-skip-stone text-sm">{stylist.name}</p>
        </div>
        <Link href="/dashboard/stylists" className="text-sm text-skip-stone hover:text-skip-ink">
          ← Back
        </Link>
      </header>

      <section className="mt-6">
        <StylistForm
          initial={{
            id: stylist.id,
            name: stylist.name,
            role: stylist.role,
            specialty: stylist.specialty,
            photo: stylist.photo,
            status: stylist.status,
            gender_serves: stylist.gender_serves ?? [],
          }}
        />
      </section>
    </main>
  );
}
