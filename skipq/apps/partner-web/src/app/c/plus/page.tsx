import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PERKS = [
  { title: "Priority joins", body: "Skip the regular line at busy salons." },
  { title: "Zero platform fee", body: "We absorb the booking fee on every visit." },
  { title: "Family profiles", body: "Hold spots for your partner and kids." },
  { title: "Member-only offers", body: "Exclusive discounts from featured salons." },
];

export default async function PlusPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="max-w-3xl mx-auto px-5 py-10 text-center">
        <h1 className="text-2xl font-extrabold text-skip-ink">Sign in to subscribe</h1>
        <Link href="/c/login?next=/c/plus" className="skip-btn-primary inline-block mt-6">
          Sign in
        </Link>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("plus_until")
    .eq("id", user.id)
    .maybeSingle();
  const until = profile?.plus_until ? new Date(profile.plus_until) : null;
  const active = until && until > new Date();

  return (
    <main className="max-w-3xl mx-auto px-5 py-6">
      <span className="text-[10px] uppercase tracking-[0.3em] font-bold bg-skip-ink text-white px-2 py-1 rounded">
        Plus
      </span>
      <h1 className="mt-3 text-3xl font-extrabold text-skip-ink leading-tight">
        Skip the wait,<br />every time.
      </h1>

      {active && until ? (
        <div className="mt-4 rounded-xl bg-skip-successLo border border-skip-success/20 px-4 py-3 text-skip-success text-sm font-semibold">
          Active until{" "}
          {until.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {PERKS.map((p) => (
          <div key={p.title} className="skip-card p-4">
            <p className="font-bold text-skip-ink">{p.title}</p>
            <p className="text-sm text-skip-slate mt-0.5">{p.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-skip-stone">
        Subscriptions are billed via the SkipQ mobile app. Web checkout coming soon.
      </p>
    </main>
  );
}
