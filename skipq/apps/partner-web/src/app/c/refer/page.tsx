import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReferralShare } from "./ReferralShare";

export const dynamic = "force-dynamic";

export default async function ReferPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="max-w-3xl mx-auto px-5 py-10 text-center">
        <h1 className="text-2xl font-extrabold text-skip-ink">Sign in to get your code</h1>
        <Link
          href="/c/login?next=/c/refer"
          className="skip-btn-primary inline-block mt-6"
        >
          Sign in
        </Link>
      </main>
    );
  }

  const { data: ref } = await supabase.rpc("my_referral_stats");
  const referral = Array.isArray(ref) ? ref[0] : null;
  const code = referral?.my_code as string | undefined;
  const count = (referral?.referred_count as number | undefined) ?? 0;

  return (
    <main className="max-w-3xl mx-auto px-5 py-6">
      <h1 className="text-2xl font-extrabold text-skip-ink">Refer & Earn</h1>
      <p className="mt-1 text-skip-slate text-sm">
        Share your code with friends. When they sign up and book their first salon, you both
        unlock perks.
      </p>

      <section className="mt-6 skip-card p-6 text-center">
        <p className="text-[10px] uppercase tracking-wider font-bold text-skip-stone">
          Your code
        </p>
        <p className="mt-1 text-3xl font-extrabold tracking-[0.3em] text-skip-ink">
          {code ?? "—"}
        </p>
        <p className="mt-3 text-xs text-skip-stone">
          {count} friend{count === 1 ? "" : "s"} have joined using your code
        </p>
        {code ? <ReferralShare code={code} /> : null}
      </section>
    </main>
  );
}
