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
    <main className="p-8 max-w-4xl">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-skip-ink">Edit service</h1>
          <p className="mt-1 text-skip-stone text-sm">{service.name}</p>
        </div>
        <Link href="/dashboard/services" className="text-sm text-skip-stone hover:text-skip-ink">
          ← Back
        </Link>
      </header>

      <section className="mt-6">
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
