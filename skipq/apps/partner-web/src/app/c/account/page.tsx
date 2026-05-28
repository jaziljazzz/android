import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { customerSignOut } from "../login/actions";

export const dynamic = "force-dynamic";

function Row({
  href,
  icon,
  label,
  hint,
  action,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  const body = (
    <div className="flex items-center gap-4 px-5 py-4 bg-white active:bg-skip-mist transition">
      <div className="w-8 h-8 rounded-lg bg-skip-mist text-skip-ink flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-skip-ink">{label}</p>
        {hint ? <p className="text-xs text-skip-stone truncate">{hint}</p> : null}
      </div>
      {action ?? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-skip-stone"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </div>
  );
  return href ? (
    <Link href={href} prefetch className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export default async function CustomerAccount() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="max-w-3xl mx-auto px-5 py-10 text-center">
        <h1 className="text-2xl font-extrabold text-skip-ink">Sign in to continue</h1>
        <p className="mt-2 text-skip-slate">
          Track bookings, save favourites, and earn rewards.
        </p>
        <Link
          href="/c/login?next=/c/account"
          className="skip-btn-primary inline-block mt-6"
        >
          Sign in or create account
        </Link>
      </main>
    );
  }

  const [{ data: profile }, { data: ref }] = await Promise.all([
    supabase
      .from("users")
      .select("name, email, phone, plus_until")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.rpc("my_referral_stats"),
  ]);
  const referral = Array.isArray(ref) ? ref[0] : null;
  const isPlus = profile?.plus_until && new Date(profile.plus_until) > new Date();
  const initials = (profile?.name ?? user.email ?? "U")
    .split(/\s+/u)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return (
    <main className="max-w-3xl mx-auto pb-8">
      <section className="px-5 py-6 bg-white border-b border-skip-stone/10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-skip-ink text-white font-extrabold text-xl flex items-center justify-center">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-skip-ink truncate text-lg">
              {profile?.name ?? "Add your name"}
            </p>
            <p className="text-sm text-skip-stone truncate">{user.email}</p>
            {isPlus ? (
              <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-bold bg-skip-ink text-white px-2 py-0.5 rounded">
                Plus member
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-3">
        <Row
          href="/c/bookings"
          label="Your bookings"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <Row
          href="/c/favourites"
          label="Favourites"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          }
        />
        <Row
          href="/c/refer"
          label="Refer & Earn"
          hint={referral?.my_code ? `Code: ${referral.my_code}` : "Invite friends"}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
        />
      </section>

      <p className="px-5 mt-6 text-[10px] uppercase tracking-wider font-bold text-skip-stone">
        Membership
      </p>
      <section className="mt-2">
        <Row
          href="/c/plus"
          label="SkipQ Plus"
          hint={isPlus ? "Active" : "₹99 / month — priority joins, zero fees"}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 19 21 12 17 5 21 12 2" />
            </svg>
          }
        />
      </section>

      <p className="px-5 mt-6 text-[10px] uppercase tracking-wider font-bold text-skip-stone">
        Other
      </p>
      <section className="mt-2">
        <Row
          href="/c/select-location"
          label="Change location"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          }
        />
        <Row
          href="/c/help"
          label="Help & support"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
        />
        <Row
          href="/privacy"
          label="Privacy & terms"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
        />
      </section>

      <section className="mt-6 px-5">
        <form action={customerSignOut}>
          <button
            type="submit"
            className="w-full py-3 rounded-xl text-skip-accent font-bold bg-white border border-skip-stone/15 active:opacity-60"
          >
            Sign out
          </button>
        </form>
      </section>

      <p className="mt-6 text-center text-[10px] text-skip-stone">SkipQ · v0.1</p>
    </main>
  );
}
