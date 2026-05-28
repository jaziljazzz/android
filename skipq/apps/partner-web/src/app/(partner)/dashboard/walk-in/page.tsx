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
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <Link href="/dashboard" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back to queue
      </Link>
      <header className="mt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">Add a walk-in</h1>
        <p className="mt-2 text-skip-slate">
          Customer at the counter? Drop them into the queue and they&apos;ll start getting
          WhatsApp updates right away.
        </p>
      </header>

      <section className="mt-8">
        <WalkInForm services={services ?? []} stylists={stylists ?? []} />
      </section>
    </main>
  );
}
