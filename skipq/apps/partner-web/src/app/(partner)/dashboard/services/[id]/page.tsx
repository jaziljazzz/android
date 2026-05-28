import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServiceForm } from "../ServiceForm";

export const dynamic = "force-dynamic";

export default async function EditServicePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: service } = await supabase
    .from("services")
    .select("id, name, category, price, default_duration, gender, active, display_order")
    .eq("id", params.id)
    .maybeSingle();

  if (!service) notFound();

  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <Link href="/dashboard/services" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back to services
      </Link>
      <header className="mt-4">
        <h1 className="text-4xl font-extrabold text-skip-ink leading-tight">Edit service</h1>
        <p className="mt-2 text-skip-slate">{service.name}</p>
      </header>

      <section className="mt-8">
        <ServiceForm
          initial={{
            id: service.id,
            name: service.name,
            category: service.category,
            price: Number(service.price),
            default_duration: service.default_duration,
            gender: service.gender,
            active: service.active,
            display_order: service.display_order,
          }}
        />
      </section>
    </main>
  );
}
