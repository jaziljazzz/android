import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const AREAS = [
  { label: "Edapally, Kochi", value: "Edapally, Kochi" },
  { label: "Kakkanad, Kochi", value: "Kakkanad, Kochi" },
  { label: "Panampilly Nagar, Kochi", value: "Panampilly Nagar, Kochi" },
  { label: "Vyttila, Kochi", value: "Vyttila, Kochi" },
  { label: "MG Road, Kochi", value: "MG Road, Kochi" },
  { label: "Kochi", value: "Kochi" },
];

async function setLocation(formData: FormData) {
  "use server";
  const value = String(formData.get("loc") ?? "").trim();
  if (!value) return;
  cookies().set("skipq_loc", value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  redirect("/c/home");
}

export default function SelectLocation() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-6">
      <Link
        href="/c/home"
        prefetch
        className="text-sm font-medium text-skip-slate hover:text-skip-ink"
      >
        ← Back
      </Link>
      <h1 className="mt-4 text-2xl font-extrabold text-skip-ink">Set your location</h1>
      <p className="mt-1 text-skip-slate text-sm">
        We&apos;ll show you salons closest to this area.
      </p>

      <ul className="mt-6 space-y-2">
        {AREAS.map((a) => (
          <li key={a.value}>
            <form action={setLocation}>
              <input type="hidden" name="loc" value={a.value} />
              <button
                type="submit"
                className="w-full skip-card p-4 flex items-center justify-between text-left active:opacity-70"
              >
                <span className="font-semibold text-skip-ink">{a.label}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-skip-stone">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
