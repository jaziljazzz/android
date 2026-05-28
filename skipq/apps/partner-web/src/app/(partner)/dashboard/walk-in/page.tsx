import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WalkInForm } from "./WalkInForm";

export const dynamic = "force-dynamic";

export default async function WalkInPage() {
  const supabase = createClient();
  const [{ data: services }, { data: stylists }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, price, default_duration")
      .eq("active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("stylists")
      .select("id, name, role")
      .neq("status", "off")
      .order("name", { ascending: true }),
  ]);

  return (
    <main className="p-8 max-w-2xl">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-skip-ink">Add walk-in</h1>
          <p className="mt-1 text-skip-stone text-sm">
            Customer is here at the counter. Add them to the queue and they&apos;ll start
            getting WhatsApp updates.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-skip-stone hover:text-skip-ink">
          ← Back to queue
        </Link>
      </header>

      <section className="mt-6">
        <WalkInForm services={services ?? []} stylists={stylists ?? []} />
      </section>
    </main>
  );
}
