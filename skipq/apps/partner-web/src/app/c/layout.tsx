import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BottomTabBar } from "@/components/BottomTabBar";
import { LocationDetect } from "@/components/LocationDetect";

export const dynamic = "force-dynamic";

interface SavedLocation {
  place: string;
  sub?: string;
  lat?: number;
  lng?: number;
}

function parseLocation(raw: string | undefined): SavedLocation | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return { place: parsed };
    if (parsed && typeof parsed.place === "string") return parsed as SavedLocation;
    return null;
  } catch {
    return { place: raw };
  }
}

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(user);

  const cookieStore = cookies();
  const location = parseLocation(cookieStore.get("skipq_loc")?.value);

  return (
    <div className="min-h-screen bg-skip-mist flex flex-col pb-16">
      <LocationDetect hasLocation={Boolean(location)} />

      <header className="px-5 py-3 bg-white border-b border-skip-stone/10 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Link
            href="/c/select-location"
            prefetch
            className="flex items-start gap-2 min-w-0 flex-1 active:opacity-60"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-skip-accent shrink-0 mt-0.5"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
            </svg>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1">
                <p className="text-lg font-extrabold text-skip-ink truncate">
                  {location?.place ?? "Set location"}
                </p>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-skip-ink shrink-0"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {location?.sub ? (
                <p className="text-xs text-skip-stone truncate">{location.sub}</p>
              ) : (
                <p className="text-xs text-skip-stone truncate">
                  Tap to detect or pick area
                </p>
              )}
            </div>
          </Link>

          {isLoggedIn ? (
            <Link
              href="/c/account"
              className="w-9 h-9 rounded-full bg-skip-ink text-white flex items-center justify-center font-bold active:opacity-70 shrink-0"
              aria-label="Account"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          ) : (
            <Link
              href="/c/account"
              className="w-9 h-9 rounded-full bg-skip-ink text-white flex items-center justify-center font-bold active:opacity-70 shrink-0"
              aria-label="Account"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          )}
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <BottomTabBar isLoggedIn={isLoggedIn} />
    </div>
  );
}
