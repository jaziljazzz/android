"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { Logo } from "./Logo";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function QueueIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="13" y2="18" />
    </svg>
  );
}
function ServicesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}
function StylistsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M20 8v6M23 11h-6" />
    </svg>
  );
}
function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function CustomersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function InvoiceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Live queue", icon: <QueueIcon /> },
  { href: "/dashboard/services", label: "Services", icon: <ServicesIcon /> },
  { href: "/dashboard/stylists", label: "Stylists", icon: <StylistsIcon /> },
  { href: "/dashboard/customers", label: "Customers", icon: <CustomersIcon /> },
  { href: "/dashboard/analytics", label: "Analytics", icon: <AnalyticsIcon /> },
  { href: "/dashboard/invoices", label: "Invoices", icon: <InvoiceIcon /> },
  { href: "/dashboard/profile", label: "Salon profile", icon: <ProfileIcon /> },
];

export interface SidebarProps {
  salonName: string;
  salonArea?: string;
  partnerName: string;
  partnerRole: string;
}

export function Sidebar({ salonName, salonArea, partnerName, partnerRole }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-72 shrink-0 bg-white flex flex-col border-r border-skip-stone/10">
      <div className="px-6 pt-6 pb-5">
        <Logo size="md" />
        <div className="mt-5">
          <div className="text-skip-ink font-semibold text-base leading-tight">{salonName}</div>
          {salonArea ? (
            <div className="text-skip-stone text-xs mt-0.5">{salonArea}</div>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active
                  ? "bg-skip-accentLo text-skip-accent"
                  : "text-skip-slate hover:bg-skip-mist hover:text-skip-ink"
              }`}
            >
              <span className="opacity-80">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-skip-stone/10">
        <div className="px-3 py-2">
          <div className="text-sm font-semibold text-skip-ink">{partnerName}</div>
          <div className="text-xs text-skip-stone capitalize">{partnerRole}</div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-skip-stone hover:bg-skip-mist hover:text-skip-ink transition"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
