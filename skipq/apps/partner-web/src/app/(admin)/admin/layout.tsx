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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Logo size="sm" variant="light" />
            </Link>
            <span className="text-[10px] uppercase tracking-wider font-bold bg-skip-accent/20 text-skip-accent px-2 py-1 rounded">
              Admin
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="text-white/70 hover:text-white font-medium">Salons</Link>
            <Link href="/admin/partners" className="text-white/70 hover:text-white font-medium">Partners</Link>
            <Link href="/admin/queues" className="text-white/70 hover:text-white font-medium">Live activity</Link>
            <Link href="/dashboard" className="text-white/70 hover:text-white font-medium">Salon view</Link>
            <form action={signOut}>
              <button type="submit" className="text-white/70 hover:text-white font-medium">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div>{children}</div>
    </div>
  );
}
