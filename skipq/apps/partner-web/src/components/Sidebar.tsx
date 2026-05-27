"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";

const NAV = [
  { href: "/dashboard", label: "Queue" },
  { href: "/dashboard/services", label: "Services" },
  { href: "/dashboard/stylists", label: "Stylists" },
  { href: "/dashboard/profile", label: "Salon profile" },
] as const;

export interface SidebarProps {
  salonName: string;
  salonArea?: string;
  partnerName: string;
  partnerRole: string;
}

export function Sidebar({ salonName, salonArea, partnerName, partnerRole }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-skip-stone/15 bg-white flex flex-col">
      <div className="px-5 py-5 border-b border-skip-stone/10">
        <div className="text-skip-accent text-[10px] font-bold tracking-widest uppercase">
          skipQ Partner
        </div>
        <div className="mt-1 text-skip-ink font-bold text-base">{salonName}</div>
        {salonArea ? (
          <div className="text-skip-stone text-xs">{salonArea}</div>
        ) : null}
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${
                active
                  ? "bg-skip-accent/10 text-skip-accent"
                  : "text-skip-slate hover:bg-skip-mist"
              }`}
            >
              {item.label}
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
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-skip-stone hover:bg-skip-mist hover:text-skip-ink"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
