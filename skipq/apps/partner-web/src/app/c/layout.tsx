import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(user);

  return (
    <div className="min-h-screen bg-skip-mist flex flex-col">
      <header className="px-5 py-4 bg-white border-b border-skip-stone/10 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/c/home"
            className="text-skip-accent font-extrabold tracking-tight text-lg"
          >
            SkipQ
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/c/home" className="text-skip-slate hover:text-skip-ink">
              Home
            </Link>
            <Link href="/c/bookings" className="text-skip-slate hover:text-skip-ink">
              Bookings
            </Link>
            {isLoggedIn ? (
              <Link href="/c/account" className="text-skip-slate hover:text-skip-ink">
                Account
              </Link>
            ) : (
              <Link href="/c/login" className="text-skip-accent hover:underline">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="text-center text-xs text-skip-stone py-6">
        SkipQ ·{" "}
        <Link href="/privacy" className="underline">
          Privacy
        </Link>
      </footer>
    </div>
  );
}
