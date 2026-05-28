import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth";
import { BoostCheckout } from "./BoostCheckout";

export const dynamic = "force-dynamic";

export default async function BoostPage() {
  const { partner } = await requirePartner();
  const supabase = createClient();
  const { data: salon } = await supabase
    .from("salons")
    .select("name, search_boost_credits")
    .eq("id", partner.salon_id)
    .single();

  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <Link href="/dashboard" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back to queue
      </Link>
      <header className="mt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">
          Search boost
        </h1>
        <p className="mt-2 text-skip-slate max-w-2xl">
          Pay per click. Boost gives your salon a small rank bump in the
          customer&apos;s nearby list. We deduct one credit each time a customer taps
          your card.
        </p>
      </header>

      <section className="mt-6 skip-card p-6">
        <p className="text-skip-slate">
          You have{" "}
          <span className="text-skip-ink font-bold">{salon?.search_boost_credits ?? 0}</span>{" "}
          click credits left.
        </p>
      </section>

      {partner.role !== "owner" ? (
        <p className="mt-10 text-sm text-skip-stone">
          Only the salon owner can buy boost packs.
        </p>
      ) : (
        <BoostCheckout salonName={salon?.name ?? "your salon"} />
      )}
    </main>
  );
}
