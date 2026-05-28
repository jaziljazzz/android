import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { signOut } from "@/app/login/actions";

export const dynamic = "force-dynamic";

// SkipQ-team super-admin allowlist. Anyone signed in with one of these
// emails sees the /admin pages.
const ADMIN_EMAILS = ["jazilsameer@gmail.com"];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-extrabold text-skip-ink">Not authorised</h1>
          <p className="mt-3 text-skip-slate">
            This area is for the SkipQ team only.
          </p>
          <Link href="/dashboard" className="skip-btn-primary inline-flex mt-6">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-skip-mist">
      <header className="bg-skip-ink text-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 pb-1">
          <div className="flex items-center justify-between gap-3">
            <Link href="/admin" className="flex items-center gap-2 min-w-0">
              <Logo size="sm" variant="light" />
              <span className="text-[9px] uppercase tracking-wider font-bold bg-skip-accent/20 text-skip-accent px-1.5 py-0.5 rounded shrink-0">
                Admin
              </span>
            </Link>
            <form action={signOut} className="shrink-0">
              <button
                type="submit"
                className="text-white/70 hover:text-white text-sm font-medium"
              >
                Sign out
              </button>
            </form>
          </div>
          <nav
            className="flex items-center gap-1 text-sm overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mt-2 pb-2 scrollbar-none"
            style={{ scrollbarWidth: "none" }}
          >
            {[
              { href: "/admin", label: "Salons" },
              { href: "/admin/partners", label: "Partners" },
              { href: "/admin/partnerships", label: "Brands" },
              { href: "/admin/placements", label: "Placements" },
              { href: "/admin/disputes", label: "Disputes" },
              { href: "/admin/queues", label: "Live activity" },
              { href: "/dashboard", label: "Salon view" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="shrink-0 text-white/70 hover:text-white hover:bg-white/10 font-medium px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div>{children}</div>
    </div>
  );
}
