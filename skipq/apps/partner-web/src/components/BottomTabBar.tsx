"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  href: string;
  label: string;
  match: (p: string) => boolean;
  icon: (active: boolean) => React.ReactNode;
}

const TABS: Tab[] = [
  {
    href: "/c/home",
    label: "Home",
    match: (p) => p === "/c/home" || p.startsWith("/c/salon/"),
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 2l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5z" />
      </svg>
    ),
  },
  {
    href: "/c/bookings",
    label: "Bookings",
    match: (p) => p.startsWith("/c/bookings"),
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="16" y1="2" x2="16" y2="6" />
      </svg>
    ),
  },
  {
    href: "/c/account",
    label: "Account",
    match: (p) => p.startsWith("/c/account"),
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function BottomTabBar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname() ?? "";
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-skip-stone/10 z-20 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-3xl mx-auto grid grid-cols-3">
        {TABS.map((t) => {
          const active = t.match(pathname);
          // Account tab always opens /c/account — the page itself
          // renders a Zomato-style "Your profile / Continue" card
          // when logged-out, so the user stays in-tab.
          return (
            <Link
              key={t.href}
              href={t.href}
              prefetch
              className={`flex flex-col items-center gap-0.5 py-2.5 active:opacity-60 ${
                active ? "text-skip-accent" : "text-skip-stone"
              }`}
            >
              {t.icon(active)}
              <span className="text-[10px] font-semibold">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
