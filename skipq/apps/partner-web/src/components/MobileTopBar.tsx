"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { signOut } from "@/app/login/actions";

export interface MobileTopBarProps {
  salonName: string;
  salonArea?: string;
}

/** Compact header for partner-web on phones. Sidebar is hidden below lg. */
export function MobileTopBar({ salonName, salonArea }: MobileTopBarProps) {
  return (
    <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-skip-stone/10">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/dashboard" className="shrink-0">
          <Logo size="sm" />
        </Link>
        <div className="flex-1 min-w-0 text-right">
          <div className="text-sm font-semibold text-skip-ink truncate">
            {salonName}
          </div>
          {salonArea ? (
            <div className="text-[11px] text-skip-stone truncate">{salonArea}</div>
          ) : null}
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-skip-stone hover:text-skip-ink hover:bg-skip-mist transition"
            aria-label="Sign out"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </form>
      </div>
    </header>
  );
}
