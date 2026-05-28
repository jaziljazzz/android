import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth";
import { ProCheckout } from "./ProCheckout";

export const dynamic = "force-dynamic";

const PERKS = [
  { title: "Empty-chair blast", body: "One-tap push to favourite + recent customers when a chair opens up." },
  { title: "Stylist productivity table", body: "Per-stylist services, average minutes, rating, revenue — last 30 days." },
  { title: "Busy-times heatmap", body: "7×24 grid so you schedule the right stylists at the right time." },
  { title: "Featured listing eligibility", body: "Get the discount when you stack a featured slot on top of Pro." },
  { title: "Priority support", body: "Direct chat with the SkipQ team for faster resolution." },
];

export default async function ProPage() {
  const { partner } = await requirePartner();
  const supabase = createClient();
  const { data: salon } = await supabase
    .from("salons")
    .select("name, pro_until")
    .eq("id", partner.salon_id)
    .single();

  const until = salon?.pro_until ? new Date(salon.pro_until) : null;
  const active = until && until > new Date();
  const daysLeft = active && until ? Math.ceil((until.getTime() - Date.now()) / 86400000) : 0;

  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <Link href="/dashboard" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back to queue
      </Link>
      <header className="mt-4">
        <div className="inline-flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold bg-skip-ink text-white px-2 py-1 rounded-full">
            Pro
          </span>
          <span className="text-xs font-semibold text-skip-stone">For serious salons</span>
        </div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">
          skipQ Pro
        </h1>
        <p className="mt-2 text-skip-slate max-w-2xl">
          Unlock the growth toolkit — fill chairs faster, schedule smarter, retain
          customers longer. The base SkipQ stays free.
        </p>
      </header>

      <section className="mt-6 skip-card p-6">
        {active && until ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] uppercase tracking-wider font-bold bg-skip-successLo text-skip-success px-2 py-1 rounded-full">
              Pro active
            </span>
            <p className="text-skip-ink font-medium">
              Until {until.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              {" · "}
              <span className="text-skip-slate">{daysLeft} day{daysLeft === 1 ? "" : "s"} left</span>
            </p>
          </div>
        ) : (
          <p className="text-skip-slate">Not on Pro yet. Pick a plan below to unlock everything.</p>
        )}
      </section>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PERKS.map((p) => (
          <div key={p.title} className="skip-card p-5">
            <h3 className="font-bold text-skip-ink">{p.title}</h3>
            <p className="mt-1 text-sm text-skip-slate">{p.body}</p>
          </div>
        ))}
      </section>

      {partner.role !== "owner" ? (
        <p className="mt-10 text-sm text-skip-stone">
          Only the salon owner can buy or extend Pro.
        </p>
      ) : (
        <ProCheckout salonName={salon?.name ?? "your salon"} />
      )}
    </main>
  );
}
