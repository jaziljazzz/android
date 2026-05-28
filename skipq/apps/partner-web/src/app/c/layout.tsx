import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BottomTabBar } from "@/components/BottomTabBar";
import { LocationPill } from "@/components/LocationPill";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(user);

  const cookieStore = cookies();
  const location = cookieStore.get("skipq_loc")?.value ?? "Kochi";

  return (
    <div className="min-h-screen bg-skip-mist flex flex-col pb-16">
      <header className="px-5 py-3 bg-white border-b border-skip-stone/10 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Link
            href="/c/select-location"
            className="flex items-start gap-1 min-w-0 active:opacity-70"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-skip-accent shrink-0 mt-0.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-bold text-skip-stone leading-none">
                Deliver to
              </p>
              <p className="text-sm font-extrabold text-skip-ink leading-tight truncate flex items-center gap-1">
                <LocationPill defaultLabel={location} />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-skip-ink">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </p>
            </div>
          </Link>

          {isLoggedIn ? (
            <Link
              href="/c/account"
              className="w-9 h-9 rounded-full bg-skip-ink text-white flex items-center justify-center font-bold active:opacity-70"
              aria-label="Account"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          ) : (
            <Link
              href="/c/login"
              className="text-xs font-bold uppercase tracking-wider text-skip-accent active:opacity-70"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <BottomTabBar isLoggedIn={isLoggedIn} />
    </div>
  );
}
