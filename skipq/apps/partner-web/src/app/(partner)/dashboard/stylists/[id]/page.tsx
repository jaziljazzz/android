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
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <Link href="/dashboard/stylists" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back to stylists
      </Link>
      <header className="mt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">Edit stylist</h1>
        <p className="mt-2 text-skip-slate">{stylist.name}</p>
      </header>

      <section className="mt-8">
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
