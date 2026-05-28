import Link from "next/link";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-skip-mist flex flex-col">
      <header className="px-5 py-4 bg-white border-b border-skip-stone/10 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/c/home" className="text-skip-accent font-extrabold tracking-tight text-lg">
            SkipQ
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/c/home" className="text-skip-slate hover:text-skip-ink">Home</Link>
            <Link href="/c/bookings" className="text-skip-slate hover:text-skip-ink">Bookings</Link>
            <Link href="/c/account" className="text-skip-slate hover:text-skip-ink">Account</Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="text-center text-xs text-skip-stone py-6">
        SkipQ · <Link href="/privacy" className="underline">Privacy</Link>
      </footer>
    </div>
  );
}
