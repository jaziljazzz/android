import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { customerSignOut } from "../login/actions";

export const dynamic = "force-dynamic";

function Row({
  href,
  icon,
  label,
  trailing,
  border = true,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  border?: boolean;
}) {
  const body = (
    <div
      className={`flex items-center gap-4 px-5 py-3.5 active:bg-skip-mist transition ${
        border ? "border-t border-skip-stone/10 first:border-t-0" : ""
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-skip-mist text-skip-slate flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="flex-1 font-semibold text-skip-ink truncate">{label}</span>
      {trailing}
      <svg
        width="16"
        height="16"
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
    </div>
  );
  return href ? (
    <Link href={href} prefetch className="block bg-white">
      {body}
    </Link>
  ) : (
    <div className="bg-white">{body}</div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <div className="mt-6 mb-2 px-5 flex items-center gap-2">
      <span className="w-1 h-5 bg-skip-accent rounded-full" />
      <h2 className="text-base font-extrabold text-skip-ink">{title}</h2>
    </div>
  );
}

export default async function CustomerAccount() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="max-w-3xl mx-auto pb-8 pt-2">
        {/* Profile card prompting sign-in */}
        <section className="mx-5 mt-3 rounded-2xl bg-white px-5 py-5 shadow-card">
          <h1 className="text-2xl font-extrabold text-skip-ink leading-tight">
            Your profile
          </h1>
          <p className="mt-1 text-sm text-skip-slate">
            Log in or sign up to view your complete profile
          </p>
          <Link
            href="/c/login?next=/c/account"
            prefetch
            className="mt-4 block w-full text-center py-3.5 rounded-xl border-2 border-skip-accent text-skip-accent font-bold active:opacity-70 transition"
          >
            Continue
          </Link>
        </section>

        {/* Two quick cards */}
        <section className="mx-5 mt-3 grid grid-cols-2 gap-3">
          <Link
            href="/c/favourites"
            prefetch
            className="rounded-xl bg-white px-4 py-5 shadow-card active:opacity-70 flex flex-col items-center gap-2 text-center"
          >
            <div className="w-10 h-10 rounded-full bg-skip-mist text-skip-slate flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-skip-ink">Favourites</p>
          </Link>
          <Link
            href="/c/refer"
            prefetch
            className="rounded-xl bg-white px-4 py-5 shadow-card active:opacity-70 flex flex-col items-center gap-2 text-center"
          >
            <div className="w-10 h-10 rounded-full bg-skip-mist text-skip-slate flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <p className="text-sm font-bold text-skip-ink">Refer & Earn</p>
          </Link>
        </section>

        {/* Bottom-only sections that don't need auth */}
        <SectionHead title="More" />
        <div className="mx-5 rounded-xl overflow-hidden shadow-card">
          <Row
            href="/c/help"
            label="About SkipQ"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            }
          />
          <Row
            href="/c/help"
            label="Send feedback"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
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
        </div>

        <p className="mt-6 text-center text-[10px] text-skip-stone">SkipQ · v0.1</p>
      </main>
    );
  }

  const [{ data: profile }, { data: loyaltyRaw }] = await Promise.all([
    supabase
      .from("users")
      .select("name, email, phone, profile_photo, plus_until")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.rpc("my_loyalty_balance"),
  ]);
  const loyaltyBalance = typeof loyaltyRaw === "number" ? loyaltyRaw : 0;

  const isPlus = profile?.plus_until && new Date(profile.plus_until) > new Date();
  const fields = [profile?.name, profile?.email, profile?.phone, profile?.profile_photo];
  const completion = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  const displayName = profile?.name?.trim() || user.email?.split("@")[0] || "You";
  const initial = (displayName[0] ?? "U").toUpperCase();

  return (
    <main className="max-w-3xl mx-auto pb-8 pt-2">
      {/* Profile card */}
      <section className="mx-5 mt-3 rounded-2xl bg-white px-5 py-5 shadow-card">
        <div className="flex items-center gap-4">
          {profile?.profile_photo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={profile.profile_photo}
              alt=""
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-skip-mist text-skip-accent font-extrabold text-2xl flex items-center justify-center">
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-skip-ink text-lg leading-tight truncate">
              {displayName}
            </p>
            <p className="text-sm text-skip-stone truncate">{user.email}</p>
            <Link
              href="/c/bookings"
              prefetch
              className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-skip-accent active:opacity-60"
            >
              View activity
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,4 18,12 6,20" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* SkipQ Plus banner */}
      <Link
        href="/c/plus"
        prefetch
        className="block mx-5 mt-4 rounded-xl active:opacity-80 transition overflow-hidden"
        style={{
          background:
            "linear-gradient(95deg, #15100A 0%, #2C1C04 50%, #15100A 100%)",
        }}
      >
        <div className="px-4 py-3.5 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              background:
                "radial-gradient(circle at 30% 25%, #FFE39C 0%, #E1A734 60%, #8C5C0F 100%)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1A0E00">
              <path d="M5 19h14v-2H5v2zm2-4h10l1-9-4 3-2-5-2 5-4-3 1 9z" />
            </svg>
          </div>
          <span
            className="flex-1 font-extrabold tracking-wide text-base"
            style={{
              background: "linear-gradient(180deg, #FFE9A8 0%, #F0B852 60%, #C58B1F 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {isPlus ? "SkipQ Plus active" : "Join SkipQ Plus"}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E1A734"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </Link>

      {/* Loyalty balance */}
      <section className="mx-5 mt-3 rounded-2xl bg-white shadow-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-skip-accentLo text-skip-accent flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-skip-ink text-lg leading-tight">
            {loyaltyBalance.toLocaleString("en-IN")} points
          </p>
          <p className="text-xs text-skip-stone leading-snug">
            Earn 10 points/visit + 1 per ₹100 spent. 100 points = ₹100 off your next visit.
          </p>
        </div>
      </section>

      {/* Profile completion */}
      {completion < 100 ? (
        <Link
          href="/c/account"
          className="mx-5 mt-3 block rounded-xl bg-white shadow-card px-4 py-3.5 active:bg-skip-mist"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-skip-mist text-skip-slate flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="flex-1 font-semibold text-skip-ink">Your profile</span>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-skip-accentLo text-skip-accent">
              {completion}% completed
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-skip-stone">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>
      ) : null}

      <SectionHead title="Bookings" />
      <div className="mx-5 rounded-xl overflow-hidden shadow-card">
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
          href="/c/history"
          label="Past visits"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <Row
          href="/c/style-memory"
          label="Style memory"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          }
        />
      </div>

      <SectionHead title="Saved" />
      <div className="mx-5 rounded-xl overflow-hidden shadow-card">
        <Row
          href="/c/favourites"
          label="Favourite salons"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          }
        />
        <Row
          href="/c/select-location"
          label="Saved locations"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          }
        />
      </div>

      <SectionHead title="Membership & rewards" />
      <div className="mx-5 rounded-xl overflow-hidden shadow-card">
        <Row
          href="/c/plus"
          label="SkipQ Plus"
          trailing={
            isPlus ? (
              <span className="text-[10px] uppercase tracking-wider font-bold bg-skip-successLo text-skip-success px-2 py-0.5 rounded-full">
                Active
              </span>
            ) : null
          }
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 19h14v-2H5v2zm2-4h10l1-9-4 3-2-5-2 5-4-3 1 9z" />
            </svg>
          }
        />
        <Row
          href="/c/refer"
          label="Refer & Earn"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
        />
      </div>

      <SectionHead title="More" />
      <div className="mx-5 rounded-xl overflow-hidden shadow-card">
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
          href="/c/help"
          label="Send feedback"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
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
        <Row
          href="/c/account"
          label="About SkipQ"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          }
        />
      </div>

      <section className="mx-5 mt-6">
        <form action={customerSignOut}>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl text-skip-accent font-bold bg-white border border-skip-stone/15 active:opacity-70"
          >
            Log out
          </button>
        </form>
      </section>

      <p className="mt-6 text-center text-[10px] text-skip-stone">SkipQ · v0.1</p>
    </main>
  );
}
