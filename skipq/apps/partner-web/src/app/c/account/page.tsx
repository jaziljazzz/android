import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { customerSignOut } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function CustomerAccount() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/c/login");

  const [{ data: profile }, { data: ref }, { data: balance }] = await Promise.all([
    supabase
      .from("users")
      .select("name, email, phone, total_visits, total_spend, plus_until")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.rpc("my_referral_stats"),
    supabase.rpc("my_loyalty_balance"),
  ]);

  const referral = Array.isArray(ref) ? ref[0] : null;
  const points = typeof balance === "number" ? balance : 0;
  const isPlus = profile?.plus_until && new Date(profile.plus_until) > new Date();

  return (
    <main className="max-w-3xl mx-auto px-5 py-6">
      <Link href="/c/home" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Home
      </Link>

      <h1 className="mt-4 text-2xl font-extrabold text-skip-ink">Account</h1>

      <section className="mt-6 skip-card p-5">
        <p className="text-[10px] uppercase tracking-wider font-bold text-skip-stone">
          Signed in as
        </p>
        <p className="text-skip-ink font-semibold mt-1">{user.email}</p>
        {profile?.name ? (
          <p className="text-sm text-skip-slate mt-1">{profile.name}</p>
        ) : null}
        {isPlus ? (
          <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-bold bg-skip-ink text-white px-2 py-0.5 rounded-full">
            Plus member
          </span>
        ) : null}
      </section>

      <section className="mt-3 grid grid-cols-3 gap-3">
        <Stat label="Visits" value={String(profile?.total_visits ?? 0)} />
        <Stat label="Spent" value={`₹${Number(profile?.total_spend ?? 0).toFixed(0)}`} />
        <Stat label="Points" value={String(points)} />
      </section>

      {referral?.my_code ? (
        <section className="mt-6 skip-card p-5">
          <p className="text-[10px] uppercase tracking-wider font-bold text-skip-stone">
            Your referral code
          </p>
          <p className="text-2xl font-extrabold text-skip-ink mt-1 tracking-wider">
            {referral.my_code}
          </p>
          <p className="text-xs text-skip-stone mt-2">
            {referral.referred_count} friend{referral.referred_count === 1 ? "" : "s"} joined
            using your code.
          </p>
        </section>
      ) : null}

      <form action={customerSignOut} className="mt-6">
        <button type="submit" className="skip-btn-ghost w-full">
          Sign out
        </button>
      </form>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="skip-card p-3 text-center">
      <p className="text-xl font-extrabold text-skip-ink">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-skip-stone font-bold mt-1">
        {label}
      </p>
    </div>
  );
}
