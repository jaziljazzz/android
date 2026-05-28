import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPartnersPage() {
  const supabase = createClient();
  const { data: partners } = await supabase
    .from("partner_users")
    .select("id, name, email, phone, role, auth_user_id, last_login_at, salon_id, salons(name)")
    .order("last_login_at", { ascending: false, nullsFirst: false })
    .limit(200);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 sm:py-10">
      <header>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">All partners</h1>
        <p className="mt-2 text-skip-slate">Every owner / receptionist / stylist provisioned to a SkipQ salon.</p>
      </header>

      <ul className="mt-6 space-y-2">
        {(partners ?? []).map((p) => {
          const salon = Array.isArray(p.salons) ? p.salons[0] : p.salons;
          return (
            <li key={p.id} className="skip-card p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-skip-ink">
                  {p.name}{" "}
                  <span className="text-xs font-normal text-skip-stone uppercase tracking-wider">{p.role}</span>
                </div>
                <div className="text-xs text-skip-slate">{p.email ?? p.phone ?? "—"}</div>
              </div>
              <Link
                href={p.salon_id ? `/admin/salons/${p.salon_id}` : "/admin"}
                className="text-sm text-skip-slate hover:text-skip-accent font-medium"
              >
                {salon?.name ?? "—"} →
              </Link>
              <div className="text-xs text-skip-stone w-32 text-right">
                {p.auth_user_id ? (p.last_login_at ? new Date(p.last_login_at).toLocaleDateString("en-IN") : "linked") : "not signed in"}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
