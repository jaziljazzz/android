import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth";
import { FeaturedCheckout } from "./FeaturedCheckout";

export const dynamic = "force-dynamic";

export default async function FeaturedPage() {
  const { partner } = await requirePartner();
  const supabase = createClient();
  const { data: salon } = await supabase
    .from("salons")
    .select("name, featured_until")
    .eq("id", partner.salon_id)
    .single();

  const until = salon?.featured_until ? new Date(salon.featured_until) : null;
  const active = until && until > new Date();
  const daysLeft = active && until ? Math.ceil((until.getTime() - Date.now()) / 86400000) : 0;

  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <Link href="/dashboard" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back to queue
      </Link>
      <header className="mt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">Featured listing</h1>
        <p className="mt-2 text-skip-slate max-w-2xl">
          Featured salons jump to the top of every customer&apos;s home list and get a
          coral &ldquo;Featured&rdquo; pill on their card. Higher visibility → more first-time
          customers in the door.
        </p>
      </header>

      <section className="mt-6 skip-card p-6">
        {active && until ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] uppercase tracking-wider font-bold bg-skip-accentLo text-skip-accent px-2 py-1 rounded-full">
              Featured
            </span>
            <p className="text-skip-ink font-medium">
              Active until {until.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              {" · "}
              <span className="text-skip-slate">
                {daysLeft} day{daysLeft === 1 ? "" : "s"} left
              </span>
            </p>
          </div>
        ) : (
          <p className="text-skip-slate">Not currently featured. Pick a package below to go live.</p>
        )}
      </section>

      {partner.role !== "owner" ? (
        <p className="mt-10 text-sm text-skip-stone">
          Only the salon owner can buy featured slots.
        </p>
      ) : (
        <FeaturedCheckout salonName={salon?.name ?? "your salon"} />
      )}
    </main>
  );
}
